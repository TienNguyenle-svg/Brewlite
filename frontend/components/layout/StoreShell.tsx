import Navbar from "@/components/layout/Navbar";


export default function StoreShell({
  active = "",
  children,
}: {
  active?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8F5F0] text-[#39281F]">
      <Navbar active={active} />
      <main className="flex-1 px-4 pb-16 pt-[30px] sm:px-8 lg:px-[72px]">
        {children}
      </main>
    </div>
  );
}
