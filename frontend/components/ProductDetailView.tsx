
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product as StoreProduct } from "@/lib/types";
import { ensureCartHydrated, useCartStore } from "@/lib/cart-store";
import { sizePrice, type SizeId } from "@/lib/pricing";

export type Topping = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  soldCount: number;
  toppings?: Topping[];
};

const SIZES: { id: SizeId; label: string }[] = [
  { id: "S", label: "S" },
  { id: "M", label: "M" },
  { id: "L", label: "L" },
];

const NOTE_MAX = 200;
const BEST_SELLER_MIN = 50;

// Phong cách thẻ giống ProductCard
const cardStyle =
  "rounded-2xl border border-[#D9CBAA] bg-[#F3EAD8] " +
  "shadow-[0_6px_18px_-8px_rgba(46,31,20,0.3)] " +
  "transition-all duration-300 ease-out " +
  "hover:-translate-y-0.5 hover:border-[#2F4A3A] " +
  "hover:shadow-[0_10px_24px_-8px_rgba(46,31,20,0.35)]";

const FEATURES = [
  {
    label: "100% cà phê Việt Nam",
    icon: "M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z M16 9h2a2 2 0 0 1 0 4h-2",
  },
  {
    label: "Pha mới mỗi ngày",
    icon: "M5 19c0-9 6-14 14-14 0 9-5 14-14 14z M5 19c3-5 6-8 10-10",
  },
  {
    label: "Theo gu của bạn",
    icon: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  },
];

function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

function formatK(n: number) {
  return n % 1000 === 0 ? n / 1000 + "k" : formatVND(n);
}

