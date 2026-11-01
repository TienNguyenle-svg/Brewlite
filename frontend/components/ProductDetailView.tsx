"use client";

import { useState } from "react";
import Link from "next/link";

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

// Danh sách size (tạm, chưa có từ backend)
const SIZES = [
  { id: "S", label: "Small", extra: 0 },
  { id: "M", label: "Medium", extra: 10000 },
  { id: "L", label: "Large", extra: 15000 },
];

export default function ProductDetailView({ product }: { product: Product }) {
  // Ô nhớ: size đang được chọn, mặc định là Medium
  const [sizeId, setSizeId] = useState("M");

  // Ô nhớ: danh sách id topping đang được chọn, mặc định chưa chọn gì
  const [toppingIds, setToppingIds] = useState<string[]>([]);

  // Topping thật của món này, lấy từ backend
  const toppings = product.toppings ?? [];

  // Bật/tắt một topping
  function toggleTopping(id: string) {
    setToppingIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
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
        {/* Cột trái: ảnh */}
        <div>
          <img
            src={product.imageUrl}
            alt={product.name}
            className="aspect-[7/8] w-full rounded-3xl bg-gray-200 object-cover"
          />
        </div>

        {/* Cột phải: thông tin */}
        <div>
          <p className="text-xs uppercase tracking-wide text-orange-700">
            Cà phê
          </p>

          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="text-4xl font-medium text-gray-900">
              {product.name}
            </h1>
            <p className="text-2xl text-gray-900">
              {product.price.toLocaleString("vi-VN")}₫
            </p>
          </div>

          <p className="mt-3 border-b border-gray-200 pb-5 text-sm text-gray-500">
            Hương vị đậm đà, cân bằng. Pha ngay sau khi bạn gọi.
          </p>

          {/* ===== PHẦN 2: CHỌN SIZE ===== */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900">Size</h2>
              <span className="text-xs text-gray-500">Bắt buộc · Chọn 1</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {SIZES.map((size) => {
                const isSelected = sizeId === size.id;

                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSizeId(size.id)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                      isSelected
                        ? "border-orange-600 bg-orange-50 font-medium text-gray-900"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {/* Vòng tròn radio */}
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          isSelected ? "border-orange-600" : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-orange-600" />
                        )}
                      </span>
                      {size.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      +{size.extra / 1000}k
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== PHẦN 3: CHỌN TOPPING (dữ liệu thật từ backend) ===== */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900">Topping</h2>
              <span className="text-xs text-gray-500">
                Tùy chọn · Chọn bao nhiêu tùy ý
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {toppings.length === 0 && (
                <p className="text-sm text-gray-500">
                  Món này chưa có topping.
                </p>
              )}

              {toppings.map((topping) => {
                const isChecked = toppingIds.includes(topping.id);
                const isSoldOut = topping.stock <= 0;

                return (
                  <button
                    key={topping.id}
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => toggleTopping(topping.id)}
                    aria-pressed={isChecked}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                      isSoldOut
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                        : isChecked
                        ? "border-orange-600 bg-orange-50 font-medium text-gray-900"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {/* Ô vuông tick */}
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
                      {isSoldOut ? "Hết hàng" : `+${topping.price / 1000}k`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Các phần 4, 5 sẽ thêm vào đây */}
        </div>
      </div>
    </main>
  );
}