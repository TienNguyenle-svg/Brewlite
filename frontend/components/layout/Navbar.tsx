import Link from "next/link";
import CartButton from "@/components/layout/CartButton";
import { IconChevronDown, IconCoffee, IconMapPin } from "@/components/icons";

const LINKS = [
  { label: "Menu", href: "/" },
  { label: "Đơn đặt hàng", href: "/orders" },
  { label: "Lịch sử đặt hàng", href: "/" },
];

export default function Navbar({ active = "My orders" }: { active?: string }) {
  return (
    <header className="flex min-h-[88px] flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[#E7E1DA] bg-[#F8F5F0] px-4 sm:px-8 lg:px-[72px]">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-[11px] bg-[#39281F]">
          <IconCoffee size={22} className="text-white" />
        </div>
        <span className="text-[25px] text-[#39281F]">BrewLite.</span>
      </Link>

      <nav className="hidden items-center gap-9 md:flex">
        {LINKS.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className={`flex h-[88px] items-center border-b-[3px] text-sm ${
              l.label === active
                ? "border-[#B9672B] text-[#39281F]"
                : "border-transparent text-[#82776E]"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="hidden items-center gap-[7px] text-[13px] text-[#39281F] sm:flex">
          <IconMapPin size={17} />
          Hồ Chí Minh
          <IconChevronDown size={14} />
        </div>
        <CartButton />
        <div className="flex size-9 items-center justify-center rounded-full bg-[#EEE2D2] text-xs text-[#39281F]">
          AL
        </div>
      </div>
    </header>
  );
}
