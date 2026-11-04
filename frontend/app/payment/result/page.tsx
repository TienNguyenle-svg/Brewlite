import type { Metadata } from "next";
import PaymentResult from "./PaymentResult";

export const metadata: Metadata = { title: "Payment result · BrewLite" };

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; orderId?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="px-4 pb-16 pt-[30px] sm:px-8 lg:px-[72px]">
      <PaymentResult
        status={params.status ?? null}
        orderId={params.orderId ?? null}
      />
    </main>
  );
}
