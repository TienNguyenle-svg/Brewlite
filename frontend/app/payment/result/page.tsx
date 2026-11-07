import { Suspense } from "react";
import PaymentResult from "./PaymentResult";

export const metadata = { title: "Payment result · BrewLite" };

export default function PaymentResultPage() {
  return (
    <main className="px-4 pb-16 pt-[30px] sm:px-8 lg:px-[72px]">
      <Suspense fallback={<p className="py-16 text-center text-sm text-[#82776E]">Đang tải kết quả thanh toán...</p>}>
        <PaymentResult />
      </Suspense>
    </main>
  );
}