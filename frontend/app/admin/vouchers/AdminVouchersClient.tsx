'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ApiError } from '../../../lib/api';
import {
  type AdminPromotion, type PromotionCreatePayload,
  fetchPromotions, createPromotion, updatePromotion, formatVnd,
} from '../../../lib/admin';
import {
  Badge, ErrorBox, Field, Modal, PageHeader, Pagination, PencilIcon,
  PlusIcon, SearchInput, StatCard, TableSkeleton, Toast,
  btnOutline, btnPrimary, fieldClass, filterBase, useToast,
} from '../../../components/admin/ui';

const PAGE_SIZE = 8;
type FormState = {
  code: string; type: 'PERCENT' | 'FIXED'; discount: string;
  minOrder: string; startAt: string; expiredAt: string;
  usageLimit: string; active: boolean;
};
const emptyForm: FormState = {
  code: '', type: 'PERCENT', discount: '', minOrder: '0',
  startAt: '', expiredAt: '', usageLimit: '', active: true,
};
const formatDate = (iso: string | null) => iso
  ? new Date(iso).toLocaleDateString('vi-VN') : 'Không giới hạn';
const toInputDate = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
const toIso = (value: string) => value ? new Date(value).toISOString() : null;
const errorMessage = (error: unknown) => error instanceof ApiError
  ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.';

type Status = 'active' | 'upcoming' | 'expired' | 'inactive' | 'exhausted';
function statusOf(p: AdminPromotion): Status {
  const now = Date.now();
  if (!p.active) return 'inactive';
  if (p.expiredAt && new Date(p.expiredAt).getTime() <= now) return 'expired';
  if (p.startAt && new Date(p.startAt).getTime() > now) return 'upcoming';
  if (p.remaining !== null && p.remaining <= 0) return 'exhausted';
  return 'active';
}
const statusLabels: Record<Status, string> = {
  active: 'Đang hoạt động', upcoming: 'Sắp diễn ra', expired: 'Hết hạn',
  inactive: 'Đã vô hiệu hóa', exhausted: 'Hết lượt',
};
const statusTones = {
  active: 'success', upcoming: 'warning', expired: 'danger',
  inactive: 'neutral', exhausted: 'warning',
} as const;

function validate(f: FormState, edit: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!edit && !/^[A-Za-z0-9_-]{3,30}$/.test(f.code.trim())) {
    errors.code = 'Mã gồm 3–30 ký tự: chữ, số, dấu - hoặc _';
  }
  const discount = Number(f.discount);
  if (!f.discount.trim() || !Number.isInteger(discount) || discount < 1 ||
      (f.type === 'PERCENT' && discount > 100)) {
    errors.discount = f.type === 'PERCENT' ? 'Nhập phần trăm nguyên từ 1 đến 100' : 'Nhập số tiền nguyên lớn hơn 0';
  }
  if (!f.minOrder.trim() || !Number.isInteger(Number(f.minOrder)) || Number(f.minOrder) < 0) {
    errors.minOrder = 'Đơn tối thiểu phải là số nguyên không âm';
  }
  if (f.usageLimit && (!Number.isInteger(Number(f.usageLimit)) || Number(f.usageLimit) < 1)) {
    errors.usageLimit = 'Giới hạn phải là số nguyên dương';
  }
  if (f.startAt && f.expiredAt && new Date(f.startAt) >= new Date(f.expiredAt)) {
    errors.expiredAt = 'Ngày kết thúc phải sau ngày bắt đầu';
  }
  return errors;
}

