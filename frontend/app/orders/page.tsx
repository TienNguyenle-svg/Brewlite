import OrdersView from "@/components/orders/OrdersView";

export const instant = false;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ placed?: string }>;
}) {
  const { placed } = await searchParams;
  return <OrdersView placedId={placed} />;
}