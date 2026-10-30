import { Suspense } from "react";
import { getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

async function ProductGrid() {
  const products = await getProducts();

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-[#F8F5F0]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-medium text-[#2B1F1A]">
          What’s your kind of happy?
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          A familiar favorite or a little something new.
        </p>

        <Suspense
          fallback={<p className="mt-6 text-stone-500">Đang tải menu...</p>}
        >
          <ProductGrid />
        </Suspense>
      </div>
    </main>
  );
}