'use client';

import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../../lib/api';
import {
  type AdminOrder,
  type AdminProduct,
  addDays,
  dateKey,
  downloadCsv,
  fetchOrders,
  fetchProducts,
  formatClock,
  formatDate,
  formatNumber,
  formatPercent,
  formatVnd,
  pad2,
  parseDateKey,
} from '../../../lib/admin';
import {
  CalendarIcon,
  CupIcon,
  DownloadIcon,
  ErrorBox,
  PageHeader,
  ReceiptIcon,
  StatCard,
  TableSkeleton,
  TrendingUpIcon,
  WalletIcon,
  btnOutline,
  filterBase,
} from '../../../components/admin/ui';

const GENERIC_ERROR = 'Đã có lỗi xảy ra, vui lòng thử lại';
const MAX_DAYS = 92;
const DAY_MS = 86_400_000;
const COLORS = ['#39281F', '#B9672B', '#E5C9A8', '#41705A', '#8A7F76', '#D6574F'];

type Preset = 'today' | '7d' | 'month' | 'custom';
type Range = { from: string; to: string };

const PRESET_LABEL: Record<Preset, string> = {
  today: 'Hôm nay',
  '7d': '7 ngày qua',
  month: 'Tháng này',
  custom: 'Khoảng đã chọn',
};

