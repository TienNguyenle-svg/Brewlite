'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Ẩn Header/Footer chung của website ở khu vực /admin
// (admin đã có thanh điều hướng và footer riêng trong app/admin/layout.tsx).
// Các trang khác giữ nguyên như cũ.
export default function SiteChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');

  return (
    <>
      {!isAdmin && header}
      {children}
      {!isAdmin && footer}
    </>
  );
}