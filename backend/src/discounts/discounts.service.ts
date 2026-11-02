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
  | 'total'
  | 'promotionId'
  | 'discountAmount'
  | 'pointsUsed'
  | 'pointsDiscount'
  | 'shippingFee'
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
        select: { loyaltyPoints: true },
      });

      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      if (user.loyaltyPoints < MIN_REDEEM_POINTS) {
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

      pointsUsed = Math.min(user.loyaltyPoints, maxPoints);
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
      select: { loyaltyPoints: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      points: user.loyaltyPoints,
      pointValueVnd: POINT_VALUE_VND,
      earnRule: `${EARN_BLOCK_VND} đồng = ${EARN_POINTS_PER_BLOCK} điểm`,
      transactions,
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
    if (order.promotionId) {
      const promotion = await tx.promotion.findUnique({
        where: { id: order.promotionId },
      });

      if (!promotion) {
        throw new ConflictException(
          'Mã giảm giá không còn tồn tại, hãy áp lại mã',
        );
      }

      try {
        await this.assertPromotionUsable(
          tx,
          promotion,
          order.userId,
          order.id,
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

    if (order.pointsUsed > 0) {
      const user = await tx.user.findUnique({
        where: { id: order.userId },
        select: { loyaltyPoints: true },
      });

      if (!user || user.loyaltyPoints < order.pointsUsed) {
        throw new ConflictException(
          'Số điểm hiện có không đủ cho đơn này, hãy chọn lại số điểm',
        );
      }
    }
  }

  /**
   * Khi đơn lên PAID (chỉ gọi đúng một lần): trừ điểm đã dùng, cộng điểm mới.
   * Lượt dùng mã được tính tự động vì đơn đã PAID.
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

    // Đã quyết toán rồi thì bỏ qua (không cộng/trừ 2 lần).
    const settled = await tx.loyaltyTransaction.findFirst({
      where: {
        orderId: order.id,
        reason: { in: [LOYALTY_REASON.EARN, LOYALTY_REASON.REDEEM] },
      },
    });

    if (settled) {
      return;
    }

    const user = await tx.user.findUnique({
      where: { id: order.userId },
      select: { loyaltyPoints: true },
    });

    if (!user) {
      return;
    }

    let balance = user.loyaltyPoints;

    if (order.pointsUsed > 0) {
      // Khách đã trả tiền theo giá đã giảm nên không từ chối đơn; chỉ không trừ quá số dư.
      const deduct = Math.min(order.pointsUsed, balance);

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

    if (earned > 0) {
      await tx.loyaltyTransaction.create({
        data: {
          userId: order.userId,
          points: earned,
          reason: LOYALTY_REASON.EARN,
          orderId: order.id,
        },
      });
      balance += earned;
    }

    await tx.user.update({
      where: { id: order.userId },
      data: { loyaltyPoints: balance },
    });
  }

  // ---------------------------------------------------------------------------
  // Nội bộ
  // ---------------------------------------------------------------------------

  private async assertPromotionUsable(
    tx: Pick<Prisma.TransactionClient, 'order'>,
    promotion: Promotion,
    userId: string,
    orderId: string | undefined,
    subtotal: number,
    now: Date,
  ): Promise<void> {
    if (!promotion.active) {
      throw new BadRequestException('Mã giảm giá không còn hiệu lực');
    }

    if (promotion.expiredAt && promotion.expiredAt <= now) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }

    if (subtotal < promotion.minOrder) {
      throw new BadRequestException(
        `Đơn hàng cần tối thiểu ${promotion.minOrder}đ để dùng mã này`,
      );
    }

    // Chỉ đơn đã thanh toán thành công mới tính là "đã dùng mã".
    const used = await tx.order.count({
      where: {
        userId,
        promotionId: promotion.id,
        ...(orderId ? { id: { not: orderId } } : {}),
        status: { in: SUCCESSFUL_ORDER_STATUSES },
      },
    });

    if (used > 0) {
      throw new ConflictException('Bạn đã sử dụng mã giảm giá này rồi');
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
