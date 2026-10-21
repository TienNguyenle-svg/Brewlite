import Image from "next/image";
import Link from "next/link";
import PromoForm from "@/components/cart/PromoForm";
import { money } from "@/lib/format";
import type { useCart } from "@/lib/cart-store";

type Cart = ReturnType<typeof useCart>;

export default function CheckoutSummary({
  cart,
  agreed,
  onAgreedChange,
  canSubmit,
}: {
  cart: Cart;
  agreed: boolean;
  onAgreedChange: (v: boolean) => void;
  canSubmit: boolean;
}) {
  return (
    <aside className="rounded-[18px] bg-white p-8">
      <h2 className="text-[21px] font-semibold leading-[25px]">Your order</h2>
      <p className="mt-2 text-xs text-[#82776E]">
        {cart.count} {cart.count === 1 ? "item" : "items"}
      </p>
      <ul className="mt-[22px] flex flex-col gap-4">
        {cart.items.map((i) => (
          <li key={i.id} className="flex items-center gap-4">
            <Image
              src={i.imageUrl}
              alt={i.name}
              width={62}
              height={62}
              unoptimized
              className="size-[62px] shrink-0 rounded-[10px] object-cover"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-[7px]">
              <span className="text-[13px] font-semibold leading-4">
                {i.name}
                {i.qty > 1 && ` × ${i.qty}`}
              </span>
              <span className="text-[11px] leading-[13px] text-[#82776E]">
                {i.summaryNote}
              </span>
            </span>
            <span className="text-xs font-medium">{money(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>

      <PromoForm
        className="mt-[22px] border-t border-[#E3DACF] pt-[22px]"
        applied={cart.promo}
        onApply={cart.applyPromo}
        onRemove={cart.removePromo}
      />

      <div className="mt-[22px] border-t border-[#E3DACF] pt-[22px]">
        <dl className="flex flex-col gap-4 text-[13px]">
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
      </div>
      <div className="mt-[22px] flex items-center justify-between border-t border-[#E3DACF] pt-[22px]">
        <span className="text-[15px] font-semibold">Total to pay</span>
        <span className="text-[22px] font-bold">{money(cart.total)}</span>
      </div>

      <label className="mt-[34px] flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreedChange(e.target.checked)}
          className="size-[18px] shrink-0 accent-[#B9672B]"
        />
        <span className="text-[10px] leading-[18px] text-[#82776E]">
          I agree to the Terms of Service and Privacy Policy.
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-[32px] h-12 w-full rounded-xl bg-[#39281F] text-sm font-semibold text-white disabled:opacity-60"
      >
        Place order
      </button>
      <p className="mt-3.5 text-center text-[10px] text-[#82776E]">
        By placing your order, you agree to our terms.
      </p>
      <Link
        href="/cart"
        className="mt-[22px] flex h-12 items-center justify-center rounded-xl border border-[#E3DACF] bg-white text-sm font-semibold"
      >
        Back to cart
      </Link>
      <p className="mt-4 text-[11px] text-[#82776E]">Questions? We’re happy to help.</p>
    </aside>
  );
}
