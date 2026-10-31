'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BaristaOrder,
  fetchHistory,
  formatTime,
  orderCode,
} from '../../../lib/barista';

const summarize = (o: BaristaOrder) =>
  o.items.map((i) => `${i.qty} × ${i.product.name}`).join(' · ');

const processingMinutes = (o: BaristaOrder) =>
  o.updatedAt
    ? Math.max(
        0,
        Math.round((new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000),
      )
    : null;

export default function BaristaHistoryPage() {
  const [orders, setOrders] = useState<BaristaOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOrders(await fetchHistory());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được lịch sử đơn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const times = orders.map(processingMinutes).filter((m): m is number => m !== null);
    return {
      orders: orders.length,
      cups: orders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0),
      avg: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
    };
  }, [orders]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-wide text-[#B9672B]">Quầy barista</p>
        <h1 className="text-4xl tracking-tight">Đơn đã hoàn thành</h1>
        <p className="text-sm text-[#82776E]">
          Các đơn đã giao cho khách, đơn mới nhất hiển thị trước.
        </p>
      </section>

      {error && (
        <div role="alert" className="rounded-2xl bg-[#FAECE9] px-5 py-3 text-[13px] text-[#A6564F]">
          {error}
        </div>
      )}

      <section className="grid grid-cols-3 gap-6">
        {[
          { label: 'Đơn đã hoàn thành', value: String(stats.orders), note: 'Trong danh sách gần nhất' },
          { label: 'Số sản phẩm đã làm', value: String(stats.cups), note: 'Tổng số lượng các món' },
          {
            label: 'Thời gian xử lý trung bình',
            value: stats.avg === null ? '—' : `${stats.avg} phút`,
            note: 'Từ lúc đặt đến lúc giao',
          },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-2xl border border-[#E7E1DA] bg-white px-6 py-5">
            <span className="text-xs text-[#82776E]">{s.label}</span>
            <span className="text-3xl tracking-tight">{s.value}</span>
            <span className="text-[11px] text-[#82776E]">{s.note}</span>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E7E1DA] bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#FCFAF7] text-[11px] uppercase tracking-wider text-[#82776E]">
            <tr>
              {['Mã đơn', 'Giờ đặt', 'Khách', 'Món', 'Thời gian xử lý', 'Trạng thái'].map((h) => (
                <th key={h} className="px-6 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#82776E]">
                  Đang tải…
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#82776E]">
                  Chưa có đơn nào hoàn thành.
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const mins = processingMinutes(o);
              return (
                <tr key={o.id} className="border-t border-[#E7E1DA]">
                  <td className="px-6 py-4 font-semibold">#{orderCode(o)}</td>
                  <td className="px-6 py-4 text-[#82776E]">{formatTime(o.createdAt)}</td>
                  <td className="px-6 py-4 text-[#82776E]">{o.user.email}</td>
                  <td className="px-6 py-4">{summarize(o)}</td>
                  <td className="px-6 py-4 text-[#82776E]">{mins === null ? '—' : `${mins} phút`}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-[#EAF2EC] px-2.5 py-1 text-[11px] font-semibold text-[#41705A]">
                      Hoàn thành
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
