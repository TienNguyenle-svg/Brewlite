import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, Prisma } from '@prisma/client';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { isAllowedOrderTransition } from './payments.constants';
import { DiscountsService } from '../discounts/discounts.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const prisma = {
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  const configValues: Record<string, string> = {
    VNPAY_TMN_CODE: 'TESTCODE',
    VNPAY_HASH_SECRET: 'test-secret',
    VNPAY_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    VNPAY_RETURN_URL: 'http://localhost:3001/payments/vnpay-return',
  };

  const config = { get: jest.fn() };

  const discounts = {
    validateBeforePayment: jest.fn(),
    settlePaidOrder: jest.fn(),
    reservePendingPoints: jest.fn(),
    releasePendingPoints: jest.fn(),
    refundUsedPoints: jest.fn(),
  };
  const inventory = {
    reserveOrder: jest.fn(),
    releaseOrder: jest.fn(),
    settleOrder: jest.fn(),
    refundOrder: jest.fn(),
  };

  const order = {
    id: 'order-1',
    userId: 'user-1',
    total: 35000,
    status: 'PENDING',
    pointsUsed: 0,
  };

  const payment = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    orderId: 'order-1',
    idempotencyKey: 'order-1:PAY-1',
    amount: 35000,
    method: 'VNPAY',
    status: 'PENDING',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    failedAt: null,
  };

  const MIN = 60 * 1000;

  function createSignedQuery(
    overrides: Record<string, string> = {},
  ): Record<string, string> {
    const params: Record<string, string> = {
      vnp_TmnCode: 'TESTCODE',
      vnp_TxnRef: payment.id.replace(/-/g, ''),
      vnp_Amount: '3500000',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      ...overrides,
    };

    const queryString = Object.keys(params)
      .sort()
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
      )
      .join('&');

    const signature = createHmac('sha512', 'test-secret')
      .update(queryString, 'utf-8')
      .digest('hex');

    return { ...params, vnp_SecureHash: signature };
  }

  beforeEach(() => {
    jest.resetAllMocks();

    config.get.mockImplementation((key: string) => configValues[key]);
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => unknown) => callback(prisma),
    );
    prisma.$queryRaw.mockResolvedValue([]);
    prisma.order.updateMany.mockResolvedValue({ count: 1 });

    discounts.validateBeforePayment.mockResolvedValue(undefined);
    discounts.settlePaidOrder.mockResolvedValue(undefined);
    discounts.reservePendingPoints.mockResolvedValue(undefined);
    discounts.releasePendingPoints.mockResolvedValue(undefined);
    discounts.refundUsedPoints.mockResolvedValue(undefined);
    inventory.reserveOrder.mockResolvedValue(undefined);
    inventory.releaseOrder.mockResolvedValue(undefined);
    inventory.settleOrder.mockResolvedValue(undefined);
    inventory.refundOrder.mockResolvedValue(undefined);

    service = new PaymentsService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
      discounts as unknown as DiscountsService,
      inventory as unknown as InventoryService,
    );
  });

  // ---------------------------------------------------------------------------
  // createPayment
  // ---------------------------------------------------------------------------
  describe('createPayment', () => {
    function mockCreateOk() {
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => ({
          ...payment,
          ...data,
          createdAt: new Date(),
        }),
      );
    }

    it('tạo URL VNPay, lưu hạn 10 phút và key gắn với đơn hàng', async () => {
      mockCreateOk();
      const before = Date.now();

      const result = await service.createPayment(
        'user-1',
        'order-1',
        'PAY-1',
        '127.0.0.1',
      );

      const after = Date.now();

      expect(result.status).toBe('PENDING');
      expect(result.paymentUrl).toContain(
        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?',
      );
      expect(result.paymentUrl).toContain('vnp_SecureHash=');
      expect(result.paymentUrl).toContain('vnp_ExpireDate=');

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-1',
          idempotencyKey: 'order-1:PAY-1',
          amount: 35000,
          method: 'VNPAY',
          status: 'PENDING',
          expiresAt: expect.any(Date),
        }),
      });
      expect(inventory.reserveOrder).not.toHaveBeenCalled();
      expect(discounts.reservePendingPoints).not.toHaveBeenCalled();

      const expiresAt = prisma.payment.create.mock.calls[0][0].data
        .expiresAt as Date;
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 10 * MIN);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(after + 10 * MIN);
    });

    it('dùng total đã gồm shippingFee, không cộng phí ship lần hai', async () => {
      mockCreateOk();
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        total: 115000,
        shippingFee: 15000,
      });

      await service.createPayment('user-1', 'order-1', 'PAY-1', '127.0.0.1');

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-1',
          amount: 115000,
        }),
      });
    });

    it.each([
      'idem-key-123',
      '550e8400-e29b-41d4-a716-446655440000',
      'PAY-',
      'pay-1',
      'PAY-1a',
      '',
    ])('từ chối Idempotency-Key sai dạng: "%s"', async (key) => {
      await expect(
        service.createPayment('user-1', 'order-1', key, '127.0.0.1'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('từ chối khi thiếu Idempotency-Key', async () => {
      await expect(
        service.createPayment(
          'user-1',
          'order-1',
          undefined as never,
          '127.0.0.1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('báo lỗi khi không tìm thấy đơn hàng', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createPayment('user-1', 'order-1', 'PAY-1', '127.0.0.1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('từ chối thanh toán đơn hàng của người khác', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        userId: 'another-user',
      });

      await expect(
        service.createPayment('user-1', 'order-1', 'PAY-1', '127.0.0.1'),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it.each(['PAID', 'CANCELLED', 'PREPARING'])(
      'từ chối thanh toán đơn đang ở trạng thái %s',
      async (status) => {
        prisma.order.findUnique.mockResolvedValue({ ...order, status });
        prisma.payment.findUnique.mockResolvedValue(null);

        await expect(
          service.createPayment('user-1', 'order-1', 'PAY-1', '127.0.0.1'),
        ).rejects.toBeInstanceOf(ConflictException);

        expect(prisma.payment.create).not.toHaveBeenCalled();
      },
    );

    it('cùng Idempotency-Key khi lượt còn hạn: trả lại cùng URL, không tạo lượt mới', async () => {
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findUnique.mockResolvedValue(payment);

      const first = await service.createPayment(
        'user-1',
        'order-1',
        'PAY-1',
        '127.0.0.1',
      );
      const second = await service.createPayment(
        'user-1',
        'order-1',
        'PAY-1',
        '127.0.0.1',
      );

      expect(first.paymentUrl).toBe(second.paymentUrl);
      expect(prisma.payment.findUnique).toHaveBeenCalledWith({
        where: { idempotencyKey: 'order-1:PAY-1' },
      });
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('gửi lại key của lượt đã thành công: trả SUCCEEDED dù đơn đã PAID', async () => {
      prisma.order.findUnique.mockResolvedValue({ ...order, status: 'PAID' });
      prisma.payment.findUnique.mockResolvedValue({
        ...payment,
        status: 'SUCCEEDED',
      });

      const result = await service.createPayment(
        'user-1',
        'order-1',
        'PAY-1',
        '127.0.0.1',
      );

      expect(result.status).toBe('SUCCEEDED');
      expect(result.paymentUrl).toBeNull();
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('từ chối dùng lại key của lượt thất bại', async () => {
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findUnique.mockResolvedValue({
        ...payment,
        status: 'FAILED',
      });

      await expect(
        service.createPayment('user-1', 'order-1', 'PAY-1', '127.0.0.1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('từ chối dùng lại lượt đã hết hạn', async () => {
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findUnique.mockResolvedValue({
        ...payment,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.createPayment('user-1', 'order-1', 'PAY-1', '127.0.0.1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('từ chối tạo lượt mới khi đã có lượt thanh toán còn hạn', async () => {
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.findFirst.mockResolvedValue(payment);

      await expect(
        service.createPayment('user-1', 'order-1', 'PAY-2', '127.0.0.1'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('thử lại: đơn PAYMENT_FAILED => tạo lượt PENDING mới và đơn về PENDING', async () => {
      mockCreateOk();
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        status: 'PAYMENT_FAILED',
      });
      // Lần gọi đầu (kiểm tra hạn thử lại): đã thất bại 2 phút trước, còn trong 10 phút.
      prisma.payment.findMany.mockResolvedValueOnce([
        { failedAt: new Date(Date.now() - 2 * MIN), createdAt: new Date() },
      ]);
      prisma.order.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.createPayment(
        'user-1',
        'order-1',
        'PAY-2',
        '127.0.0.1',
      );

      expect(result.status).toBe('PENDING');
      expect(prisma.payment.create).toHaveBeenCalled();
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PAYMENT_FAILED' },
        data: { status: 'PENDING' },
      });
      expect(discounts.reservePendingPoints).toHaveBeenCalledWith(
        prisma,
        'order-1',
      );
      expect(inventory.reserveOrder).toHaveBeenCalledWith(prisma, 'order-1');
    });

    it('không thử lại trong 10 phút sau khi thất bại: hủy đơn và từ chối tạo lượt mới', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        status: 'PAYMENT_FAILED',
      });
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.findMany.mockResolvedValue([
        {
          failedAt: new Date(Date.now() - 11 * MIN),
          createdAt: new Date(Date.now() - 21 * MIN),
        },
      ]);
      prisma.order.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.createPayment('user-1', 'order-1', 'PAY-2', '127.0.0.1'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PAYMENT_FAILED' },
        data: { status: 'CANCELLED' },
      });
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // (b) Idempotency-Key: gửi 2 lần chỉ tạo 1 lượt
  // ---------------------------------------------------------------------------
  describe('Idempotency-Key', () => {
    beforeEach(() => {
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.findMany.mockResolvedValue([]);
    });

    it('gửi 2 lần cùng Idempotency-Key chỉ tạo 1 lượt thanh toán', async () => {
      let stored: Record<string, unknown> | null = null;

      prisma.payment.findUnique.mockImplementation(async () => stored);
      prisma.payment.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => {
          stored = { ...payment, ...data, createdAt: new Date() };
          return stored;
        },
      );

      const first = await service.createPayment(
        'user-1',
        'order-1',
        'PAY-1',
        '127.0.0.1',
      );
      const second = await service.createPayment(
        'user-1',
        'order-1',
        'PAY-1',
        '127.0.0.1',
      );

      expect(prisma.payment.create).toHaveBeenCalledTimes(1);
      expect(second.paymentId).toBe(first.paymentId);
      expect(second.paymentUrl).toBe(first.paymentUrl);
    });

    it('2 request song song cùng key (lỗi trùng P2002): request sau nhận lại lượt đã tạo', async () => {
      prisma.payment.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(payment);
      prisma.payment.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      const result = await service.createPayment(
        'user-1',
        'order-1',
        'PAY-1',
        '127.0.0.1',
      );

      expect(result.paymentId).toBe(payment.id);
      expect(prisma.payment.create).toHaveBeenCalledTimes(1);
    });

    it('cùng key PAY-1 ở 2 đơn khác nhau là 2 lượt độc lập (key lưu kèm mã đơn)', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => ({
          ...payment,
          ...data,
          createdAt: new Date(),
        }),
      );

      await service.createPayment('user-1', 'order-1', 'PAY-1', '127.0.0.1');

      prisma.order.findUnique.mockResolvedValue({ ...order, id: 'order-2' });
      await service.createPayment('user-1', 'order-2', 'PAY-1', '127.0.0.1');

      const keys = prisma.payment.create.mock.calls.map(
        (call) => call[0].data.idempotencyKey,
      );
      expect(keys).toEqual(['order-1:PAY-1', 'order-2:PAY-1']);
    });
  });

  // ---------------------------------------------------------------------------
  // (a) Chặn chuyển trạng thái sai
  // ---------------------------------------------------------------------------
  describe('bảng chuyển trạng thái Order', () => {
    const ALL: OrderStatus[] = [
      'PENDING',
      'PAID',
      'PAYMENT_FAILED',
      'PREPARING',
      'READY',
      'COMPLETED',
      'CANCELLED',
    ];

    // Đúng 5 chuyển được phép theo sơ đồ đã chốt.
    const ALLOWED = new Set([
      'PENDING>PAID',
      'PENDING>PAYMENT_FAILED',
      'PAYMENT_FAILED>PENDING',
      'PENDING>CANCELLED',
      'PAYMENT_FAILED>CANCELLED',
    ]);

    const PAIRS = ALL.flatMap((from) =>
      ALL.map((to) => [from, to] as [OrderStatus, OrderStatus]),
    );

    it.each(PAIRS)('%s -> %s', (from, to) => {
      expect(isAllowedOrderTransition(from, to)).toBe(
        ALLOWED.has(`${from}>${to}`),
      );
    });

    it('mũi tên một chiều không đi ngược được', () => {
      expect(isAllowedOrderTransition('PENDING', 'PAID')).toBe(true);
      expect(isAllowedOrderTransition('PAID', 'PENDING')).toBe(false);
      expect(isAllowedOrderTransition('PENDING', 'CANCELLED')).toBe(true);
      expect(isAllowedOrderTransition('CANCELLED', 'PENDING')).toBe(false);
      expect(isAllowedOrderTransition('PAYMENT_FAILED', 'CANCELLED')).toBe(
        true,
      );
      expect(isAllowedOrderTransition('CANCELLED', 'PAYMENT_FAILED')).toBe(
        false,
      );
    });

    it('mũi tên hai chiều đi được cả hai hướng', () => {
      expect(isAllowedOrderTransition('PENDING', 'PAYMENT_FAILED')).toBe(true);
      expect(isAllowedOrderTransition('PAYMENT_FAILED', 'PENDING')).toBe(true);
    });

    it('moveOrder ném lỗi và không ghi DB khi chuyển sai (PAID -> PENDING)', async () => {
      const move = (
        service as unknown as {
          moveOrder: (
            client: unknown,
            id: string,
            from: OrderStatus,
            to: OrderStatus,
          ) => Promise<boolean>;
        }
      ).moveOrder.bind(service);

      await expect(
        move(prisma, 'order-1', 'PAID', 'PENDING'),
      ).rejects.toBeInstanceOf(ConflictException);
      await expect(
        move(prisma, 'order-1', 'PAYMENT_FAILED', 'PAID'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('moveOrder chỉ ghi khi đơn vẫn đang ở trạng thái cũ', async () => {
      const move = (
        service as unknown as {
          moveOrder: (
            client: unknown,
            id: string,
            from: OrderStatus,
            to: OrderStatus,
          ) => Promise<boolean>;
        }
      ).moveOrder.bind(service);

      prisma.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(move(prisma, 'order-1', 'PENDING', 'PAID')).resolves.toBe(
        false,
      );
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'PAID' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // cancelOrder
  // ---------------------------------------------------------------------------
  describe('cancelOrder', () => {
    it('khách hủy đơn PAYMENT_FAILED => CANCELLED, lượt cũ giữ FAILED', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        status: 'PAYMENT_FAILED',
      });
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.findFirst.mockResolvedValue(null);

      const result = await service.cancelOrder('user-1', 'order-1');

      expect(result).toEqual({ orderId: 'order-1', status: 'CANCELLED' });
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PAYMENT_FAILED' },
        data: { status: 'CANCELLED' },
      });
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('lượt PENDING đã quá hạn nhưng cron chưa chạy: thành FAILED rồi mới hủy được', async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce(order) // đọc đơn ban đầu: PENDING
        .mockResolvedValueOnce(order) // trong markPaymentFailed: PENDING
        .mockResolvedValueOnce({ ...order, status: 'PAYMENT_FAILED' }); // đọc lại sau đó
      prisma.payment.findMany.mockResolvedValue([{ id: payment.id }]);
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.count.mockResolvedValue(1);

      const result = await service.cancelOrder('user-1', 'order-1');

      expect(result.status).toBe('CANCELLED');
      expect(prisma.order.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'PAYMENT_FAILED' },
      });
      expect(prisma.order.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: 'order-1', status: 'PAYMENT_FAILED' },
        data: { status: 'CANCELLED' },
      });
    });

    it('hủy lần 2 vẫn trả CANCELLED (idempotent)', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        status: 'CANCELLED',
      });

      const result = await service.cancelOrder('user-1', 'order-1');

      expect(result.status).toBe('CANCELLED');
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('từ chối hủy đơn của người khác', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        userId: 'another-user',
        status: 'PAYMENT_FAILED',
      });

      await expect(
        service.cancelOrder('user-1', 'order-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('báo lỗi khi không tìm thấy đơn', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelOrder('user-1', 'order-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it.each(['PAID', 'PREPARING', 'READY', 'COMPLETED'])(
      'từ chối hủy đơn ở trạng thái %s',
      async (status) => {
        prisma.order.findUnique.mockResolvedValue({ ...order, status });

        await expect(
          service.cancelOrder('user-1', 'order-1'),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(prisma.order.updateMany).not.toHaveBeenCalled();
      },
    );

    it('từ chối hủy đơn PENDING chưa có lỗi thanh toán (chỉ hủy sau khi thanh toán lỗi)', async () => {
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.cancelOrder('user-1', 'order-1'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('từ chối hủy khi đang có lượt thanh toán còn hạn', async () => {
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.findFirst.mockResolvedValue(payment);

      await expect(
        service.cancelOrder('user-1', 'order-1'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // processVnpayIpn
  // ---------------------------------------------------------------------------
  describe('processVnpayIpn', () => {
    it('xác nhận thanh toán thành công và quyết toán điểm', async () => {
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        pointsUsed: 20,
      });
      prisma.payment.findFirst.mockResolvedValue(null);

      const result = await service.processVnpayIpn(createSignedQuery());

      expect(result).toEqual({ RspCode: '00', Message: 'Confirm Success' });
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: payment.id },
        data: { status: 'SUCCEEDED' },
      });
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'PAID' },
      });
      expect(discounts.settlePaidOrder).toHaveBeenCalledWith(prisma, {
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 20,
        amountPaid: 35000,
      });
      expect(discounts.releasePendingPoints).toHaveBeenCalledWith(
        prisma,
        'order-1',
      );
    });

    it('từ chối IPN có chữ ký không hợp lệ', async () => {
      const result = await service.processVnpayIpn({
        ...createSignedQuery(),
        vnp_SecureHash: 'invalid',
      });

      expect(result).toEqual({
        RspCode: '97',
        Message: 'Chữ ký VNPay không hợp lệ',
      });
      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it('IPN báo thất bại => payment FAILED và đơn PAYMENT_FAILED', async () => {
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.count.mockResolvedValue(1);

      const result = await service.processVnpayIpn(
        createSignedQuery({
          vnp_ResponseCode: '24',
          vnp_TransactionStatus: '02',
        }),
      );

      expect(result).toEqual({ RspCode: '00', Message: 'Confirm Success' });
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: payment.id },
        data: { status: 'FAILED', failedAt: expect.any(Date) },
      });
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'PAYMENT_FAILED' },
      });
      expect(discounts.releasePendingPoints).toHaveBeenCalledWith(
        prisma,
        'order-1',
      );
      expect(inventory.releaseOrder).toHaveBeenCalledWith(prisma, 'order-1');
      expect(discounts.settlePaidOrder).not.toHaveBeenCalled();
    });

    it('IPN thất bại lần thứ ba => hủy đơn và giải phóng điểm giữ', async () => {
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.count.mockResolvedValue(3);

      const result = await service.processVnpayIpn(
        createSignedQuery({
          vnp_ResponseCode: '24',
          vnp_TransactionStatus: '02',
        }),
      );

      expect(result).toEqual({ RspCode: '00', Message: 'Confirm Success' });
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });
      expect(discounts.releasePendingPoints).toHaveBeenCalledWith(
        prisma,
        'order-1',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // processVnpayReturn
  // ---------------------------------------------------------------------------
  describe('processVnpayReturn', () => {
    it('từ chối chữ ký không hợp lệ', async () => {
      await expect(
        service.processVnpayReturn({
          vnp_SecureHash: 'invalid',
          vnp_TxnRef: payment.id.replace(/-/g, ''),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('từ chối số tiền không khớp', async () => {
      prisma.payment.findUnique.mockResolvedValue(payment);

      await expect(
        service.processVnpayReturn(createSignedQuery({ vnp_Amount: '100000' })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('báo lỗi khi không tìm thấy payment', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      await expect(
        service.processVnpayReturn(createSignedQuery()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('thành công: payment SUCCEEDED, đơn PAID', async () => {
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findFirst.mockResolvedValue(null);

      const result = await service.processVnpayReturn(createSignedQuery());

      expect(result).toEqual({ orderId: 'order-1', status: 'success' });
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: payment.id },
        data: { status: 'SUCCEEDED' },
      });
      expect(prisma.order.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'PAID' },
      });
    });

    it('kết quả thành công đến muộn: đơn PAYMENT_FAILED đi PENDING rồi PAID', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        ...payment,
        status: 'FAILED',
      });
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        status: 'PAYMENT_FAILED',
      });
      prisma.payment.findFirst.mockResolvedValue(null);

      const result = await service.processVnpayReturn(createSignedQuery());

      expect(result.status).toBe('success');
      // Đi đúng 2 mũi tên hợp lệ: PAYMENT_FAILED -> PENDING -> PAID
      expect(prisma.order.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: 'order-1', status: 'PAYMENT_FAILED' },
        data: { status: 'PENDING' },
      });
      expect(prisma.order.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'PAID' },
      });
      expect(inventory.reserveOrder).not.toHaveBeenCalled();
      expect(inventory.settleOrder).toHaveBeenCalledWith(
        prisma,
        'order-1',
        true,
      );
    });

    it('thành công nhưng đơn đã bị hủy: báo lỗi để đối soát', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        ...payment,
        status: 'FAILED',
      });
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        status: 'CANCELLED',
      });

      await expect(
        service.processVnpayReturn(createSignedQuery()),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('VNPay báo thất bại: payment FAILED, đơn PAYMENT_FAILED', async () => {
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.count.mockResolvedValue(1);

      const result = await service.processVnpayReturn(
        createSignedQuery({
          vnp_ResponseCode: '24',
          vnp_TransactionStatus: '02',
        }),
      );

      expect(result).toEqual({ orderId: 'order-1', status: 'failed' });
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: payment.id },
        data: { status: 'FAILED', failedAt: expect.any(Date) },
      });
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'PAYMENT_FAILED' },
      });
      expect(discounts.releasePendingPoints).toHaveBeenCalledWith(
        prisma,
        'order-1',
      );
    });

    it('thất bại lần thứ 3: đơn CANCELLED, không bị ghi đè về PAYMENT_FAILED', async () => {
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.count.mockResolvedValue(3);

      const result = await service.processVnpayReturn(
        createSignedQuery({
          vnp_ResponseCode: '24',
          vnp_TransactionStatus: '02',
        }),
      );

      expect(result.status).toBe('failed');
      expect(prisma.order.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });
    });

    it('callback gửi lại cho payment đã thành công => success, không ghi DB', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        ...payment,
        status: 'SUCCEEDED',
      });
      prisma.order.findUnique.mockResolvedValue({ ...order, status: 'PAID' });

      const result = await service.processVnpayReturn(createSignedQuery());

      expect(result).toEqual({ orderId: 'order-1', status: 'success' });
      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('callback gửi lại cho payment đã thất bại => failed, không ghi DB', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        ...payment,
        status: 'FAILED',
      });
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        status: 'PAYMENT_FAILED',
      });

      const result = await service.processVnpayReturn(
        createSignedQuery({
          vnp_ResponseCode: '24',
          vnp_TransactionStatus: '02',
        }),
      );

      expect(result).toEqual({ orderId: 'order-1', status: 'failed' });
      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Mã giảm giá & điểm thưởng: chỉ quyết toán khi PAID
  // ---------------------------------------------------------------------------
  describe('điểm thưởng và mã giảm giá', () => {
    it('thanh toán thành công => quyết toán điểm đúng một lần với số tiền thực trả', async () => {
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.order.findUnique.mockResolvedValue({ ...order, pointsUsed: 20 });
      prisma.payment.findFirst.mockResolvedValue(null);

      await service.processVnpayReturn(createSignedQuery());

      expect(discounts.settlePaidOrder).toHaveBeenCalledTimes(1);
      expect(discounts.settlePaidOrder).toHaveBeenCalledWith(prisma, {
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 20,
        amountPaid: 35000,
      });
    });

    it('thanh toán đến muộn (PAYMENT_FAILED -> PENDING -> PAID) vẫn quyết toán một lần', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        ...payment,
        status: 'FAILED',
      });
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        status: 'PAYMENT_FAILED',
      });
      prisma.payment.findFirst.mockResolvedValue(null);

      await service.processVnpayReturn(createSignedQuery());

      expect(discounts.settlePaidOrder).toHaveBeenCalledTimes(1);
    });

    it('VNPay báo thất bại => KHÔNG trừ điểm, không quyết toán', async () => {
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.count.mockResolvedValue(1);

      await service.processVnpayReturn(
        createSignedQuery({
          vnp_ResponseCode: '24',
          vnp_TransactionStatus: '02',
        }),
      );

      expect(discounts.settlePaidOrder).not.toHaveBeenCalled();
    });

    it('thất bại lần 3 (đơn CANCELLED) => KHÔNG trừ điểm', async () => {
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.count.mockResolvedValue(3);

      await service.processVnpayReturn(
        createSignedQuery({
          vnp_ResponseCode: '24',
          vnp_TransactionStatus: '02',
        }),
      );

      expect(discounts.settlePaidOrder).not.toHaveBeenCalled();
    });

    it('callback thành công gửi lại => không quyết toán lần 2', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        ...payment,
        status: 'SUCCEEDED',
      });
      prisma.order.findUnique.mockResolvedValue({ ...order, status: 'PAID' });

      await service.processVnpayReturn(createSignedQuery());

      expect(discounts.settlePaidOrder).not.toHaveBeenCalled();
    });

    it('đơn đã CANCELLED nhận thành công muộn => không quyết toán', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        ...payment,
        status: 'FAILED',
      });
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        status: 'CANCELLED',
      });

      await expect(
        service.processVnpayReturn(createSignedQuery()),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(discounts.settlePaidOrder).not.toHaveBeenCalled();
    });

    it('tạo lượt thanh toán => kiểm tra lại mã và điểm trước khi chốt tiền', async () => {
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => ({
          ...payment,
          ...data,
          createdAt: new Date(),
        }),
      );

      await service.createPayment('user-1', 'order-1', 'PAY-1', '127.0.0.1');

      expect(discounts.validateBeforePayment).toHaveBeenCalledTimes(1);
    });

    it('mã hoặc điểm không còn hợp lệ => không tạo lượt thanh toán', async () => {
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.findMany.mockResolvedValue([]);
      discounts.validateBeforePayment.mockRejectedValue(
        new ConflictException('Mã giảm giá không còn hợp lệ'),
      );

      await expect(
        service.createPayment('user-1', 'order-1', 'PAY-1', '127.0.0.1'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Cron: hết hạn 10 phút
  // ---------------------------------------------------------------------------
  describe('failExpiredPayments', () => {
    it('lượt PENDING quá 10 phút => FAILED, đơn => PAYMENT_FAILED', async () => {
      prisma.payment.findMany.mockResolvedValue([{ id: payment.id }]);
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.count.mockResolvedValue(1);

      const count = await service.failExpiredPayments(new Date());

      expect(count).toBe(1);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: payment.id },
        data: { status: 'FAILED', failedAt: expect.any(Date) },
      });
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'PAYMENT_FAILED' },
      });
    });

    it('lượt hết hạn thứ 3 => đơn CANCELLED', async () => {
      prisma.payment.findMany.mockResolvedValue([{ id: payment.id }]);
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.count.mockResolvedValue(3);

      await service.failExpiredPayments(new Date());

      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });
    });
  });

  describe('cancelStaleFailedOrders', () => {
    beforeEach(() => {
      prisma.order.findMany.mockResolvedValue([{ id: 'order-1' }]);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
    });

    it('hủy đơn không thử lại sau 10 phút', async () => {
      prisma.payment.findMany.mockResolvedValue([
        {
          failedAt: new Date(Date.now() - 11 * MIN),
          createdAt: new Date(Date.now() - 21 * MIN),
        },
      ]);

      const count = await service.cancelStaleFailedOrders(new Date());

      expect(count).toBe(1);
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PAYMENT_FAILED' },
        data: { status: 'CANCELLED' },
      });
    });

    it('chưa đủ 10 phút thì giữ PAYMENT_FAILED để khách còn thử lại', async () => {
      prisma.payment.findMany.mockResolvedValue([
        {
          failedAt: new Date(Date.now() - 5 * MIN),
          createdAt: new Date(Date.now() - 15 * MIN),
        },
      ]);

      const count = await service.cancelStaleFailedOrders(new Date());

      expect(count).toBe(0);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('cancelStaleOrdersWithoutPayment', () => {
    it('hủy đơn PENDING quá hạn chưa có payment và nhả reservation', async () => {
      const now = new Date();
      prisma.order.findMany.mockResolvedValue([{ id: 'order-1' }]);
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'PENDING',
        createdAt: new Date(now.getTime() - 11 * MIN),
      });
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.order.updateMany.mockResolvedValue({ count: 1 });

      const count = await service.cancelStaleOrdersWithoutPayment(now);

      expect(count).toBe(1);
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          createdAt: { lte: new Date(now.getTime() - 10 * MIN) },
          payments: { none: {} },
        },
        select: { id: true },
      });
      expect(inventory.releaseOrder).toHaveBeenCalledWith(prisma, 'order-1');
      expect(discounts.releasePendingPoints).toHaveBeenCalledWith(
        prisma,
        'order-1',
      );
    });

    it('không hủy nếu payment đã được tạo sau lần quét ban đầu', async () => {
      const now = new Date();
      prisma.order.findMany.mockResolvedValue([{ id: 'order-1' }]);
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'PENDING',
        createdAt: new Date(now.getTime() - 11 * MIN),
      });
      prisma.payment.findFirst.mockResolvedValue({ id: 'payment-1' });

      const count = await service.cancelStaleOrdersWithoutPayment(now);

      expect(count).toBe(0);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });
  });
});
