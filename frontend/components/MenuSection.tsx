"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

const CATEGORIES = ["Tất cả", "Cà phê", "Trà sữa", "Bánh ngọt", "Trà trái cây"];

type SortKey = "popular" | "price-asc" | "price-desc" | "name";

// Bỏ dấu tiếng Việt để tìm "ca phe" vẫn ra "Cà phê"
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

export default function MenuSection({ products }: { products: Product[] }) {
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");

  const visible = useMemo(() => {
    const keyword = normalize(query.trim());

    const list = products.filter((p) => {
      const matchCategory = category === "Tất cả" || p.category === category;
      const matchQuery = normalize(p.name).includes(keyword);
      return matchCategory && matchQuery;
    });

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "vi"));

    return list;
  }, [products, category, query, sort]);

  return (
    <section id="menu" className="scroll-mt-6 pt-12">
      {/* Tiêu đề */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-3xl font-medium text-[#2E1F14]">
            Hương vị yêu thích của bạn?
          </h2>
          <p className="mt-1 text-xs text-[#6B5240]">
            Món quen thuộc, hay thử chút gì mới.
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-[#8A4B22]">
          <LeafIcon />
          Nguyên liệu tươi mới. Pha ngay sau khi bạn gọi.
        </p>
      </div>

      {/* Thanh công cụ */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={
                c === category
                  ? "rounded-full bg-[#2B1F1A] px-4 py-2 text-xs font-medium text-white"
                  : "rounded-full border border-[#EDE6DC] bg-white px-4 py-2 text-xs text-[#2B1F1A] hover:bg-[#F3EDE4]"
              }
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-[#EDE6DC] bg-white px-3.5 text-stone-500">
            <SearchIcon />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm món yêu thích"
              className="w-44 bg-transparent text-xs text-[#2B1F1A] outline-none placeholder:text-stone-400"
            />
          </label>

          <label className="flex h-10 items-center gap-2 rounded-xl border border-[#D8CDB4] bg-white px-3.5 text-[##2E1F14]">
            <SlidersIcon />
            <span className="text-xs font-medium">Sắp xếp:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-transparent text-xs font-medium outline-none"
            >
              <option value="popular">Bán chạy</option>
              <option value="price-asc">Price: thấp đến cao</option>
              <option value="price-desc">Price: cao đến thấp</option>
              <option value="name">Tên A–Z</option>
            </select>
          </label>
        </div>
      </div>

      {/* Dòng đếm */}
      <div className="mt-5 flex flex-wrap justify-between gap-2 text-[11px] text-[#6B5240]">
        <p>{visible.length} món ngon để bạn nghỉ tay một chút.</p>
        <p>Giá tính bằng VND · Tùy chỉnh món theo ý bạn</p>
      </div>

      {/* Lưới món */}
      {visible.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-stone-500">
          Chưa có món phù hợp. Thử chọn danh mục khác hoặc đổi từ khóa nhé.
        </p>
      )}
    </section>
  );
}