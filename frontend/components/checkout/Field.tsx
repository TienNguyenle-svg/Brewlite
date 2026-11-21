export const inputCls =
  "h-12 w-full rounded-[10px] border border-[#D9CBAA] bg-white px-4 text-[13px] outline-none placeholder:text-[#6B5240] focus:border-[#2F4A3A]";

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
