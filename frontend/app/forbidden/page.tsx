import Link from "next/link";
import AuthShell from "../../components/auth/AuthShell";

export const metadata = {
  title: "Không có quyền truy cập | Brewlite",
};

export default function ForbiddenPage() {
  return (
    <AuthShell>
      <div className="flex max-w-[360px] flex-col items-center text-center">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EDE3D3] text-[#3B2A20]"
          aria-hidden="true"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>

        <p className="mt-3 text-[9px] font-semibold tracking-[0.2em] text-[#8A7F76]">
          403
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#3B2A20]">
          Không có quyền truy cập
        </h1>
        <p className="mt-3 text-xs leading-relaxed text-[#8A7F76]">
          Tài khoản của bạn không có quyền xem trang này.
          <br />
          Hãy quay về trang chủ để tiếp tục khám phá Brewlite.
        </p>

        <Link
          href="/"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#3B2A20] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#2C1F17]"
        >
          Quay về trang chủ
        </Link>
      </div>
    </AuthShell>
  );
}