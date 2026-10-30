import StoreShell from "@/components/layout/StoreShell";
import MenuProducts from "@/components/menu/MenuProducts";

export default function MenuPage() {
  return (
    <StoreShell active="Menu">
      <MenuProducts />
    </StoreShell>
  );
}