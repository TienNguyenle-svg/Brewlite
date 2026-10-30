export const inputCls =
  "h-12 w-full rounded-[10px] border border-[#E3DACF] bg-white px-4 text-[13px] outline-none placeholder:text-[#82776E] focus:border-[#B9672B]";

export default function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-2.5 ${className}`}>
      <span className="text-xs font-semibold">{label}</span>
      {children}
    </label>
  );
}
