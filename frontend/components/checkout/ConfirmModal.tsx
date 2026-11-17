import { money } from "@/lib/format";
import { PAYMENT_LABELS, type PaymentId } from "./PaymentMethods";

export default function ConfirmModal({
  count,
  total,
  payment,
  busy = false,
  onCancel,
  onConfirm,
}: {
  count: number;
  total: number;
  payment: PaymentId;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E1F14]/40 p-5">
      <div className="w-full max-w-[420px] rounded-[18px] bg-white p-6 sm:p-8">
        <h2 className="text-[21px] font-semibold leading-[25px]">Xác nhận đơn hàng</h2>
        <p className="mt-3 text-sm text-[#82776E]">
          Tạo đơn gồm {count} món với tổng tiền dự kiến{" "}
          <span className="font-semibold text-[#2E1F14]">{money(total)}</span>.
          Bạn sẽ được chuyển tới {PAYMENT_LABELS[payment]} để hoàn tất thanh toán.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-12 rounded-xl border border-[#D9CBAA] bg-white text-sm font-semibold text-[#2F4A3A] disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="h-12 rounded-xl bg-[#2F4A3A] text-sm font-semibold text-white transition-colors hover:bg-[#263D2F] disabled:opacity-60"
          >
            {busy ? "Đang tạo đơn..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
