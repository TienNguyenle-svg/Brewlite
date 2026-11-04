import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CartHydration from "@/components/cart/CartHydration";
import SiteChrome from "@/components/SiteChrome";

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
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}