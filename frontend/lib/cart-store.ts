"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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

// Tùy chọn khi thêm món từ trang chi tiết (size đã có tham số riêng)
export interface AddItemOptions {
  qty?: number;
  unitPrice?: number; // giá 1 ly đã gồm size + topping
  toppings?: { id: string; name: string; price: number }[];
  note?: string;
}

interface CartState {
  items: CartItem[];
  promo: Promotion | null;
  addItem: (
    product: Product,
    size?: CartItem["size"],
    options?: AddItemOptions,
  ) => void;
  setQty: (id: string, qty: number) => void;
  applyPromo: (code: string) => PromoResult;
  removePromo: () => void;
  clear: () => void;
}

export const FREE_DELIVERY_THRESHOLD = 100000;
export const DELIVERY_FEE = 15000;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
  items: [],
  promo: null,
  addItem: (product, size = "M", options = {}) => {
    const {
      qty = 1,
      unitPrice = product.price,
      toppings = [],
      note = "",
    } = options;

    const cleanNote = note.trim();
    const toppingKey = toppings
      .map((t) => t.id)
      .sort()
      .join(",");
    // cùng món + size + topping + ghi chú thì mới gộp thành một dòng
    const id = `${product.id}:${size}:${toppingKey}:${cleanNote}`;

    const toppingText = toppings.map((t) => t.name).join(", ");
    const customization = toppingText
      ? `Size ${size} · ${toppingText}`
      : `Size ${size}`;
    const summaryNote = cleanNote
      ? `${customization} · ${cleanNote}`
      : customization;

    const currentItem = get().items.find((item) => item.id === id);
    const item: CartItem = currentItem
      ? { ...currentItem, qty: currentItem.qty + qty }
      : {
          id,
          productId: product.id,
          name: product.name,
          customization,
          summaryNote,
          category: "BREWLITE MENU",
          price: unitPrice,
          qty,
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
    }),
    {
      name: "brewlite-cart",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
    },
  ),
);

let cartHydration: Promise<void> | null = null;

export function ensureCartHydrated(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  cartHydration ??= Promise.resolve(useCartStore.persist.rehydrate());
  return cartHydration;
}

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