import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order, Prisma, Promotion } from '@prisma/client';
import type { CartItemDto } from './dto/cart-item.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  LOYALTY_REASON,
  MIN_REDEEM_POINTS,
  FREE_SHIPPING_THRESHOLD_VND,
  SHIPPING_FEE_VND,
  EARN_BLOCK_VND,
  EARN_POINTS_PER_BLOCK,
  POINT_VALUE_VND,
  PROMOTION_RESERVED_STATUSES,
  SUCCESSFUL_ORDER_STATUSES,
} from './discounts.constants';
import {
  calcEarnedPoints,
  calcMaxRedeemPoints,
  calcPromotionDiscount,
  getSubtotal,
} from './order-pricing';

type DiscountOrder = Pick<
  Order,
  | 'id'
  | 'userId'
  | 'status'
  | 'total'
  | 'promotionId'
  | 'discountAmount'
  | 'pointsUsed'
  | 'pointsDiscount'
  | 'shippingFee'
  | 'createdAt'
>;

/** Preview endpoints are read-only; loyalty points are settled only after payment succeeds. */
@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // POST /checkout/preview
  // ---------------------------------------------------------------------------
  async previewCheckout(
    userId: string,
    items: CartItemDto[],
    rawPromotionCode?: string,
    usePoints = false,
  ) {
    const subtotal = await this.calculateCartSubtotal(items);
    let promotion: Promotion | null = null;
    if (rawPromotionCode?.trim()) {
      promotion = await this.findUsablePromotion(
        userId,
        rawPromotionCode,
        subtotal,
        new Date(),
      );
    }

    const discountAmount = promotion
      ? calcPromotionDiscount(promotion, subtotal)
      : 0;
    const afterPromotion = subtotal - discountAmount;
    let pointsUsed = 0;

    if (usePoints) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          loyaltyPoints: true,
          reservedPoints: true,
          pointsOwed: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      const availablePoints = Math.max(
        0,
        user.loyaltyPoints -
          (user.reservedPoints ?? 0) -
          (user.pointsOwed ?? 0),
      );

      if (availablePoints < MIN_REDEEM_POINTS) {
        throw new BadRequestException(
          `Cần có tối thiểu ${MIN_REDEEM_POINTS} điểm thưởng để áp dụng`,
        );
      }

      const maxPoints = calcMaxRedeemPoints(afterPromotion);
      if (maxPoints < MIN_REDEEM_POINTS) {
        throw new BadRequestException(
          `Đơn hàng cần đủ điều kiện để áp dụng tối thiểu ${MIN_REDEEM_POINTS} điểm`,
        );
      }

      pointsUsed = Math.min(availablePoints, maxPoints);
    }

    const pointsDiscount = pointsUsed * POINT_VALUE_VND;
    const shippingFee =
      subtotal >= FREE_SHIPPING_THRESHOLD_VND ? 0 : SHIPPING_FEE_VND;

    return {
      promotionCode: promotion?.code ?? null,
      subtotal,
      discountAmount,
      pointsUsed,
      pointsDiscount,
      shippingFee,
      total: afterPromotion - pointsDiscount + shippingFee,
    };
  }

  // ---------------------------------------------------------------------------
  // GET /users/me/loyalty
  // ---------------------------------------------------------------------------
  async getLoyalty(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        loyaltyPoints: true,
        reservedPoints: true,
        pointsOwed: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const validOrderIds = new Set<string>();
    const orderClient = this.prisma.order as
      | { findMany?: (args: unknown) => Promise<Array<{ id: string }>> }
      | undefined;
    if (orderClient?.findMany) {
      const paidOrderIds = await orderClient.findMany({
        where: {
          userId,
          status: {
            in: ['PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'],
          },
        },
        select: { id: true },
      });
      for (const order of paidOrderIds) validOrderIds.add(order.id);
    }

    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const visibleTransactions = transactions.filter(
      (tx) =>
        !tx.orderId ||
        validOrderIds.size === 0 ||
        validOrderIds.has(tx.orderId),
    );

    const availablePoints = Math.max(
      0,
      user.loyaltyPoints - (user.reservedPoints ?? 0) - (user.pointsOwed ?? 0),
    );

    return {
      points: user.loyaltyPoints,
      availablePoints,
      reservedPoints: user.reservedPoints ?? 0,
      pointsOwed: user.pointsOwed ?? 0,
      pointValueVnd: POINT_VALUE_VND,
      earnRule: `${EARN_BLOCK_VND} đồng = ${EARN_POINTS_PER_BLOCK} điểm`,
      transactions: visibleTransactions,
    };
  }

  // ---------------------------------------------------------------------------
  // Gọi từ PaymentsService
  // ---------------------------------------------------------------------------

  /** Trước khi tạo lượt thanh toán: mã và điểm gắn vào đơn còn hợp lệ không. */
  async validateBeforePayment(
    tx: Prisma.TransactionClient,
    order: DiscountOrder,
    now = new Date(),
  ): Promise<void> {
    await this.validatePromotionForOrder(tx, order, now);

    if (order.pointsUsed > 0) {
      const user = await tx.user.findUnique({
        where: { id: order.userId },
        select: {
          loyaltyPoints: true,
          reservedPoints: true,
          pointsOwed: true,
        },
      });

      const ownReservation = order.status === 'PENDING' ? order.pointsUsed : 0;
      const available = Math.max(
        0,
        (user?.loyaltyPoints ?? 0) -
          (user?.reservedPoints ?? 0) -
          (user?.pointsOwed ?? 0) +
          ownReservation,
      );
      if (!user || available < order.pointsUsed) {
        throw new ConflictException(
          'Số điểm hiện có không đủ cho đơn này, hãy chọn lại số điểm',
        );
      }
    }
  }

  async validatePromotionForOrder(
    tx: Prisma.TransactionClient,
    order: Pick<
      DiscountOrder,
      | 'id'
      | 'userId'
      | 'promotionId'
      | 'createdAt'
      | 'total'
      | 'discountAmount'
      | 'pointsDiscount'
      | 'shippingFee'
    >,
    now = new Date(),
  ): Promise<void> {
    if (order.promotionId) {
      const promotion = await tx.promotion.findUnique({
        where: { id: order.promotionId },
      });

      if (!promotion) {
        throw new ConflictException(
          'Mã giảm giá không còn tồn tại, hãy áp lại mã',
        );
      }

      // Khóa dòng mã để các khách thanh toán cùng lúc được kiểm tra lần lượt.
      await tx.$queryRaw`SELECT "id" FROM "Promotion" WHERE "id" = ${promotion.id} FOR UPDATE`;

      try {
        await this.assertPromotionUsable(
          tx,
          promotion,
          order.userId,
          { id: order.id, createdAt: order.createdAt },
          getSubtotal(order),
          now,
        );
      } catch (error) {
        if (error instanceof HttpException) {
          throw new ConflictException(
            `Mã giảm giá không còn hợp lệ, hãy áp lại mã (${error.message})`,
          );
        }
        throw error;
      }
    }
  }

  async reservePendingPoints(
    tx: Prisma.TransactionClient,
    orderId: string,
  ): Promise<void> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { userId: true, pointsUsed: true },
    });

    if (!order || order.pointsUsed <= 0) {
      return;
    }

    const updated = await tx.$executeRaw`
      UPDATE "User"
      SET "reservedPoints" = "reservedPoints" + ${order.pointsUsed}
      WHERE "id" = ${order.userId}
        AND "loyaltyPoints" - "reservedPoints" - "pointsOwed" >= ${order.pointsUsed}
    `;

    if (updated === 0) {
      throw new ConflictException(
        'Số điểm hiện có không đủ cho đơn này, hãy chọn lại số điểm',
      );
    }
  }

  async releasePendingPoints(
    tx: Prisma.TransactionClient,
    orderId: string,
  ): Promise<void> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { userId: true, pointsUsed: true },
    });

    if (!order || order.pointsUsed <= 0) {
      return;
    }

    await tx.$executeRaw`
      UPDATE "User"
      SET "reservedPoints" = GREATEST("reservedPoints" - ${order.pointsUsed}, 0)
      WHERE "id" = ${order.userId}
    `;
  }

  async refundUsedPoints(
    tx: Prisma.TransactionClient,
    orderId: string,
  ): Promise<void> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true },
    });

    if (!order) {
      return;
    }

    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${order.userId} FOR UPDATE`;

    const user = await tx.user.findUnique({
      where: { id: order.userId },
      select: {
        loyaltyPoints: true,
        reservedPoints: true,
        pointsOwed: true,
      },
    });

    if (!user) {
      return;
    }

    const transactions = await tx.loyaltyTransaction.findMany({
      where: {
        orderId: order.id,
        reason: {
          in: [
            LOYALTY_REASON.REDEEM,
            LOYALTY_REASON.REDEEM_REFUND,
            LOYALTY_REASON.EARN,
            LOYALTY_REASON.EARN_REVOKE,
          ],
        },
      },
      select: { points: true, reason: true },
    });

    const redeemed = transactions.reduce((sum, transaction) => {
      if (transaction.reason === LOYALTY_REASON.REDEEM) {
        return sum - transaction.points;
      }
      if (transaction.reason === LOYALTY_REASON.REDEEM_REFUND) {
        return sum - transaction.points;
      }
      return sum;
    }, 0);
    const refundable = Math.max(0, redeemed);
    const earned = transactions.reduce((sum, transaction) => {
      if (transaction.reason === LOYALTY_REASON.EARN) {
        return sum + transaction.points;
      }
      if (transaction.reason === LOYALTY_REASON.EARN_REVOKE) {
        return sum + transaction.points;
      }
      return sum;
    }, 0);
    const alreadyRevoked = transactions.some(
      (transaction) => transaction.reason === LOYALTY_REASON.EARN_REVOKE,
    );
    const pointsToRevoke = alreadyRevoked ? 0 : Math.max(0, earned);
    const existingDebt = user.pointsOwed ?? 0;
    const debtPayment = Math.min(existingDebt, refundable);
    const balanceAfterRefund = user.loyaltyPoints + refundable - debtPayment;
    const debtAfterRefund = existingDebt - debtPayment;
    const availableAfterRefund = Math.max(
      0,
      balanceAfterRefund - (user.reservedPoints ?? 0) - debtAfterRefund,
    );
    const revoked = Math.min(pointsToRevoke, availableAfterRefund);
    const revokeOwed = pointsToRevoke - revoked;

    if (refundable > 0 || pointsToRevoke > 0 || debtPayment > 0) {
      await tx.user.update({
        where: { id: order.userId },
        data: {
          loyaltyPoints: balanceAfterRefund - revoked,
          pointsOwed: debtAfterRefund + revokeOwed,
        },
      });
    }

    if (refundable > 0) {
      await tx.loyaltyTransaction.create({
        data: {
          userId: order.userId,
          points: refundable,
          reason: LOYALTY_REASON.REDEEM_REFUND,
          orderId: order.id,
        },
      });
    }

    if (pointsToRevoke > 0) {
      // The record also marks revocation as processed when all of it becomes debt.
      await tx.loyaltyTransaction.create({
        data: {
          userId: order.userId,
          points: -revoked,
          reason: LOYALTY_REASON.EARN_REVOKE,
          orderId: order.id,
        },
      });
    }

    if (debtPayment > 0) {
      await tx.loyaltyTransaction.create({
        data: {
          userId: order.userId,
          points: -debtPayment,
          reason: LOYALTY_REASON.EARN_REVOKE,
        },
      });
    }
  }

  /**
   * Khi đơn lên PAID (chỉ gọi đúng một lần): ghi nhận lượt dùng mã,
   * trừ điểm đã dùng, cộng điểm mới.
   */
  async settlePaidOrder(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      userId: string;
      pointsUsed: number;
      amountPaid: number;
    },
  ): Promise<void> {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${order.userId} FOR UPDATE`;

    // Ghi nhận lượt dùng mã. Bảng PromotionUsage không bị xóa khi đơn bị hủy/hoàn tiền
    // nên lượt dùng không được trả lại. skipDuplicates giúp gọi lại không bị lỗi.
    const paidOrder = await tx.order.findUnique({
      where: { id: order.id },
      select: { promotionId: true },
    });

    if (paidOrder?.promotionId) {
      await tx.promotionUsage.createMany({
        data: [
          {
            promotionId: paidOrder.promotionId,
            userId: order.userId,
            orderId: order.id,
          },
        ],
        skipDuplicates: true,
      });
    }

    // Đã quyết toán rồi thì bỏ qua (không cộng/trừ 2 lần).
    const settled = await tx.loyaltyTransaction.findFirst({
      where: {
        orderId: order.id,
        reason: {
          in: [
            LOYALTY_REASON.EARN,
            LOYALTY_REASON.REDEEM,
            LOYALTY_REASON.DEBT_SETTLEMENT,
          ],
        },
      },
    });

    if (settled) {
      return;
    }

    const user = await tx.user.findUnique({
      where: { id: order.userId },
      select: {
        loyaltyPoints: true,
        reservedPoints: true,
        pointsOwed: true,
      },
    });

    if (!user) {
      return;
    }

    let balance = user.loyaltyPoints;
    let pointsOwed = user.pointsOwed ?? 0;

    if (order.pointsUsed > 0) {
      const available = Math.max(
        0,
        balance - pointsOwed - (user.reservedPoints ?? 0),
      );
      const deduct = Math.min(order.pointsUsed, available);

      if (deduct > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            userId: order.userId,
            points: -deduct,
            reason: LOYALTY_REASON.REDEEM,
            orderId: order.id,
          },
        });
        balance -= deduct;
      }
    }

    const earned = calcEarnedPoints(order.amountPaid);
    const debtPayment = Math.min(earned, pointsOwed);
    const credited = earned - debtPayment;

    if (credited > 0) {
      await tx.loyaltyTransaction.create({
        data: {
          userId: order.userId,
          points: credited,
          reason: LOYALTY_REASON.EARN,
          orderId: order.id,
        },
      });
      balance += credited;
    }

    if (debtPayment > 0) {
      await tx.loyaltyTransaction.create({
        data: {
          userId: order.userId,
          points: -debtPayment,
          reason: LOYALTY_REASON.DEBT_SETTLEMENT,
          orderId: order.id,
        },
      });
    }

    await tx.user.update({
      where: { id: order.userId },
      data: {
        loyaltyPoints: balance,
        ...(debtPayment > 0 ? { pointsOwed: { decrement: debtPayment } } : {}),
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Nội bộ
  // ---------------------------------------------------------------------------

  /**
   * Quy tắc mã giảm giá:
   *  - Mỗi tài khoản chỉ dùng 1 mã 1 lần. Lượt dùng ghi khi đơn PAID và không mất khi đơn bị hủy.
   *  - Đơn PENDING giữ chỗ mã. PAYMENT_FAILED / CANCELLED nhả mã (trả lại số lượng).
   *  - Số lượng bị chiếm = đơn đã thanh toán + đơn PENDING tạo trước đơn đang kiểm tra,
   *    nên hai đơn cùng chờ không chặn lẫn nhau, đơn đến trước giữ chỗ trước.
   * `current` là đơn đang kiểm tra; không truyền khi chỉ xem trước giỏ hàng.
   */
  private async assertPromotionUsable(
    tx: Pick<Prisma.TransactionClient, 'order' | 'promotionUsage'>,
    promotion: Promotion,
    userId: string,
    current: { id: string; createdAt: Date } | undefined,
    subtotal: number,
    now: Date,
  ): Promise<void> {
    if (!promotion.active) {
      throw new BadRequestException('Mã giảm giá không còn hiệu lực');
    }

    if (promotion.startAt && promotion.startAt > now) {
      throw new BadRequestException('Mã giảm giá chưa đến thời gian áp dụng');
    }

    if (promotion.expiredAt && promotion.expiredAt <= now) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }

    if (subtotal < promotion.minOrder) {
      throw new BadRequestException(
        `Đơn hàng cần tối thiểu ${promotion.minOrder}đ để dùng mã này`,
      );
    }

    const notCurrent = current ? { id: { not: current.id } } : {};
    // Chỉ đơn PENDING tạo trước đơn hiện tại mới giữ chỗ trước.
    const reservedBefore = current
      ? {
          OR: [
            { createdAt: { lt: current.createdAt } },
            { createdAt: current.createdAt, id: { lt: current.id } },
          ],
        }
      : {};

    // 1. Tài khoản đã dùng mã ở đơn khác (kể cả đơn đã bị hủy sau khi PAID).
    const usedByUser = await tx.promotionUsage.findUnique({
      where: {
        userId_promotionId: { userId, promotionId: promotion.id },
      },
    });

    if (usedByUser && usedByUser.orderId !== current?.id) {
      throw new ConflictException('Bạn đã sử dụng mã giảm giá này rồi');
    }

    // 2. Mã đang được giữ ở một đơn chờ thanh toán khác của chính khách này.
    const heldByUser = await tx.order.count({
      where: {
        userId,
        promotionId: promotion.id,
        status: { in: PROMOTION_RESERVED_STATUSES },
        ...notCurrent,
        ...reservedBefore,
      },
    });

    if (heldByUser > 0) {
      throw new ConflictException(
        'Mã giảm giá đang được giữ ở một đơn chờ thanh toán khác của bạn',
      );
    }

    // 3. Số lượng toàn hệ thống.
    if (promotion.usageLimit !== null && promotion.usageLimit !== undefined) {
      const taken = await tx.order.count({
        where: {
          promotionId: promotion.id,
          ...notCurrent,
          OR: [
            { status: { in: SUCCESSFUL_ORDER_STATUSES } },
            { status: { in: PROMOTION_RESERVED_STATUSES }, ...reservedBefore },
          ],
        },
      });

      if (taken >= promotion.usageLimit) {
        throw new ConflictException('Mã giảm giá đã hết lượt sử dụng');
      }
    }
  }

  private async findUsablePromotion(
    userId: string,
    rawCode: string,
    subtotal: number,
    now: Date,
  ) {
    const code = rawCode.trim().toUpperCase();
    const promotion = await this.prisma.promotion.findUnique({
      where: { code },
    });

    if (!promotion) {
      throw new NotFoundException('Mã giảm giá không tồn tại');
    }

    await this.assertPromotionUsable(
      this.prisma,
      promotion,
      userId,
      undefined,
      subtotal,
      now,
    );

    return promotion;
  }

  private async calculateCartSubtotal(items: CartItemDto[]): Promise<number> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Giỏ hàng không được để trống');
    }

    let subtotal = 0;

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { price: true },
      });

      if (!product) {
        throw new BadRequestException('Sản phẩm không tồn tại');
      }

      const multiplier = item.size === 'S' ? 0.8 : item.size === 'L' ? 1.2 : 1;
      const productPrice = Math.round(product.price * multiplier);
      const toppingIds = [...new Set(item.toppingIds ?? [])];
      const toppings = toppingIds.length
        ? await this.prisma.topping.findMany({
            where: { id: { in: toppingIds } },
            select: { id: true, price: true },
          })
        : [];

      if (toppings.length !== toppingIds.length) {
        throw new BadRequestException('Topping không tồn tại');
      }

      const toppingPrice = toppings.reduce(
        (total, topping) => total + topping.price,
        0,
      );
      subtotal += (productPrice + toppingPrice) * item.qty;
    }

    return subtotal;
  }
}
