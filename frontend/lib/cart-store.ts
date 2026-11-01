"use client";

import { useMemo } from "react";
import { create } from "zustand";
import {
  calcDiscount,
  validatePromo,
  type Promotion,
  type PromoResult,
} from "@/lib/promotions";
import type { Product } from "@/lib/types";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  customization: string;
  summaryNote: string;
  category: string;
  price: number;
  qty: number;
  size: "S" | "M" | "L";
  imageUrl: string; // ảnh nằm trong frontend/public/images
}

interface CartState {
  items: CartItem[];
  promo: Promotion | null;
  addItem: (product: Product, size?: CartItem["size"]) => void;
  setQty: (id: string, qty: number) => void;
  applyPromo: (code: string) => PromoResult;
  removePromo: () => void;
  clear: () => void;
}

export const FREE_DELIVERY_THRESHOLD = 150000;
export const DELIVERY_FEE = 15000;

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  promo: null,
  addItem: (product, size = "M") => {
    const id = `${product.id}:${size}`;
    const currentItem = get().items.find((item) => item.id === id);
    const item: CartItem = currentItem
      ? { ...currentItem, qty: currentItem.qty + 1 }
      : {
          id,
          productId: product.id,
          name: product.name,
          customization: `Size ${size}`,
          summaryNote: `Size ${size}`,
          category: "BREWLITE MENU",
          price: product.price,
          qty: 1,
          size,
          imageUrl: product.imageUrl ?? "/window.svg",
        };
    set({
      items: currentItem
        ? get().items.map((existing) => (existing.id === id ? item : existing))
        : [...get().items, item],
    });
  },
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
  const addItem = useCartStore((s) => s.addItem);
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

  return {
    items,
    promo,
    addItem,
    setQty,
    applyPromo,
    removePromo,
    clear,
    ...totals,
  };
}
