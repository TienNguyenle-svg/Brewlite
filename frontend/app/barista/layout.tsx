export default function BaristaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-[1440px] bg-[#F8F5F0] px-4 pb-14 pt-9 text-[#39281F] md:px-[72px]">
      {children}
    </main>
  );
}
