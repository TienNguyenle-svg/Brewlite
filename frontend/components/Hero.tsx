"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  { src: "/images/hero-1.jpg", alt: "Cà phê đá, trà đào và bánh croissant trên bàn gỗ", label: "Cà phê & bánh ngọt" },
  { src: "/images/hero-2.jpg", alt: "Ly trà đào cam sả mát lạnh", label: "Trà đào cam sả" },
  { src: "/images/hero-3.jpg", alt: "Cà phê sữa đá bên khung cửa sổ", label: "Cà phê sữa đá" },
];

const INTERVAL_MS = 4000;
const PROMO_CODE = "WELCOME10";

function ArrowDownIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  const goPrev = () => setCurrent((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  const goNext = () => setCurrent((i) => (i + 1) % SLIDES.length);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => {
      setCurrent((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearTimeout(id);
  }, [current, paused]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // trình duyệt chặn clipboard thì bỏ qua
    }
  }

  const arrowClass =
    "absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/35 focus-visible:opacity-100 active:scale-95 md:opacity-0 md:group-hover:opacity-100";

  return (
    <section className="grid overflow-hidden rounded-[32px] bg-[#2F4A3A] shadow-[0_20px_50px_-20px_rgba(46,31,20,0.45)] md:min-h-[340px] md:grid-cols-[1.5fr_1fr]">
      {/* ===== Bên trái: nội dung ===== */}
      <div className="relative flex flex-col justify-center overflow-hidden px-8 py-10 md:px-14">
        {/* Vệt sáng/tối trang trí cho nền đỡ phẳng */}
        <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-[#40634E]/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-[#223729]/70 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#E3C9A3] ring-1 ring-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E3C9A3]" />
            Mỗi ngày một niềm vui nhỏ
          </span>

          <h1 className="mt-5 text-4xl font-light leading-[1.1] text-[#F8F5EA] md:text-[52px]">
            Một ly ngon.
            <br />
            Một ngày{" "}
            <span className="font-medium text-[#E3C9A3]">vui hơn.</span>
          </h1>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#E4E8CF]">
            Chậm lại một chút, nhâm nhi món mình thích. Thức uống quen thuộc, pha mới mỗi ngày, đúng vị bạn thương.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <a
              href="#menu"
              className="group/btn flex items-center gap-2 rounded-xl bg-[#F1EBDB] px-5 py-3 text-sm font-medium text-[#2E1F14] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white"
            >
              <span className="transition-transform group-hover/btn:translate-y-0.5">
                <ArrowDownIcon />
              </span>
              Thức uống yêu thích
            </a>

            <button
              type="button"
              onClick={copyCode}
              title="Bấm để sao chép mã"
              className="flex items-center gap-2 rounded-xl border border-dashed border-white/40 px-4 py-3 text-xs text-[#E4E8CF] transition hover:border-white/70 hover:bg-white/10"
            >
              <TagIcon />
              <span>
                Giảm 10% cho đơn đầu tiên ·{" "}
                <b className="font-semibold tracking-wide text-[#E3C9A3]">
                  {copied ? "Đã sao chép!" : PROMO_CODE}
                </b>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== Bên phải: ảnh động (nằm trong khung nhỏ hơn) ===== */}
      <div className="p-4 md:p-6 md:pl-0">
        <div
          className="group relative h-full min-h-[240px] overflow-hidden rounded-3xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {SLIDES.map((slide, i) => (
            <Image
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="(min-width: 768px) 38vw, 100vw"
              aria-hidden={i !== current}
              className={`object-cover object-center transition-opacity duration-700 motion-reduce:transition-none ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}

          {/* Lớp phủ tối nhẹ ở đáy cho chấm điều hướng nổi */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />

          <button
            type="button"
            onClick={goPrev}
            aria-label="Ảnh trước"
            className={`${arrowClass} left-3`}
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Ảnh tiếp theo"
            className={`${arrowClass} right-3`}
          >
            <ChevronIcon direction="right" />
          </button>

          {/* Chấm điều hướng */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={i === current}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === current ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}