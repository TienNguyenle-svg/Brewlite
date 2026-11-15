'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ApiError } from '../../../lib/api';
import {
  type Ingredient,
  type Topping,
  createIngredient,
  createTopping,
  fetchInventory,
  formatClock,
  formatNumber,
  formatVnd,
  importIngredient,
  importTopping,
} from '../../../lib/admin';
import {
  AlertIcon,
  ArrowRightIcon,
  Badge,
  BoxIcon,
  CheckCircleIcon,
  ErrorBox,
  Field,
  Modal,
  PageHeader,
  Pagination,
  PlusIcon,
  SearchInput,
  StatCard,
  TableSkeleton,
  Toast,
  btnOutline,
  btnPrimary,
  fieldClass,
  filterBase,
  useToast,
} from '../../../components/admin/ui';

const PAGE_SIZE = 8;
const GENERIC_ERROR = 'Đã có lỗi xảy ra, vui lòng thử lại';
const GRID =
  'grid grid-cols-[130px_minmax(0,1.6fr)_130px_130px_140px_120px] items-center gap-4 px-5';

type Tab = 'ingredients' | 'toppings';
type StockFilter = '' | 'ok' | 'out';

type Item = {
  id: string;
  code: string;
  name: string;
  unit: string; // chỉ nguyên liệu
  price: number | null; // chỉ topping
  stock: number;
};

type CreateForm = { name: string; stock: string; unit: string; price: string };
type CreateErrors = { name?: string; stock?: string; unit?: string; price?: string };

const EMPTY_CREATE: CreateForm = { name: '', stock: '', unit: 'gram', price: '' };
const pad = (n: number) => String(n).padStart(3, '0');
const pad2 = (n: number) => String(n).padStart(2, '0');
const toNumber = (s: string) => Number(s.trim().replace(',', '.'));

