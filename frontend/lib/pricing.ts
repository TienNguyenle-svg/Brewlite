// frontend/lib/pricing.ts
// Quy tắc giá theo size của Brewlite.
// PHẢI giống backend (backend/src/orders/orders.service.ts, hàm getSizeMultiplier),
// để giá hiển thị trên giao diện luôn khớp với giá tính trong đơn hàng.

export type SizeId = "S" | "M" | "L";

// Giá size = giá gốc (price trong database) x hệ số
export const SIZE_MULTIPLIER: Record<SizeId, number> = {
  S: 0.8,
  M: 1,
  L: 1.2,
};

/** Giá một ly theo size, chưa gồm topping. Làm tròn đến đồng như backend. */
export function sizePrice(basePrice: number, size: SizeId): number {
  return Math.round(basePrice * SIZE_MULTIPLIER[size]);
}