export default function ProductDetailView({
  product,
}: {
  product: Product;
}) {
  const toppings = product.toppings ?? [];

  const [sizeId, setSizeId] = useState<SizeId>("M");
  const [toppingIds, setToppingIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Reset trạng thái khi quay lại trang bằng Back
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setAdding(false);
      }
    };

    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  function toggleTopping(id: string) {
    setToppingIds((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : [...prev, id]
    );
  }

  // Tính giá theo size và topping
  const size = SIZES.find((s) => s.id === sizeId)!;
  const sizeUnitPrice = sizePrice(product.price, size.id);

  const selectedToppings = toppings.filter((t) =>
    toppingIds.includes(t.id)
  );

  const unitPrice =
    sizeUnitPrice +
    selectedToppings.reduce((sum, t) => sum + t.price, 0);

  const total = unitPrice * quantity;

  const breakdown = [
    `Size ${size.label} ${formatK(sizeUnitPrice)}`,
    ...selectedToppings.map(
      (t) => `${t.name} ${formatK(t.price)}`
    ),
  ].join(" + ");

  // Thêm vào giỏ hàng, không chuyển trang
  async function handleAddToCart() {
    if (adding) return;

    setAdding(true);

    try {
      await ensureCartHydrated();

      useCartStore.getState().addItem(
        product as unknown as StoreProduct,
        size.id,
        {
          qty: quantity,
          unitPrice,
          toppings: selectedToppings.map((t) => ({
            id: t.id,
            name: t.name,
            price: t.price,
          })),
          note,
        }
      );

      window.alert("Đã thêm sản phẩm vào giỏ hàng thành công!");
    } catch (err) {
      console.error("Thêm vào giỏ hàng thất bại:", err);

      window.alert(
        "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại."
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F3EAD8] text-[#2B1F1A]">
      <div className="mx-auto max-w-[1100px] px-6 py-6">

        {/* ĐƯỜNG DẪN */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-[#6B5240]">
          <Link
            href="/"
            className="transition hover:text-[#2F4A3A] hover:underline"
          >
            ← Quay lại menu
          </Link>

          <span>/</span>
          <span>Cà phê</span>
          <span>/</span>

          <span className="font-medium text-[#2B1F1A]">
            {product.name}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

          {/* CỘT TRÁI */}
          <div>

            {/* ẢNH SẢN PHẨM */}
            <div className="relative">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="aspect-[7/8] w-full rounded-3xl border border-[#D9CBAA] bg-[#E8DFD0] object-cover shadow-[0_8px_28px_rgba(46,31,20,0.18)]"
              />

              {product.soldCount >= BEST_SELLER_MIN && (
                <span className="absolute left-4 top-4 rounded-full bg-[#FBE9DC] px-3 py-1 text-xs font-medium text-[#C8672B]">
                  Bán chạy
                </span>
              )}

              <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-[#FAF6EF] px-3 py-1.5 text-xs text-[#2B1F1A] shadow-sm">
                <span className="text-[#2F4A3A]">★</span>
                4.9 · Được 240+ người yêu cà phê chọn
              </span>
            </div>

            {/* ĐẶC ĐIỂM */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.label}
                  className={`${cardStyle} flex flex-col items-center gap-2 p-3 text-center`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-[#2F4A3A]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={feature.icon} />
                  </svg>

                  <span className="text-xs font-semibold leading-5 text-[#2F4A3A]">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>

            {/* LƯU Ý */}
            <div className={`${cardStyle} mt-5 p-5`}>
              <h3 className="text-lg font-bold text-[#2F4A3A]">
                Một lưu ý nhỏ
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#6B5240]">
                Đồ uống được chế biến trong bếp có sử dụng
                sữa, caffeine và các loại hạt. Hãy hỏi nhân
                viên nếu bạn bị dị ứng.
              </p>
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div>

            {/* THÔNG TIN SẢN PHẨM */}
            <p className="text-base font-bold uppercase tracking-wide text-[#2F4A3A]">
              Cà phê
            </p>

            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-[#2B1F1A] md:text-4xl">
                {product.name}
              </h1>

              <p className="text-2xl font-bold text-[#2F4A3A]">
                {formatVND(product.price)}
              </p>
            </div>

            <p className="mt-4 border-b border-[#D9CBAA] pb-5 text-sm leading-6 text-[#6B5240]">
              Hương vị đậm đà, cân bằng. Pha ngay sau khi bạn gọi.
            </p>

            {/* CHỌN SIZE */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#2F4A3A]">
                  Size
                </h2>

                <span className="text-xs text-[#6B5240]">
                  Bắt buộc · Chọn 1
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                {SIZES.map((s) => {
                  const isSelected = sizeId === s.id;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSizeId(s.id)}
                      aria-pressed={isSelected}
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-4 text-center transition-all duration-300 ease-out ${
                        isSelected
                          ? "border-2 border-[#2F4A3A] bg-[#E8EFEA] shadow-[0_6px_18px_-6px_rgba(47,74,58,0.3)]"
                          : "border-[#D9CBAA] bg-[#F3EAD8] shadow-[0_6px_18px_-8px_rgba(46,31,20,0.3)] hover:-translate-y-0.5 hover:border-[#2F4A3A] hover:shadow-[0_10px_24px_-8px_rgba(46,31,20,0.35)]"
                      }`}
                    >
                      <span className="text-lg font-bold text-[#2F4A3A]">
                        {s.label}
                      </span>

                      <span className="text-base font-semibold text-[#2B1F1A]">
                        {formatVND(sizePrice(product.price, s.id))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CHỌN TOPPING */}
            {toppings.length > 0 && (
              <div className="mt-7">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-[#2F4A3A]">
                    Topping
                  </h2>

                  <span className="text-xs text-[#6B5240]">
                    Tùy chọn · Chọn bao nhiêu tùy ý
                  </span>
                </div>

                <div className="mt-3 flex flex-col gap-3">
                  {toppings.map((topping) => {
                    const isChecked = toppingIds.includes(topping.id);
                    const isOutOfStock = topping.stock <= 0;

                    return (
                      <button
                        key={topping.id}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => toggleTopping(topping.id)}
                        aria-pressed={isChecked}
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-sm transition-all duration-300 ease-out ${
                          isOutOfStock
                            ? "cursor-not-allowed border-[#D9CBAA] bg-[#F3EAD8] opacity-50"
                            : isChecked
                              ? "border-2 border-[#2F4A3A] bg-[#E8EFEA] font-medium shadow-[0_8px_20px_-6px_rgba(47,74,58,0.3)]"
                              : "border-[#D9CBAA] bg-[#F3EAD8] shadow-[0_6px_18px_-8px_rgba(46,31,20,0.3)] hover:-translate-y-0.5 hover:border-[#2F4A3A] hover:shadow-[0_10px_24px_-8px_rgba(46,31,20,0.35)]"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] leading-none ${
                              isChecked
                                ? "border-[#2F4A3A] bg-[#2F4A3A] text-white"
                                : "border-[#D9CBAA] bg-white text-transparent"
                            }`}
                          >
                            {isChecked && "✓"}
                          </span>

                          <span className="text-base font-bold text-[#2F4A3A]">
                            {topping.name}
                          </span>
                        </span>

                        <span className="shrink-0 text-sm font-semibold text-[#6B5240]">
                          {isOutOfStock
                            ? "Hết hàng"
                            : `+${formatK(topping.price)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GHI CHÚ */}
            <div className="mt-7">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#2F4A3A]">
                  Ghi chú
                </h2>

                <span className="text-xs text-[#6B5240]">
                  Tùy chọn
                </span>
              </div>

              <div className="relative mt-3">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={NOTE_MAX}
                  rows={3}
                  placeholder="Ví dụ: ít đá, ít ngọt..."
                  className="w-full resize-none rounded-2xl border border-[#D9CBAA] bg-[#FAF6EF] px-4 py-3 text-sm text-[#2B1F1A] shadow-[0_4px_12px_rgba(46,31,20,0.08)] outline-none transition placeholder:text-[#9B8978] focus:border-[#2F4A3A] focus:ring-1 focus:ring-[#2F4A3A]"
                />

                <span className="absolute bottom-3 right-4 text-xs text-[#6B5240]">
                  {note.length} / {NOTE_MAX}
                </span>
              </div>
            </div>

            {/* TÓM TẮT GIÁ */}
            <div className={`${cardStyle} mt-7 p-5`}>
              <div className="flex items-start justify-between gap-4">
                <p className="text-lg font-bold text-[#2F4A3A]">
                  Ly nước của bạn
                </p>

                <p className="text-base font-bold text-[#2B1F1A]">
                  {formatVND(unitPrice)} / ly
                </p>
              </div>

              <p className="mt-3 text-sm leading-5 text-[#6B5240]">
                {breakdown}
              </p>
            </div>

            {/* SỐ LƯỢNG VÀ THÊM GIỎ HÀNG */}
            <div className="mt-6 flex flex-col gap-4 border-t border-[#D9CBAA] pt-6 sm:flex-row sm:items-center">
              <div className="flex w-fit items-center overflow-hidden rounded-xl border border-[#D9CBAA] bg-[#FAF6EF] shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.max(1, q - 1))
                  }
                  className="px-4 py-3 text-lg font-bold text-[#2F4A3A] transition hover:bg-[#E8EFEA]"
                  aria-label="Giảm số lượng"
                >
                  −
                </button>

                <span className="w-8 text-center text-base font-bold text-[#2F4A3A]">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(99, q + 1))
                  }
                  className="px-4 py-3 text-lg font-bold text-[#2F4A3A] transition hover:bg-[#E8EFEA]"
                  aria-label="Tăng số lượng"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 rounded-xl bg-[#2F4A3A] px-6 py-3.5 text-base font-bold text-white shadow-[0_6px_16px_rgba(47,74,58,0.2)] transition-all duration-200 hover:bg-[#263D2F] hover:shadow-[0_8px_20px_rgba(47,74,58,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding
                  ? "Đang thêm..."
                  : `Thêm vào giỏ hàng - ${formatVND(total)}`}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-[#6B5240]">
              Pha mới cho bạn · Sẵn sàng trong khoảng 10–15 phút
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}