export default function AdminInventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [tab, setTab] = useState<Tab>('ingredients');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('');
  const [page, setPage] = useState(1);

  // Nhập thêm số lượng cho mục đã có
  const [importing, setImporting] = useState<Item | null>(null);
  const [importAmount, setImportAmount] = useState('');
  const [importError, setImportError] = useState('');
  const [importBusy, setImportBusy] = useState(false);

  // Thêm mới
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState<CreateErrors>({});
  const [createServerError, setCreateServerError] = useState('');
  const [createBusy, setCreateBusy] = useState(false);

  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    fetchInventory()
      .then((inv) => {
        if (cancelled) return;
        setIngredients(inv.ingredients);
        setToppings(inv.toppings);
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

  const isIngredients = tab === 'ingredients';
  const noun = isIngredients ? 'nguyên liệu' : 'topping';

  // Mã NL001 / TP001 đánh số theo thứ tự tên (backend chỉ có ID dạng UUID)
  const items = useMemo<Item[]>(
    () =>
      isIngredients
        ? ingredients.map((x, i) => ({
            id: x.id,
            code: `NL${pad(i + 1)}`,
            name: x.name,
            unit: x.unit,
            price: null,
            stock: x.stock,
          }))
        : toppings.map((x, i) => ({
            id: x.id,
            code: `TP${pad(i + 1)}`,
            name: x.name,
            unit: '',
            price: x.price,
            stock: x.stock,
          })),
    [isIngredients, ingredients, toppings],
  );

  // Backend không có ngưỡng "tối thiểu", nên chỉ phân biệt còn hàng / hết hàng
  const outItems = items.filter((i) => i.stock <= 0);
  const okCount = items.length - outItems.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!q || i.name.toLowerCase().includes(q)) &&
        (!stockFilter || (stockFilter === 'out' ? i.stock <= 0 : i.stock > 0)),
    );
  }, [items, search, stockFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function reload() {
    setReloadKey((k) => k + 1);
  }

  function switchTab(next: Tab) {
    setTab(next);
    setSearch('');
    setStockFilter('');
    setPage(1);
  }

  function openImport(item: Item) {
    setImportAmount('');
    setImportError('');
    setImporting(item);
  }

  function openCreate() {
    setCreateForm(EMPTY_CREATE);
    setCreateErrors({});
    setCreateServerError('');
    setCreating(true);
  }

  async function handleImport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!importing || importBusy) return;

    const target = importing;
    const n = toNumber(importAmount);
    const invalid =
      importAmount.trim() === '' ||
      !(n > 0) ||
      (!isIngredients && !Number.isInteger(n));
    if (invalid) {
      setImportError(
        isIngredients
          ? 'Số lượng nhập phải lớn hơn 0'
          : 'Số lượng nhập phải là số nguyên lớn hơn 0',
      );
      return;
    }

    setImportBusy(true);
    setImportError('');
    try {
      if (isIngredients) await importIngredient(target.id, n);
      else await importTopping(target.id, n);
      setImporting(null);
      toast.show(`Đã nhập thêm ${formatNumber(n)} cho "${target.name}"`);
      reload();
    } catch (err) {
      setImportError(err instanceof ApiError ? err.message : GENERIC_ERROR);
    } finally {
      setImportBusy(false);
    }
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (createBusy) return;

    const errs: CreateErrors = {};
    if (!createForm.name.trim()) errs.name = 'Vui lòng nhập tên';

    const stock = toNumber(createForm.stock);
    if (createForm.stock.trim() === '' || !(stock >= 0)) {
      errs.stock = 'Tồn kho ban đầu phải là số không âm';
    } else if (!isIngredients && !Number.isInteger(stock)) {
      errs.stock = 'Tồn kho topping phải là số nguyên';
    }

    if (isIngredients) {
      if (!createForm.unit.trim()) errs.unit = 'Vui lòng nhập đơn vị';
    } else {
      const price = Number(createForm.price);
      if (createForm.price.trim() === '' || !Number.isInteger(price) || price < 0) {
        errs.price = 'Giá phải là số nguyên không âm';
      }
    }

    setCreateErrors(errs);
    setCreateServerError('');
    if (Object.keys(errs).length > 0) return;

    setCreateBusy(true);
    try {
      if (isIngredients) {
        await createIngredient({
          name: createForm.name.trim(),
          stock,
          unit: createForm.unit.trim(),
        });
      } else {
        await createTopping({
          name: createForm.name.trim(),
          price: Number(createForm.price),
          stock,
        });
      }
      setCreating(false);
      toast.show(isIngredients ? 'Đã thêm nguyên liệu' : 'Đã thêm topping');
      reload();
    } catch (err) {
      setCreateServerError(err instanceof ApiError ? err.message : GENERIC_ERROR);
    } finally {
      setCreateBusy(false);
    }
  }

  const tabBtn = (active: boolean) =>
    `rounded-lg border px-4 py-2 text-sm transition-colors ${
      active
        ? 'border-[#39281F] bg-[#39281F] font-semibold text-white'
        : 'border-[#E7E1DA] bg-white text-[#39281F] hover:bg-[#F8F5F0]'
    }`;

  return (
    <div>
      <PageHeader
        title="Quản lý kho"
        subtitle="Theo dõi nguyên liệu để mỗi ngày vận hành luôn trọn vẹn."
        action={
          <button
            type="button"
            onClick={openCreate}
            className={`${btnPrimary} flex items-center gap-2`}
          >
            <PlusIcon size={14} />
            {isIngredients ? 'Nhập nguyên liệu' : 'Thêm topping'}
          </button>
        }
      />

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => switchTab('ingredients')}
          className={tabBtn(isIngredients)}
        >
          Nguyên liệu
        </button>
        <button
          type="button"
          onClick={() => switchTab('toppings')}
          className={tabBtn(!isIngredients)}
        >
          Topping
        </button>
      </div>

      {!loading && !loadError && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <StatCard
              label={`Tổng ${noun}`}
              value={pad2(items.length)}
              hint="Đang theo dõi trong kho"
              icon={<BoxIcon size={16} />}
            />
            <StatCard
              label="Đủ hàng"
              value={pad2(okCount)}
              hint="Sẵn sàng cho ngày mới"
              icon={<CheckCircleIcon size={16} />}
            />
            <StatCard
              label="Hết hàng"
              value={pad2(outItems.length)}
              hint="Cần bổ sung ngay"
              icon={<AlertIcon size={16} />}
            />
          </div>

          {outItems.length > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-[#FAEAD7] px-4 py-3 text-xs text-[#B9672B]">
              <span className="flex items-center gap-2">
                <AlertIcon size={14} />
                Có {outItems.length} {noun} đã hết:{' '}
                {outItems
                  .slice(0, 3)
                  .map((i) => i.name)
                  .join(', ')}
                {outItems.length > 3 ? '...' : ''}.
              </span>
              <button
                type="button"
                onClick={() => {
                  setStockFilter('out');
                  setPage(1);
                }}
                className="flex items-center gap-1.5 font-semibold hover:underline"
              >
                Xem cảnh báo
                <ArrowRightIcon size={13} />
              </button>
            </div>
          )}
        </>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder={`Tìm theo ${noun}`}
        />
        <select
          value={stockFilter}
          onChange={(e) => {
            setStockFilter(e.target.value as StockFilter);
            setPage(1);
          }}
          className={`${filterBase} px-3.5`}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ok">Đủ hàng</option>
          <option value="out">Hết hàng</option>
        </select>
        {updatedAt && (
          <span className="ml-auto text-xs text-[#82776E]">
            Cập nhật lúc {formatClock(updatedAt)}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E7E1DA] bg-white">
        <div
          className={`${GRID} border-b border-[#E7E1DA] bg-[#FBF8F4] py-3 text-xs text-[#82776E]`}
        >
          <span>{isIngredients ? 'Mã nguyên liệu' : 'Mã topping'}</span>
          <span>{isIngredients ? 'Tên nguyên liệu' : 'Tên topping'}</span>
          <span>{isIngredients ? 'Đơn vị' : 'Giá'}</span>
          <span>Tồn hiện tại</span>
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
                reload();
              }}
              className={btnOutline}
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-[#82776E]">
            {items.length === 0
              ? `Chưa có ${noun} nào trong kho.`
              : `Không có ${noun} khớp với bộ lọc.`}
          </div>
        )}

        {!loading &&
          !loadError &&
          rows.map((item) => {
            const out = item.stock <= 0;
            return (
              <div
                key={item.id}
                className={`${GRID} border-b border-[#F1ECE5] py-3 text-sm transition-colors hover:bg-[#FBF8F4]`}
              >
                <span className="text-xs text-[#82776E]">{item.code}</span>
                <span className="truncate font-medium">{item.name}</span>
                <span>{isIngredients ? item.unit : formatVnd(item.price ?? 0)}</span>
                <span className={`font-semibold ${out ? 'text-[#C0443B]' : ''}`}>
                  {formatNumber(item.stock)}
                </span>
                <span>
                  <Badge tone={out ? 'danger' : 'success'} dot>
                    {out ? 'Hết hàng' : 'Đủ hàng'}
                  </Badge>
                </span>
                <span>
                  <button
                    type="button"
                    onClick={() => openImport(item)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#B9672B] hover:underline"
                  >
                    Nhập kho
                    <PlusIcon size={12} />
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
            noun={noun}
            onChange={setPage}
          />
        )}
      </div>

      {/* ===== Modal nhập thêm số lượng ===== */}
      {importing && (
        <Modal width={400} onClose={() => !importBusy && setImporting(null)}>
          <h2 className="mb-1 text-lg font-semibold">Nhập kho</h2>
          <p className="mb-4 text-sm text-[#82776E]">
            {importing.name} · tồn hiện tại {formatNumber(importing.stock)}
            {isIngredients ? ` ${importing.unit}` : ''}
          </p>
          <form onSubmit={handleImport} noValidate className="space-y-4">
            <Field label="Số lượng nhập thêm">
              <input
                autoFocus
                inputMode="decimal"
                value={importAmount}
                onChange={(e) => setImportAmount(e.target.value)}
                className={fieldClass(!!importError)}
              />
            </Field>
            {importError && <ErrorBox>{importError}</ErrorBox>}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={importBusy}
                onClick={() => setImporting(null)}
                className={btnOutline}
              >
                Hủy
              </button>
              <button type="submit" disabled={importBusy} className={btnPrimary}>
                {importBusy ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===== Modal thêm mới ===== */}
      {creating && (
        <Modal width={440} onClose={() => !createBusy && setCreating(false)}>
          <h2 className="mb-5 text-lg font-semibold">
            {isIngredients ? 'Thêm nguyên liệu mới' : 'Thêm topping mới'}
          </h2>
          <form onSubmit={handleCreate} noValidate className="space-y-4">
            <Field label="Tên" error={createErrors.name}>
              <input
                autoFocus
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className={fieldClass(!!createErrors.name)}
              />
            </Field>

            {isIngredients ? (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tồn kho ban đầu" error={createErrors.stock}>
                  <input
                    inputMode="decimal"
                    value={createForm.stock}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, stock: e.target.value })
                    }
                    className={fieldClass(!!createErrors.stock)}
                  />
                </Field>
                <Field label="Đơn vị" error={createErrors.unit}>
                  <input
                    value={createForm.unit}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, unit: e.target.value })
                    }
                    placeholder="gram, ml, quả..."
                    className={fieldClass(!!createErrors.unit)}
                  />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Giá (VNĐ)" error={createErrors.price}>
                  <input
                    inputMode="numeric"
                    value={createForm.price}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, price: e.target.value })
                    }
                    className={fieldClass(!!createErrors.price)}
                  />
                </Field>
                <Field label="Tồn kho ban đầu" error={createErrors.stock}>
                  <input
                    inputMode="numeric"
                    value={createForm.stock}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, stock: e.target.value })
                    }
                    className={fieldClass(!!createErrors.stock)}
                  />
                </Field>
              </div>
            )}

            {createServerError && <ErrorBox>{createServerError}</ErrorBox>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={createBusy}
                onClick={() => setCreating(false)}
                className={btnOutline}
              >
                Hủy
              </button>
              <button type="submit" disabled={createBusy} className={btnPrimary}>
                {createBusy ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <Toast message={toast.message} />
    </div>
  );
}