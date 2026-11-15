'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ApiError } from '../../../lib/api';
import {
  type AdminProduct,
  type Ingredient,
  createProduct,
  deleteProduct,
  fetchInventory,
  fetchProducts,
  formatVnd,
  updateProduct,
} from '../../../lib/admin';
import {
  Badge,
  CupIcon,
  ErrorBox,
  Field,
  LeafIcon,
  Modal,
  PageHeader,
  Pagination,
  PencilIcon,
  PlusIcon,
  SearchInput,
  TableSkeleton,
  Toast,
  TrashIcon,
  btnDanger,
  btnOutline,
  btnPrimary,
  fieldClass,
  filterBase,
  useToast,
} from '../../../components/admin/ui';

const PAGE_SIZE = 8;
const GENERIC_ERROR = 'Đã có lỗi xảy ra, vui lòng thử lại';
const DELETE_BLOCKED =
  'Không thể xóa: sản phẩm đang được dùng trong đơn hàng, công thức hoặc topping.';

const GRID =
  'grid grid-cols-[110px_minmax(0,1.7fr)_160px_130px_140px_110px] items-center gap-4 px-5';

type RecipeRow = { ingredientId: string; amount: string };
type FormState = {
  name: string;
  price: string;
  imageUrl: string;
  category: string;
  recipes: RecipeRow[];
};
type FormErrors = { name?: string; price?: string; recipes?: string };

const EMPTY_FORM: FormState = {
  name: '',
  price: '',
  imageUrl: '',
  category: '',
  recipes: [],
};

function validate(form: FormState, isEdit: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Vui lòng nhập tên sản phẩm';

  const price = Number(form.price);
  if (form.price.trim() === '' || !Number.isInteger(price) || price < 0) {
    errors.price = 'Giá phải là số nguyên không âm';
  }

  // Backend chỉ nhận công thức khi tạo mới
  if (!isEdit) {
    const bad = form.recipes.some(
      (r) => !r.ingredientId || !(Number(r.amount.replace(',', '.')) > 0),
    );
    const ids = form.recipes.map((r) => r.ingredientId);
    if (bad) {
      errors.recipes =
        'Mỗi dòng công thức cần chọn nguyên liệu và định lượng lớn hơn 0';
    } else if (new Set(ids).size !== ids.length) {
      errors.recipes = 'Mỗi nguyên liệu chỉ nên xuất hiện một lần';
    }
  }
  return errors;
}

// Ô icon vuông; nếu sản phẩm có ảnh thì phủ ảnh lên trên (lỗi ảnh thì hiện lại icon)
function Tile({ src, tea, size }: { src: string | null; tea: boolean; size: number }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#F4EDE3] text-[#B9672B]"
      style={{ width: size, height: size }}
    >
      {tea ? <LeafIcon size={16} /> : <CupIcon size={16} />}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
    </div>
  );
}

