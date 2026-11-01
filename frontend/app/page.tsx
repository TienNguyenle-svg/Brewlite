import { Suspense } from "react";
import { getProducts } from "@/lib/api";
import Hero from "@/components/Hero";
import MenuSection from "@/components/MenuSection";

async function MenuContent() {
  const products = await getProducts();
  return <MenuSection products={products} />;
}

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-[#F1EBDB]">
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 md:px-[72px]">
        <Hero />
        <Suspense
          fallback={<p className="pt-12 text-stone-500">Đang tải menu...</p>}
        >
          <MenuContent />
        </Suspense>
      </div>
    </main>
  );
}