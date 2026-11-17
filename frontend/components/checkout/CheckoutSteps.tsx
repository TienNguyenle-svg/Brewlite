const STEPS = [
  { n: "01", label: "Thông tin của bạn", cls: "text-[#2F4A3A] font-semibold" },
  { n: "02", label: "Giao hàng", cls: "text-[#2E1F14] font-semibold" },
  { n: "03", label: "Thanh toán", cls: "text-[#6B5240] font-medium" },
];

export default function CheckoutSteps() {
  return (
    <div className="mt-[26px] flex h-[54px] items-center overflow-x-auto rounded-[14px] border border-[#D9CBAA] bg-white px-7 text-[13px]">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          {i > 0 && <span className="mx-6 h-[26px] w-px bg-[#D9CBAA] sm:mx-10" />}
          <span className={`whitespace-pre ${s.cls}`}>
            {s.n}  {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
