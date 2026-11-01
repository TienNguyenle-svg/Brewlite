'use client';

import Link from 'next/link';
import {
  BaristaOrder,
  LATE_AFTER_MINUTES,
  STATUS_CONFIG,
  formatTime,
  minutesSince,
  orderCode,
} from '../../lib/barista';

type Props = {
  order: BaristaOrder;
  busy?: boolean;
  onAdvance: (order: BaristaOrder) => void;
};

export function OrderCard({ order, busy, onAdvance }: Props) {
  if (order.status === 'COMPLETED') return null;
  const cfg = STATUS_CONFIG[order.status];
  const minutes = minutesSince(order.createdAt);
  const late = order.status !== 'READY' && minutes >= LATE_AFTER_MINUTES;

  return (
    <article className="flex flex-col gap-3.5 rounded-2xl border border-[#E7E1DA] bg-white p-[18px]">
      <header className="flex items-start justify-between">
        <div>
          <Link
            href={`/barista/orders/${order.id}`}
            className="text-base text-[#39281F] hover:underline"
          >
            Đơn #{orderCode(order)}
          </Link>
          <p className="text-[11px] text-[#82776E]">
            Đặt lúc {formatTime(order.createdAt)} · Lấy tại quán
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.badgeClass}`}>
          {cfg.badge}
        </span>
      </header>

      <p className="text-[11px] text-[#82776E]">{order.user.email}</p>

      <ul className="flex flex-col gap-3 border-t border-[#E7E1DA] pt-3">
        {order.items.map((item) => {
          const options = [item.size, ...item.toppings.map((t) => t.topping.name)]
            .filter(Boolean)
            .join(' · ');
          return (
            <li key={item.id} className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.product.imageUrl ?? '/placeholder-drink.png'}
                alt={item.product.name}
                className="h-[52px] w-[52px] rounded-[10px] bg-[#F1EDE7] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#39281F]">
                  {item.qty} × {item.product.name}
                </p>
                {options && <p className="text-[11px] text-[#82776E]">{options}</p>}
                {item.note && (
                  <p className="text-[11px] text-[#B9672B]">Ghi chú: {item.note}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p
        className={`rounded-[10px] px-3 py-2 text-[11px] ${
          late ? 'bg-[#FAECE9] font-semibold text-[#A6564F]' : 'bg-[#FCFAF7] text-[#82776E]'
        }`}
      >
        {minutes} phút kể từ khi đặt{late ? ' · đang trễ' : ''}
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={() => onAdvance(order)}
        className={`h-[42px] rounded-[10px] text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${cfg.actionClass}`}
      >
        {busy ? 'Đang cập nhật…' : cfg.action}
      </button>
    </article>
  );
}
