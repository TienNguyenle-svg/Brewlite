"use client";

import { useState } from "react";
import type { PromotionQuote, PromoResult } from "@/lib/promotions";

/**
 * Ô nhập mã giảm giá. Dùng <div> thay vì <form> để có thể đặt bên trong
 * form checkout mà không bị lồng form.
 */
export default function PromoForm({
  applied,
  onApply,
  onRemove,
  className = "mt-[34px]",
}: {
  applied: PromotionQuote | null;
  onApply: (code: string) => Promise<PromoResult>;
  onRemove: () => void;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await onApply(value);
      setError(result.ok ? null : result.message);
      if (result.ok) setValue("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex gap-2.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void apply();
            }
          }}
          placeholder="Nhập mã giảm giá..."
          aria-label="Mã giảm giá"
          className="h-[46px] min-w-0 flex-1 rounded-[10px] border border-[#D9CBAA] bg-[#F3EAD8] px-4 text-xs uppercase outline-none placeholder:normal-case placeholder:text-[#6B5240] focus:border-[#2F4A3A]"
        />
        <button
          type="button"
          onClick={() => void apply()}
          disabled={busy}
          className="h-12 w-[116px] shrink-0 rounded-xl border border-[#D9CBAA] bg-white text-sm font-semibold text-[#2F4A3A] transition-colors hover:bg-[#E8EFEA]"
        >
          {busy ? "Đang kiểm tra…" : "Áp dụng"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {applied && !error && (
        <p className="mt-2 flex items-center gap-2 text-xs text-[#2F4A3A]">
          Đã áp dụng mã {applied.code}.
          <button
            type="button"
            onClick={onRemove}
            className="underline underline-offset-2"
          >
            Gỡ
          </button>
        </p>
      )}
    </div>
  );
}
