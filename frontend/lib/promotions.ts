export interface PromotionQuote {
  code: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
}

export type PromoResult =
  | { ok: true; promo: PromotionQuote }
  | { ok: false; message: string };
