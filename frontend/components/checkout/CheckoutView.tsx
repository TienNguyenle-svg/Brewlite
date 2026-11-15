"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  PENDING_ORDER_IDEMPOTENCY_KEY,
  PENDING_ORDER_REQUEST_FINGERPRINT,
  PENDING_PAYMENT_ORDER_KEY,
  createOrder,
  createPayment,
  getAccessToken,
} from "@/lib/api";
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
  const [deliveryDetails, setDeliveryDetails] = useState<{
    receiverName: string;
    receiverPhone: string;
    deliveryAddress: string;
  } | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentIdempotencyKey, setPaymentIdempotencyKey] = useState<string | null>(
    null,
  );

  const canSubmit = agreed && !!payment && cart.items.length > 0;

  const placeOrder = async () => {
    const token = getAccessToken();
    if (!token) {
      setError("Vui lòng đăng nhập tài khoản khách hàng trước khi thanh toán.");
      setConfirming(false);
      return;
    }

    if (!deliveryDetails) {
      setError("Vui lòng nhập thông tin giao hàng.");
      setConfirming(false);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let orderId = pendingOrderId;
      if (!orderId) {
        const orderInput = {
          items: cart.items.map(({ productId, size, qty, toppingIds }) => ({
            productId,
            size,
            qty,
            toppingIds: toppingIds || [], // <--- Lấy toppingIds từ giỏ hàng
          })),
          ...deliveryDetails,
        };
        const requestFingerprint = JSON.stringify(orderInput);
        let orderIdempotencyKey = sessionStorage.getItem(
          PENDING_ORDER_IDEMPOTENCY_KEY,
        );
        if (
          !orderIdempotencyKey ||
          sessionStorage.getItem(PENDING_ORDER_REQUEST_FINGERPRINT) !==
            requestFingerprint
        ) {
          const randomDigits = crypto.getRandomValues(new Uint32Array(1))[0];
          orderIdempotencyKey = `ORD-${Date.now()}${randomDigits}`;
          sessionStorage.setItem(
            PENDING_ORDER_IDEMPOTENCY_KEY,
            orderIdempotencyKey,
          );
          sessionStorage.setItem(
            PENDING_ORDER_REQUEST_FINGERPRINT,
            requestFingerprint,
          );
        }

        const order = await createOrder(orderInput, orderIdempotencyKey);
        orderId = order.id;
        setPendingOrderId(orderId);
      }

      const idempotencyKey =
        paymentIdempotencyKey ?? `PAY-${Date.now()}`;
      setPaymentIdempotencyKey(idempotencyKey);
      const paymentResult = await createPayment({ orderId }, idempotencyKey);

      sessionStorage.setItem(PENDING_PAYMENT_ORDER_KEY, orderId);

      if (paymentResult.status === "SUCCEEDED") {
        sessionStorage.removeItem(PENDING_ORDER_IDEMPOTENCY_KEY);
        sessionStorage.removeItem(PENDING_ORDER_REQUEST_FINGERPRINT);
        router.replace(
          `/payment/result?status=success&orderId=${encodeURIComponent(orderId)}`,
        );
        return;
      }

      if (!paymentResult.paymentUrl) {
        throw new ApiError(
          "Backend không trả về đường dẫn thanh toán VNPay.",
          502,
        );
      }

      const paymentUrl = new URL(paymentResult.paymentUrl);
      if (paymentUrl.protocol !== "https:") {
        throw new ApiError("Đường dẫn thanh toán VNPay không hợp lệ.", 502);
      }

      sessionStorage.removeItem(PENDING_ORDER_IDEMPOTENCY_KEY);
      sessionStorage.removeItem(PENDING_ORDER_REQUEST_FINGERPRINT);
      window.location.assign(paymentUrl.toString());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể khởi tạo thanh toán VNPay.",
      );
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  };

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
          if (!canSubmit) return;
          const formData = new FormData(e.currentTarget);
          setDeliveryDetails({
            receiverName: String(formData.get("receiverName") ?? "").trim(),
            receiverPhone: String(formData.get("receiverPhone") ?? "").trim(),
            deliveryAddress: String(formData.get("deliveryAddress") ?? "").trim(),
          });
          setError(null);
          setConfirming(true);
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
