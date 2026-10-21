"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { money } from "@/lib/format";
import CartItemRow from "./CartItemRow";
import PromoForm from "./PromoForm";

export default function CartView() {
  const cart = useCart();

  return (
    <div className="mt-[42px] grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_440px]">
      <section className="rounded-[18px] border border-[#E3DACF] bg-white px-5 pb-8 pt-[26px] sm:px-8">
        <h2 className="pb-[19px] text-xl font-semibold leading-6">
          Your items ({cart.count})
        </h2>
        <div className="border-t border-[#E3DACF]">
          {cart.items.length === 0 && (
            <p className="py-10 text-sm text-[#82776E]">Your cart is empty.</p>
          )}
          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} onSetQty={cart.setQty} />
          ))}
        </div>
        <Link
          href="/"
          className="mt-8 inline-block text-[13px] font-semibold text-[#B9672B]"
        >
          ← Continue shopping
        </Link>
      </section>

      <aside className="rounded-[18px] bg-white p-8">
        <h2 className="text-[21px] font-semibold leading-[25px]">
          Order summary
        </h2>
        <dl className="mt-[33px] flex flex-col gap-[22px] text-sm">
          <div className="flex justify-between">
            <dt className="text-[#82776E]">Subtotal</dt>
            <dd className="font-medium">{money(cart.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#82776E]">Delivery</dt>
            <dd className="font-medium">{money(cart.delivery)}</dd>
          </div>
          {cart.promo && (
            <div className="flex justify-between text-[#406B4A]">
              <dt>Discount ({cart.promo.code})</dt>
              <dd className="font-medium">−{money(cart.discount)}</dd>
            </div>
          )}
        </dl>
        <div className="mt-[23px] flex items-center justify-between border-t border-[#E3DACF] pt-6">
          <span className="text-[17px] font-semibold">Total</span>
          <span className="text-[22px] font-bold">{money(cart.total)}</span>
        </div>

        <PromoForm
          applied={cart.promo}
          onApply={cart.applyPromo}
          onRemove={cart.removePromo}
        />

        <Link
          href="/checkout"
          className="mt-[22px] flex h-12 items-center justify-center rounded-xl bg-[#39281F] text-sm font-semibold text-white"
        >
          Proceed to checkout
        </Link>
        <p className="mt-[21px] text-center text-[11px] text-[#82776E]">
          ♡ Freshly made · Secure checkout
        </p>

        {cart.toFreeDelivery > 0 && cart.items.length > 0 && (
          <div className="mt-[39px] rounded-xl bg-[#F2E9DC] px-[18px] py-3.5">
            <p className="text-[13px] font-semibold">
              You’re close to a little treat!
            </p>
            <p className="mt-2.5 text-[11px] text-[#82776E]">
              Add {money(cart.toFreeDelivery)} more for free delivery.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