function rangeFor(preset: Exclude<Preset, 'custom'>): Range {
  const today = new Date();
  if (preset === 'today') return { from: dateKey(today), to: dateKey(today) };
  if (preset === '7d') return { from: dateKey(addDays(today, -6)), to: dateKey(today) };
  return {
    from: dateKey(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: dateKey(today),
  };
}

type Summary = {
  revenue: number;
  orderCount: number;
  avg: number;
  cups: number;
  itemsValue: number;
  shipping: number;
  discount: number;
};

function summarize(list: AdminOrder[]): Summary {
  let revenue = 0;
  let itemsValue = 0;
  let shipping = 0;
  let discount = 0;
  let cups = 0;
  for (const o of list) {
    revenue += o.total;
    shipping += o.shippingFee;
    discount += o.discountAmount + o.pointsDiscount;
    for (const it of o.items) {
      itemsValue += it.lineTotal;
      cups += it.qty;
    }
  }
  const orderCount = list.length;
  return {
    revenue,
    orderCount,
    avg: orderCount ? Math.round(revenue / orderCount) : 0,
    cups,
    itemsValue,
    shipping,
    discount,
  };
}

const inRange = (o: AdminOrder, r: Range) => {
  const k = dateKey(new Date(o.createdAt));
  return k >= r.from && k <= r.to;
};

const changePct = (cur: number, prev: number) =>
  prev > 0 ? ((cur - prev) / prev) * 100 : null;

const million = (n: number) =>
  (n / 1_000_000).toLocaleString('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const dm = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;

function Change({ value, label }: { value: number | null; label: string }) {
  if (value === null) {
    return <span>Chưa có dữ liệu kỳ trước</span>;
  }
  const up = value >= 0;
  return (
    <span className={up ? 'text-[#41705A]' : 'text-[#C0443B]'}>
      {up ? '+' : '−'}
      {formatPercent(Math.abs(value))} so với {label}
    </span>
  );
}

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

// Biểu đồ tròn vẽ bằng SVG thuần
function Donut({
  items,
  total,
}: {
  items: { name: string; value: number }[];
  total: number;
}) {
  const R = 46;
  const C = 2 * Math.PI * R;
  const segments = items.reduce<
    { name: string; color: string; start: number; len: number }[]
  >((acc, it, i) => {
    const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].len : 0;
    acc.push({
      name: it.name,
      color: COLORS[i % COLORS.length],
      start,
      len: (it.value / total) * C,
    });
    return acc;
  }, []);

  return (
    <div className="relative h-[150px] w-[150px] shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#F1ECE5" strokeWidth="14" />
        {segments.map((s) => (
          <circle
            key={s.name}
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${s.len} ${C - s.len}`}
            strokeDashoffset={-s.start}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold">{million(total)}</span>
        <span className="text-[10px] text-[#82776E]">triệu đồng</span>
      </div>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[#E7E1DA] bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}

export default function AdminRevenuePage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [preset, setPreset] = useState<Preset>('7d');
  const [range, setRange] = useState<Range>(() => rangeFor('7d'));

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchOrders(), fetchProducts()])
      .then(([o, p]) => {
        if (cancelled) return;
        setOrders(o);
        setProducts(p);
        setUpdatedAt(new Date());
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

  // Backend chỉ có tổng doanh thu toàn thời gian, nên mọi số liệu theo kỳ
  // được tính ở frontend từ danh sách đơn (chỉ tính đơn COMPLETED, theo ngày tạo đơn)
  const data = useMemo(() => {
    if (!range.from || !range.to) return null;
    const from = parseDateKey(range.from);
    const to = parseDateKey(range.to);
    const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
    if (Number.isNaN(days) || days < 1 || days > MAX_DAYS) return null;

    const completed = orders.filter((o) => o.status === 'COMPLETED');
    const current = completed.filter((o) => inRange(o, range));

    // Kỳ trước: cùng số ngày, liền ngay trước kỳ hiện tại
    const prevTo = addDays(from, -1);
    const prevFrom = addDays(prevTo, -(days - 1));
    const prevRange = { from: dateKey(prevFrom), to: dateKey(prevTo) };
    const previous = completed.filter((o) => inRange(o, prevRange));

    const cur = summarize(current);
    const prev = summarize(previous);

    const revenueByDay = new Map<string, number>();
    const countByDay = new Map<string, number>();
    for (const o of current) {
      const k = dateKey(new Date(o.createdAt));
      revenueByDay.set(k, (revenueByDay.get(k) ?? 0) + o.total);
      countByDay.set(k, (countByDay.get(k) ?? 0) + 1);
    }
    const daily = Array.from({ length: days }, (_, i) => {
      const d = addDays(from, i);
      const key = dateKey(d);
      return { key, date: d, revenue: revenueByDay.get(key) ?? 0 };
    });

    // Danh mục lấy từ danh sách sản phẩm, ghép theo tên (đơn hàng chỉ trả tên sản phẩm)
    const categoryOf = new Map(
      products.map((p) => [p.name.trim().toLowerCase(), p.category] as const),
    );
    const byCategory = new Map<string, number>();
    const byProduct = new Map<string, { qty: number; revenue: number }>();
    for (const o of current) {
      for (const it of o.items) {
        const cat = categoryOf.get(it.product.name.trim().toLowerCase()) ?? 'Khác';
        byCategory.set(cat, (byCategory.get(cat) ?? 0) + it.lineTotal);
        const p = byProduct.get(it.product.name) ?? { qty: 0, revenue: 0 };
        p.qty += it.qty;
        p.revenue += it.lineTotal;
        byProduct.set(it.product.name, p);
      }
    }
    const categories = Array.from(byCategory, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
    const productRows = Array.from(byProduct, ([name, v]) => ({ name, ...v })).sort(
      (a, b) => b.revenue - a.revenue,
    );

    return { from, to, days, cur, prev, daily, countByDay, categories, productRows };
  }, [orders, products, range]);

  function choosePreset(p: Exclude<Preset, 'custom'>) {
    setPreset(p);
    setRange(rangeFor(p));
  }

  function changeDate(field: 'from' | 'to', value: string) {
    setPreset('custom');
    setRange((r) => ({ ...r, [field]: value }));
  }

  function handleExport() {
    if (!data) return;
    downloadCsv(`bao-cao-doanh-thu_${range.from}_${range.to}.csv`, [
      ['Ngày', 'Số đơn hoàn thành', 'Doanh thu (đ)'],
      ...data.daily.map((d) => [
        formatDate(d.date),
        data.countByDay.get(d.key) ?? 0,
        d.revenue,
      ]),
      ['Tổng', data.cur.orderCount, data.cur.revenue],
    ]);
  }

  const prevLabel =
    preset === 'today' ? 'hôm qua' : preset === '7d' ? '7 ngày trước' : 'kỳ trước';

  const tabBtn = (active: boolean) =>
    `rounded-lg border px-4 py-2 text-sm transition-colors ${
      active
        ? 'border-[#39281F] bg-[#39281F] font-semibold text-white'
        : 'border-[#E7E1DA] bg-white text-[#39281F] hover:bg-[#F8F5F0]'
    }`;

  // ----- Chuẩn bị số liệu cho biểu đồ (khi khoảng ngày hợp lệ) -----
  let chart: {
    top: number;
    ticks: number[];
    best: { date: Date; revenue: number };
    labelEvery: number;
    showValues: boolean;
  } | null = null;
  let donutItems: { name: string; value: number }[] = [];
  let donutTotal = 0;

  if (data) {
    const maxDay = Math.max(0, ...data.daily.map((d) => d.revenue));
    const topM = Math.max(1, Math.ceil(maxDay / 1_000_000));
    const step = topM <= 4 ? 1 : Math.ceil(topM / 4);
    const top = Math.ceil(topM / step) * step;
    const ticks: number[] = [];
    for (let t = 0; t <= top; t += step) ticks.push(t);
    const best = data.daily.reduce((b, d) => (d.revenue > b.revenue ? d : b), data.daily[0]);
    chart = {
      top,
      ticks,
      best,
      labelEvery: Math.ceil(data.daily.length / 7),
      showValues: data.daily.length <= 10,
    };

    donutTotal = data.categories.reduce((s, c) => s + c.value, 0);
    donutItems = data.categories.slice(0, 5);
    const rest = data.categories.slice(5).reduce((s, c) => s + c.value, 0);
    if (rest > 0) donutItems.push({ name: 'Nhóm khác', value: rest });
  }

  return (
    <div>
      <PageHeader
        title="Báo cáo doanh thu"
        subtitle="Nhìn lại những con số, vun đắp những ca cà phê tốt hơn."
        action={
          <button
            type="button"
            onClick={handleExport}
            disabled={!data || loading}
            className={`${btnOutline} flex items-center gap-2 text-[#B9672B]`}
          >
            <DownloadIcon size={14} />
            Xuất báo cáo
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['today', '7d', 'month'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => choosePreset(p)}
            className={tabBtn(preset === p)}
          >
            {PRESET_LABEL[p]}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[#82776E]">
          <CalendarIcon size={15} />
          <input
            type="date"
            value={range.from}
            onChange={(e) => changeDate('from', e.target.value)}
            aria-label="Từ ngày"
            className={`${filterBase} px-3`}
          />
          <span>–</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => changeDate('to', e.target.value)}
            aria-label="Đến ngày"
            className={`${filterBase} px-3`}
          />
        </div>
      </div>

      {loading && (
        <div className="overflow-hidden rounded-xl border border-[#E7E1DA] bg-white">
          <TableSkeleton />
        </div>
      )}

      {!loading && loadError && (
        <Card>
          <div className="p-4 text-center text-sm">
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
        </Card>
      )}

      {!loading && !loadError && !data && (
        <ErrorBox>
          Khoảng ngày không hợp lệ. Vui lòng chọn từ ngày không sau đến ngày, tối đa {MAX_DAYS} ngày.
        </ErrorBox>
      )}

      {!loading && !loadError && data && chart && (
        <>
          <div className="mb-4 grid grid-cols-4 gap-4">
            <StatCard
              label="Doanh thu ghi nhận"
              value={formatVnd(data.cur.revenue)}
              hint={<Change value={changePct(data.cur.revenue, data.prev.revenue)} label={prevLabel} />}
              icon={<WalletIcon size={16} />}
            />
            <StatCard
              label="Đơn hoàn thành"
              value={formatNumber(data.cur.orderCount)}
              hint={<Change value={changePct(data.cur.orderCount, data.prev.orderCount)} label={prevLabel} />}
              icon={<ReceiptIcon size={16} />}
            />
            <StatCard
              label="Giá trị trung bình / đơn"
              value={formatVnd(data.cur.avg)}
              hint={<Change value={changePct(data.cur.avg, data.prev.avg)} label={prevLabel} />}
              icon={<TrendingUpIcon size={16} />}
            />
            <StatCard
              label="Số ly đã bán"
              value={formatNumber(data.cur.cups)}
              hint={<Change value={changePct(data.cur.cups, data.prev.cups)} label={prevLabel} />}
              icon={<CupIcon size={16} />}
            />
          </div>

          <div className="mb-4 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
            {/* ===== Biểu đồ cột theo ngày ===== */}
            <Card>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-semibold">Doanh thu theo ngày</h2>
                <span className="flex items-center gap-1.5 text-xs text-[#82776E]">
                  <span className="h-2 w-2 rounded-full bg-[#D9A877]" />
                  Doanh thu
                </span>
              </div>
              <p className="mb-4 text-xs text-[#82776E]">
                {formatDate(data.from)} – {formatDate(data.to)} · Đơn vị: triệu đồng
              </p>

              <div className="flex gap-3">
                <div className="relative h-[200px] w-6 shrink-0 text-[11px] text-[#82776E]">
                  {chart.ticks.map((t) => (
                    <span
                      key={t}
                      className="absolute right-0 translate-y-1/2"
                      style={{ bottom: `${(t / chart.top) * 100}%` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="relative h-[200px]">
                    {chart.ticks.map((t) => (
                      <div
                        key={t}
                        className="absolute inset-x-0 border-t border-[#EFE9E1]"
                        style={{ bottom: `${(t / chart.top) * 100}%` }}
                      />
                    ))}
                    <div className="absolute inset-0 flex items-end gap-2 px-2">
                      {data.daily.map((d, i) => {
                        const last = i === data.daily.length - 1;
                        const h = (d.revenue / (chart.top * 1_000_000)) * 100;
                        return (
                          <div
                            key={d.key}
                            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                          >
                            {chart.showValues && d.revenue > 0 && (
                              <span className="mb-1 text-[10px] text-[#82776E]">
                                {million(d.revenue)}
                              </span>
                            )}
                            <div
                              className="w-full max-w-[44px] rounded-t-md"
                              style={{
                                height: `${h}%`,
                                minHeight: d.revenue > 0 ? 2 : 0,
                                backgroundColor: last ? '#39281F' : '#D9A877',
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 px-2">
                    {data.daily.map((d, i) => {
                      const last = i === data.daily.length - 1;
                      return (
                        <span
                          key={d.key}
                          className={`min-w-0 flex-1 text-center text-[11px] ${
                            last ? 'font-semibold text-[#39281F]' : 'text-[#82776E]'
                          }`}
                        >
                          {i % chart.labelEvery === 0 || last ? dm(d.date) : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-[#82776E]">
                {chart.best.revenue > 0
                  ? `Ngày ${dm(chart.best.date)} cao nhất: ${formatVnd(chart.best.revenue)}`
                  : 'Chưa có doanh thu trong kỳ này.'}
              </p>
            </Card>

            {/* ===== Biểu đồ tròn theo danh mục ===== */}
            <Card>
              <h2 className="font-semibold">Cơ cấu doanh thu</h2>
              <p className="mb-4 text-xs text-[#82776E]">
                Theo danh mục sản phẩm · {PRESET_LABEL[preset].toLowerCase()}
              </p>

              {donutTotal === 0 ? (
                <p className="py-10 text-center text-sm text-[#82776E]">
                  Chưa có dữ liệu trong kỳ này.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <Donut items={donutItems} total={donutTotal} />
                    <ul className="min-w-0 flex-1 space-y-2.5 text-xs">
                      {donutItems.map((it, i) => (
                        <li key={it.name} className="flex items-start justify-between gap-2">
                          <span className="flex min-w-0 items-start gap-2">
                            <span
                              className="mt-1 h-2 w-2 shrink-0 rounded-sm"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{it.name}</span>
                              <span className="text-[#82776E]">{formatVnd(it.value)}</span>
                            </span>
                          </span>
                          <span className="shrink-0 text-[#82776E]">
                            {formatPercent((it.value / donutTotal) * 100)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="mt-4 border-t border-[#F1ECE5] pt-3 text-xs text-[#82776E]">
                    {donutItems[0].name} dẫn đầu, đóng góp{' '}
                    {formatPercent((donutItems[0].value / donutTotal) * 100)} giá trị món bán ra
                    trong kỳ. Tính theo giá trị món, chưa trừ giảm giá và chưa gồm phí vận chuyển.
                  </p>
                </>
              )}
            </Card>
          </div>

          <div className="mb-4 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
            {/* ===== Sản phẩm bán chạy ===== */}
            <div className="overflow-hidden rounded-xl border border-[#E7E1DA] bg-white">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="font-semibold">Sản phẩm bán chạy</h2>
                <span className="text-xs text-[#82776E]">
                  {formatDate(data.from)} – {formatDate(data.to)}
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1.6fr)_80px_140px_90px] gap-4 border-y border-[#E7E1DA] bg-[#FBF8F4] px-5 py-3 text-xs text-[#82776E]">
                <span>Sản phẩm</span>
                <span>Số ly</span>
                <span>Doanh thu</span>
                <span>Tỷ trọng</span>
              </div>
              {data.productRows.length === 0 && (
                <p className="p-8 text-center text-sm text-[#82776E]">
                  Chưa có sản phẩm nào được bán trong kỳ này.
                </p>
              )}
              {data.productRows.slice(0, 4).map((p) => (
                <div
                  key={p.name}
                  className="grid grid-cols-[minmax(0,1.6fr)_80px_140px_90px] gap-4 border-b border-[#F1ECE5] px-5 py-3 text-sm"
                >
                  <span className="truncate font-medium">{p.name}</span>
                  <span>{formatNumber(p.qty)}</span>
                  <span>{formatVnd(p.revenue)}</span>
                  <span>
                    {formatPercent(
                      data.cur.itemsValue > 0 ? (p.revenue / data.cur.itemsValue) * 100 : 0,
                    )}
                  </span>
                </div>
              ))}
              {data.productRows.length > 4 && (() => {
                const rest = data.productRows.slice(4);
                const qty = rest.reduce((s, p) => s + p.qty, 0);
                const revenue = rest.reduce((s, p) => s + p.revenue, 0);
                return (
                  <div className="flex items-center justify-between px-5 py-3 text-xs text-[#82776E]">
                    <span>
                      Các sản phẩm khác · {formatNumber(qty)} ly
                    </span>
                    <span>
                      {formatVnd(revenue)} ·{' '}
                      {formatPercent(
                        data.cur.itemsValue > 0 ? (revenue / data.cur.itemsValue) * 100 : 0,
                      )}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* ===== Tổng kết trong kỳ ===== */}
            <Card>
              <h2 className="font-semibold">Tổng kết trong kỳ</h2>
              <p className="mb-4 text-xs text-[#82776E]">
                {formatDate(data.from)} – {formatDate(data.to)}
              </p>
              {(() => {
                const { itemsValue, shipping, discount, revenue } = data.cur;
                // Nếu các dòng không cộng ra đúng doanh thu thì hiện dòng điều chỉnh để số liệu minh bạch
                const other = revenue - (itemsValue + shipping - discount);
                return (
                  <div className="space-y-2.5">
                    <Row label="Giá trị món bán ra" value={formatVnd(itemsValue)} />
                    <Row label="Phí vận chuyển" value={formatVnd(shipping)} />
                    <Row label="Giảm giá (mã và điểm)" value={`−${formatVnd(discount)}`} />
                    {other !== 0 && (
                      <Row
                        label="Điều chỉnh khác"
                        value={`${other > 0 ? '+' : '−'}${formatVnd(Math.abs(other))}`}
                      />
                    )}
                  </div>
                );
              })()}
              <div className="mt-4 border-t border-[#E7E1DA] pt-4">
                <p className="text-xs text-[#82776E]">Doanh thu ghi nhận</p>
                <p className="mt-1 text-[26px] font-semibold leading-tight">
                  {formatVnd(data.cur.revenue)}
                </p>
                <p className="mt-1 text-xs">
                  <Change
                    value={changePct(data.cur.revenue, data.prev.revenue)}
                    label={prevLabel}
                  />
                </p>
              </div>
            </Card>
          </div>

          <p className="text-xs text-[#82776E]">
            Chỉ tính đơn đã hoàn thành, theo ngày tạo đơn.
            {updatedAt ? ` Cập nhật lúc ${formatClock(updatedAt)}.` : ''}
          </p>
        </>
      )}
    </div>
  );
}