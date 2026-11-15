'use client';

import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../../lib/api';
import { formatOrderCode } from '../../../lib/order-code';
import {
  type AdminOrder,
  type AdminOrderStatus,
  dateKey,
  downloadCsv,
  fetchOrders,
  formatDate,
  formatPercent,
  formatVnd,
  pad2,
  parseDateKey,
} from '../../../lib/admin';
import {
  ArrowUpRightIcon,
  Badge,
  CheckCircleIcon,
  CupIcon,
  DownloadIcon,
  Modal,
  PageHeader,
  Pagination,
  ReceiptIcon,
  SearchInput,
  StatCard,
  TableSkeleton,
  WalletIcon,
  btnOutline,
  filterBase,
  type Tone,
} from '../../../components/admin/ui';

const PAGE_SIZE = 8;
const GENERIC_ERROR = 'Đã có lỗi xảy ra, vui lòng thử lại';
const GRID =
  'grid grid-cols-[100px_110px_minmax(0,1.6fr)_120px_140px_150px_130px] items-center gap-4 px-5';

// Backend có 7 trạng thái đơn
const STATUS: Record<AdminOrderStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Chờ thanh toán', tone: 'warning' },
  PAID: { label: 'Chờ pha chế', tone: 'warning' },
  PAYMENT_FAILED: { label: 'Thanh toán lỗi', tone: 'danger' },
  PREPARING: { label: 'Đang pha chế', tone: 'dark' },
  READY: { label: 'Sẵn sàng giao', tone: 'success' },
  COMPLETED: { label: 'Hoàn thành', tone: 'success' },
  CANCELLED: { label: 'Đã hủy', tone: 'danger' },
};

type PayKey = 'paid' | 'unpaid' | 'failed' | 'refunded';
const PAY: Record<PayKey, { label: string; tone: Tone }> = {
  paid: { label: 'Đã thanh toán', tone: 'neutral' },
  unpaid: { label: 'Chưa thanh toán', tone: 'warning' },
  failed: { label: 'Thất bại', tone: 'danger' },
  refunded: { label: 'Đã hoàn tiền', tone: 'neutral' },
};

// Trạng thái thanh toán của cả đơn, suy ra từ các bản ghi thanh toán
function paymentKey(o: AdminOrder): PayKey {
  const s = o.payments.map((p) => p.status);
  if (s.includes('REFUNDED')) return 'refunded';
  if (s.includes('SUCCEEDED')) return 'paid';
  if (s.length === 0 || s.includes('PENDING')) return 'unpaid';
  return 'failed';
}

