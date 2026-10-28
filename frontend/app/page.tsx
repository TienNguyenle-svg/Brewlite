import { getProducts } from "@/lib/api";

export default async function MenuPage() {
  const products = await getProducts();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Menu</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="rounded-xl border p-4 shadow-sm">
            <h2 className="font-semibold">{p.name}</h2>
            <p className="text-amber-700">
              {p.price.toLocaleString("vi-VN")}đ
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}