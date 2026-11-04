"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, ROLE_HOME, login, saveSession } from "../../lib/auth";
import { LogoMark } from "./AuthShell";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = "Email không hợp lệ";
  }
  if (password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
  }
  return errors;
}

export function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {off ? (
        <>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <path d="m2 2 20 20" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function Banner({
  type,
  children,
}: {
  type: "error" | "success";
  children: string;
}) {
  const isError = type === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mb-4 mt-4 flex items-center gap-2 rounded-lg border px-3 py-3 text-[11px] ${
        isError
          ? "border-[#F5CFCB] bg-[#FDEFEE] text-[#C0443B]"
          : "border-[#CFE6D4] bg-[#EAF5EC] text-[#2F7A45]"
      }`}
    >
      <svg
        className="shrink-0"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        {isError ? (
          <>
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </>
        ) : (
          <path d="m9 12 2 2 4-4" />
        )}
      </svg>
      <span>{children}</span>
    </div>
  );
}

export function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  // Trang đăng ký chuyển về /login?registered=1 sau khi đăng ký thành công
  const [showSuccess, setShowSuccess] = useState(
    searchParams.get("registered") === "1",
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setServerError("");
    setShowSuccess(false);
    const fieldErrors = validate(email, password);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      saveSession(data.accessToken, data.user);
      router.push(ROLE_HOME[data.user.role] ?? "/");
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.message
          : "Đã có lỗi xảy ra, vui lòng thử lại.",
      );
      setLoading(false);
    }
  }

  const inputBase =
    "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-[#3B2A20] outline-none transition-colors placeholder:text-[#A39A92] focus:border-[#3B2A20]";
  const inputOk = "border-[#E5DED5]";
  const inputBad = "border-[#D6574F] focus:border-[#D6574F]";

  return (
    <div className="flex w-full max-w-[300px] flex-col items-center sm:max-w-[300px]">
      <div className="mb-3 flex items-center gap-2.5">
        <LogoMark />
        <span className="text-xl">Brewlite</span>
      </div>

      <div className="w-full rounded-2xl border border-[#EFE9E1] bg-white px-5 pb-5 pt-6 shadow-[0_8px_24px_rgba(59,42,32,0.06)]">
        <h1 className="text-center text-2xl font-semibold">Đăng nhập</h1>

        {serverError ? (
          <Banner type="error">{serverError}</Banner>
        ) : showSuccess ? (
          <Banner type="success">Đăng ký thành công, vui lòng đăng nhập</Banner>
        ) : (
          <p className="mb-5 mt-4 text-center text-[11px] text-[#8A7F76]">
            Chào bạn trở lại. Cà phê ngon đang chờ!
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="email" className="mb-1.5 block text-[11px] font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="customer@brewlite.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              aria-invalid={!!errors.email}
              className={`${inputBase} ${errors.email ? inputBad : inputOk}`}
            />
            {errors.email && (
              <p className="mt-1 text-[10px] text-[#D6574F]">{errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="mb-1.5 block text-[11px] font-medium">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                maxLength={72}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((p) => ({ ...p, password: undefined }));
                }}
                aria-invalid={!!errors.password}
                className={`${inputBase} pr-10 ${
                  errors.password ? inputBad : inputOk
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3B2A20] hover:opacity-70"
              >
                <EyeIcon off={!showPassword} />
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[10px] text-[#D6574F]">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg text-xs font-semibold text-white transition-colors ${
              loading
                ? "cursor-not-allowed bg-[#A89B90]"
                : "bg-[#3B2A20] hover:bg-[#2C1F17]"
            }`}
          >
            {loading && <Spinner />}
            Đăng nhập
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-[#8A7F76]">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-[#3B2A20] underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}