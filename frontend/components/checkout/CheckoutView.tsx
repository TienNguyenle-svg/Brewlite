"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import CheckoutSteps from "./CheckoutSteps";
import DeliveryForm from "./DeliveryForm";
import PaymentMethods, { type PaymentId } from "./PaymentMethods";
import CheckoutSummary from "./CheckoutSummary";
import ConfirmModal from "./ConfirmModal";

export default function CheckoutView() {
  const router = useRouter();
  const cart = useCart();
  const [payment, setPayment] = useState<PaymentId | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const canSubmit = agreed && !!payment && cart.items.length > 0;

  const placeOrder = () => {
    // TODO: gọi API backend tạo đơn hàng + thanh toán, rồi chuyển tới /order-confirmed?id=...
    router.push("/orders");
    cart.clear();
  };

  return (
    <>
      <CheckoutSteps />
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
        />
      )}
    </>
  );
}
