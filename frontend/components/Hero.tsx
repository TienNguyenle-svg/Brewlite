"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  { src: "/images/hero-1.jpg", alt: "Cà phê đá, trà đào và bánh croissant trên bàn gỗ" },
  { src: "/images/hero-2.jpg", alt: "Ly trà đào cam sả mát lạnh" },
  { src: "/images/hero-3.jpg", alt: "Cà phê sữa đá bên khung cửa sổ" },
];

const INTERVAL_MS = 3000;

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

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const goPrev = () => setCurrent((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  const goNext = () => setCurrent((i) => (i + 1) % SLIDES.length);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => {
      setCurrent((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearTimeout(id);
  }, [current, paused]);

  const arrowClass =
    "absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#F8F5EA]/25 text-[#F8F5EA] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-[#F8F5EA]/40 focus-visible:opacity-100 active:scale-95 md:opacity-0 md:group-hover:opacity-100";

  return (
    <section className="grid overflow-hidden rounded-3xl bg-[#4B5A24] md:min-h-[260px] md:grid-cols-[2fr_1fr]">
      <div className="flex flex-col justify-center px-8 py-10 md:px-14">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[#E3C9A3]">
          MỖI NGÀY MỘT NIỀM VUI NHỎ
        </p>
        <h1 className="mt-4 text-4xl font-light leading-tight text-[#F8F5EA] md:text-5xl">
          Một ly ngon.
          <br />
          Một ngày vui hơn.
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#E4E8CF]">
          Chậm lại một chút, nhâm nhi món mình thích. Thức uống quen thuộc, pha mới mỗi ngày, đúng vị bạn thương.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a
            href="#menu"
            className="flex items-center gap-2 rounded-lg bg-[#F1EBDB] px-4 py-2.5 text-sm font-medium text-[#2E1F14]"
          >
            <ArrowDownIcon />
            Thức uống yêu thích
          </a>
          <span className="text-xs text-[#E4E8CF]">
            Giảm 10% cho đơn đầu tiên · GUDMUD
          </span>
        </div>
      </div>

      <div
        className="group relative min-h-[160px]"
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
            sizes="(min-width: 768px) 33vw, 100vw"
            aria-hidden={i !== current}
            className={`object-cover transition-opacity duration-700 motion-reduce:transition-none ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

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

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              aria-current={i === current}
              className={`h-2 rounded-full transition-all ${
                i === current ? "w-6 bg-[#F8F5EA]" : "w-2 bg-[#F8F5EA]/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}