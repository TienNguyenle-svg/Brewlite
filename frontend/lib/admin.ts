// frontend/lib/admin.ts
// Lớp gọi API cho khu vực Admin, viết theo mẫu lib/barista.ts.
// Dùng chung ApiError và TOKEN_KEY của lib/api.ts, và clearSession của lib/auth.ts.
import { ApiError, TOKEN_KEY } from './api';
import { API_URL, clearSession } from './auth';

export type Ingredient = {
  id: string;
  name: string;
  stock: number;
  unit: string;
};

export type Topping = {
  id: string;
  name: string;
  price: number;
  stock: number;
  productId: string | null;
};

export type Recipe = {
  id: string;
  productId: string;
  ingredientId: string;
  amount: number;
  ingredient: Ingredient;
};

// GET /products (công khai) — có thêm isAvailable do backend tính từ tồn kho nguyên liệu
export type AdminProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
  soldCount: number;
  isAvailable: boolean;
  recipes: Recipe[];
};

export type ProductPayload = {
  name: string;
  price: number;
  imageUrl?: string;
  category?: string; // backend chưa khai báo field này, cần thử xem có lưu không
  recipes?: { ingredientId: string; amount: number }[];
};

// Sửa sản phẩm: không sửa được công thức. Backend khai báo tên, giá, ảnh,
// còn category chưa khai báo nhưng service truyền thẳng body vào Prisma nên nhiều khả năng vẫn lưu được.
export type ProductUpdatePayload = {
  name?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
};

export type Inventory = {
  ingredients: Ingredient[];
  toppings: Topping[];
};

export type AdminOrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export type AdminOrder = {
  id: string;
  status: AdminOrderStatus;
  total: number;
  shippingFee: number;
  discountAmount: number;
  pointsUsed: number;
  pointsDiscount: number;
  createdAt: string;
  receiverName: string | null;
  receiverPhone: string | null;
  deliveryAddress: string | null;
  items: {
    id: string;
    size: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    product: { name: string };
    toppings: { id: string; price: number; topping: { name: string } }[];
  }[];
  payments: { status: string; method: string; amount: number }[];
};

export type RevenueReport = {
  totalRevenue: number;
  totalOrders: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    // 401: token hết hạn (1 ngày) hoặc đã bị vô hiệu → về trang đăng nhập
    if (res.status === 401 && typeof window !== 'undefined') {
      clearSession();
      window.location.href = '/login';
    }

    let message = 'Đã có lỗi xảy ra, vui lòng thử lại';
    try {
      const body = await res.json();
      message = Array.isArray(body.message)
        ? body.message.join(', ')
        : (body.message ?? message);
    } catch {}
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

// ===== SẢN PHẨM =====
/** GET /products — công khai, dùng để liệt kê trong bảng admin */
export const fetchProducts = (sort = 'name_asc') =>
  request<AdminProduct[]>(`/products?sort=${sort}`);

/** POST /admin/products — thêm sản phẩm kèm công thức */
export const createProduct = (data: ProductPayload) =>
  request<AdminProduct>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });

/** PATCH /admin/products/:id */
export const updateProduct = (id: string, data: ProductUpdatePayload) =>
  request<AdminProduct>(`/admin/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

/** DELETE /admin/products/:id — có thể lỗi nếu món đã nằm trong đơn, công thức hoặc topping */
export const deleteProduct = (id: string) =>
  request<AdminProduct>(`/admin/products/${id}`, { method: 'DELETE' });

// ===== KHO =====
/** GET /admin/inventory */
export const fetchInventory = () => request<Inventory>('/admin/inventory');

export const createIngredient = (data: {
  name: string;
  stock: number;
  unit: string;
}) =>
  request<Ingredient>('/admin/ingredients', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const importIngredient = (id: string, amount: number) =>
  request<Ingredient>(`/admin/ingredients/${id}/import`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });

export const createTopping = (data: {
  name: string;
  price: number;
  stock: number;
}) =>
  request<Topping>('/admin/toppings', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const importTopping = (id: string, amount: number) =>
  request<Topping>(`/admin/toppings/${id}/import`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });

// ===== ĐƠN HÀNG & BÁO CÁO (chỉ xem) =====
/** GET /admin/orders — tất cả đơn, mới nhất trước, chưa phân trang */
export const fetchOrders = () => request<AdminOrder[]>('/admin/orders');

/** GET /admin/reports/revenue — chỉ tính đơn COMPLETED */
export const fetchRevenue = () =>
  request<RevenueReport>('/admin/reports/revenue');

// ===== ĐĂNG XUẤT =====
/** POST /auth/logout — tăng tokenVersion ở server, rồi mới xóa token ở trình duyệt */
export async function logout() {
  try {
    await request<{ message: string }>('/auth/logout', { method: 'POST' });
  } catch {
    // dù server lỗi vẫn cho thoát ở phía trình duyệt
  } finally {
    clearSession();
  }
}

// ===== TIỆN ÍCH HIỂN THỊ =====
export const formatVnd = (n: number) => `${n.toLocaleString('vi-VN')} ₫`;

/** Số thường, tối đa 2 chữ số thập phân (18,5) */
export const formatNumber = (n: number) =>
  n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });

/** "14:30 - 07/11/2026" */
export const formatClock = (d: Date) =>
  `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${d.toLocaleDateString(
    'vi-VN',
    { day: '2-digit', month: '2-digit', year: 'numeric' },
  )}`;

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Mã đơn rút gọn để hiển thị (tạm thời, sau này có thể dùng formatOrderCode có sẵn) */
export const shortOrderCode = (id: string) => `#${id.slice(0, 6).toUpperCase()}`;