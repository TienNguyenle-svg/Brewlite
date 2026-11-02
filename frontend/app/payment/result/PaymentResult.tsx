"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  PENDING_PAYMENT_ORDER_KEY,
} from "@/lib/api";
import { ensureCartHydrated, useCartStore } from "@/lib/cart-store";

type PaymentResultStatus = "loading" | "success" | "failed" | "invalid";

export default function PaymentResult({
  status,
  orderId,
}: {
  status: string | null;
  orderId: string | null;
}) {
  const [result, setResult] = useState<PaymentResultStatus>("loading");

  useEffect(() => {
    let active = true;

    ensureCartHydrated().then(() => {
      if (!active) return;

      const expectedOrderId = sessionStorage.getItem(
        PENDING_PAYMENT_ORDER_KEY,
      );
      if (!orderId || expectedOrderId !== orderId) {
        setResult("invalid");
        return;
      }

      if (status === "success") {
        useCartStore.getState().clear();
        setResult("success");
      } else if (status === "failed") {
        setResult("failed");
      } else {
        setResult("invalid");
      }

      sessionStorage.removeItem(PENDING_PAYMENT_ORDER_KEY);
    });

    return () => {
      active = false;
    };
  }, [orderId, status]);

  if (result === "loading") {
    return <p className="py-16 text-center text-sm text-[#82776E]">Đang xác nhận kết quả thanh toán…</p>;
  }

  const successful = result === "success";

  return (
    <section
      role="status"
      className="mx-auto mt-8 max-w-2xl rounded-[18px] border border-[#E7E1DA] bg-white p-6 sm:p-8"
    >
      <p
        className={`text-xs uppercase tracking-wide ${
          successful ? "text-[#41705A]" : "text-[#A6564F]"
        }`}
      >
        {successful
          ? "Thanh toán thành công"
          : result === "failed"
            ? "Thanh toán chưa hoàn tất"
            : "Không xác định được giao dịch"}
      </p>
      <h1 className="mt-2 text-2xl font-semibold">
        {successful
          ? "Cảm ơn bạn đã đặt hàng!"
          : result === "failed"
            ? "Đơn hàng chưa được thanh toán"
            : "Không thể xác minh kết quả thanh toán"}
      </h1>
      <p className="mt-3 text-sm text-[#82776E]">
        {successful
          ? "VNPay đã xác nhận giao dịch. Đơn hàng của bạn đang được xử lý."
          : result === "failed"
            ? "Giỏ hàng vẫn được giữ lại. Bạn có thể quay lại giỏ để thử thanh toán lần nữa."
            : "Liên kết kết quả không khớp với lượt thanh toán hiện tại. Giỏ hàng được giữ nguyên."}
      </p>
      {orderId && (
        <p className="mt-4 text-sm">
          Mã đơn: <span className="font-semibold">{orderId}</span>
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {!successful && (
          <Link
            href="/cart"
            className="inline-flex rounded-xl bg-[#39281F] px-5 py-3 text-sm font-semibold text-white"
          >
            Quay lại giỏ hàng
          </Link>
        )}
        <Link
          href="/"
          className="inline-flex rounded-xl border border-[#E3DACF] px-5 py-3 text-sm font-semibold"
        >
          Về menu
        </Link>
      </div>
    </section>
  );
}
