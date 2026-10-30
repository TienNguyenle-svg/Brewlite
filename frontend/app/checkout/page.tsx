import type { Metadata } from "next";
import Link from "next/link";
import StoreShell from "@/components/layout/StoreShell";
import CheckoutView from "@/components/checkout/CheckoutView";

export const metadata: Metadata = { title: "Checkout · BrewLite" };

export default function CheckoutPage() {
  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-[1296px]">
        <p className="text-xs text-[#82776E]">
          <Link href="/">Menu</Link>
          {"   /   "}
          <Link href="/cart">Giỏ hàng</Link>
          {"   /   "}Thanh toán
        </p>
        <h1 className="mt-[21px] text-[38px] leading-[46px]">Đơn hàng của quý khách sắp hoàn tất.</h1>
        <p className="mt-3 text-sm text-[#82776E]">
          Vui lòng điền thêm một số chi tiết để chúng tôi bắt đầu pha chế.
        </p>
        <CheckoutView />
      </div>
    </StoreShell>
  );
}
