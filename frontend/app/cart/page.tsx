import type { Metadata } from "next";
import Link from "next/link";
import StoreShell from "@/components/layout/StoreShell";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Your cart · BrewLite" };

export default function CartPage() {
  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-[1296px]">
        <p className="text-xs text-[#82776E]">
          <Link href="/">Menu</Link>
          {"   /   "}Giỏ hàng
        </p>
        <h1 className="mt-[21px] text-[38px] leading-[46px]">Giỏ hàng</h1>
        <p className="mt-3 text-sm text-[#82776E]">
          A little happiness, coming right up.
        </p>
        <CartView />
      </div>
    </StoreShell>
  );
}
