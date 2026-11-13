"use client";
import { sizePrice } from "@/lib/pricing";
import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ApiError, getAccessToken, previewCheckout } from "@/lib/api";
import type { PromoResult, PromotionQuote } from "@/lib/promotions";
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
  toppingIds: string[];
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
  promo: PromotionQuote | null;
  usePoints: boolean;
  addItem: (
    product: Product,
    size?: CartItem["size"],
    options?: AddItemOptions,
  ) => void;
  setQty: (id: string, qty: number) => void;
  setUsePoints: (value: boolean) => void;
  applyPromo: (code: string) => Promise<PromoResult>;
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
      usePoints: false,
      addItem: (product, size = "M", options) => {
        const qty = options?.qty ?? 1;
        const toppings = options?.toppings ?? [];
        const note = options?.note?.trim() ?? "";
        const unitPrice = options?.unitPrice ?? sizePrice(product.price, size);

        const toppingKey = toppings
          .map((t) => t.id)
          .sort()
          .join(",");
        const id = `${product.id}:${size}:${toppingKey}:${note}`;

        const customization = [
          `Size ${size}`,
          ...toppings.map((t) => t.name),
        ].join(" · ");

        const currentItem = get().items.find((item) => item.id === id);
        const item: CartItem = currentItem
          ? { ...currentItem, qty: currentItem.qty + qty }
          : {
              id,
              productId: product.id,
              name: product.name,
              customization,
              summaryNote: note,
              category: "BREWLITE MENU",
              price: unitPrice,
              qty,
              size,
              toppingIds: toppings.map((t) => t.id),
              imageUrl: product.imageUrl ?? "/images/hero-1.jpg",
            };

        set({
          items: currentItem
            ? get().items.map((existing) =>
                existing.id === id ? item : existing,
              )
            : [...get().items, item],
          promo: null,
        });
      },
      setQty: (id, qty) => {
        const items = get()
          .items.map((i) => (i.id === id ? { ...i, qty } : i))
          .filter((i) => i.qty > 0);
        set({ items, promo: null });
      },
      setUsePoints: (value) => set({ usePoints: value }),
      applyPromo: async (code) => {
        const promotionCode = code.trim();
        if (!promotionCode) {
          return { ok: false, message: "Vui lòng nhập mã giảm giá." };
        }
        if (!getAccessToken()) {
          return {
            ok: false,
            message: "Vui lòng đăng nhập để kiểm tra mã giảm giá.",
          };
        }

        const items = get().items;
        if (items.length === 0) {
          return { ok: false, message: "Giỏ hàng đang trống." };
        }

        try {
          const preview = await previewCheckout({
            items: items.map(({ productId, size, qty, toppingIds }) => ({
              productId,
              size,
              qty,
              toppingIds,
            })),
            promotionCode,
            usePoints: get().usePoints,
          });
          if (get().items !== items) {
            return {
              ok: false,
              message: "Giỏ hàng đã thay đổi. Vui lòng áp dụng lại mã.",
            };
          }

          const promo: PromotionQuote = {
            code: preview.promotionCode ?? promotionCode.toUpperCase(),
            subtotal: preview.subtotal,
            discountAmount: preview.discountAmount,
            shippingFee: preview.shippingFee,
            total: preview.total,
          };
          set({ promo });
          return { ok: true, promo };
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof ApiError
                ? error.message
                : "Không thể kiểm tra mã giảm giá. Vui lòng thử lại.",
          };
        }
      },
      removePromo: () => set({ promo: null }),
      clear: () => set({ items: [], promo: null, usePoints: false }),
    }),
    {
      name: "brewlite-cart",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      version: 2,
      migrate: (persistedState, version) => {
        const state =
          persistedState && typeof persistedState === "object"
            ? (persistedState as Partial<CartState>)
            : {};

        if (version < 2) {
          return {
            items: (Array.isArray(state.items) ? state.items : []).map(
              (item) => ({
                ...item,
                toppingIds: item.toppingIds ?? [],
              }),
            ),
            promo: null,
            usePoints: Boolean(state.usePoints),
          };
        }

        return {
          ...(state as Partial<CartState>),
          usePoints: Boolean(state.usePoints),
          promo: state.promo ?? null,
          items: Array.isArray(state.items) ? state.items : [],
        } as CartState;
      },
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
  const usePoints = useCartStore((s) => s.usePoints);
  const setUsePoints = useCartStore((s) => s.setUsePoints);
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
    const discount = promo?.discountAmount ?? 0;
    const displayedSubtotal = promo?.subtotal ?? subtotal;
    const displayedDelivery = promo?.shippingFee ?? delivery;
    const rawUser =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("brewlite_user") ?? "null")
        : null;
    const availableRewardPoints = rawUser?.loyaltyPoints ?? 0;
    const pointsDiscount = usePoints
      ? Math.min(availableRewardPoints, Math.max(0, displayedSubtotal + displayedDelivery))
      : 0;
    const totalBeforePoints = promo?.total ?? displayedSubtotal + displayedDelivery;

    return {
      subtotal: displayedSubtotal,
      count,
      delivery: displayedDelivery,
      discount,
      pointsDiscount,
      total: Math.max(0, totalBeforePoints - pointsDiscount),
      toFreeDelivery: Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal),
    };
  }, [items, promo, usePoints]);

  return {
    items,
    promo,
    usePoints,
    setUsePoints,
    addItem,
    setQty,
    applyPromo,
    removePromo,
    clear,
    ...totals,
  };
}
