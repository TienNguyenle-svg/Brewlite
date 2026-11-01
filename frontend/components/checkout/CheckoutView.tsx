"use client";

import { useState } from "react";
import Link from "next/link";
import { createOrder, type OrderReceipt } from "@/lib/api";
import { useCart } from "@/lib/cart-store";
import { money } from "@/lib/format";
import CheckoutSteps from "./CheckoutSteps";
import DeliveryForm from "./DeliveryForm";
import PaymentMethods, { type PaymentId } from "./PaymentMethods";
import CheckoutSummary from "./CheckoutSummary";
import ConfirmModal from "./ConfirmModal";

export default function CheckoutView() {
  const cart = useCart();
  const [payment, setPayment] = useState<PaymentId | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

  const canSubmit = agreed && !!payment && cart.items.length > 0;

  const placeOrder = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const createdOrder = await createOrder({
        items: cart.items.map(({ productId, size, qty }) => ({
          productId,
          size,
          qty,
        })),
      });
      setReceipt(createdOrder);
      cart.clear();
      setConfirming(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể tạo đơn hàng.",
      );
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <section
        role="status"
        className="mt-8 rounded-[18px] border border-[#E7E1DA] bg-white p-6 sm:p-8"
      >
        <p className="text-xs uppercase tracking-wide text-[#41705A]">
          Đã tạo đơn hàng
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          Mã đơn: {receipt.id.slice(-8).toUpperCase()}
        </h2>
        <p className="mt-3 text-sm text-[#82776E]">
          Đơn đang ở trạng thái {receipt.status}. Backend hiện chưa xử lý thanh
          toán hoặc lưu thông tin giao hàng, nên đơn chưa được thanh toán.
        </p>
        <p className="mt-4 font-semibold">Tạm tính theo API: {money(receipt.total)}</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-[#39281F] px-5 py-3 text-sm font-semibold text-white"
        >
          Quay lại menu
        </Link>
      </section>
    );
  }

  return (
    <>
      <CheckoutSteps />
      {error && (
        <div
          role="alert"
          className="mt-6 rounded-2xl bg-[#FAECE9] px-5 py-3 text-[13px] text-[#A6564F]"
        >
          {error}
        </div>
      )}
      <form
        className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_466px] lg:gap-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) setConfirming(true);
        }}
      >
        <div className="flex flex-col gap-5">
          <DeliveryForm />
          <PaymentMethods value={payment} onChange={setPayment} />
        </div>
        <CheckoutSummary
          cart={cart}
          agreed={agreed}
          onAgreedChange={setAgreed}
          canSubmit={canSubmit}
        />
      </form>

      {confirming && payment && (
        <ConfirmModal
          count={cart.count}
          total={cart.total}
          payment={payment}
          onCancel={() => setConfirming(false)}
          onConfirm={placeOrder}
          busy={submitting}
        />
      )}
    </>
  );
}
