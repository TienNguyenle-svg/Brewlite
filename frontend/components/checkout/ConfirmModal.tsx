import { money } from "@/lib/format";
import { PAYMENT_LABELS, type PaymentId } from "./PaymentMethods";

export default function ConfirmModal({
  count,
  total,
  payment,
  onCancel,
  onConfirm,
}: {
  count: number;
  total: number;
  payment: PaymentId;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#39281F]/40 p-5">
      <div className="w-full max-w-[420px] rounded-[18px] bg-white p-6 sm:p-8">
        <h2 className="text-[21px] font-semibold leading-[25px]">Confirm your order?</h2>
        <p className="mt-3 text-sm text-[#82776E]">
          {count} item(s) paid with {PAYMENT_LABELS[payment]} for a total of{" "}
          <span className="font-semibold text-[#39281F]">{money(total)}</span>.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-xl border border-[#E3DACF] bg-white text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-12 rounded-xl bg-[#39281F] text-sm font-semibold text-white"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
