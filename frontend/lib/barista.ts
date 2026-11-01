export type OrderStatus = 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED';
export type BaristaOrderStatus = Exclude<OrderStatus, 'PAID'>;

export type BaristaOrderItem = {
  id: string;
  qty: number;
  size?: string | null;
  note?: string | null;
  product: { id: string; name: string; imageUrl: string | null };
  toppings: { topping: { id: string; name: string } }[];
};

export type BaristaOrder = {
  id: string;
  code?: string | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string | null;
  user: { id: string; email: string };
  items: BaristaOrderItem[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const TOKEN_KEY = 'accessToken';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

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
    let message = 'Đã có lỗi xảy ra, vui lòng thử lại';
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? message;
    } catch {}
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

/** GET /barista/orders — đơn PAID, PREPARING, READY (cũ nhất trước) */
export const fetchOrders = () => request<BaristaOrder[]>('/barista/orders');

/** GET /barista/orders/history — đơn COMPLETED */
export const fetchHistory = () => request<BaristaOrder[]>('/barista/orders/history');

/** PATCH /barista/orders/:id — chỉ cho phép chuyển sang bước kế tiếp */
export const updateOrderStatus = (id: string, status: BaristaOrderStatus) =>
  request<BaristaOrder>(`/barista/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

type StatusConfig = {
  column: string;
  badge: string;
  badgeClass: string;
  dotClass: string;
  next: BaristaOrderStatus | null;
  action: string;
  actionClass: string;
};

export const STATUS_CONFIG: Record<Exclude<OrderStatus, 'COMPLETED'>, StatusConfig> = {
  PAID: {
    column: 'Đơn mới',
    badge: 'Đã thanh toán',
    badgeClass: 'bg-[#FAEAD7] text-[#B9672B]',
    dotClass: 'bg-[#B9672B]',
    next: 'PREPARING',
    action: 'Bắt đầu pha chế',
    actionClass: 'bg-[#39281F] hover:bg-[#2b1e17]',
  },
  PREPARING: {
    column: 'Đang pha chế',
    badge: 'Đang pha',
    badgeClass: 'bg-[#39281F] text-white',
    dotClass: 'bg-[#39281F]',
    next: 'READY',
    action: 'Đã pha xong',
    actionClass: 'bg-[#B9672B] hover:bg-[#a05a24]',
  },
  READY: {
    column: 'Sẵn sàng giao',
    badge: 'Sẵn sàng',
    badgeClass: 'bg-[#EAF2EC] text-[#41705A]',
    dotClass: 'bg-[#41705A]',
    next: 'COMPLETED',
    action: 'Giao cho khách',
    actionClass: 'bg-[#41705A] hover:bg-[#365d4a]',
  },
};

export const COLUMN_ORDER = ['PAID', 'PREPARING', 'READY'] as const;

export const LATE_AFTER_MINUTES = 10;

export const orderCode = (o: BaristaOrder) =>
  o.code ?? o.id.slice(-6).toUpperCase();

export const minutesSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
