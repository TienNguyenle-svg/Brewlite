"use client";

import { useMemo } from "react";
import { create } from "zustand";
import {
  calcDiscount,
  validatePromo,
  type Promotion,
  type PromoResult,
} from "@/lib/promotions";

export interface CartItem {
  id: string;
  name: string;
  customization: string;
  summaryNote: string;
  category: string;
  price: number;
  qty: number;
  imageUrl: string; // ảnh nằm trong frontend/public/images
}

interface CartState {
  items: CartItem[];
  promo: Promotion | null;
  setQty: (id: string, qty: number) => void;
  applyPromo: (code: string) => PromoResult;
  removePromo: () => void;
  clear: () => void;
}

export const FREE_DELIVERY_THRESHOLD = 150000;
export const DELIVERY_FEE = 15000;

// Dữ liệu mẫu lấy từ backend/prisma/seed.ts (tên, giá, imageUrl khớp seed).
// TODO: thay bằng giỏ hàng thật (thêm từ trang Menu / API backend).
const SAMPLE_ITEMS: CartItem[] = [
  {
    id: "ca-phe-sua",
    name: "Cà phê sữa",
    customization: "Medium · 50% sugar · Regular ice",
    summaryNote: "Medium · 50% sugar",
    category: "BEST SELLER",
    price: 35000,
    qty: 1,
    imageUrl: "/images/ca-phe-sua.jpg",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    customization: "Large · Oat milk · Hot",
    summaryNote: "Large · Oat milk",
    category: "COFFEE",
    price: 45000,
    qty: 1,
    imageUrl: "/images/cappuccino.jpg",
  },
  {
    id: "tra-dao",
    name: "Trà đào",
    customization: "Medium · Less ice",
    summaryNote: "Medium · Less ice",
    category: "FRUIT TEA",
    price: 39000,
    qty: 1,
    imageUrl: "/images/tra-dao.jpg",
  },
];

export const useCartStore = create<CartState>((set, get) => ({
  items: SAMPLE_ITEMS,
  promo: null,
  setQty: (id, qty) => {
    const items = get()
      .items.map((i) => (i.id === id ? { ...i, qty } : i))
      .filter((i) => i.qty > 0);
    // Nếu tạm tính tụt dưới mức tối thiểu của mã đang áp dụng thì gỡ mã.
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    const promo = get().promo;
    set({
      items,
      promo: promo && subtotal >= promo.minOrder ? promo : null,
    });
  },
  applyPromo: (code) => {
    const subtotal = get().items.reduce((n, i) => n + i.price * i.qty, 0);
    const result = validatePromo(code, subtotal);
    if (result.ok) set({ promo: result.promo });
    return result;
  },
  removePromo: () => set({ promo: null }),
  clear: () => set({ items: [], promo: null }),
}));

/** Giỏ hàng + các giá trị tính toán (tạm tính, phí ship, giảm giá, tổng). */
export function useCart() {
  const items = useCartStore((s) => s.items);
  const promo = useCartStore((s) => s.promo);
  const setQty = useCartStore((s) => s.setQty);
  const applyPromo = useCartStore((s) => s.applyPromo);
  const removePromo = useCartStore((s) => s.removePromo);
  const clear = useCartStore((s) => s.clear);

  const totals = useMemo(() => {
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    const count = items.reduce((n, i) => n + i.qty, 0);
    const delivery =
      items.length === 0 || subtotal >= FREE_DELIVERY_THRESHOLD
        ? 0
        : DELIVERY_FEE;
    const discount = calcDiscount(promo, subtotal);
    return {
      subtotal,
      count,
      delivery,
      discount,
      total: subtotal + delivery - discount,
      toFreeDelivery: Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal),
    };
  }, [items, promo]);

  return { items, promo, setQty, applyPromo, removePromo, clear, ...totals };
}
