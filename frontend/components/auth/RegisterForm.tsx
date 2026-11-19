
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError, register } from "../../lib/auth";
import { Banner, EyeIcon, Spinner } from "./LoginForm";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_FORMAT_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

interface FormErrors {
  email?: string;
  password: string[];
  confirm?: string;
}

const NO_ERRORS: FormErrors = { password: [] };

function validate(
  email: string,
  password: string,
  confirm: string,
): FormErrors {
  const errors: FormErrors = { password: [] };

  if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = "Email không hợp lệ";
  }

  if (password.length < 6) {
    errors.password.push("Mật khẩu phải có ít nhất 6 ký tự");
  }

  if (!PASSWORD_FORMAT_REGEX.test(password)) {
    errors.password.push(
      "Mật khẩu phải chứa ít nhất một chữ cái và một chữ số",
    );
  }

  if (confirm !== password) {
    errors.confirm = "Mật khẩu nhập lại không khớp";
  }

  return errors;
}

function hasErrors(errors: FormErrors) {
  return (
    Boolean(errors.email) ||
    errors.password.length > 0 ||
    Boolean(errors.confirm)
  );
}

const inputBase =
  "h-[58px] w-full rounded-2xl border-2 bg-[#FAF8F2] pl-12 pr-14 text-base font-medium text-[#2F4A3A] outline-none transition-all duration-300 placeholder:text-[#9A9F96] focus:bg-white focus:shadow-[0_0_0_4px_rgba(47,74,58,0.1)]";

const inputOk =
  "border-[#E5E6DA] hover:border-[#A4BC89] focus:border-[#2F4A3A]";

const inputBad = "border-red-400 focus:border-red-500";

function MailIcon() {
  return (
    <svg
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
  );
}

function LockIcon() {
  return (
    <svg
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
  );
}

function PasswordInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  invalid,
  autoComplete = "new-password",
  children,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  autoComplete?: string;
  children?: ReactNode;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-3 block text-base font-bold text-[#2F4A3A]"
      >
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78917D]">
          <LockIcon />
        </span>

        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={72}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          className={`${inputBase} ${invalid ? inputBad : inputOk}`}
        />

        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#2F4A3A] transition-colors hover:bg-[#E8EFE5]"
        >
          <EyeIcon off={!show} />
        </button>
      </div>

      {children}
    </div>
  );
}

export default function RegisterForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setServerError("");

    const fieldErrors = validate(email, password, confirm);
    setErrors(fieldErrors);

    if (hasErrors(fieldErrors)) return;

    setLoading(true);

    try {
      await register(email.trim(), password);
      router.push("/login?registered=1");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({
          password: [],
          email: err.message,
        });
      } else {
        setServerError(
          err instanceof ApiError
            ? err.message
            : "Đã có lỗi xảy ra, vui lòng thử lại.",
        );
      }

      setLoading(false);
    }
  }

  const passwordInvalid = errors.password.length > 0;

  return (
    <div className="w-full max-w-[520px]">
      <div className="rounded-[32px] border border-[#E8E2D5] bg-white px-7 py-10 shadow-[0_25px_65px_-15px_rgba(47,74,58,0.25),0_10px_25px_rgba(47,74,58,0.08)] transition-shadow duration-300 hover:shadow-[0_30px_75px_-15px_rgba(47,74,58,0.3)] sm:px-12 sm:py-12">

        <div className="mb-9 text-center">
          <p className="mb-4 text-2xl font-extrabold tracking-tight text-[#2F4A3A]">
            BrewLite.
          </p>

          <h1 className="text-[36px] font-extrabold tracking-tight text-[#2F4A3A] sm:text-[40px]">
            Tạo tài khoản
          </h1>

          <p className="mt-4 text-[15px] font-medium leading-6 text-[#737B70]">
            Gia nhập BrewLite, tích điểm cho mỗi lần ghé.
          </p>
        </div>

        {serverError && (
          <Banner type="error">{serverError}</Banner>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="mb-6">
            <label
              htmlFor="email"
              className="mb-3 block text-base font-bold text-[#2F4A3A]"
            >
              Email
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78917D]">
                <MailIcon />
              </span>

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

          {/* Mật khẩu */}
          <div className="mb-6">
            <PasswordInput
              id="password"
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={password}
              invalid={passwordInvalid}
              onChange={(value) => {
                setPassword(value);

                if (passwordInvalid) {
                  setErrors((p) => ({
                    ...p,
                    password: [],
                  }));
                }
              }}
            >
              <p className="mt-2 text-sm text-[#737B70]">
                Tối thiểu 6 ký tự, gồm cả chữ và số.
              </p>

              {errors.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {errors.password.map((message) => (
                    <p
                      key={message}
                      className="text-sm font-medium text-red-600"
                    >
                      {message}
                    </p>
                  ))}
                </div>
              )}
            </PasswordInput>
          </div>

          {/* Nhập lại mật khẩu */}
          <div className="mb-8">
            <PasswordInput
              id="confirm"
              label="Nhập lại mật khẩu"
              placeholder="Nhập lại mật khẩu"
              value={confirm}
              invalid={!!errors.confirm}
              onChange={(value) => {
                setConfirm(value);

                if (errors.confirm) {
                  setErrors((p) => ({
                    ...p,
                    confirm: undefined,
                  }));
                }
              }}
            >
              {errors.confirm && (
                <p className="mt-2 text-sm font-medium text-red-600">
                  {errors.confirm}
                </p>
              )}
            </PasswordInput>
          </div>

          {/* Nút đăng ký */}
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
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <p className="mt-8 text-center text-[15px] font-medium text-[#737B70]">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-extrabold text-[#2F4A3A] underline decoration-[#A4BC89] decoration-2 underline-offset-4 transition-colors hover:text-[#60846A]"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
