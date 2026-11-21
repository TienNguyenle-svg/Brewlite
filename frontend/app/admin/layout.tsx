
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getToken, getUser } from '../../lib/auth';
import { logout } from '../../lib/admin';

const NAV = [
  { href: '/admin/products', label: 'Sản phẩm' },
  { href: '/admin/inventory', label: 'Kho' },
  { href: '/admin/orders', label: 'Đơn hàng' },
  { href: '/admin/revenue', label: 'Doanh thu' },
];

function CupIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path d="M7 2v3M11 2v3" />
    </svg>
  );
}

function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex h-full items-center gap-2 text-sm font-semibold">
      {NAV.map((n) => {
        const active = pathname.startsWith(n.href);

        return (
          <li key={n.href} className="h-full">
            <Link
              href={n.href}
              className={`flex h-full items-center border-b-[3px] px-4 transition-colors ${
                active
                  ? 'border-[#2F4A3A] text-[#2F4A3A]'
                  : 'border-transparent text-[#647466] hover:text-[#2F4A3A]'
              }`}
            >
              {n.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getUser();

    if (!getToken() || !user) {
      router.replace('/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      router.replace('/forbidden');
      return;
    }

    const timer = setTimeout(() => setReady(true), 0);

    return () => clearTimeout(timer);
  }, [router]);

  if (!ready) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3EAD8]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#CBD7C8] border-t-[#2F4A3A]" />
    </div>
  );
}

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F3EAD8] text-[#2F4A3A]">

      {/* ===== HEADER ===== */}
      <nav className="flex min-h-[88px] flex-wrap items-center justify-between gap-4 border-b border-[#B8C8B8] bg-[#F3EAD8] px-6 shadow-[0_5px_18px_rgba(47,74,58,0.10)] lg:px-[72px]">

        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F4A3A] text-white shadow-md">
            <CupIcon />
          </span>

          <span className="text-2xl font-extrabold tracking-tight text-[#2F4A3A]">
            BrewLite.
          </span>
        </Link>

        {/* Menu */}
        <Suspense
          fallback={
            <ul className="flex h-full items-center gap-9 text-sm" />
          }
        >
          <NavLinks />
        </Suspense>

        {/* Tài khoản */}
        <div className="flex items-center gap-4 text-[13px]">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-[#2F4A3A] px-5 py-3 font-bold text-white shadow-[0_5px_12px_rgba(47,74,58,0.22)] transition hover:bg-[#243C2E]"
          >
            Đăng xuất
          </button>

          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#B8C8B8] bg-[#E4EDDF] text-xs font-extrabold text-[#2F4A3A]">
            AD
          </span>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 bg-[#F3EAD8] px-5 pb-16 pt-10 lg:px-16 xl:px-24">
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="flex min-h-[100px] flex-wrap items-center justify-between gap-3 border-t border-[#B8C8B8] bg-[#F3EAD8] px-6 text-xs font-medium text-[#617466] lg:px-[72px]">

        <span>
          <span className="mr-5 text-[19px] font-extrabold text-[#2F4A3A]">
            BrewLite.
          </span>
          Khu vực quản trị
        </span>

        <span>© 2026 BrewLite</span>
      </footer>

    </div>
  );
}
