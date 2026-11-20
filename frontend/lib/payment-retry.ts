const RETRY_PAYMENT_KEY = "brewlite-payment-retry-key";
const RETRY_PAYMENT_ORDER_KEY = "brewlite-payment-retry-order";
const RETRY_PAYMENT_REDIRECTED_KEY = "brewlite-payment-retry-redirected";

export function getRetryPaymentKey(orderId: string): string {
  const savedKey = sessionStorage.getItem(RETRY_PAYMENT_KEY);
  const savedOrderId = sessionStorage.getItem(RETRY_PAYMENT_ORDER_KEY);
  if (
    savedOrderId === orderId &&
    savedKey &&
    /^PAY-\d{1,15}$/.test(savedKey)
  ) {
    return savedKey;
  }

  const randomDigits = crypto.getRandomValues(new Uint32Array(1))[0] % 100;
  const key = `PAY-${Date.now()}${randomDigits.toString().padStart(2, "0")}`;
  sessionStorage.setItem(RETRY_PAYMENT_KEY, key);
  sessionStorage.setItem(RETRY_PAYMENT_ORDER_KEY, orderId);
  return key;
}

export function clearRetryPaymentKey() {
  sessionStorage.removeItem(RETRY_PAYMENT_KEY);
  sessionStorage.removeItem(RETRY_PAYMENT_ORDER_KEY);
  sessionStorage.removeItem(RETRY_PAYMENT_REDIRECTED_KEY);
}

export function setRetryPaymentRedirected(redirected: boolean) {
  sessionStorage.setItem(RETRY_PAYMENT_REDIRECTED_KEY, String(redirected));
}

export function didRetryPaymentRedirect(orderId: string): boolean {
  return (
    sessionStorage.getItem(RETRY_PAYMENT_ORDER_KEY) === orderId &&
    sessionStorage.getItem(RETRY_PAYMENT_REDIRECTED_KEY) === "true"
  );
}