const isTea = (category: string) => /trà/i.test(category);

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // modal: null = đóng; { product: null } = thêm mới; { product } = sửa
  const [modal, setModal] = useState<{ product: AdminProduct | null } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);

  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProducts(), fetchInventory()])
      .then(([prods, inv]) => {
        if (cancelled) return;
        setProducts(prods);
        setIngredients(inv.ingredients);
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

  // Mã SP001, SP002... đánh số theo thứ tự tên (backend chỉ có ID dạng UUID)
  const codeById = useMemo(
    () =>
      new Map(
        products.map((p, i) => [p.id, `SP${String(i + 1).padStart(3, '0')}`] as const),
      ),
    [products],
  );

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products],
  );

  const availableCount = products.filter((p) => p.isAvailable).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q)) &&
        (!categoryFilter || p.category === categoryFilter) &&
        (!statusFilter ||
          (statusFilter === 'available' ? p.isAvailable : !p.isAvailable)),
    );
  }, [products, search, categoryFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function reload() {
    setReloadKey((k) => k + 1);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrors({});
    setServerError('');
    setModal({ product: null });
  }

  function openEdit(p: AdminProduct) {
    setForm({
      name: p.name,
      price: String(p.price),
      imageUrl: p.imageUrl ?? '',
      category: p.category,
      recipes: [],
    });
    setErrors({});
    setServerError('');
    setModal({ product: p });
  }

  function setRecipe(i: number, patch: Partial<RecipeRow>) {
    setForm((f) => ({
      ...f,
      recipes: f.recipes.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !modal) return;

    const isEdit = !!modal.product;
    const errs = validate(form, isEdit);
    setErrors(errs);
    setServerError('');
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const base = {
        name: form.name.trim(),
        price: Number(form.price),
        imageUrl: form.imageUrl.trim() || undefined,
        category: form.category.trim() || undefined,
      };
      if (modal.product) {
        await updateProduct(modal.product.id, base);
      } else {
        await createProduct({
          ...base,
          recipes: form.recipes.map((r) => ({
            ingredientId: r.ingredientId,
            amount: Number(r.amount.replace(',', '.')),
          })),
        });
      }
      setModal(null);
      toast.show(isEdit ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
      reload();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : GENERIC_ERROR);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await deleteProduct(deleting.id);
      setDeleting(null);
      toast.show('Đã xóa sản phẩm');
      reload();
    } catch (err) {
      // Backend chưa bắt lỗi khóa ngoại nên món đang được dùng sẽ trả lỗi 500
      setDeleteError(
        err instanceof ApiError && err.status !== 500 ? err.message : DELETE_BLOCKED,
      );
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Quản lý sản phẩm"
        subtitle="Chăm chút từng thức uống, giữ trọn hương vị BrewLite."
        action={
          <button
            type="button"
            onClick={openCreate}
            className={`${btnPrimary} flex items-center gap-2`}
          >
            <PlusIcon size={14} />
            Thêm sản phẩm
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Tìm theo tên sản phẩm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className={`${filterBase} px-3.5`}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className={`${filterBase} px-3.5`}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="available">Còn hàng</option>
          <option value="soldout">Hết hàng</option>
        </select>
        <span className="ml-auto text-xs text-[#82776E]">
          {products.length} sản phẩm · {availableCount} còn hàng
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E7E1DA] bg-white">
        <div
          className={`${GRID} border-b border-[#E7E1DA] bg-[#FBF8F4] py-3 text-xs text-[#82776E]`}
        >
          <span>Mã sản phẩm</span>
          <span>Tên sản phẩm</span>
          <span>Danh mục</span>
          <span>Giá bán</span>
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
            {products.length === 0
              ? 'Chưa có sản phẩm nào. Bấm "Thêm sản phẩm" để bắt đầu.'
              : 'Không có sản phẩm khớp với bộ lọc.'}
          </div>
        )}

        {!loading &&
          !loadError &&
          rows.map((p) => {
            const subtitle = p.recipes.map((r) => r.ingredient.name).join(', ');
            return (
              <div
                key={p.id}
                className={`${GRID} border-b border-[#F1ECE5] py-3 text-sm transition-colors hover:bg-[#FBF8F4]`}
              >
                <span className="text-xs text-[#82776E]">{codeById.get(p.id)}</span>
                <div className="flex min-w-0 items-center gap-3">
                  <Tile src={p.imageUrl} tea={isTea(p.category)} size={36} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="truncate text-xs text-[#82776E]">
                      {subtitle || 'Chưa có công thức'}
                    </p>
                  </div>
                </div>
                <span>
                  <Badge tone="neutral">{p.category}</Badge>
                </span>
                <span className="font-medium">{formatVnd(p.price)}</span>
                <span>
                  <Badge tone={p.isAvailable ? 'success' : 'danger'} dot>
                    {p.isAvailable ? 'Còn hàng' : 'Hết hàng'}
                  </Badge>
                </span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Sửa ${p.name}`}
                    onClick={() => openEdit(p)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E1DA] bg-white text-[#B9672B] hover:bg-[#F8F5F0]"
                  >
                    <PencilIcon size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Xóa ${p.name}`}
                    onClick={() => {
                      setDeleteError('');
                      setDeleting(p);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C0443B] text-white hover:bg-[#a93a32]"
                  >
                    <TrashIcon size={14} />
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
            noun="sản phẩm"
            onChange={setPage}
          />
        )}
      </div>

      {/* ===== Modal thêm / sửa ===== */}
      {modal && (
        <Modal onClose={() => !saving && setModal(null)}>
          <h2 className="mb-5 text-xl font-semibold">
            {modal.product ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
          </h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field label="Tên sản phẩm" error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={fieldClass(!!errors.name)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Giá (VNĐ)" error={errors.price}>
                <input
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={fieldClass(!!errors.price)}
                />
              </Field>
              <Field label="Danh mục">
                <input
                  list="category-list"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Để trống = Khác"
                  className={fieldClass()}
                />
                <datalist id="category-list">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
            </div>

            <Field label="Đường dẫn ảnh">
              <div className="flex items-center gap-3">
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/images/ca-phe-trung.jpg"
                  className={fieldClass()}
                />
                <Tile
                  src={form.imageUrl.trim() || null}
                  tea={isTea(form.category)}
                  size={44}
                />
              </div>
            </Field>

            <div>
              <p className="mb-1.5 text-xs font-medium">Công thức</p>
              {modal.product ? (
                <div className="rounded-xl border border-[#E7E1DA] bg-[#F8F5F0] p-3 text-xs text-[#82776E]">
                  {modal.product.recipes.length === 0 ? (
                    <p>Sản phẩm chưa có công thức.</p>
                  ) : (
                    <ul className="mb-2 space-y-1 text-[#39281F]">
                      {modal.product.recipes.map((r) => (
                        <li key={r.id}>
                          {r.ingredient.name}: {r.amount} {r.ingredient.unit}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p>Hiện chưa hỗ trợ sửa công thức của sản phẩm đã tạo.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {form.recipes.map((r, i) => {
                    const unit = ingredients.find((x) => x.id === r.ingredientId)?.unit;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <select
                          value={r.ingredientId}
                          onChange={(e) => setRecipe(i, { ingredientId: e.target.value })}
                          className={fieldClass()}
                        >
                          <option value="">Chọn nguyên liệu</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>
                        <input
                          inputMode="decimal"
                          value={r.amount}
                          onChange={(e) => setRecipe(i, { amount: e.target.value })}
                          placeholder="Định lượng"
                          className={`${fieldClass()} max-w-[130px]`}
                        />
                        <span className="w-10 text-xs text-[#82776E]">{unit ?? ''}</span>
                        <button
                          type="button"
                          aria-label="Xóa dòng"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              recipes: f.recipes.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="text-lg leading-none text-[#C0443B]"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        recipes: [...f.recipes, { ingredientId: '', amount: '' }],
                      }))
                    }
                    className="text-xs font-medium text-[#B9672B] hover:underline"
                  >
                    + Thêm nguyên liệu
                  </button>
                  {errors.recipes && (
                    <p className="text-xs text-[#D6574F]">{errors.recipes}</p>
                  )}
                </div>
              )}
            </div>

            {serverError && <ErrorBox>{serverError}</ErrorBox>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setModal(null)}
                className={btnOutline}
              >
                Hủy
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===== Hộp thoại xác nhận xóa ===== */}
      {deleting && (
        <Modal width={400} onClose={() => !deleteBusy && setDeleting(null)}>
          <h2 className="mb-2 text-lg font-semibold">Xóa sản phẩm?</h2>
          <p className="mb-4 text-sm text-[#82776E]">
            Bạn có chắc muốn xóa &quot;{deleting.name}&quot;? Thao tác này không thể hoàn tác.
          </p>
          {deleteError && (
            <div className="mb-4">
              <ErrorBox>{deleteError}</ErrorBox>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={deleteBusy}
              onClick={() => setDeleting(null)}
              className={btnOutline}
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={deleteBusy}
              onClick={handleDelete}
              className={btnDanger}
            >
              {deleteBusy ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </Modal>
      )}

      <Toast message={toast.message} />
    </div>
  );
}