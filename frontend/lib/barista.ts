import { formatOrderCode } from './order-code';

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

/** GET /barista/orders?status=COMPLETED — đơn đã hoàn thành */
export const fetchHistory = () =>
  request<BaristaOrder[]>('/barista/orders?status=COMPLETED');

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
    badgeClass: 'bg-[#F3EAD8] text-[#2E1F14]',
    dotClass: 'bg-[#2F4A3A]',
    next: 'PREPARING',
    action: 'Bắt đầu pha chế',
    actionClass: 'bg-[#2F4A3A] hover:bg-[#263D2F]',
  },
  PREPARING: {
    column: 'Đang pha chế',
    badge: 'Đang pha',
    badgeClass: 'bg-[#2F4A3A] text-white',
    dotClass: 'bg-[#2F4A3A]',
    next: 'READY',
    action: 'Đã pha xong',
    actionClass: 'bg-[#2F4A3A] hover:bg-[#263D2F]',
  },
  READY: {
    column: 'Sẵn sàng giao',
    badge: 'Sẵn sàng',
    badgeClass: 'bg-[#E8EFEA] text-[#2F4A3A]',
    dotClass: 'bg-[#2F4A3A]',
    next: 'COMPLETED',
    action: 'Giao cho khách',
    actionClass: 'bg-[#2F4A3A] hover:bg-[#263D2F]',
  },
};

export const COLUMN_ORDER = ['PAID', 'PREPARING', 'READY'] as const;

export const LATE_AFTER_MINUTES = 10;

export const orderCode = (o: BaristaOrder) => formatOrderCode(o.id);

export const minutesSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
