const STEPS = [
  { n: "01", label: "Your details", cls: "text-[#B9672B] font-semibold" },
  { n: "02", label: "Delivery", cls: "text-[#39281F] font-semibold" },
  { n: "03", label: "Payment", cls: "text-[#82776E] font-medium" },
];

export default function CheckoutSteps() {
  return (
    <div className="mt-[26px] flex h-[54px] items-center overflow-x-auto rounded-[14px] border border-[#E3DACF] bg-white px-7 text-[13px]">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          {i > 0 && <span className="mx-6 h-[26px] w-px bg-[#E3DACF] sm:mx-10" />}
          <span className={`whitespace-pre ${s.cls}`}>
            {s.n}  {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
