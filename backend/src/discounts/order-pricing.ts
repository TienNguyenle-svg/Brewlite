import {
  EARN_BLOCK_VND,
  EARN_POINTS_PER_BLOCK,
  MAX_REDEEM_PERCENT,
  MIN_PAYABLE_AMOUNT,
  POINT_VALUE_VND,
} from './discounts.constants';

/** Tiền món trước giảm giá và phí ship. */
export function getSubtotal(order: {
  total: number;
  discountAmount: number;
  pointsDiscount: number;
  shippingFee?: number;
}): number {
  return (
    order.total +
    order.discountAmount +
    order.pointsDiscount -
    (order.shippingFee ?? 0)
  );
}

/** Discount calculation must match order creation. */
export function calcPromotionDiscount(
  promotion: { type: string; discount: number },
  subtotal: number,
): number {
  return promotion.type === 'FIXED'
    ? promotion.discount
    : Math.round((subtotal * promotion.discount) / 100);
}

/** Số điểm tối đa được dùng cho phần tiền còn lại sau khi áp mã. */
export function calcMaxRedeemPoints(amountAfterPromotion: number): number {
  const byPercent = Math.floor(
    (amountAfterPromotion * MAX_REDEEM_PERCENT) / 100 / POINT_VALUE_VND,
  );
  const byMinPayable = Math.floor(
    Math.max(0, amountAfterPromotion - MIN_PAYABLE_AMOUNT) / POINT_VALUE_VND,
  );

  return Math.max(0, Math.min(byPercent, byMinPayable));
}

/** Điểm được cộng khi thanh toán thành công `amountPaid` đồng (mỗi 1.000đ trọn = 1 điểm). */
export function calcEarnedPoints(amountPaid: number): number {
  return Math.floor(amountPaid / EARN_BLOCK_VND) * EARN_POINTS_PER_BLOCK;
}
