import type { OrderStatus } from '@prisma/client';

export const PAYMENT_TIMEOUT_MS = 10 * 60 * 1000;
export const RETRY_WINDOW_MS = 10 * 60 * 1000;
export const MAX_FAILED_ATTEMPTS = 3;
export const IDEMPOTENCY_KEY_PATTERN = /^PAY-\d{1,15}$/;
export const PAYMENT_ORDER_TRANSITIONS: Partial<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
};

export function isAllowedOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return PAYMENT_ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}