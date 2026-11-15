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

  // Header dành riêng cho Barista
  if (pathname.startsWith("/barista")) {
    const baristaNav = [
      { href: "/barista/orders", label: "Hàng đợi đơn" },
      { href: "/barista/history", label: "Đã hoàn thành" },
    ];

    return (
      <header className="border-b border-[#E7E1DA] bg-[#F8F5F0]">
        <div className="mx-auto flex min-h-[88px] max-w-[1440px] items-center justify-between gap-4 px-4 md:px-[72px]">
          <Link href="/barista" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8A4B22] text-white">
              <CupIcon />
            </span>
            <span className="text-xl text-[#2B1F1A]">BrewLite.</span>
          </Link>

          <nav className="flex h-full items-center gap-4 text-sm md:gap-9">
            {baristaNav.map((item) => {
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-[88px] items-center border-b-[3px] ${
                    active
                      ? "border-[#B9672B] text-[#39281F]"
                      : "border-transparent text-[#82776E]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 text-[13px] md:gap-6">
            <span className="hidden sm:inline">BrewLite · Quận 1</span>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(TOKEN_KEY);
                window.dispatchEvent(new Event("storage"));
                router.replace("/login");
              }}
              className="rounded-[10px] bg-[#39281F] px-3.5 py-2.5 font-semiboAld text-white"
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

  return (
    <header className="border-b border-[#F8F4E8] bg-[#F8F5F0]">
      <div className="mx-auto flex h-[88px] max-w-[1440px] items-center justify-between px-4 md:px-[72px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8A4B22] text-white">
            <CupIcon />
          </span>
          <span className="text-xl text-[#2B1F1A]">BrewLite.</span>
        </Link>

        {/* Điều hướng giữa: ẩn ở trang đăng nhập / đăng ký */}
        {!isAuthPage && (
          <nav className="hidden h-full items-center gap-8 text-sm md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex h-full items-center ${
                  item.active
                    ? "font-medium text-[#2B1F1A]"
                    : "text-stone-500 hover:text-[#2B1F1A]"
                }`}
              >
                {item.label}
                {item.active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#C8672B]" />
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
              <Link
                href="/cart"
                className="flex items-center gap-2 rounded-lg bg-[#2B1F1A] px-3.5 py-2 text-xs font-medium text-white"
              >
                <BagIcon />
                Giỏ hàng
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] text-[#2B1F1A]">
                  {count}
                </span>
              </Link>

              {/* Đã đăng nhập: Đăng xuất. Chưa đăng nhập: Đăng nhập */}
              {loggedIn === true && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(TOKEN_KEY);
                    window.dispatchEvent(new Event("storage"));
                    router.replace("/login");
                  }}
                  className="rounded-lg border border-[#2B1F1A] px-3.5 py-2 text-xs font-medium text-[#2B1F1A] hover:bg-[#EDE0D0]"
                >
                  Đăng xuất
                </button>
              )}

              {loggedIn === false && (
                <Link
                  href="/login"
                  className="rounded-lg bg-[#8A4B22] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#7A401C]"
                >
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