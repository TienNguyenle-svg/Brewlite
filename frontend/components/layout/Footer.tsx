export default function Footer() {
  return (
    <footer className="border-t border-[#2E1F14] bg-[##2E1F14]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-[11px] text-stone-500 md:px-[72px]">
        <p className="flex items-baseline gap-3">
          <span className="text-base text-[#2B1F1A]">BrewLite.</span>
          Ngồi lại một chút, ngày dịu dàng hơn
        </p>
        <p>Pha mới mỗi ngày · 7:00 – 22:00</p>
        <p className="flex gap-4">
          <span>Cần hỗ trợ?</span>
          <a href="#" className="hover:text-[#E3C9A3]">
            Liên hệ chúng tôi
          </a>
          <span>© 2026 BrewLite</span>
        </p>
      </div>
    </footer>
  );
}