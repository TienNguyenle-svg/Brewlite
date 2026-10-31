'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TOKEN_KEY } from '../../lib/barista';

const NAV = [
  { href: '/barista/orders', label: 'Hàng đợi đơn' },
  { href: '/barista/history', label: 'Đã hoàn thành' },
];

export default function BaristaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // Chưa đăng nhập thì chuyển về trang login (đổi đường dẫn nếu dự án khác)
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) router.replace('/login');
    else setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F5F0] text-[#39281F]">
      <nav className="flex h-[88px] items-center justify-between border-b border-[#E7E1DA] px-[72px]">
        <Link href="/barista" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#39281F] text-white">
            ☕
          </span>
          <span className="text-[25px] tracking-tight">BrewLite.</span>
        </Link>

        <ul className="flex h-full items-center gap-9 text-sm">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <li key={n.href} className="h-full">
                <Link
                  href={n.href}
                  className={`flex h-full items-center border-b-[3px] ${
                    active ? 'border-[#B9672B] text-[#39281F]' : 'border-transparent text-[#82776E]'
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-6 text-[13px]">
          <span>BrewLite · Quận 1</span>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(TOKEN_KEY);
              router.replace('/login');
            }}
            className="rounded-[10px] bg-[#39281F] px-3.5 py-2.5 font-semibold text-white"
          >
            Đăng xuất
          </button>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEE2D2] text-xs">
            BR
          </span>
        </div>
      </nav>

      <main className="flex-1 px-24 pb-14 pt-9">{children}</main>

      <footer className="flex h-[100px] items-center justify-between border-t border-[#E7E1DA] px-[72px] text-xs text-[#82776E]">
        <span>
          <span className="mr-5 text-[19px] text-[#39281F]">BrewLite.</span>
          Một chút lắng đọng. Một ngày tươi hơn.
        </span>
        <span>Pha mới mỗi ngày · 7:00 – 22:00</span>
        <span>© 2026 BrewLite</span>
      </footer>
    </div>
  );
}
