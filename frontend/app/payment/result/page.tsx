import type { Metadata } from "next";
import StoreShell from "@/components/layout/StoreShell";
import PaymentResult from "./PaymentResult";

export const metadata: Metadata = { title: "Payment result · BrewLite" };

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; orderId?: string }>;
}) {
  const params = await searchParams;

  return (
    <StoreShell>
      <PaymentResult
        status={params.status ?? null}
        orderId={params.orderId ?? null}
      />
    </StoreShell>
  );
}
