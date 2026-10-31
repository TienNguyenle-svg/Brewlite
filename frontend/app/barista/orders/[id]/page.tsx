'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  BaristaOrder,
  STATUS_CONFIG,
  fetchOrders,
  formatTime,
  minutesSince,
  orderCode,
  updateOrderStatus,
} from '../../../../lib/barista';

const STEPS = [
  { key: 'PAID', label: 'Đã thanh toán' },
  { key: 'PREPARING', label: 'Đang pha' },
  { key: 'READY', label: 'Sẵn sàng' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
] as const;

export default function BaristaOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<BaristaOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API chưa có GET /barista/orders/:id → lấy danh sách rồi tìm theo id
  const load = useCallback(async () => {
    try {
      const list = await fetchOrders();
      setOrder(list.find((o) => o.id === id) ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const advance = async () => {
    if (!order || order.status === 'COMPLETED') return;
    const next = STATUS_CONFIG[order.status].next;
    if (!next) return;
    setBusy(true);
    try {
      await updateOrderStatus(order.id, next);
      if (next === 'COMPLETED') router.replace('/barista/orders');
      else await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không cập nhật được đơn');
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="py-16 text-center text-sm text-[#82776E]">Đang tải…</p>;

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-sm text-[#82776E]">
        <p>Không tìm thấy đơn này trong hàng đợi (có thể đã hoàn thành).</p>
        {error && <p className="text-[#A6564F]">{error}</p>}
        <Link href="/barista/orders" className="font-semibold text-[#B9672B]">
          ← Về hàng đợi đơn
        </Link>
      </div>
    );
  }

  if (order.status === 'COMPLETED') return null;
  const cfg = STATUS_CONFIG[order.status];
  const currentIndex = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="mx-auto flex max-w-[840px] flex-col gap-6">
      <Link href="/barista/orders" className="text-[13px] text-[#82776E] hover:text-[#39281F]">
        ← Về hàng đợi đơn
      </Link>

      {error && (
        <div role="alert" className="rounded-2xl bg-[#FAECE9] px-5 py-3 text-[13px] text-[#A6564F]">
          {error}
        </div>
      )}

      <article className="flex flex-col gap-5 rounded-2xl border border-[#E7E1DA] bg-white p-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl tracking-tight">Đơn #{orderCode(order)}</h1>
            <p className="text-xs text-[#82776E]">
              Đặt lúc {formatTime(order.createdAt)} · {minutesSince(order.createdAt)} phút trước · Lấy
              tại quán
            </p>
            <p className="mt-1 text-xs text-[#82776E]">Khách: {order.user.email}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cfg.badgeClass}`}>
            {cfg.badge}
          </span>
        </header>

        <ol className="flex items-center justify-between rounded-[10px] bg-[#FCFAF7] px-3.5 py-3 text-[11px]">
          {STEPS.map((s, i) => {
            const done = i <= currentIndex;
            return (
              <li key={s.key} className="flex items-center gap-2">
                <span
                  className={`flex h-[23px] w-[23px] items-center justify-center rounded-full text-[11px] font-semibold ${
                    done ? 'bg-[#B9672B] text-white' : 'bg-[#F1EDE7] text-[#82776E]'
                  }`}
                >
                  {i + 1}
                </span>
                <span className={done ? 'text-[#39281F]' : 'text-[#82776E]'}>{s.label}</span>
              </li>
            );
          })}
        </ol>

        <ul className="flex flex-col gap-4 border-t border-[#E7E1DA] pt-5">
          {order.items.map((item) => {
            const options = [item.size, ...item.toppings.map((t) => t.topping.name)]
              .filter(Boolean)
              .join(' · ');
            return (
              <li key={item.id} className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.product.imageUrl ?? '/placeholder-drink.png'}
                  alt={item.product.name}
                  className="h-16 w-16 rounded-[10px] bg-[#F1EDE7] object-cover"
                />
                <div>
                  <p className="text-sm font-semibold">
                    {item.qty} × {item.product.name}
                  </p>
                  {options && <p className="text-xs text-[#82776E]">{options}</p>}
                  {item.note && <p className="text-xs text-[#B9672B]">Ghi chú: {item.note}</p>}
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          disabled={busy}
          onClick={advance}
          className={`h-[46px] rounded-[10px] text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${cfg.actionClass}`}
        >
          {busy ? 'Đang cập nhật…' : cfg.action}
        </button>
      </article>
    </div>
  );
}
