import { notFound } from "next/navigation";
import ProductDetailView from "@/components/ProductDetailView";
import type { Product } from "@/components/ProductDetailView";

export const instant = false;

const API_URL = process.env.API_URL_INTERNAL || "http://localhost:3001";

async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;

  return res.json();
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  return <ProductDetailView product={product} />;
}