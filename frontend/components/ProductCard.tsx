import Image from "next/image";
import { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="rounded-2xl border border-[#EDE6DC] bg-white p-2.5 shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-200">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover"
        />
        {product.badge && (
          <span className="absolute left-2 top-2 rounded-full bg-[#FBE9DC] px-2 py-0.5 text-[10px] font-medium text-[#C8672B]">
            {product.badge}
          </span>
        )}
      </div>

      <div className="px-1.5 pb-1.5 pt-3">
        {product.category && (
          <p className="text-[10px] uppercase tracking-wide text-stone-500">
            {product.category}
          </p>
        )}
        <h2 className="mt-1 font-medium text-[#2B1F1A]">{product.name}</h2>
        {product.description && (
          <p className="mt-1 line-clamp-1 text-xs text-stone-500">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="font-semibold text-[#2B1F1A]">
            {product.price.toLocaleString("vi-VN")}₫
          </span>
          <button
            type="button"
            className="rounded-lg border border-[#EDE6DC] px-3 py-1.5 text-xs font-medium text-[#2B1F1A] hover:bg-[#F8F5F0]"
          >
            + Quick Add
          </button>
        </div>
      </div>
    </article>
  );
}