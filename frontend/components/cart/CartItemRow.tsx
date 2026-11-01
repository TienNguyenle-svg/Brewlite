import Image from "next/image";
import { money } from "@/lib/format";
import type { CartItem } from "@/lib/cart-store";

export default function CartItemRow({
  item,
  onSetQty,
}: {
  item: CartItem;
  onSetQty: (id: string, qty: number) => void;
}) {
  return (
    <div className="flex gap-4 border-b border-[#E3DACF] py-[25px] last:border-b-0 sm:gap-[22px]">
      <Image
        src={item.imageUrl}
        alt={item.name}
        width={112}
        height={112}
        unoptimized
        className="size-20 shrink-0 rounded-[14px] object-cover sm:size-28"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row">
        <div className="flex min-w-0 flex-col">
          <p className="text-[17px] font-semibold leading-[21px]">{item.name}</p>
          <p className="mt-[11px] text-xs text-[#82776E]">{item.customization}</p>
          <p className="mt-[19px] text-[10px] font-semibold leading-3 text-[#B9672B]">
            {item.category}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-between">
          <p className="text-base font-semibold leading-[19px]">
            {money(item.price * item.qty)}
          </p>
          <div className="flex h-9 w-[126px] items-center justify-between rounded-full border border-[#E3DACF] bg-[#FBF7F1] px-3.5 text-xs font-medium">
            <button
              type="button"
              aria-label={`Decrease ${item.name}`}
              className="px-1"
              onClick={() => onSetQty(item.id, item.qty - 1)}
            >
              −
            </button>
            <span>{item.qty}</span>
            <button
              type="button"
              aria-label={`Increase ${item.name}`}
              className="px-1"
              onClick={() => onSetQty(item.id, item.qty + 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
