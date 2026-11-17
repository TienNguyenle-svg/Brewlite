
export default function Footer() {
  return (
    <footer className="bg-[#F3EAD8]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm font-semibold text-[#2F4A3A] md:px-[72px]">
        <p className="flex flex-wrap items-baseline gap-3">
          <span className="text-xl font-bold text-[#2F4A3A]">
            BrewLite.
          </span>
          <span>Ngồi lại một chút, ngày dịu dàng hơn</span>
        </p>

        <p className="font-semibold">
          Pha mới mỗi ngày · 7:00 – 22:00
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <span>Cần hỗ trợ?</span>

          <a
            href="#"
            className="font-bold text-[#2F4A3A] transition-colors duration-200 hover:text-[#6B8E65] hover:underline"
          >
            Liên hệ chúng tôi
          </a>

          <span>© 2026 BrewLite</span>
        </div>
      </div>
    </footer>
  );
}
