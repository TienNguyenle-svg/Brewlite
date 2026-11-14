import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Về chúng tôi · BrewLite",
  description: "Cà phê Việt Nam, pha mới và giao đến tận cửa.",
};

const features = [
  { icon: "☕", title: "100% cà phê Việt Nam", desc: "Hạt cà phê chọn từ các vùng trồng trong nước." },
  { icon: "🔥", title: "Pha mới mỗi ngày", desc: "Chỉ pha khi bạn đặt, giữ trọn hương vị." },
  { icon: "🎚️", title: "Theo gu của bạn", desc: "Size, topping, ghi chú — tùy chỉnh theo ý bạn." },
];

const steps = [
  "Chọn món",
  "Tùy chỉnh size, topping, ghi chú",
  "Thanh toán qua VNPay",
  "Pha mới & giao tận nơi",
  "Theo dõi đơn trong “Đơn hàng của tôi”",
];

const notes = [
  {
    title: "Giao gần, thêm chút tiện lợi",
    desc: "Phí giao 15.000đ, miễn phí cho đơn từ 100.000đ.",
  },
  {
    title: "Một lưu ý nhỏ cho bạn",
    desc: "Size S/M/L thay đổi lượng nước và giá; topping được tính riêng.",
  },
];

const contacts = [
  { icon: "📍", label: "Địa chỉ", value: "Quận 5, TP.HCM" },
  { icon: "🕒", label: "Giờ mở cửa", value: "7:00 – 22:00" },
  { icon: "📞", label: "Điện thoại", value: "0123456789" },
  { icon: "✉️", label: "Email", value: "goodvibe@brewlite.vn" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0] text-[#2A1F1A]">
      <div className="mx-auto max-w-6xl space-y-14 px-5 py-10 md:px-8 md:py-14">
        {/* Hero */}
        <section className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C8622B]">
              Về BrewLite
            </p>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              Cà phê Việt Nam, pha mới và giao đến tận cửa
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#6B5D54]">
              Chọn size, topping, ghi chú theo gu của bạn, thanh toán không cần
              tiền mặt, ly nước pha mới ngay khi bạn gọi.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#C8622B] hover:underline"
            >
              Xem thực đơn của BrewLite →
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-[#E9DFD2] shadow-sm">
            {/* Thay bằng ảnh thật: /public/about-hero.jpg */}
            <img
              src="/about-hero.jpg"
              alt="Ly cà phê phin đá của BrewLite"
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs shadow">
              <span className="text-[#C8622B]">★</span>
              <span>4.8 · hơn 240 người đã đặt</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-3 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 rounded-2xl border border-[#EADFD0] bg-[#F5EDE1] p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base">
                {f.icon}
              </span>
              <div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-0.5 text-xs text-[#6B5D54]">{f.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Steps */}
        <section>
          <h2 className="text-xl font-bold md:text-2xl">Đặt nước dễ như thế nào?</h2>
          <p className="mt-1 text-sm text-[#6B5D54]">Từ lúc chọn món đến khi nhận ly.</p>
          <ol className="mt-5 grid gap-4 md:grid-cols-5">
            {steps.map((s, i) => (
              <li key={s} className="flex items-start gap-3 md:flex-col">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C8622B] text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Notes */}
        <section className="rounded-2xl border border-[#EADFD0] bg-[#F5EDE1] p-5 md:p-6">
          <h2 className="mb-4 text-lg font-bold">Một vài điều cần biết</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {notes.map((n) => (
              <div key={n.title}>
                <h3 className="text-sm font-semibold">{n.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#6B5D54]">{n.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Visit */}
        <section>
          <h2 className="mb-5 text-xl font-bold md:text-2xl">Ghé gần hơn với BrewLite</h2>
          <div className="grid items-stretch gap-6 md:grid-cols-2">
            <ul className="space-y-4">
              {contacts.map((c) => (
                <li key={c.label} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5EDE1] text-sm">
                    {c.icon}
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[#8A7B70]">{c.label}</p>
                    <p className="text-sm font-medium">{c.value}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="relative min-h-[200px] overflow-hidden rounded-2xl bg-[#E4DED5]">
              {/* Có thể thay bằng iframe Google Maps */}
              <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_45%,#F8F5EF_45%,#F8F5EF_52%,transparent_52%),linear-gradient(20deg,transparent_55%,#F8F5EF_55%,#F8F5EF_61%,transparent_61%)]" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white px-4 py-2 text-center shadow">
                <p className="text-xs font-semibold">BrewLite · Quận 5</p>
                <p className="text-[10px] text-[#8A7B70]">TP. Hồ Chí Minh</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#2A1F1A] p-6 text-white md:flex-row md:items-center md:p-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D9A27C]">
              Một ly được pha ngay đây
            </p>
            <h2 className="mt-1 text-xl font-bold md:text-2xl">Sẵn sàng cho ly cà phê của bạn?</h2>
          </div>
          <Link
            href="/"
            className="rounded-lg bg-[#C8622B] px-5 py-2.5 text-sm font-semibold transition hover:bg-[#B35523]"
          >
            Xem thực đơn →
          </Link>s
        </section>
      </div>
    </main>
  );
}