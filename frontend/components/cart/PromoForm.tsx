"use client";

import { useState } from "react";
import type { Promotion, PromoResult } from "@/lib/promotions";

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
  applied: Promotion | null;
  onApply: (code: string) => PromoResult;
  onRemove: () => void;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    const result = onApply(value);
    setError(result.ok ? null : result.message);
    if (result.ok) setValue("");
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
              apply();
            }
          }}
          placeholder="Nhập mã giảm giá..."
          aria-label="Mã giảm giá"
          className="h-[46px] min-w-0 flex-1 rounded-[10px] border border-[#E3DACF] bg-[#FBF7F1] px-4 text-xs uppercase outline-none placeholder:normal-case placeholder:text-[#82776E] focus:border-[#B9672B]"
        />
        <button
          type="button"
          onClick={apply}
          className="h-12 w-[116px] shrink-0 rounded-xl border border-[#E3DACF] bg-white text-sm font-semibold"
        >
          Áp dụng
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {applied && !error && (
        <p className="mt-2 flex items-center gap-2 text-xs text-[#406B4A]">
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
