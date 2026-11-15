"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

// Danh sách size (tạm, backend chưa có bảng size).
// Giá từng size = giá gốc x hệ số, xem lib/pricing.ts
const SIZES: { id: SizeId; label: string }[] = [
  { id: "S", label: "S" },
  { id: "M", label: "M" },
  { id: "L", label: "L" },
];

const NOTE_MAX = 200;

// Món có số lượng đã bán từ mức này trở lên thì hiện huy hiệu "Bán chạy"
const BEST_SELLER_MIN = 50;

// 3 biểu tượng dưới ảnh (icon là đường vẽ SVG, không cần cài thư viện)
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

// 45000 -> "45.000₫"
function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

// 10000 -> "10k"; số không tròn nghìn (39200) -> "39.200₫"
function formatK(n: number) {
  return n % 1000 === 0 ? n / 1000 + "k" : formatVND(n);
}

export default function ProductDetailView({ product }: { product: Product }) {
  const router = useRouter();

  // Topping thật lấy từ backend (không có thì là danh sách rỗng)
  const toppings = product.toppings ?? [];

  const [sizeId, setSizeId] = useState<SizeId>("M");
  const [toppingIds, setToppingIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Reset nút khi quay lại trang bằng Back (trình duyệt khôi phục từ bfcache)
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setAdding(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  
  function toggleTopping(id: string) {
    setToppingIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  // ----- Tính tiền (giống backend: giá size làm tròn rồi mới cộng topping) -----
  const size = SIZES.find((s) => s.id === sizeId)!;
  const sizeUnitPrice = sizePrice(product.price, size.id);
  const selectedToppings = toppings.filter((t) => toppingIds.includes(t.id));
  const unitPrice =
    sizeUnitPrice + selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const total = unitPrice * quantity;

  // Dòng giải thích: "Size M 30k + Trân châu 5k"
  const breakdown = [
    `Size ${size.label} ${formatK(sizeUnitPrice)}`,
    ...selectedToppings.map((t) => `${t.name} ${formatK(t.price)}`),
  ].join(" + ");

  // Thêm vào giỏ rồi chuyển sang trang thanh toán
  async function handleAddToCart() {
    if (adding) return;
    setAdding(true);

    try {
      await ensureCartHydrated();
      useCartStore
        .getState()
        .addItem(product as unknown as StoreProduct, size.id, {
          qty: quantity,
          unitPrice,
          toppings: selectedToppings.map((t) => ({
            id: t.id,
            name: t.name,
            price: t.price,
          })),
          note,
        });

      router.push("/checkout");
    } catch (err) {
      console.error("Thêm vào giỏ thất bại:", err);
      setAdding(false); // lỗi thì mở lại nút để bấm lại
    }
  }

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <Link href="/" className="hover:underline">
          ← Quay lại menu
        </Link>
        <span>/</span>
        <span>Cà phê</span>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* ===== CỘT TRÁI: ẢNH + THÔNG TIN PHỤ ===== */}
        <div>
          {/* Ảnh, có huy hiệu và thanh đánh giá nằm đè lên */}
          <div className="relative">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="aspect-[7/8] w-full rounded-3xl bg-gray-200 object-cover"
            />

            {product.soldCount >= BEST_SELLER_MIN && (
              <span className="absolute left-4 top-4 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                Bán chạy
              </span>
            )}

            {/* Tạm: backend chưa có đánh giá, đây là chữ viết cứng theo Figma */}
            <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs text-gray-900 shadow-sm">
              <span className="text-orange-600">★</span>
              4.9 · Được 240+ người yêu cà phê chọn
            </span>
          </div>

          {/* Hàng 3 biểu tượng */}
          <div className="mt-4 flex items-center justify-between gap-2 text-xs text-gray-600">
            {FEATURES.map((f) => (
              <span key={f.label} className="flex items-center gap-1.5">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-orange-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={f.icon} />
                </svg>
                {f.label}
              </span>
            ))}
          </div>

          {/* Ô lưu ý */}
          <div className="mt-5 rounded-xl bg-stone-100 p-4">
            <p className="text-sm font-medium text-gray-900">Một lưu ý nhỏ</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Đồ uống được chế biến trong bếp có sử dụng sữa, caffeine và các
              loại hạt. Hãy hỏi nhân viên nếu bạn bị dị ứng.
            </p>
          </div>
        </div>

        {/* ===== CỘT PHẢI: THÔNG TIN + TÙY CHỌN ===== */}
        <div>
          <p className="text-xs uppercase tracking-wide text-orange-700">
            Cà phê
          </p>

          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="text-4xl font-medium text-gray-900">
              {product.name}
            </h1>
            <p className="text-2xl text-gray-900">{formatVND(product.price)}</p>
          </div>

          <p className="mt-3 border-b border-gray-200 pb-5 text-sm text-gray-500">
            Hương vị đậm đà, cân bằng. Pha ngay sau khi bạn gọi.
          </p>

          {/* ===== CHỌN SIZE ===== */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900">Size</h2>
              <span className="text-xs text-gray-500">Bắt buộc · Chọn 1</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {SIZES.map((s) => {
                const isSelected = sizeId === s.id;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSizeId(s.id)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-4 py-3 text-center transition ${
                      isSelected
                        ? "border-orange-600 bg-orange-50 text-gray-900"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-sm">{s.label}</span>
                    <span className="text-base font-bold text-gray-900">
                      {formatVND(sizePrice(product.price, s.id))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== CHỌN TOPPING (chỉ hiện khi backend trả topping) ===== */}
          {toppings.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-900">Topping</h2>
                <span className="text-xs text-gray-500">
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
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                        isOutOfStock
                          ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                          : isChecked
                          ? "border-orange-600 bg-orange-50 font-medium text-gray-900"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] leading-none text-white ${
                            isChecked
                              ? "border-orange-600 bg-orange-600"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isChecked && "✓"}
                        </span>
                        {topping.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {isOutOfStock ? "Hết hàng" : `+${formatK(topping.price)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== GHI CHÚ ===== */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900">Ghi chú</h2>
              <span className="text-xs text-gray-500">Tùy chọn</span>
            </div>

            <div className="relative mt-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={NOTE_MAX}
                rows={3}
                placeholder="Ví dụ: ít đá, ít ngọt..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-orange-600"
              />
              <span className="absolute bottom-3 right-4 text-xs text-gray-400">
                {note.length} / {NOTE_MAX}
              </span>
            </div>
          </div>

          {/* ===== TÓM TẮT GIÁ ===== */}
          <div className="mt-6 rounded-xl bg-stone-100 p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-gray-900">
                Ly nước của bạn
              </p>
              <p className="text-base text-gray-900">
                {formatVND(unitPrice)} / ly
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-500">{breakdown}</p>
          </div>

          {/* ===== SỐ LƯỢNG + NÚT ===== */}
          <div className="mt-5 flex items-center gap-4 border-t border-gray-200 pt-5">
            <div className="flex items-center rounded-xl border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-3 text-lg text-gray-700 hover:text-black"
                aria-label="Giảm số lượng"
              >
                −
              </button>
              <span className="w-8 text-center text-sm text-gray-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="px-4 py-3 text-lg text-gray-700 hover:text-black"
                aria-label="Tăng số lượng"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="flex-1 rounded-xl bg-stone-800 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-stone-900 disabled:opacity-60"
            >
              {adding
                ? "Đang chuyển..."
                : `Thêm vào giỏ hàng - ${formatVND(total)}`}
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-gray-500">
            Pha mới cho bạn · Sẵn sàng trong khoảng 10-15 phút
          </p>
        </div>
      </div>
    </main>
  );
}