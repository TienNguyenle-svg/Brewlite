"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { TOKEN_KEY } from "@/lib/barista";

// Các trang không hiện tab điều hướng, giỏ hàng, nút đăng nhập/đăng xuất
const AUTH_ROUTES = ["/login", "/register"];

// Để React biết khi nào localStorage đổi (ví dụ đăng xuất ở tab khác)
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function CupIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path d="M7 2v3M11 2v3" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

function Logo({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F4A3A] text-white">
        <CupIcon />
      </span>
      <span className="text-xl text-[#2B1F1A]">BrewLite.</span>
    </Link>
  );
}

export default function Header() {
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  // Đang ở trang đăng nhập / đăng ký thì chỉ hiện logo + địa chỉ
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  // null ở server / lần render đầu, sau đó là true/false tùy có token hay không
  const loggedIn = useSyncExternalStore<boolean | null>(
    subscribe,
    () => !!localStorage.getItem(TOKEN_KEY),
    () => null,
  );

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event("storage"));
    router.replace("/login");
  };

  // Header dành riêng cho Barista
  if (pathname.startsWith("/barista")) {
    const baristaNav = [
      { href: "/barista/orders", label: "Hàng đợi đơn" },
      { href: "/barista/history", label: "Đã hoàn thành" },
    ];

    return (
      <header className="bg-[#F2EBDC]">
        <div className="mx-auto flex min-h-[88px] max-w-[1440px] items-center justify-between gap-4 px-4 md:px-[72px]">
          <Logo href="/barista" />

          <nav className="flex h-full items-center gap-4 text-[15px] md:gap-9">
            {baristaNav.map((item) => {
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-[88px] items-center border-b-[3px] transition-colors ${
                    active
                      ? "border-[#2F4A3A] font-semibold text-[#2F4A3A]"
                      : "border-transparent font-medium text-[#6B5240] hover:text-[#2F4A3A]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 text-[13px] md:gap-6">
            <span className="hidden sm:inline">BrewLite · Quận 5</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-[10px] bg-[#2F4A3A] px-3.5 py-2.5 font-semibold text-white hover:bg-[#263D2F]"
            >
              Đăng xuất
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEE2D2] text-xs">
              BR
            </span>
          </div>
        </div>
      </header>
    );
  }

  const navItems = [
    {
      label: "Thực đơn",
      href: "/",
      active: pathname === "/" || pathname.startsWith("/products"),
    },
    {
      label: "Đơn hàng của tôi",
      href: "/orders",
      active: pathname.startsWith("/orders"),
    },
    {
      label: "Về chúng tôi",
      href: "/about",
      active: pathname.startsWith("/about"),
    },
  ];

  // Chuỗi class dùng chung cho giỏ hàng, đăng nhập, đăng xuất
  const actionBtn =
    "flex items-center gap-2 rounded-lg bg-[#2F4A3A] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#263D2F]";

  return (
    <header className="bg-[#F2EBDC]">
      <div className="mx-auto flex h-[88px] max-w-[1440px] items-center justify-between px-4 md:px-[72px]">
        {/* Logo */}
        <Logo href="/" />

        {/* Điều hướng giữa: ẩn ở trang đăng nhập / đăng ký */}
        {!isAuthPage && (
          <nav className="hidden h-full items-center gap-9 text-[15px] md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex h-full items-center transition-colors ${
                  item.active
                    ? "font-semibold text-[#2F4A3A]"
                    : "font-medium text-[#6B5240] hover:text-[#2F4A3A]"
                }`}
              >
                {item.label}
                {item.active && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-[#2F4A3A]" />
                )}
              </Link>
            ))}
          </nav>
        )}

        {/* Bên phải */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="hidden items-center gap-1.5 text-xs text-[#2B1F1A] md:flex"
          >
            <PinIcon />
            Quận 5, TP.HCM
            <ChevronIcon />
          </button>

          {!isAuthPage && (
            <>
              <Link href="/cart" className={actionBtn}>
                <BagIcon />
                Giỏ hàng
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] text-[#2F4A3A]">
                  {count}
                </span>
              </Link>

              {/* Đã đăng nhập: Đăng xuất. Chưa đăng nhập: Đăng nhập */}
              {loggedIn === true && (
                <button type="button" onClick={handleLogout} className={actionBtn}>
                  <LogoutIcon />
                  Đăng xuất
                </button>
              )}

              {loggedIn === false && (
                <Link href="/login" className={actionBtn}>
                  <LoginIcon />
                  Đăng nhập
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}