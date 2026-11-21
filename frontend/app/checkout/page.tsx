import type { Metadata } from "next";
import Link from "next/link";
import CheckoutView from "@/components/checkout/CheckoutView";

export const metadata: Metadata = { title: "Checkout · BrewLite" };

export default function CheckoutPage() {
  return (
    <main className="px-4 pb-16 pt-[30px] sm:px-8 lg:px-[72px]">
      <div className="mx-auto w-full max-w-[1296px]">
        <p className="text-xs text-[#6B5240]">
          <Link href="/" className="text-[#2F4A3A] hover:underline">Menu</Link>
          {"   /   "}
          <Link href="/cart" className="text-[#2F4A3A] hover:underline">Giỏ hàng</Link>
          {"   /   "}Thanh toán
        </p>
        <h1 className="mt-[21px] text-[38px] leading-[46px] text-[#2E1F14]">Đơn hàng của quý khách sắp hoàn tất.</h1>
        <p className="mt-3 text-sm text-[#6B5240]">
          Vui lòng điền thêm một số chi tiết để chúng tôi bắt đầu pha chế.
        </p>
        <CheckoutView />
      </div>
    </main>
  );
}
