export type PaymentId = "momo" | "vnpay" | "stripe";

export const PAYMENT_LABELS: Record<PaymentId, string> = {
  momo: "Ví Momo",
  vnpay: "VNPAY",
  stripe: "Stripe",
};

const OPTIONS: [PaymentId, string, string][] = [
  ["momo", "Ví Momo", "E-wallet payment"],
  ["vnpay", "VNPAY", "Bank card / QR payment"],
  ["stripe", "Stripe", "International card"],
];

export default function PaymentMethods({
  value,
  onChange,
}: {
  value: PaymentId | null;
  onChange: (id: PaymentId) => void;
}) {
  return (
    <section className="rounded-[18px] bg-white p-5 sm:p-8">
      <h2 className="text-[21px] font-semibold leading-[25px]">Payment method</h2>
      <p className="mt-2 text-xs text-[#82776E]">Choose what works best for you.</p>
      <div className="mt-[23px] grid gap-[26px] sm:grid-cols-3">
        {OPTIONS.map(([id, title, sub]) => {
          const on = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex h-[70px] items-center gap-3 rounded-xl border px-[17px] text-left ${
                on ? "border-[#B9672B] bg-[#F2E9DC]" : "border-[#E3DACF] bg-white"
              }`}
            >
              <span
                className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border bg-white ${
                  on ? "border-[#B9672B]" : "border-[#E3DACF]"
                }`}
              >
                {on && <span className="size-2 rounded-full bg-[#B9672B]" />}
              </span>
              <span className="flex flex-col gap-[7px]">
                <span className="text-[13px] font-semibold leading-4">{title}</span>
                <span className="text-[11px] leading-[13px] text-[#82776E]">{sub}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-[27px] text-[11px] text-[#82776E]">
        🔒 Your information is kept safe and secure.
      </p>
    </section>
  );
}
