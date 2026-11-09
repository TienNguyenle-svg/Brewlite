'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getToken, getUser } from '../../lib/auth';
import { logout } from '../../lib/admin';

// Khu vực admin có header và footer riêng (giống khu vực barista).
// Header/Footer chung của website được ẩn ở /admin bằng components/layout/SiteChrome.tsx.

const NAV = [
  { href: '/admin/products', label: 'Sản phẩm' },
  { href: '/admin/inventory', label: 'Kho' },
  { href: '/admin/orders', label: 'Đơn hàng' },
  { href: '/admin/revenue', label: 'Doanh thu' },
];

// Component con chỉ đọc pathname → bọc trong Suspense (giống layout barista)
function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="flex h-full items-center gap-9 text-sm">
      {NAV.map((n) => {
        const active = pathname.startsWith(n.href);
        return (
          <li key={n.href} className="h-full">
            <Link
              href={n.href}
              className={`flex h-full items-center border-b-[3px] ${
                active
                  ? 'border-[#B9672B] text-[#39281F]'
                  : 'border-transparent text-[#82776E]'
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getUser();

    // Chưa đăng nhập → về trang đăng nhập
    if (!getToken() || !user) {
      router.replace('/login');
      return;
    }
    // Đã đăng nhập nhưng không phải admin → trang từ chối truy cập
    if (user.role !== 'ADMIN') {
      router.replace('/forbidden');
      return;
    }

    const timer = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(timer);
  }, [router]);

  // Chưa kiểm tra xong thì không hiện gì, tránh nháy nội dung admin
  if (!ready) return null;

  async function handleLogout() {
    await logout(); // gọi POST /auth/logout rồi xóa token + user
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F5F0] text-[#39281F]">
      <nav className="flex h-[88px] items-center justify-between border-b border-[#E7E1DA] bg-white px-[72px]">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#39281F] text-white">
            ☕
          </span>
          <span className="text-[25px] tracking-tight">BrewLite.</span>
        </Link>

        <Suspense fallback={<ul className="flex h-full items-center gap-9 text-sm" />}>
          <NavLinks />
        </Suspense>

        <div className="flex items-center gap-6 text-[13px]">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-[10px] bg-[#39281F] px-3.5 py-2.5 font-semibold text-white"
          >
            Đăng xuất
          </button>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEE2D2] text-xs">
            AD
          </span>
        </div>
      </nav>

      <main className="flex-1 px-24 pb-14 pt-9">{children}</main>

      <footer className="flex h-[100px] items-center justify-between border-t border-[#E7E1DA] px-[72px] text-xs text-[#82776E]">
        <span>
          <span className="mr-5 text-[19px] text-[#39281F]">BrewLite.</span>
          Khu vực quản trị
        </span>
        <span>© 2026 BrewLite</span>
      </footer>
    </div>
  );
}