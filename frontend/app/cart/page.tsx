import type { Metadata } from "next";
import Link from "next/link";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Your cart · BrewLite" };

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-[1296px] px-6 py-10">
      <p className="text-xs text-[#6B5240]">
        <Link href="/" className="text-[#2F4A3A] hover:underline">Menu</Link>
        {"   /   "}Giỏ hàng
      </p>
      <h1 className="mt-[21px] text-[38px] leading-[46px] text-[#2E1F14]">Giỏ hàng</h1>
      <p className="mt-3 text-sm text-[#6B5240]">
        A little happiness, coming right up.
      </p>
      <CartView />
    </div>
  );
}