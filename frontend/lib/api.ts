import type { ApiProduct, ApiTopping, Product } from "./types";

// Hàm tự động chọn URL phù hợp với môi trường
const getApiUrl = () => {
  // Ưu tiên lấy biến NEXT_PUBLIC_API_URL (dùng chung cho cả Server và Browser trên Render)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Fallback cho môi trường Docker trên máy local (nếu có biến API_URL_INTERNAL)
  if (typeof window === "undefined" && process.env.API_URL_INTERNAL) {
    return process.env.API_URL_INTERNAL;
  }

  // Mặc định cho máy local
  return "http://localhost:3001";
};

const API_URL = getApiUrl().replace(/\/+$/, "");
export const TOKEN_KEY = "accessToken";
export const PENDING_PAYMENT_ORDER_KEY = "brewlite-pending-payment-order";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type CreateOrderInput = {
  items: Array<{
    productId: string;
    size: "S" | "M" | "L";
    qty: number;
    toppingIds: string[];
  }>;
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
};

export type OrderReceipt = {
  id: string;
  status: string;
  total: number;
};

export type CustomerOrder = {
  id: string;
  status:
    | "PENDING"
    | "PAID"
    | "PAYMENT_FAILED"
    | "PREPARING"
    | "READY"
    | "COMPLETED"
    | "CANCELLED";
  createdAt: string;
  total: number;
  items: Array<{
    id: string;
    size: string;
    qty: number;
    lineTotal: number;
    productId: string;
    toppings: Array<{
      id: string;
      orderItemId: string;
      toppingId: string;
      price: number;
    }>;
  }>;
};

export type CreatePaymentInput = {
  orderId: string;
};

export type PaymentReceipt = {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  expiresAt?: string;
  paymentUrl: string | null;
};

export const getAccessToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Không thể kết nối máy chủ. Vui lòng kiểm tra backend và thử lại.",
      0,
    );
  }

  if (!response.ok) {
    const body = await response.text();
    let message = body || response.statusText || "Đã có lỗi xảy ra";

    if (body) {
      try {
        const parsed: { message?: string | string[] } = JSON.parse(body);
        if (Array.isArray(parsed.message)) {
          message = parsed.message.join(", ");
        } else if (parsed.message) {
          message = parsed.message;
        }
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
      }
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

type ProductResponse = Omit<Product, "imageUrl"> & {
  imageUrl: string | null;
  isAvailable?: boolean;
  toppings?: ApiTopping[];
};

function normalizeProduct(product: ProductResponse): ApiProduct {
  return {
    ...product,
    imageUrl: product.imageUrl ?? "/window.svg",
  };
}

export async function getProducts(): Promise<ApiProduct[]> {
  const products = await request<ProductResponse[]>("/products");
  return products.map(normalizeProduct);
}

export async function getProduct(id: string): Promise<ApiProduct> {
  const product = await request<ProductResponse>(
    `/products/${encodeURIComponent(id)}`,
  );
  return normalizeProduct(product);
}

export const createOrder = (input: CreateOrderInput) =>
  request<OrderReceipt>("/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const getMyOrders = () => request<CustomerOrder[]>("/orders/me");

export const createPayment = (
  input: CreatePaymentInput,
  idempotencyKey: string,
) =>
  request<PaymentReceipt>("/payments", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(input),
  });