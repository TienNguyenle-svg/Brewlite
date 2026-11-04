import Link from "next/link";
import type { ReactNode } from "react";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg bg-[#3B2A20] text-white"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" />
      </svg>
    </span>
  );
}

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8F5F0] text-[#3B2A20]">
      <header className="mx-auto w-full max-w-[1200px] px-6 md:px-12">
        <div className="flex h-[88px] items-center justify-between border-b border-[#ECE6DE]">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-xl">Brewlite</span>
          </Link>

          <nav className="hidden items-center gap-6 text-xs text-[#8A7F76] md:flex">
            <Link href="/" className="hover:text-[#3B2A20]">
              Thực đơn
            </Link>
            <Link href="/" className="hover:text-[#3B2A20]">
              Câu chuyện của chúng tôi
            </Link>
          </nav>

          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium hover:opacity-70"
          >
            <svg
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
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Trang chủ
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-[1200px] px-6 md:px-12">
        <div className="flex h-[56px] items-center justify-between border-t border-[#ECE6DE] text-[11px] text-[#8A7F76]">
          <span>© 2026 Brewlite</span>
          <span className="hidden md:inline">
            Một chút thảnh thơi. Một ngày thêm vui.
          </span>
          <span className="font-medium text-[#3B2A20]">
            Cần hỗ trợ? Liên hệ chúng tôi
          </span>
        </div>
      </footer>
    </div>
  );
}