import Image from "next/image";

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="grid overflow-hidden rounded-3xl bg-[#4B5A24] md:min-h-[385px] md:grid-cols-2">
      <div className="flex flex-col justify-center px-8 py-10 md:px-14">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[#E3C9A3]">
          MỖI NGÀY MỘT NIỀM VUI NHỎ
        </p>
        <h1 className="mt-4 text-4xl font-light leading-tight text-[#F8F5EA] md:text-5xl">
          Một ly ngon.
          <br />
          Một ngày vui hơn.
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-500">
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

      <div className="relative min-h-[240px]">
        <Image
          src="/images/hero.jpg"
          alt="Iced coffee, peach tea and a croissant on a wooden table"
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}