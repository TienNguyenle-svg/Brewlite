import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}