export default function AdminVouchersClient() {
  const [items, setItems] = useState<AdminPromotion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminPromotion | null | undefined>(undefined);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = useCallback(async (isCancelled: () => boolean) => {
    setLoading(true);
    try {
      // Backend giới hạn 100 bản ghi mỗi lần gọi. Lấy đủ trang để thống kê/lọc chính xác.
      const first = await fetchPromotions(1, 100);
      const pages = Math.ceil(first.total / 100);
      const remaining = pages > 1
        ? await Promise.all(Array.from({ length: pages - 1 }, (_, i) => fetchPromotions(i + 2, 100)))
        : [];
      if (isCancelled()) return;
      setItems([...(first.items ?? []), ...remaining.flatMap((p) => p.items)]);
      setTotal(first.total);
      setLoadError('');
    } catch (err) {
      if (!isCancelled()) setLoadError(errorMessage(err));
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) void load(() => cancelled);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [load, reloadKey]);
  const reload = () => setReloadKey((x) => x + 1);

  const filtered = useMemo(() => items.filter((p) =>
    p.code.toLowerCase().includes(search.trim().toLowerCase()) &&
    (!filter || statusOf(p) === filter)), [items, search, filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeCount = items.filter((p) => statusOf(p) === 'active').length;
  const expiredCount = items.filter((p) => statusOf(p) === 'expired').length;
  const usageCount = items.reduce((sum, p) => sum + p.usedCount, 0);

  function openCreate() {
    setEditing(null); setForm(emptyForm); setErrors({}); setFormError('');
  }
  function openEdit(p: AdminPromotion) {
    setEditing(p);
    setForm({
      code: p.code, type: p.type, discount: String(p.discount),
      minOrder: String(p.minOrder), startAt: toInputDate(p.startAt),
      expiredAt: toInputDate(p.expiredAt), usageLimit: p.usageLimit === null ? '' : String(p.usageLimit),
      active: p.active,
    });
    setErrors({}); setFormError('');
  }
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || editing === undefined) return;
    const issues = validate(form, !!editing);
    setErrors(issues); setFormError('');
    if (Object.keys(issues).length) return;
    const data: PromotionCreatePayload = {
      code: form.code.trim().toUpperCase(), type: form.type,
      discount: Number(form.discount), minOrder: Number(form.minOrder),
      startAt: toIso(form.startAt), expiredAt: toIso(form.expiredAt),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    };
    setSaving(true);
    try {
      if (editing) {
        const { code: _code, type: _type, ...update } = data;
        void _code; void _type;
        await updatePromotion(editing.id, { ...update, active: form.active });
      } else {
        await createPromotion(data);
      }
      toast.show(editing ? 'Đã cập nhật mã giảm giá' : 'Đã tạo mã giảm giá');
      setEditing(undefined); reload();
    } catch (err) { setFormError(errorMessage(err)); }
    finally { setSaving(false); }
  }
  async function toggle(p: AdminPromotion) {
    try {
      await updatePromotion(p.id, { active: !p.active });
      toast.show(p.active ? 'Đã tắt mã giảm giá' : 'Đã bật mã giảm giá');
      reload();
    } catch (err) { toast.show(errorMessage(err)); }
  }

  return <div className="space-y-5">
    <PageHeader title="Quản lý mã giảm giá"
      subtitle="Tạo ưu đãi đúng lúc. Gắn kết khách hàng qua từng tách cà phê."
      action={<button type="button" onClick={openCreate} className={`${btnPrimary} inline-flex items-center gap-2`}>
        <PlusIcon size={16} /> Thêm mã giảm giá
      </button>} />
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard label="Tổng mã" value={String(total).padStart(2, '0')} hint="Tất cả chương trình ưu đãi" />
      <StatCard label="Đang hoạt động" value={String(activeCount).padStart(2, '0')} hint="Sẵn sàng cho đơn hàng mới" />
      <StatCard label="Hết hạn" value={String(expiredCount).padStart(2, '0')} hint="Đã kết thúc thời gian áp dụng" />
      <StatCard label="Tổng lượt sử dụng" value={usageCount.toLocaleString('vi-VN')} hint="Lượt sử dụng đã ghi nhận" />
    </div>
    <section className="overflow-hidden rounded-2xl border border-[#CBD7C8] bg-white shadow-[0_12px_32px_rgba(47,74,58,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <h2 className="text-lg font-extrabold text-[#2F4A3A]">Danh sách mã giảm giá <span className="ml-1 rounded-full bg-[#E5EDE2] px-2 py-1 text-xs">{total} mã</span></h2>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Tìm theo mã giảm giá..." />
          <select aria-label="Lọc trạng thái" className={`${filterBase} px-3`} value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
      </div>
      {loading ? <TableSkeleton rows={8} /> : loadError ? <div className="p-6"><ErrorBox>{loadError}</ErrorBox><button className={`${btnOutline} mt-3`} onClick={reload}>Thử lại</button></div>
        : filtered.length === 0 ? <div className="p-12 text-center text-[#617466]">Không tìm thấy mã giảm giá. <button className="underline" onClick={() => { setSearch(''); setFilter(''); }}>Đặt lại bộ lọc</button></div>
        : <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-[#E8F0E5] text-xs font-bold text-[#526B59]"><tr>
                {['Mã giảm giá','Loại giảm','Giá trị','Đơn tối thiểu','Thời gian áp dụng','Lượt sử dụng','Trạng thái','Thao tác'].map((h) => <th key={h} className="px-4 py-4">{h}</th>)}
              </tr></thead>
              <tbody>{rows.map((p) => <tr key={p.id} className="border-t border-[#E8EEE5] transition-colors hover:bg-[#F3F8F0]">
                <td className="px-4 py-4 font-extrabold">{p.code}</td>
                <td className="px-4 py-4">{p.type === 'PERCENT' ? 'Phần trăm' : 'Cố định'}</td>
                <td className="px-4 py-4 font-bold">{p.type === 'PERCENT' ? `${p.discount}%` : formatVnd(p.discount)}</td>
                <td className="px-4 py-4">{formatVnd(p.minOrder)}</td>
                <td className="px-4 py-4 text-xs">{formatDate(p.startAt)} – {formatDate(p.expiredAt)}</td>
                <td className="px-4 py-4"><span>{p.usedCount} / {p.usageLimit ?? '∞'}</span><div className="mt-1 h-1.5 w-20 rounded-full bg-[#E9EEE7]"><div className="h-full rounded-full bg-[#7C9D70]" style={{ width: `${p.usageLimit ? Math.min(100, p.usedCount / p.usageLimit * 100) : 0}%` }} /></div></td>
                <td className="px-4 py-4"><Badge dot tone={statusTones[statusOf(p)]}>{statusLabels[statusOf(p)]}</Badge></td>
                <td className="px-4 py-4"><div className="flex items-center gap-2">
                  <button aria-label={`Sửa ${p.code}`} title="Chỉnh sửa" onClick={() => openEdit(p)} className="rounded-lg p-2 hover:bg-[#E5EDE2]"><PencilIcon size={16} /></button>
                  <button aria-label={`${p.active ? 'Tắt' : 'Bật'} ${p.code}`} title={p.active ? 'Tắt mã' : 'Bật mã'} onClick={() => void toggle(p)} className={`relative h-6 w-11 rounded-full transition ${p.active ? 'bg-[#507A50]' : 'bg-[#CDD4C9]'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${p.active ? 'left-6' : 'left-1'}`} /></button>
                </div></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="space-y-3 bg-[#F3EAD8] p-3 md:hidden">{rows.map((p) => <div key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2"><strong>{p.code}</strong><Badge tone={statusTones[statusOf(p)]}>{statusLabels[statusOf(p)]}</Badge></div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-[#617466]">Giá trị giảm</p><strong>{p.type === 'PERCENT' ? `${p.discount}%` : formatVnd(p.discount)}</strong></div><div><p className="text-xs text-[#617466]">Đơn tối thiểu</p><strong>{formatVnd(p.minOrder)}</strong></div></div>
            <p className="mt-3 text-xs text-[#617466]">{formatDate(p.startAt)} – {formatDate(p.expiredAt)} · Đã dùng {p.usedCount}/{p.usageLimit ?? '∞'}</p>
            <div className="mt-3 flex gap-2 border-t pt-3"><button className={btnOutline} onClick={() => openEdit(p)}>Chỉnh sửa</button><button className={btnOutline} onClick={() => void toggle(p)}>{p.active ? 'Tắt mã' : 'Bật mã'}</button></div>
          </div>)}</div>
          <Pagination page={currentPage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} noun="mã giảm giá" onChange={setPage} />
        </>}
    </section>

    {editing !== undefined && <Modal onClose={() => !saving && setEditing(undefined)} width={590}>
      <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-extrabold">{editing ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá'}</h2><p className="mt-1 text-xs text-[#617466]">{editing ? `Cập nhật ưu đãi ${editing.code}` : 'Một ưu đãi mới, thêm một lý do để quay lại.'}</p></div><button type="button" aria-label="Đóng" onClick={() => setEditing(undefined)}>✕</button></div>
      <form className="space-y-4" onSubmit={(e) => void submit(e)} noValidate>
        <Field label="Mã giảm giá *" error={errors.code}><input className={fieldClass(!!errors.code)} value={form.code} disabled={!!editing} onChange={(e) => setField('code', e.target.value.toUpperCase())} placeholder="SUMMER20" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Loại giảm giá *"><select className={fieldClass()} disabled={!!editing} value={form.type} onChange={(e) => setField('type', e.target.value as FormState['type'])}><option value="PERCENT">Phần trăm (%)</option><option value="FIXED">Cố định (VNĐ)</option></select></Field>
          <Field label="Giá trị giảm *" error={errors.discount}><input type="number" min="1" step="1" className={fieldClass(!!errors.discount)} value={form.discount} onChange={(e) => setField('discount', e.target.value)} /></Field>
          <Field label="Đơn hàng tối thiểu" error={errors.minOrder}><input type="number" min="0" step="1" className={fieldClass(!!errors.minOrder)} value={form.minOrder} onChange={(e) => setField('minOrder', e.target.value)} /></Field>
          <Field label="Giới hạn lượt sử dụng" error={errors.usageLimit}><input type="number" min="1" step="1" placeholder="Không giới hạn" className={fieldClass(!!errors.usageLimit)} value={form.usageLimit} onChange={(e) => setField('usageLimit', e.target.value)} /></Field>
          <Field label="Ngày bắt đầu"><input type="datetime-local" className={fieldClass()} value={form.startAt} onChange={(e) => setField('startAt', e.target.value)} /></Field>
          <Field label="Ngày kết thúc" error={errors.expiredAt}><input type="datetime-local" className={fieldClass(!!errors.expiredAt)} value={form.expiredAt} onChange={(e) => setField('expiredAt', e.target.value)} /></Field>
        </div>
        {editing && <label className="flex items-center gap-3 rounded-xl bg-[#F3F7F0] p-3 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setField('active', e.target.checked)} /> Mã đang hoạt động</label>}
        <p className="rounded-xl bg-[#F3F7F0] p-3 text-xs text-[#617466]">Để trống thời gian hoặc giới hạn nếu không muốn áp dụng ràng buộc đó. Mã và loại giảm giá không thể sửa sau khi tạo.</p>
        {formError && <ErrorBox>{formError}</ErrorBox>}
        <div className="flex justify-end gap-3 border-t pt-4"><button type="button" disabled={saving} className={btnOutline} onClick={() => setEditing(undefined)}>Hủy</button><button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo mã'}</button></div>
      </form>
    </Modal>}

    <Toast message={toast.message} />
  </div>;
}