const PAYMENT_RECORD_LABEL: Record<string, string> = {
  SUCCEEDED: 'Thành công',
  PENDING: 'Đang chờ',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

const qtyOf = (o: AdminOrder) => o.items.reduce((s, i) => s + i.qty, 0);
const namesOf = (o: AdminOrder) =>
  Array.from(new Set(o.items.map((i) => i.product.name))).join(', ');
const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const dateOf = (iso: string) => formatDate(new Date(iso));

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between text-sm ${
        strong ? 'font-semibold' : 'text-[#82776E]'
      }`}
    >
      <span>{label}</span>
      <span className={strong ? '' : 'text-[#39281F]'}>{value}</span>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | AdminOrderStatus>('');
  const [payFilter, setPayFilter] = useState<'' | PayKey>('');
  const [day, setDay] = useState(() => dateKey(new Date())); // rỗng = tất cả các ngày
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AdminOrder | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOrders()
      .then((list) => {
        if (cancelled) return;
        setOrders(list);
        setLoadError('');
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : GENERIC_ERROR);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Backend trả toàn bộ đơn, không lọc theo ngày nên lọc ở frontend
  const dayOrders = useMemo(
    () => (day ? orders.filter((o) => dateKey(new Date(o.createdAt)) === day) : orders),
    [orders, day],
  );

  const stats = useMemo(() => {
    const count = (s: AdminOrderStatus) => dayOrders.filter((o) => o.status === s).length;
    const completed = dayOrders.filter((o) => o.status === 'COMPLETED');
    const waiting = count('PAID');
    const preparing = count('PREPARING');
    const ready = count('READY');
    const cancelled = count('CANCELLED');
    return {
      total: dayOrders.length,
      cancelled,
      waiting,
      preparing,
      ready,
      processing: waiting + preparing + ready,
      completedCount: completed.length,
      completedPct: dayOrders.length ? (completed.length / dayOrders.length) * 100 : 0,
      revenue: completed.reduce((s, o) => s + o.total, 0),
    };
  }, [dayOrders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dayOrders.filter(
      (o) =>
        (!q ||
          formatOrderCode(o.id).toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)) &&
        (!statusFilter || o.status === statusFilter) &&
        (!payFilter || paymentKey(o) === payFilter),
    );
  }, [dayOrders, search, statusFilter, payFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const isToday = day === dateKey(new Date());
  const dayText = day ? formatDate(parseDateKey(day)) : '';
  const subtitleDay = !day
    ? 'Tất cả các ngày'
    : isToday
      ? `Hôm nay, ${dayText}`
      : `Ngày ${dayText}`;
  const tableTitle = !day
    ? 'Tất cả đơn hàng'
    : isToday
      ? 'Đơn hàng hôm nay'
      : `Đơn hàng ngày ${dayText}`;

  function handleExport() {
    downloadCsv(`don-hang-${day || 'tat-ca'}.csv`, [
      ['Mã đơn', 'Thời gian', 'Người nhận', 'Số điện thoại', 'Địa chỉ', 'Số món', 'Tổng tiền', 'Thanh toán', 'Trạng thái'],
      ...filtered.map((o) => [
        formatOrderCode(o.id),
        new Date(o.createdAt).toLocaleString('vi-VN'),
        o.receiverName ?? '',
        o.receiverPhone ?? '',
        o.deliveryAddress ?? '',
        qtyOf(o),
        o.total,
        PAY[paymentKey(o)].label,
        STATUS[o.status].label,
      ]),
    ]);
  }

  return (
    <div>
      <PageHeader
        title="Quản lý đơn hàng"
        subtitle={`${subtitleDay} · Đồng hành cùng từng đơn hàng.`}
        action={
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || filtered.length === 0}
            className={`${btnOutline} flex items-center gap-2 text-[#B9672B]`}
          >
            <DownloadIcon size={14} />
            Xuất danh sách
          </button>
        }
      />

      {!loading && !loadError && (
        <div className="mb-4 grid grid-cols-4 gap-4">
          <StatCard
            label={isToday ? 'Tổng đơn hôm nay' : 'Tổng đơn'}
            value={pad2(stats.total)}
            hint={`${stats.total - stats.cancelled} đơn tiếp nhận · ${stats.cancelled} đơn đã hủy`}
            icon={<ReceiptIcon size={16} />}
          />
          <StatCard
            label="Đơn đang xử lý"
            value={pad2(stats.processing)}
            hint={`${stats.waiting} chờ pha chế · ${stats.preparing} đang pha chế${
              stats.ready > 0 ? ` · ${stats.ready} sẵn sàng` : ''
            }`}
            icon={<CupIcon size={16} />}
          />
          <StatCard
            label="Đã hoàn thành"
            value={pad2(stats.completedCount)}
            hint={`${formatPercent(stats.completedPct)} tổng số đơn`}
            icon={<CheckCircleIcon size={16} />}
          />
          <StatCard
            label={isToday ? 'Doanh thu hôm nay' : 'Doanh thu'}
            value={formatVnd(stats.revenue)}
            hint={`Từ ${stats.completedCount} đơn hàng đã hoàn thành`}
            icon={<WalletIcon size={16} />}
          />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Tìm theo mã đơn"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as '' | AdminOrderStatus);
            setPage(1);
          }}
          className={`${filterBase} px-3.5`}
        >
          <option value="">Tất cả trạng thái</option>
          {(Object.keys(STATUS) as AdminOrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS[s].label}
            </option>
          ))}
        </select>
        <select
          value={payFilter}
          onChange={(e) => {
            setPayFilter(e.target.value as '' | PayKey);
            setPage(1);
          }}
          className={`${filterBase} px-3.5`}
        >
          <option value="">Thanh toán: Tất cả</option>
          {(Object.keys(PAY) as PayKey[]).map((k) => (
            <option key={k} value={k}>
              {PAY[k].label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={day}
          onChange={(e) => {
            setDay(e.target.value);
            setPage(1);
          }}
          aria-label="Chọn ngày"
          className={`${filterBase} ml-auto px-3`}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E7E1DA] bg-white">
        <div className="flex items-center justify-between border-b border-[#E7E1DA] px-5 py-3.5 text-sm">
          <span className="flex items-center gap-2 font-semibold">
            {tableTitle}
            <Badge tone="neutral">{filtered.length} đơn</Badge>
          </span>
          <span className="text-xs text-[#82776E]">Mới nhất trước</span>
        </div>

        <div
          className={`${GRID} border-b border-[#E7E1DA] bg-[#FBF8F4] py-3 text-xs text-[#82776E]`}
        >
          <span>Mã đơn</span>
          <span>Thời gian</span>
          <span>Sản phẩm</span>
          <span>Tổng tiền</span>
          <span>Thanh toán</span>
          <span>Trạng thái</span>
          <span>Thao tác</span>
        </div>

        {loading && <TableSkeleton />}

        {!loading && loadError && (
          <div className="p-8 text-center text-sm">
            <p className="mb-3 text-[#C0443B]">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setReloadKey((k) => k + 1);
              }}
              className={btnOutline}
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-[#82776E]">
            {dayOrders.length === 0
              ? 'Không có đơn hàng nào trong thời gian đã chọn.'
              : 'Không có đơn hàng khớp với bộ lọc.'}
          </div>
        )}

        {!loading &&
          !loadError &&
          rows.map((o) => {
            const st = STATUS[o.status];
            const pay = PAY[paymentKey(o)];
            return (
              <div
                key={o.id}
                className={`${GRID} border-b border-[#F1ECE5] py-3 text-sm transition-colors hover:bg-[#FBF8F4]`}
              >
                <span className="font-semibold">{formatOrderCode(o.id)}</span>
                <div>
                  <p>{timeOf(o.createdAt)}</p>
                  <p className="text-xs text-[#82776E]">{dateOf(o.createdAt)}</p>
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{qtyOf(o)} món</p>
                  <p className="truncate text-xs text-[#82776E]">{namesOf(o)}</p>
                </div>
                <span className="font-medium">{formatVnd(o.total)}</span>
                <span>
                  <Badge tone={pay.tone}>{pay.label}</Badge>
                </span>
                <span>
                  <Badge tone={st.tone} dot>
                    {st.label}
                  </Badge>
                </span>
                <span>
                  <button
                    type="button"
                    onClick={() => setDetail(o)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#B9672B] hover:underline"
                  >
                    Xem chi tiết
                    <ArrowUpRightIcon size={12} />
                  </button>
                </span>
              </div>
            );
          })}

        {!loading && !loadError && (
          <Pagination
            page={safePage}
            pageCount={pageCount}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            noun="đơn hàng"
            onChange={setPage}
          />
        )}
      </div>

      {/* ===== Chi tiết đơn (chỉ xem) ===== */}
      {detail && (
        <Modal width={560} onClose={() => setDetail(null)}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Đơn {formatOrderCode(detail.id)}</h2>
              <p className="text-xs text-[#82776E]">
                {timeOf(detail.createdAt)} · {dateOf(detail.createdAt)}
              </p>
            </div>
            <Badge tone={STATUS[detail.status].tone} dot>
              {STATUS[detail.status].label}
            </Badge>
          </div>

          <div className="mb-4 space-y-1 rounded-xl bg-[#F8F5F0] p-4 text-sm">
            <p className="mb-1 text-xs font-medium text-[#82776E]">Thông tin nhận hàng</p>
            <p>{detail.receiverName || '—'}</p>
            <p className="text-[#82776E]">{detail.receiverPhone || '—'}</p>
            <p className="text-[#82776E]">{detail.deliveryAddress || '—'}</p>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-[#82776E]">Danh sách món</p>
            <ul className="divide-y divide-[#F1ECE5] rounded-xl border border-[#E7E1DA]">
              {detail.items.map((it) => (
                <li key={it.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {it.qty} × {it.product.name} ({it.size})
                    </p>
                    {it.toppings.length > 0 && (
                      <p className="text-xs text-[#82776E]">
                        Topping: {it.toppings.map((t) => t.topping.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0">{formatVnd(it.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4 space-y-2 border-t border-[#E7E1DA] pt-4">
            <Row
              label="Tạm tính"
              value={formatVnd(detail.items.reduce((s, i) => s + i.lineTotal, 0))}
            />
            <Row label="Phí vận chuyển" value={formatVnd(detail.shippingFee)} />
            <Row label="Giảm giá" value={`−${formatVnd(detail.discountAmount)}`} />
            <Row
              label={`Điểm đã dùng (${detail.pointsUsed} điểm)`}
              value={`−${formatVnd(detail.pointsDiscount)}`}
            />
            <Row label="Tổng cộng" value={formatVnd(detail.total)} strong />
          </div>

          <div className="mb-5">
            <p className="mb-2 text-xs font-medium text-[#82776E]">Thanh toán</p>
            {detail.payments.length === 0 ? (
              <p className="text-sm text-[#82776E]">Chưa có giao dịch thanh toán.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {detail.payments.map((p, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>
                      {p.method} · {PAYMENT_RECORD_LABEL[p.status] ?? p.status}
                    </span>
                    <span>{formatVnd(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={() => setDetail(null)} className={btnOutline}>
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}