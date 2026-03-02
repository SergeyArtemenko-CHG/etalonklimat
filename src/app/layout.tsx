import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CurrencyRateLoader from "@/components/CurrencyRateLoader";
import CookieBanner from "@/components/CookieBanner";
import FloatingContactBtn from "@/components/FloatingContactBtn";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://etma-pro.ru"),
  title: "ETALON — B2B каталог",
  description: "Профессиональный B2B-портал оборудования",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <CurrencyRateLoader />
        {children}
        <CookieBanner />
        <FloatingContactBtn />
      </body>
    </html>
  );
}
