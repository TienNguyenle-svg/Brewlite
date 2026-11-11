import { OrderStatus, Payment, Prisma } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { DiscountsService } from '../discounts/discounts.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  IDEMPOTENCY_KEY_PATTERN,
  isAllowedOrderTransition,
  MAX_FAILED_ATTEMPTS,
  PAYMENT_TIMEOUT_MS,
  RETRY_WINDOW_MS,
} from './payments.constants';

type VnpayQuery = Record<string, string | string[] | undefined>;

const OPEN_ORDER_STATUSES = ['PENDING', 'PAYMENT_FAILED'];

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly discounts: DiscountsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Tạo lượt thanh toán
  // ---------------------------------------------------------------------------

  async createPayment(
    userId: string,
    orderId: string,
    idempotencyKey: string,
    ipAddress: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Cần đăng nhập để thanh toán');
    }

    if (
      typeof idempotencyKey !== 'string' ||
      !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)
    ) {
      throw new BadRequestException(
        'Header Idempotency-Key phải có dạng PAY-<số>, ví dụ PAY-1',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thanh toán đơn này');
    }

    const now = new Date();
    const storageKey = this.toStorageKey(orderId, idempotencyKey);

    // Cùng Idempotency-Key => cùng kết quả, kể cả khi đơn đã PAID.
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: storageKey },
    });

    if (existingPayment) {
      return this.replayPayment(existingPayment, ipAddress, now);
    }

    if (order.status === 'PAID') {
      throw new ConflictException('Đơn hàng đã được thanh toán');
    }

    if (order.status === 'CANCELLED') {
      throw new ConflictException('Đơn hàng đã bị hủy');
    }

    if (!OPEN_ORDER_STATUSES.includes(order.status)) {
      throw new ConflictException(
        `Không thể thanh toán đơn hàng ở trạng thái ${order.status}`,
      );
    }

    if (!Number.isSafeInteger(order.total) || order.total <= 0) {
      throw new BadRequestException('Số tiền đơn hàng không hợp lệ');
    }

    // Quá 10 phút kể từ lần thất bại gần nhất => hủy đơn, không cho thử lại.
    if (order.status === 'PAYMENT_FAILED') {
      const cancelled = await this.cancelIfRetryWindowExpired(order.id, now);

      if (cancelled) {
        throw new ConflictException(
          'Đã quá 10 phút kể từ lần thanh toán thất bại, đơn hàng đã bị hủy',
        );
      }
    }

    const expiresAt = new Date(now.getTime() + PAYMENT_TIMEOUT_MS);

    let payment: Payment;

    try {
      payment = await this.prisma.$transaction(async (tx) => {
        // Khóa dòng đơn hàng để 2 request đồng thời không tạo 2 lượt PENDING.
        await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;

        const currentOrder = await tx.order.findUnique({
          where: { id: orderId },
        });

        if (
          !currentOrder ||
          !OPEN_ORDER_STATUSES.includes(currentOrder.status)
        ) {
          throw new ConflictException(
            'Trạng thái đơn hàng đã thay đổi. Vui lòng tải lại trang',
          );
        }

        // Lượt PENDING đã hết hạn => FAILED (có thể kéo theo hủy đơn nếu đủ 3 lần).
        const expiredPayments = await tx.payment.findMany({
          where: { orderId, status: 'PENDING', expiresAt: { lte: now } },
          select: { id: true },
        });

        for (const expired of expiredPayments) {
          await this.markPaymentFailed(tx, expired.id, now);
        }

        const activePayment = await tx.payment.findFirst({
          where: { orderId, status: 'PENDING', expiresAt: { gt: now } },
        });

        if (activePayment) {
          throw new ConflictException(
            'Đơn hàng đang có lượt thanh toán còn hạn. Hãy tiếp tục lượt thanh toán đó',
          );
        }

        let orderStatus = currentOrder.status;

        if (expiredPayments.length > 0) {
          const refreshed = await tx.order.findUnique({
            where: { id: orderId },
          });
          orderStatus = refreshed?.status ?? orderStatus;
        }

        if (!OPEN_ORDER_STATUSES.includes(orderStatus)) {
          throw new ConflictException(
            'Đơn hàng đã bị hủy do thanh toán thất bại quá số lần cho phép',
          );
        }

        // Số tiền sắp được chốt: mã giảm giá và điểm gắn vào đơn phải còn hợp lệ.
        await this.discounts.validateBeforePayment(tx, currentOrder, now);

        // Order.total is the final payable amount and already includes shippingFee.
        const created = await tx.payment.create({
          data: {
            orderId,
            idempotencyKey: storageKey,
            amount: currentOrder.total,
            method: 'VNPAY',
            status: 'PENDING',
            expiresAt,
          },
        });

        // Khách chọn thử lại: PAYMENT_FAILED -> PENDING.
        if (orderStatus === 'PAYMENT_FAILED') {
          const moved = await this.moveOrder(
            tx,
            orderId,
            'PAYMENT_FAILED',
            'PENDING',
          );

          if (!moved) {
            throw new ConflictException(
              'Trạng thái đơn hàng đã thay đổi. Vui lòng tải lại trang',
            );
          }
        }

        return created;
      });
    } catch (error) {
      // 2 request cùng key chạy song song: request đến sau trả lại lượt đã tạo.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const raced = await this.prisma.payment.findUnique({
          where: { idempotencyKey: storageKey },
        });

        if (raced) {
          return this.replayPayment(raced, ipAddress, new Date());
        }
      }

      throw error;
    }

    return {
      paymentId: payment.id,
      orderId,
      amount: payment.amount,
      currency: 'VND',
      status: payment.status,
      expiresAt: payment.expiresAt ?? expiresAt,
      paymentUrl: this.buildPaymentUrl(
        payment.id,
        payment.amount,
        ipAddress,
        payment.createdAt,
        payment.expiresAt ?? expiresAt,
      ),
    };
  }

  // Trả lại kết quả cũ cho cùng Idempotency-Key.
  private replayPayment(payment: Payment, ipAddress: string, now: Date) {
    if (payment.status === 'SUCCEEDED') {
      return {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: 'VND',
        status: 'SUCCEEDED',
        paymentUrl: null,
        message: 'Giao dịch này đã thanh toán thành công',
      };
    }

    if (payment.status === 'FAILED') {
      throw new ConflictException(
        'Lượt thanh toán này đã thất bại hoặc hết hạn. Hãy dùng Idempotency-Key mới (ví dụ PAY-2) để thử lại',
      );
    }

    const expiresAt =
      payment.expiresAt ??
      new Date(payment.createdAt.getTime() + PAYMENT_TIMEOUT_MS);

    if (expiresAt <= now) {
      throw new ConflictException(
        'Lượt thanh toán đã hết hạn 10 phút. Hãy dùng Idempotency-Key mới để thử lại',
      );
    }

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: 'VND',
      status: payment.status,
      expiresAt,
      paymentUrl: this.buildPaymentUrl(
        payment.id,
        payment.amount,
        ipAddress,
        payment.createdAt,
        expiresAt,
      ),
    };
  }

  // ---------------------------------------------------------------------------
  // Khách chủ động hủy đơn
  // ---------------------------------------------------------------------------

  async cancelOrder(userId: string, orderId: string) {
    if (!userId) {
      throw new UnauthorizedException('Cần đăng nhập để hủy đơn');
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;

      const order = await tx.order.findUnique({ where: { id: orderId } });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      if (order.userId !== userId) {
        throw new ForbiddenException('Bạn không có quyền hủy đơn này');
      }

      // Hủy lần 2 vẫn trả kết quả cũ.
      if (order.status === 'CANCELLED') {
        return { orderId, status: 'CANCELLED' as const };
      }

      if (!OPEN_ORDER_STATUSES.includes(order.status)) {
        throw new ConflictException(
          `Không thể hủy đơn hàng ở trạng thái ${order.status}`,
        );
      }

      // Lượt PENDING đã quá hạn nhưng cron chưa kịp chạy => coi là FAILED trước.
      const expiredPayments = await tx.payment.findMany({
        where: { orderId, status: 'PENDING', expiresAt: { lte: now } },
        select: { id: true },
      });

      for (const expired of expiredPayments) {
        await this.markPaymentFailed(tx, expired.id, now);
      }

      const activePayment = await tx.payment.findFirst({
        where: { orderId, status: 'PENDING', expiresAt: { gt: now } },
      });

      if (activePayment) {
        throw new ConflictException(
          'Đơn hàng đang có lượt thanh toán còn hạn, chưa thể hủy',
        );
      }

      const current = await tx.order.findUnique({ where: { id: orderId } });

      if (current?.status === 'CANCELLED') {
        return { orderId, status: 'CANCELLED' as const };
      }

      // Khách chỉ được chủ động hủy SAU KHI thanh toán lỗi.
      if (current?.status !== 'PAYMENT_FAILED') {
        throw new ConflictException(
          'Chỉ có thể hủy đơn sau khi thanh toán lỗi hoặc hết hạn',
        );
      }

      // PAYMENT_FAILED -> CANCELLED. Các lượt thanh toán cũ vẫn giữ FAILED.
      const moved = await this.moveOrder(
        tx,
        orderId,
        'PAYMENT_FAILED',
        'CANCELLED',
      );

      if (!moved) {
        throw new ConflictException(
          'Trạng thái đơn hàng đã thay đổi. Vui lòng tải lại trang',
        );
      }

      return { orderId, status: 'CANCELLED' as const };
    });
  }

  // ---------------------------------------------------------------------------
  // VNPay trả kết quả về
  // ---------------------------------------------------------------------------

  async processVnpayReturn(query: VnpayQuery) {
    const params = this.normalizeQuery(query);
    const receivedHash = params.vnp_SecureHash;

    if (!receivedHash || !this.isValidSignature(params, receivedHash)) {
      throw new BadRequestException('Chữ ký VNPay không hợp lệ');
    }

    const tmnCode = this.config.get<string>('VNPAY_TMN_CODE');

    if (!tmnCode || params.vnp_TmnCode !== tmnCode) {
      throw new BadRequestException('Mã website VNPay không hợp lệ');
    }

    const txnRef = params.vnp_TxnRef;

    if (!txnRef || !/^[a-fA-F0-9]{32}$/.test(txnRef)) {
      throw new BadRequestException('Mã tham chiếu thanh toán không hợp lệ');
    }

    const paymentId = this.toUuid(txnRef);

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    }

    const returnedAmount = Number(params.vnp_Amount);

    if (
      !Number.isSafeInteger(returnedAmount) ||
      returnedAmount !== payment.amount * 100
    ) {
      throw new BadRequestException('Số tiền VNPay trả về không khớp');
    }

    const success =
      params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00';

    const result = await this.prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({
        where: { id: payment.id },
      });

      const currentOrder = await tx.order.findUnique({
        where: { id: payment.orderId },
      });

      if (!currentPayment || !currentOrder) {
        throw new NotFoundException('Không tìm thấy giao dịch hoặc đơn hàng');
      }

      // Callback gửi lại cho lượt đã thành công: trả kết quả cũ.
      if (currentPayment.status === 'SUCCEEDED') {
        return 'success' as const;
      }

      if (success) {
        if (currentOrder.status === 'CANCELLED') {
          throw new ConflictException(
            'Giao dịch có thể đã thành công nhưng đơn hàng đã bị hủy; cần đối soát',
          );
        }

        if (['PREPARING', 'READY', 'COMPLETED'].includes(currentOrder.status)) {
          throw new ConflictException(
            'Đơn hàng đã được xử lý; cần đối soát giao dịch',
          );
        }

        const anotherSuccessfulPayment = await tx.payment.findFirst({
          where: {
            orderId: currentOrder.id,
            status: 'SUCCEEDED',
            id: { not: currentPayment.id },
          },
        });

        if (anotherSuccessfulPayment) {
          throw new ConflictException(
            'Đơn hàng đã có giao dịch thành công khác; cần đối soát',
          );
        }

        await tx.payment.update({
          where: { id: currentPayment.id },
          data: { status: 'SUCCEEDED' },
        });

        // Sơ đồ không có mũi tên PAYMENT_FAILED -> PAID. Nếu kết quả thành công
        // đến muộn khi đơn đang PAYMENT_FAILED thì đi đúng 2 mũi tên hợp lệ:
        // PAYMENT_FAILED -> PENDING -> PAID.
        if (currentOrder.status === 'PAYMENT_FAILED') {
          const back = await this.moveOrder(
            tx,
            currentOrder.id,
            'PAYMENT_FAILED',
            'PENDING',
          );

          if (!back) {
            throw new ConflictException(
              'Trạng thái đơn hàng đã thay đổi; cần đối soát giao dịch',
            );
          }
        }

        if (currentOrder.status !== 'PAID') {
          const paid = await this.moveOrder(
            tx,
            currentOrder.id,
            'PENDING',
            'PAID',
          );

          if (!paid) {
            throw new ConflictException(
              'Trạng thái đơn hàng đã thay đổi; cần đối soát giao dịch',
            );
          }

          // Chỉ khi đơn thật sự lên PAID mới trừ điểm đã dùng và cộng điểm mới.
          // Thanh toán lỗi / hết hạn / hủy đơn không chạm tới điểm của khách.
          await this.discounts.settlePaidOrder(tx, {
            id: currentOrder.id,
            userId: currentOrder.userId,
            pointsUsed: currentOrder.pointsUsed,
            amountPaid: currentPayment.amount,
          });
        }

        return 'success' as const;
      }

      // Callback thất bại cho lượt đã FAILED: không xử lý lại.
      if (currentPayment.status === 'FAILED') {
        return 'failed' as const;
      }

      // Payment -> FAILED, Order -> PAYMENT_FAILED (hoặc CANCELLED nếu đủ 3 lần).
      await this.markPaymentFailed(tx, currentPayment.id, new Date());

      return 'failed' as const;
    });

    return {
      orderId: payment.orderId,
      status: result,
    };
  }

  // ---------------------------------------------------------------------------
  // Dùng chung với cron (PaymentExpiryService)
  // ---------------------------------------------------------------------------

  /** Lượt PENDING quá 10 phút => FAILED, đơn => PAYMENT_FAILED (hoặc CANCELLED). */
  async failExpiredPayments(now = new Date()): Promise<number> {
    const expired = await this.prisma.payment.findMany({
      where: { status: 'PENDING', expiresAt: { lte: now } },
      select: { id: true },
    });

    for (const item of expired) {
      await this.prisma.$transaction((tx) =>
        this.markPaymentFailed(tx, item.id, now),
      );
    }

    return expired.length;
  }

  /** Đơn PAYMENT_FAILED không thử lại trong 10 phút => CANCELLED. */
  async cancelStaleFailedOrders(now = new Date()): Promise<number> {
    const orders = await this.prisma.order.findMany({
      where: { status: 'PAYMENT_FAILED' },
      select: { id: true },
    });

    let cancelled = 0;

    for (const item of orders) {
      if (await this.cancelIfRetryWindowExpired(item.id, now)) {
        cancelled += 1;
      }
    }

    return cancelled;
  }

  /**
   * Đánh dấu lượt PENDING là FAILED và cập nhật đơn:
   *  - còn lượt PENDING khác còn hạn: giữ nguyên đơn
   *  - đủ MAX_FAILED_ATTEMPTS lượt FAILED: CANCELLED
   *  - ngược lại: PAYMENT_FAILED
   */
  async markPaymentFailed(
    tx: Prisma.TransactionClient,
    paymentId: string,
    now: Date,
  ): Promise<void> {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });

    if (!payment || payment.status !== 'PENDING') {
      return;
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'FAILED', failedAt: now },
    });

    const order = await tx.order.findUnique({
      where: { id: payment.orderId },
    });

    if (!order || !OPEN_ORDER_STATUSES.includes(order.status)) {
      return;
    }

    const activePayment = await tx.payment.findFirst({
      where: {
        orderId: order.id,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
    });

    if (activePayment) {
      return;
    }

    const failedCount = await tx.payment.count({
      where: { orderId: order.id, status: 'FAILED' },
    });

    const nextStatus =
      failedCount >= MAX_FAILED_ATTEMPTS ? 'CANCELLED' : 'PAYMENT_FAILED';

    if (order.status !== nextStatus) {
      await this.moveOrder(tx, order.id, order.status, nextStatus);
    }
  }

  /**
   * Cách DUY NHẤT module này đổi Order.status.
   *  - Chuyển không có trong PAYMENT_ORDER_TRANSITIONS => ném lỗi (chặn nhảy sai).
   *  - Chỉ cập nhật khi đơn vẫn đang ở trạng thái `from` (chống ghi đè khi chạy song song).
   * Trả về false nếu đơn đã bị đổi trạng thái bởi nơi khác.
   */
  private async moveOrder(
    client: { order: Prisma.TransactionClient['order'] },
    orderId: string,
    from: OrderStatus,
    to: OrderStatus,
  ): Promise<boolean> {
    if (!isAllowedOrderTransition(from, to)) {
      throw new ConflictException(
        `Không được chuyển đơn hàng từ ${from} sang ${to}`,
      );
    }

    const result = await client.order.updateMany({
      where: { id: orderId, status: from },
      data: { status: to },
    });

    return result.count > 0;
  }

  // Hủy đơn PAYMENT_FAILED nếu quá 10 phút kể từ lần thất bại gần nhất.
  private async cancelIfRetryWindowExpired(
    orderId: string,
    now: Date,
  ): Promise<boolean> {
    const activePayment = await this.prisma.payment.findFirst({
      where: { orderId, status: 'PENDING', expiresAt: { gt: now } },
    });

    if (activePayment) {
      return false;
    }

    const failedPayments = await this.prisma.payment.findMany({
      where: { orderId, status: 'FAILED' },
      select: { failedAt: true, createdAt: true },
    });

    if (failedPayments.length === 0) {
      return false;
    }

    const latestFailure = Math.max(
      ...failedPayments.map((item) =>
        (item.failedAt ?? item.createdAt).getTime(),
      ),
    );

    const expired =
      failedPayments.length >= MAX_FAILED_ATTEMPTS ||
      now.getTime() >= latestFailure + RETRY_WINDOW_MS;

    if (!expired) {
      return false;
    }

    return this.moveOrder(this.prisma, orderId, 'PAYMENT_FAILED', 'CANCELLED');
  }

  // ---------------------------------------------------------------------------
  // VNPay helpers
  // ---------------------------------------------------------------------------

  // Key lưu DB gắn với đơn hàng, nên khách dùng PAY-1 ở đơn nào cũng không đụng nhau.
  private toStorageKey(orderId: string, idempotencyKey: string): string {
    return `${orderId}:${idempotencyKey}`;
  }

  private buildPaymentUrl(
    paymentId: string,
    amount: number,
    ipAddress: string,
    createdAt: Date,
    expiresAt: Date,
  ): string {
    const tmnCode = this.config.get<string>('VNPAY_TMN_CODE');
    const hashSecret = this.config.get<string>('VNPAY_HASH_SECRET');
    const paymentUrl =
      this.config.get<string>('VNPAY_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = this.config.get<string>('VNPAY_RETURN_URL');

    if (!tmnCode || !hashSecret || !returnUrl) {
      throw new InternalServerErrorException(
        'Thiếu cấu hình VNPay trong file .env',
      );
    }

    if (expiresAt <= new Date()) {
      throw new ConflictException('Lượt thanh toán đã hết hạn');
    }

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: String(amount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: paymentId.replace(/-/g, ''),
      vnp_OrderInfo: `Thanh toan don hang ${paymentId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: this.normalizeIp(ipAddress),
      vnp_CreateDate: this.formatVnpDate(createdAt),
      vnp_ExpireDate: this.formatVnpDate(expiresAt),
    };

    const queryString = this.toQueryString(this.sortParams(params));
    const secureHash = this.hmacSha512(queryString, hashSecret);

    return `${paymentUrl}?${queryString}&vnp_SecureHash=${secureHash}`;
  }

  private isValidSignature(
    params: Record<string, string>,
    receivedHash: string,
  ): boolean {
    const hashSecret = this.config.get<string>('VNPAY_HASH_SECRET');

    if (!hashSecret) {
      throw new InternalServerErrorException(
        'Thiếu VNPAY_HASH_SECRET trong file .env',
      );
    }

    const unsignedParams = { ...params };
    delete unsignedParams.vnp_SecureHash;
    delete unsignedParams.vnp_SecureHashType;

    const queryString = this.toQueryString(this.sortParams(unsignedParams));
    const expectedHash = this.hmacSha512(queryString, hashSecret);

    if (!/^[a-fA-F0-9]{128}$/.test(receivedHash)) {
      return false;
    }

    const expected = Buffer.from(expectedHash, 'hex');
    const received = Buffer.from(receivedHash, 'hex');

    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  }

  private normalizeQuery(query: VnpayQuery): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string') {
        result[key] = value;
      } else if (value !== undefined) {
        throw new BadRequestException('Tham số trả về VNPay không hợp lệ');
      }
    }

    return result;
  }

  private sortParams(params: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.keys(params)
        .sort()
        .map((key) => [key, params[key]]),
    );
  }

  private toQueryString(params: Record<string, string>): string {
    return Object.entries(params)
      .map(
        ([key, value]) =>
          `${this.encodeVnpValue(key)}=${this.encodeVnpValue(value)}`,
      )
      .join('&');
  }

  private encodeVnpValue(value: string): string {
    return encodeURIComponent(value)
      .replace(/%20/g, '+')
      .replace(
        /[!'()*]/g,
        (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
      );
  }

  private hmacSha512(data: string, secret: string): string {
    return createHmac('sha512', secret).update(data, 'utf-8').digest('hex');
  }

  private formatVnpDate(date: Date): string {
    // Cộng 7 tiếng để ra giờ Việt Nam
    const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    
    // Lấy từng thành phần và ghép lại thành chuỗi yyyyMMddHHmmss chuẩn xác
    const year = vnTime.getUTCFullYear();
    const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vnTime.getUTCDate()).padStart(2, '0');
    const hours = String(vnTime.getUTCHours()).padStart(2, '0');
    const minutes = String(vnTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(vnTime.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private normalizeIp(ip: string): string {
    const normalized = (ip || '127.0.0.1').replace(/^::ffff:/, '');

    return normalized.length <= 45 ? normalized : '127.0.0.1';
  }

  private toUuid(value: string): string {
    return [
      value.slice(0, 8),
      value.slice(8, 12),
      value.slice(12, 16),
      value.slice(16, 20),
      value.slice(20),
    ].join('-');
  }
}