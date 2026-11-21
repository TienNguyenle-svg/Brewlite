import Link from "next/link";
import { Suspense } from "react";
import { getProducts } from "@/lib/api";
import Hero from "@/components/Hero";
import MenuSection from "@/components/MenuSection";

async function MenuContent() {
  let products = null;

  try {
    products = await getProducts();
  } catch {
    products = null;
  }

  if (!products) {
    return (
      <div className="py-12 text-center text-stone-600">
        <p className="mb-3">
          Máy chủ đang khởi động hoặc tạm thời gián đoạn. Vui lòng tải lại trang sau vài giây.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-[#2F4A3A] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Tải lại menu
        </Link>
      </div>
    );
  }

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