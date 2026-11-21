"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ApiError,
  createPayment,
  PENDING_PAYMENT_ORDER_KEY,
} from "@/lib/api";
import { ensureCartHydrated, useCartStore } from "@/lib/cart-store";
import {
  clearRetryPaymentKey,
  didRetryPaymentRedirect,
  getRetryPaymentKey,
  setRetryPaymentRedirected,
} from "@/lib/payment-retry";

type PaymentResultStatus =
  | "loading"
  | "success"
  | "failed"
  | "cancelled"
  | "invalid";

export default function PaymentResult({
  statusOverride,
}: {
  statusOverride?: "cancelled";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = statusOverride ?? searchParams.get("status");
  const orderId = searchParams.get("orderId");

  const [result, setResult] = useState<PaymentResultStatus>("loading");
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const retryInFlight = useRef(false);

  useEffect(() => {
    let active = true;

    ensureCartHydrated()
      .then(() => {
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
          sessionStorage.removeItem(PENDING_PAYMENT_ORDER_KEY);
          clearRetryPaymentKey();
          setResult("success");
        } else if (status === "cancelled") {
          sessionStorage.removeItem(PENDING_PAYMENT_ORDER_KEY);
          clearRetryPaymentKey();
          setResult("cancelled");
        } else if (status === "failed") {
          setResult("failed");
          if (didRetryPaymentRedirect(orderId)) clearRetryPaymentKey();
        } else {
          setResult("invalid");
        }
      })
      .catch(() => {
        if (active) setResult("invalid");
      });

    return () => {
      active = false;
    };
  }, [orderId, status]);

  const retryPayment = async () => {
    if (!orderId || retryInFlight.current) return;

    retryInFlight.current = true;
    setRetrying(true);
    setRetryError(null);
    try {
      const idempotencyKey = getRetryPaymentKey(orderId);
      setRetryPaymentRedirected(false);
      const payment = await createPayment({ orderId }, idempotencyKey);

      if (payment.status === "SUCCEEDED") {
        clearRetryPaymentKey();
        router.replace(
          `/payment/result?status=success&orderId=${encodeURIComponent(orderId)}`,
        );
        return;
      }

      if (!payment.paymentUrl) {
        throw new ApiError(
          "Backend không trả về đường dẫn thanh toán VNPay.",
          502,
        );
      }

      const paymentUrl = new URL(payment.paymentUrl);
      if (paymentUrl.protocol !== "https:") {
        throw new ApiError("Đường dẫn thanh toán VNPay không hợp lệ.", 502);
      }

      sessionStorage.setItem(PENDING_PAYMENT_ORDER_KEY, orderId);
      setRetryPaymentRedirected(true);
      window.location.assign(paymentUrl.toString());
    } catch (cause) {
      setRetryError(
        cause instanceof Error
          ? cause.message
          : "Không thể khởi tạo lại thanh toán.",
      );
    } finally {
      retryInFlight.current = false;
      setRetrying(false);
    }
  };

  if (result === "loading") {
    return (
      <p
        role="status"
        aria-live="polite"
        className="py-16 text-center text-sm text-[#82776E]"
      >
        Đang xác nhận kết quả thanh toán…
      </p>
    );
  }

  const successful = result === "success";
  const cancelled = result === "cancelled";
  const resultLabel = successful
    ? "Thanh toán thành công"
    : result === "failed"
      ? "Thanh toán chưa hoàn tất"
      : cancelled
        ? "Đơn hàng đã bị hủy"
        : "Không xác định được giao dịch";
  const resultHeading = successful
    ? "Cảm ơn bạn đã đặt hàng!"
    : result === "failed"
      ? "Đơn hàng chưa được thanh toán"
      : cancelled
        ? "Đơn hàng đã bị hủy"
        : "Không thể xác minh kết quả thanh toán";
  const resultMessage = successful
    ? "VNPay đã xác nhận giao dịch. Đơn hàng của bạn đang được xử lý."
    : result === "failed"
      ? "Đơn hàng này vẫn được giữ để bạn thử thanh toán lại trong thời hạn cho phép. Bạn không cần tạo đơn mới."
      : cancelled
        ? "Vui lòng đặt lại đơn mới."
        : "Liên kết kết quả không khớp với lượt thanh toán hiện tại. Giỏ hàng được giữ nguyên.";

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
        {resultLabel}
      </p>
      <h1 className="mt-2 text-2xl font-semibold">
        {resultHeading}
      </h1>
      <p className="mt-3 text-sm text-[#82776E]">{resultMessage}</p>
      {retryError && (
        <p role="alert" className="mt-3 text-sm text-[#A6564F]">
          {retryError}
        </p>
      )}
      {orderId && (
        <p className="mt-4 text-sm">
          Mã đơn: <span className="font-semibold">{orderId}</span>
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {result === "failed" && orderId && (
          <button
            type="button"
            onClick={retryPayment}
            disabled={retrying}
            className="inline-flex rounded-xl bg-[#39281F] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {retrying ? "Đang kết nối VNPay…" : "Thanh toán lại đơn này"}
          </button>
        )}
        {result === "invalid" && (
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