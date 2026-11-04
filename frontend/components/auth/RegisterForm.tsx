"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError, register } from "../../lib/auth";
import { LogoMark } from "./AuthShell";
import { Banner, EyeIcon, Spinner } from "./LoginForm";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Giống quy tắc của backend (register.dto.ts): có ít nhất một chữ cái và một chữ số
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
    errors.password.push("Mật khẩu phải chứa ít nhất một chữ cái và một chữ số");
  }
  if (confirm !== password) {
    errors.confirm = "Mật khẩu nhập lại không khớp";
  }
  return errors;
}

function hasErrors(e: FormErrors) {
  return Boolean(e.email) || e.password.length > 0 || Boolean(e.confirm);
}

const inputBase =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-[#3B2A20] outline-none transition-colors placeholder:text-[#A39A92] focus:border-[#3B2A20]";
const inputOk = "border-[#E5DED5]";
const inputBad = "border-[#D6574F] focus:border-[#D6574F]";

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
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={72}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          className={`${inputBase} pr-10 ${invalid ? inputBad : inputOk}`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3B2A20] hover:opacity-70"
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
        // "Email đã được sử dụng" hiện ngay dưới ô email, giống Figma
        setErrors({ password: [], email: err.message });
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
    <div className="flex w-full max-w-[300px] flex-col items-center">
      <div className="mb-3 flex items-center gap-2.5">
        <LogoMark />
        <span className="text-xl">Brewlite</span>
      </div>

      <div className="w-full rounded-2xl border border-[#EFE9E1] bg-white px-5 pb-5 pt-6 shadow-[0_8px_24px_rgba(59,42,32,0.06)]">
        <h1 className="text-center text-2xl font-semibold">Tạo tài khoản</h1>

        {serverError ? (
          <Banner type="error">{serverError}</Banner>
        ) : (
          <p className="mb-5 mt-4 text-center text-[11px] text-[#8A7F76]">
            Gia nhập Brewlite, tích điểm cho mỗi lần ghé.
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

          <div className="mb-3">
            <PasswordInput
              id="password"
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={password}
              invalid={passwordInvalid}
              onChange={(v) => {
                setPassword(v);
                if (passwordInvalid) setErrors((p) => ({ ...p, password: [] }));
              }}
            >
              <p className="mt-1 text-[10px] text-[#8A7F76]">
                Tối thiểu 6 ký tự, gồm cả chữ và số
              </p>
              {/* Chừa sẵn chỗ cho 2 dòng lỗi để form không bị nhảy, giống Figma */}
              <div className="min-h-[22px]">
                {errors.password.map((msg) => (
                  <p key={msg} className="text-[10px] leading-[11px] text-[#D6574F]">
                    {msg}
                  </p>
                ))}
              </div>
            </PasswordInput>
          </div>

          <div className="mb-4">
            <PasswordInput
              id="confirm"
              label="Nhập lại mật khẩu"
              placeholder="Nhập lại mật khẩu"
              value={confirm}
              invalid={!!errors.confirm}
              onChange={(v) => {
                setConfirm(v);
                if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
              }}
            >
              {errors.confirm && (
                <p className="mt-1 text-[10px] text-[#D6574F]">{errors.confirm}</p>
              )}
            </PasswordInput>
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
            Đăng ký
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-[#8A7F76]">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-[#3B2A20] underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}