import type { OrderStatus } from '@prisma/client';

export const EARN_BLOCK_VND = 10000;
export const EARN_POINTS_PER_BLOCK = 1;

export const POINT_VALUE_VND = 1;

export const MIN_REDEEM_POINTS = 100;

export const FREE_SHIPPING_THRESHOLD_VND = 100000;
export const SHIPPING_FEE_VND = 15000;

export const MAX_REDEEM_PERCENT = 100;
export const MIN_PAYABLE_AMOUNT = 5000;

/** Chỉ đơn ở các trạng thái này mới được áp mã / dùng điểm. */
export const EDITABLE_ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'PAYMENT_FAILED',
];

/** Đơn đã thanh toán thành công (mã giảm giá của đơn này được tính là "đã dùng", chiếm 1 lượt). */
export const SUCCESSFUL_ORDER_STATUSES: OrderStatus[] = [
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
];

/**
 * Đơn chưa thanh toán nhưng đang giữ chỗ mã (chiếm 1 lượt và khóa mã với chính khách đó).
 * PAYMENT_FAILED và CANCELLED nhả mã: số lượng được trả lại, khách nhập lại được mã.
 */
export const PROMOTION_RESERVED_STATUSES: OrderStatus[] = ['PENDING'];

export const LOYALTY_REASON = {
  EARN: 'ORDER_PAID',
  REDEEM: 'REDEEM',
  REDEEM_REFUND: 'REDEEM_REFUND',
  EARN_REVOKE: 'EARN_REVOKE',
  DEBT_SETTLEMENT: 'DEBT_SETTLEMENT',
} as const;