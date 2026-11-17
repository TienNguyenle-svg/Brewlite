export default function BaristaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-[1440px] bg-[#F3EAD8] px-4 pb-14 pt-9 text-[#2E1F14] md:px-[72px]">
      {children}
    </main>
  );
}
