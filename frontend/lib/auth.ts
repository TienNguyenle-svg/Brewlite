// Dùng chung ApiError và khóa token ("accessToken") với lib/api.ts của nhóm,
// để các trang khác (giỏ hàng, đơn hàng, barista) tự nhận token sau khi đăng nhập.
import { ApiError, TOKEN_KEY } from "./api";

export { ApiError };

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type Role = "CUSTOMER" | "BARISTA" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  loyaltyPoints: number;
}

interface LoginResponse {
  message: string;
  accessToken: string;
  tokenType: string;
  user: AuthUser;
}

const USER_KEY = "brewlite_user";

// Trang đích sau khi đăng nhập, theo role.
// CUSTOMER: sửa lại cho đúng đường dẫn trang Menu của nhóm nếu không phải "/".
export const ROLE_HOME: Record<Role, string> = {
  CUSTOMER: "/",
  BARISTA: "/barista",
  ADMIN: "/admin",
};

// NestJS trả message dạng chuỗi (401, 409) hoặc mảng tiếng Anh (400 do ValidationPipe)
function readMessage(body: unknown, fallback: string): string {
  const m = (body as { message?: string | string[] } | null)?.message;
  if (typeof m === "string") return m;
  if (Array.isArray(m) && m.length > 0) return m[0];
  return fallback;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new ApiError(
      "Không kết nối được máy chủ, vui lòng thử lại",
      0,
    );
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    // 400 là lỗi tiếng Anh của backend, form đã tự kiểm tra nên chỉ hiện câu chung
    const message =
      res.status === 400
        ? "Thông tin đăng nhập không hợp lệ."
        : readMessage(body, "Đăng nhập thất bại, vui lòng thử lại.");
    throw new ApiError(message, res.status);
  }

  return body as LoginResponse;
}

export async function register(email: string, password: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new ApiError("Không kết nối được máy chủ, vui lòng thử lại", 0);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    // 409: "Email đã được sử dụng" (hiện dưới ô email). 400 là lỗi tiếng Anh của backend.
    const message =
      res.status === 400
        ? "Thông tin đăng ký không hợp lệ."
        : readMessage(body, "Đăng ký thất bại, vui lòng thử lại.");
    throw new ApiError(message, res.status);
  }
  // Backend không trả token khi đăng ký, nên không cần đọc dữ liệu trả về
}

export function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}