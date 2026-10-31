/**
 * Khuyến mãi — phản chiếu bảng `Promotion` trong backend/prisma/seed.ts
 * (code, discount, type, minOrder, active, expiredAt).
 * TODO: khi backend có API (vd. POST /promotions/validate) thì gọi API thay cho danh sách này.
 */
export interface Promotion {
  code: string;
  discount: number; // % nếu type = PERCENT, số tiền nếu type = FIXED
  type: "PERCENT" | "FIXED";
  minOrder: number;
  active: boolean;
  expiredAt?: string | null;
}

export const PROMOTIONS: Promotion[] = [
  {
    code: "WELCOME10",
    discount: 10,
    type: "PERCENT",
    minOrder: 50000,
    active: true,
    expiredAt: null,
  },
];

export type PromoResult =
  | { ok: true; promo: Promotion }
  | { ok: false; message: string };

export function validatePromo(code: string, subtotal: number): PromoResult {
  const key = code.trim().toUpperCase();
  if (!key) return { ok: false, message: "Vui lòng nhập mã giảm giá." };

  const promo = PROMOTIONS.find((p) => p.code === key);
  if (!promo || !promo.active)
    return { ok: false, message: "Mã giảm giá không hợp lệ." };
  if (promo.expiredAt && new Date(promo.expiredAt) < new Date())
    return { ok: false, message: "Mã giảm giá đã hết hạn." };
  if (subtotal < promo.minOrder)
    return {
      ok: false,
      message: `Đơn hàng tối thiểu ${promo.minOrder.toLocaleString("de-DE")}₫ để sử dụng mã ${promo.code}.`,
    };
  return { ok: true, promo };
}

export function calcDiscount(promo: Promotion | null, subtotal: number) {
  if (!promo) return 0;
  const raw =
    promo.type === "PERCENT"
      ? Math.round((subtotal * promo.discount) / 100)
      : promo.discount;
  return Math.min(raw, subtotal);
}
