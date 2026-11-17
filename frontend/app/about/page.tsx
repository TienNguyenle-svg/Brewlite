
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Về chúng tôi · BrewLite",
  description: "Cà phê Việt Nam, pha mới và giao đến tận cửa.",
};

// Phong cách thẻ đồng bộ với ProductCard
const cardStyle =
  "rounded-2xl border border-[#D9CBAA] bg-[#F3EAD8] " +
  "shadow-[0_4px_8px_rgba(46,31,20,0.08),0_12px_28px_rgba(46,31,20,0.16)] " +
  "transition-all duration-300 ease-out " +
  "hover:-translate-y-1 hover:border-[#BFA982] " +
  "hover:shadow-[0_8px_16px_rgba(46,31,20,0.12),0_20px_40px_rgba(46,31,20,0.24)]";

const features = [
  {
    number: "01",
    title: "100% cà phê Việt Nam",
    desc: "Hạt cà phê được lựa chọn từ các vùng trồng trong nước, mang đến hương vị gần gũi và đậm đà.",
  },
  {
    number: "02",
    title: "Pha mới mỗi ngày",
    desc: "Mỗi ly nước được chuẩn bị sau khi bạn đặt hàng, giúp giữ trọn hương vị tươi mới.",
  },
  {
    number: "03",
    title: "Theo gu của bạn",
    desc: "Tự do lựa chọn size, topping và ghi chú để có được thức uống phù hợp với sở thích.",
  },
];

const steps = [
  "Chọn món yêu thích",
  "Tùy chỉnh size, topping và ghi chú",
  "Thanh toán qua VNPay",
  "Pha mới và giao tận nơi",
  "Theo dõi đơn hàng của bạn",
];

const notes = [
  {
    title: "Giao hàng tiện lợi",
    desc: "Phí giao hàng 15.000đ, miễn phí vận chuyển cho đơn hàng từ 100.000đ.",
  },
  {
    title: "Tùy chỉnh thức uống",
    desc: "Size S/M/L có mức giá khác nhau. Topping được tính riêng theo lựa chọn của bạn.",
  },
];

const contacts = [
  {
    label: "Địa chỉ",
    value: "Quận 5, TP. Hồ Chí Minh",
  },
  {
    label: "Giờ mở cửa",
    value: "7:00 – 22:00",
  },
  {
    label: "Điện thoại",
    value: "0123456789",
  },
  {
    label: "Email",
    value: "goodvibe@brewlite.vn",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F2EBDC] text-[#2E1F14]">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">

        {/* GIỚI THIỆU */}
        <section className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#2F4A3A]">
              Về BrewLite
            </p>

            <h1 className="text-3xl font-medium leading-tight md:text-5xl">
              Cà phê Việt Nam,
              <br />
              pha mới mỗi ngày.
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-[#6B5240]">
              BrewLite mang đến những ly cà phê và thức uống
              quen thuộc theo cách tiện lợi hơn. Bạn có thể
              lựa chọn món yêu thích, tùy chỉnh theo sở thích
              và thanh toán không cần tiền mặt.
            </p>

            <p className="mt-3 max-w-lg text-sm leading-7 text-[#6B5240]">
              Chúng tôi mong muốn mỗi ly nước không chỉ
              mang đến hương vị thơm ngon mà còn giúp
              bạn có những phút giây thư giãn trong ngày.
            </p>

            <Link
              href="/#menu"
              className="mt-7 inline-flex rounded-full bg-[#2F4A3A] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#243B2E]"
            >
              Khám phá thực đơn
            </Link>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#F5F1EB] shadow-[0_8px_24px_rgba(46,31,20,0.16)]">
            <Image
              src="/images/about-hero.jpg"
              alt="Thức uống tại BrewLite"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </section>

        {/* GIÁ TRỊ BREWLITE */}
        <section className="mt-20">
          <div className="mb-7">
            <h2 className="text-2xl font-medium md:text-3xl">
              Điều gì làm nên BrewLite?
            </h2>

            <p className="mt-2 text-sm text-[#6B5240]">
              Những điều nhỏ tạo nên một ly nước ngon.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.number}
                className={`${cardStyle} p-6`}
              >
                <p className="text-sm font-medium text-[#2F4A3A]">
                  {feature.number}
                </p>

                <h3 className="mt-4 text-lg font-medium">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#6B5240]">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* QUY TRÌNH ĐẶT HÀNG */}
        <section className="mt-20">
          <h2 className="text-2xl font-medium md:text-3xl">
            Đặt nước dễ dàng cùng BrewLite
          </h2>

          <p className="mt-2 text-sm text-[#6B5240]">
            Chỉ vài bước đơn giản để có ngay thức uống yêu thích.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`${cardStyle} p-5`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2F4A3A] text-sm font-medium text-white">
                  {index + 1}
                </span>

                <p className="mt-4 text-sm font-medium leading-6">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* THÔNG TIN CẦN BIẾT */}
        <section className={`mt-20 ${cardStyle} p-7 md:p-10`}>
          <h2 className="text-2xl font-medium">
            Một vài điều cần biết
          </h2>

          <div className="mt-7 grid gap-8 md:grid-cols-2">
            {notes.map((note) => (
              <div key={note.title}>
                <h3 className="text-base font-medium text-[#2F4A3A]">
                  {note.title}
                </h3>

                <p className="mt-2 text-sm leading-7 text-[#6B5240]">
                  {note.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* THÔNG TIN LIÊN HỆ */}
        <section className="mt-20">
          <h2 className="text-2xl font-medium md:text-3xl">
            Kết nối cùng BrewLite
          </h2>

          <p className="mt-2 text-sm text-[#6B5240]">
            Thông tin liên hệ và thời gian hoạt động.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {contacts.map((contact) => (
              <div
                key={contact.label}
                className={`${cardStyle} p-5`}
              >
                <p className="text-xs text-[#6B5240]">
                  {contact.label}
                </p>

                <p className="mt-2 text-sm font-medium">
                  {contact.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* KHÁM PHÁ THỰC ĐƠN */}
        <section className="mt-20 flex flex-col items-start justify-between gap-6 rounded-2xl bg-[#2F4A3A] p-8 text-white shadow-[0_10px_30px_rgba(46,31,20,0.2)] md:flex-row md:items-center md:p-10">
          <div>
            <p className="text-xs text-white/70">
              BrewLite Coffee
            </p>

            <h2 className="mt-2 text-2xl font-medium">
              Sẵn sàng cho ly nước yêu thích?
            </h2>

            <p className="mt-2 text-sm text-white/75">
              Khám phá thực đơn và chọn ngay món dành cho bạn.
            </p>
          </div>

          <Link
            href="/#menu"
            className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#2F4A3A] transition hover:bg-[#E8EFEA]"
          >
            Xem thực đơn
          </Link>
        </section>

      </div>
    </main>
  );
}
