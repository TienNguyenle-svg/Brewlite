'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { OrderCard } from '../../../components/barista/order-card';
import {
  ApiError,
  BaristaOrder,
  COLUMN_ORDER,
  OrderStatus,
  STATUS_CONFIG,
  fetchOrders,
  updateOrderStatus,
} from '../../../lib/barista';

const POLL_MS = 10_000;

type Filter = 'ALL' | (typeof COLUMN_ORDER)[number];

export default function BaristaOrdersPage() {
  const [orders, setOrders] = useState<BaristaOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      setOrders(await fetchOrders());
      setUpdatedAt(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách đơn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const handleAdvance = async (order: BaristaOrder) => {
    if (order.status === 'COMPLETED') return;
    const next = STATUS_CONFIG[order.status].next;
    if (!next) return;

    setBusyId(order.id);
    try {
      await updateOrderStatus(order.id, next);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không cập nhật được đơn');
      // 409: đơn đã bị người khác cập nhật → tải lại danh sách
      if (e instanceof ApiError && (e.status === 409 || e.status === 400)) await load();
    } finally {
      setBusyId(null);
    }
  };

  const byStatus = useMemo(() => {
    const map: Record<string, BaristaOrder[]> = { PAID: [], PREPARING: [], READY: [] };
    orders.forEach((o) => map[o.status]?.push(o));
    return map;
  }, [orders]);

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả đơn', count: orders.length },
    { key: 'PAID', label: 'Mới', count: byStatus.PAID.length },
    { key: 'PREPARING', label: 'Đang pha chế', count: byStatus.PREPARING.length },
    { key: 'READY', label: 'Sẵn sàng giao', count: byStatus.READY.length },
  ];
  const visibleColumns = filter === 'ALL' ? COLUMN_ORDER : [filter];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-wide text-[#B9672B]">Quầy barista</p>
          <h1 className="text-4xl tracking-tight">Hàng đợi đơn hàng</h1>
          <p className="text-sm text-[#82776E]">
            Đơn cũ nhất hiển thị trước. Chuyển từng đơn qua từng bước: đã thanh toán, đang pha
            chế, rồi sẵn sàng giao.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-[#EAF2EC] px-3.5 py-1.5 text-xs font-semibold text-[#41705A]">
            <span className="h-2 w-2 rounded-full bg-[#41705A]" />
            Trực tiếp
            {updatedAt && ` · cập nhật ${updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
          <button
            type="button"
            onClick={load}
            className="rounded-[10px] bg-[#39281F] px-3.5 py-2.5 text-[13px] font-semibold text-white"
          >
            Làm mới
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-2xl bg-[#FAECE9] px-5 py-3 text-[13px] text-[#A6564F]"
        >
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-semibold">
            Đóng
          </button>
        </div>
      )}

      <div className="flex gap-8 border-b border-[#E7E1DA]">
        {tabs.map((t) => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={`flex h-[50px] items-center gap-2 border-b-[3px] text-sm ${
                active
                  ? 'border-[#B9672B] font-semibold text-[#39281F]'
                  : 'border-transparent text-[#82776E]'
              }`}
            >
              {t.label}
              <span className="rounded-full bg-[#F1EDE7] px-[7px] text-[11px] leading-5">
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-[#82776E]">Đang tải đơn hàng…</p>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-sm text-[#82776E]">
          Hiện chưa có đơn nào cần pha chế ☕
        </p>
      ) : (
        <div
          className={`grid items-start gap-6 ${
            visibleColumns.length === 1 ? 'grid-cols-1' : 'grid-cols-3'
          }`}
        >
          {visibleColumns.map((status) => {
            const cfg = STATUS_CONFIG[status as Exclude<OrderStatus, 'COMPLETED'>];
            const list = byStatus[status];
            return (
              <section
                key={status}
                className="flex min-h-[200px] flex-col gap-3.5 rounded-2xl border border-[#E7E1DA] bg-[#FCFAF7] p-4"
              >
                <header className="flex items-center gap-2.5 px-1 pb-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${cfg.dotClass}`} />
                  <div className="flex-1">
                    <h2 className="text-base leading-6">{cfg.column}</h2>
                    <p className="text-[10px] tracking-wider text-[#82776E]">{status}</p>
                  </div>
                  <span className="rounded-full border border-[#E7E1DA] bg-white px-[9px] text-xs font-semibold leading-6">
                    {list.length}
                  </span>
                </header>

                {list.length === 0 && (
                  <p className="py-8 text-center text-xs text-[#82776E]">Không có đơn</p>
                )}
                {list.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    busy={busyId === o.id}
                    onAdvance={handleAdvance}
                  />
                ))}
              </section>
            );
          })}
        </div>
      )}

      <section className="flex items-center justify-between rounded-2xl border border-[#E7E1DA] bg-white px-6 py-4 text-xs text-[#82776E]">
        <span>Mỗi đơn chỉ chuyển tiếp từng bước một. Đơn hoàn thành sẽ rời khỏi hàng đợi.</span>
        <span className="flex items-center gap-2.5">
          Đã thanh toán — Đang pha — Sẵn sàng — Hoàn thành
        </span>
      </section>
    </div>
  );
}
