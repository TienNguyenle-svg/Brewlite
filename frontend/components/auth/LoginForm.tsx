
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, ROLE_HOME, login, saveSession } from "../../lib/auth";

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
      width="21"
      height="21"
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
      className={`my-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      <span className="shrink-0">{isError ? "!" : "✓"}</span>
      <span>{children}</span>
    </div>
  );
}

export function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="20"
      height="20"
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
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "h-[58px] w-full rounded-2xl border-2 bg-[#FAF8F2] pl-12 pr-4 text-base font-medium text-[#2F4A3A] outline-none transition-all duration-300 placeholder:text-[#9A9F96] focus:bg-white focus:shadow-[0_0_0_4px_rgba(47,74,58,0.1)]";

  const inputOk =
    "border-[#E5E6DA] hover:border-[#A4BC89] focus:border-[#2F4A3A]";

  const inputBad = "border-red-400 focus:border-red-500";

  return (
    <div className="w-full max-w-[520px]">
      <div className="rounded-[32px] border border-[#E8E2D5] bg-white px-7 py-10 shadow-[0_25px_65px_-15px_rgba(47,74,58,0.25),0_10px_25px_rgba(47,74,58,0.08)] transition-shadow duration-300 hover:shadow-[0_30px_75px_-15px_rgba(47,74,58,0.3)] sm:px-12 sm:py-12">
        <div className="mb-9 text-center">
          <p className="mb-4 text-2xl font-extrabold tracking-tight text-[#2F4A3A]">
            BrewLite.
          </p>

          <h1 className="text-[36px] font-extrabold tracking-tight text-[#2F4A3A] sm:text-[40px]">
            Đăng nhập
          </h1>

          <p className="mt-4 text-[15px] font-medium leading-6 text-[#737B70]">
            Chào bạn trở lại. Cà phê ngon đang chờ!
          </p>
        </div>

        {serverError ? (
          <Banner type="error">{serverError}</Banner>
        ) : showSuccess ? (
          <Banner type="success">
            Đăng ký thành công, vui lòng đăng nhập
          </Banner>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-6">
            <label
              htmlFor="email"
              className="mb-3 block text-base font-bold text-[#2F4A3A]"
            >
              Email
            </label>

            <div className="relative">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78917D]"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>

              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Nhập địa chỉ email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((p) => ({
                      ...p,
                      email: undefined,
                    }));
                  }
                }}
                aria-invalid={!!errors.email}
                className={`${inputBase} ${
                  errors.email ? inputBad : inputOk
                }`}
              />
            </div>

            {errors.email && (
              <p className="mt-2 text-sm font-medium text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          <div className="mb-8">
            <label
              htmlFor="password"
              className="mb-3 block text-base font-bold text-[#2F4A3A]"
            >
              Mật khẩu
            </label>

            <div className="relative">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78917D]"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                maxLength={72}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors((p) => ({
                      ...p,
                      password: undefined,
                    }));
                  }
                }}
                aria-invalid={!!errors.password}
                className={`${inputBase} pr-14 ${
                  errors.password ? inputBad : inputOk
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                }
                className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#2F4A3A] transition-colors hover:bg-[#E8EFE5]"
              >
                <EyeIcon off={!showPassword} />
              </button>
            </div>

            {errors.password && (
              <p className="mt-2 text-sm font-medium text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`flex h-[60px] w-full items-center justify-center gap-3 rounded-2xl text-lg font-extrabold text-white transition-all duration-300 ${
              loading
                ? "cursor-not-allowed bg-[#91A095]"
                : "bg-[#2F4A3A] shadow-[0_8px_20px_rgba(47,74,58,0.25)] hover:-translate-y-1 hover:bg-[#3F614C] hover:shadow-[0_14px_28px_rgba(47,74,58,0.35)] active:translate-y-0"
            }`}
          >
            {loading && <Spinner />}
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-8 text-center text-[15px] font-medium text-[#737B70]">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-extrabold text-[#2F4A3A] underline decoration-[#A4BC89] decoration-2 underline-offset-4 transition-colors hover:text-[#60846A]"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
