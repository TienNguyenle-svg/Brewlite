import type { OrderStatus } from '@prisma/client';

/** Cộng điểm: cứ mỗi EARN_BLOCK_VND của đơn thanh toán thành công = EARN_POINTS_PER_BLOCK điểm. */
export const EARN_BLOCK_VND = 1000;
export const EARN_POINTS_PER_BLOCK = 1;

/** 1 điểm khi dùng để trừ tiền = 1đ (100 điểm = 100đ). Tích điểm 1.000đ = 1 điểm nên hoàn khoảng 0,1% giá trị đơn. */
export const POINT_VALUE_VND = 1;

/** Mỗi lần dùng điểm phải dùng tối thiểu chừng này điểm. */
export const MIN_REDEEM_POINTS = 100;

export const FREE_SHIPPING_THRESHOLD_VND = 100000;
export const SHIPPING_FEE_VND = 15000;

/** Điểm chỉ được trừ tối đa chừng này % giá trị đơn (sau khi áp mã). */
export const MAX_REDEEM_PERCENT = 50;

/**
 * Số tiền thanh toán tối thiểu sau giảm giá (VNPay không nhận giao dịch quá nhỏ).
 * Mức 5.000đ theo trí nhớ về quy định VNPay, cần đối chiếu tài liệu hiện hành.
 */
export const MIN_PAYABLE_AMOUNT = 5000;

/** Chỉ đơn ở các trạng thái này mới được áp mã / dùng điểm. */
export const EDITABLE_ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'PAYMENT_FAILED',
];

/** Đơn đã thanh toán thành công (mã giảm giá của đơn này được tính là "đã dùng"). */
export const SUCCESSFUL_ORDER_STATUSES: OrderStatus[] = [
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
];

export const LOYALTY_REASON = {
  EARN: 'ORDER_PAID',
  REDEEM: 'REDEEM',
} as const;
