import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartHydration from "@/components/cart/CartHydration";
import SiteChrome from "@/components/layout/SiteChrome";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "BrewLite",
  description: "BrewLite - Ứng dụng đặt cà phê không dùng tiền mặt",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-[#F8F5F0] antialiased`}>
        <CartHydration />
        <Suspense fallback={<>{children}</>}>
          <SiteChrome header={<Header />} footer={<Footer />}>
            {children}
          </SiteChrome>
        </Suspense>
      </body>
    </html>
  );
}