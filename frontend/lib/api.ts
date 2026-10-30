import type { Product } from "./types";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/+$/, "");
export const TOKEN_KEY = "accessToken";

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
  }>;
};

export type OrderReceipt = {
  id: string;
  status: string;
  total: number;
};

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
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

export const getProducts = () => request<Product[]>("/products");

export const createOrder = (input: CreateOrderInput) =>
  request<OrderReceipt>("/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
