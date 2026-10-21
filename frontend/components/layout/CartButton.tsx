"use client";

import Link from "next/link";
import { IconShoppingBag } from "@/components/icons";
import { useCart } from "@/lib/cart-store";

export default function CartButton() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="flex h-10 items-center gap-[9px] rounded-[10px] bg-[#39281F] px-3.5 text-[13px] font-semibold text-white"
    >
      <IconShoppingBag size={17} />
      Cart
      <span className="flex size-[22px] items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#39281F]">
        {count}
      </span>
    </Link>
  );
}
