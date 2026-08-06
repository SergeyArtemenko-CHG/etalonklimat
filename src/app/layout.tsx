import type { Metadata } from "next";
import { Inter, Open_Sans } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import CurrencyRateLoader from "@/components/CurrencyRateLoader";
import CookieBanner from "@/components/CookieBanner";
import FloatingContactBtn from "@/components/FloatingContactBtn";
import FloatingScrollToTop from "@/components/FloatingScrollToTop";
import ProductRequestModalHost from "@/components/ProductRequestModalHost";
import ToastContainer from "@/components/ToastContainer";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import YandexMetrika from "@/components/YandexMetrika";
import { SITE_THEME_STORAGE_KEY } from "@/lib/site-theme";
import { getSiteOrigin } from "@/lib/site-url";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: "Эталон Профи — поставка и сервис оборудования",
  description:
    "Профессиональное климатическое оборудование. Скидки до 50% для партнеров, отгрузка со склада в Москве по всей России",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chatScriptSrc = process.env.NEXT_PUBLIC_CHAT_WIDGET_SRC;

  return (
    <html lang="ru" className="theme-1" suppressHydrationWarning>
      <head>
        <Script
          id="site-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var k=${JSON.stringify(SITE_THEME_STORAGE_KEY)};
    var t=localStorage.getItem(k);
    var root=document.documentElement;
    root.classList.remove('theme-1','theme-2');
    root.classList.add(t==='theme-2'?'theme-2':'theme-1');
  } catch(e) {
    document.documentElement.classList.add('theme-1');
  }
})();`,
          }}
        />
        <meta
          httpEquiv="Content-Security-Policy"
          content="upgrade-insecure-requests"
        />
        {chatScriptSrc && (
          <Script
            id="external-chat-widget"
            src={chatScriptSrc}
            strategy="lazyOnload"
          />
        )}
      </head>
      <body
        className={`${inter.variable} ${openSans.variable} font-sans antialiased min-h-screen flex flex-col bg-main-bg text-text-main`}
      >
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/109012283"
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
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
