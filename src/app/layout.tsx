import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CurrencyRateLoader from "@/components/CurrencyRateLoader";
import CookieBanner from "@/components/CookieBanner";
import FloatingContactBtn from "@/components/FloatingContactBtn";
import FloatingScrollToTop from "@/components/FloatingScrollToTop";
import ProductRequestModalHost from "@/components/ProductRequestModalHost";
import ToastContainer from "@/components/ToastContainer";
import AuthSessionProvider from "@/components/AuthSessionProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  // 1. Закрываем от поисковиков
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  
  // 2. Ваши текущие настройки
  metadataBase: new URL("https://etalonklimat.ru"),
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
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="upgrade-insecure-requests"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <CurrencyRateLoader />
        <ProductRequestModalHost />
        <ToastContainer />
        <AuthSessionProvider>
          {/* Обертка flex-1 заставит содержимое страниц (включая их футеры) растягиваться на весь экран */}
          <div className="flex flex-col flex-1">{children}</div>

          <CookieBanner />
          <FloatingScrollToTop />
          <FloatingContactBtn />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
