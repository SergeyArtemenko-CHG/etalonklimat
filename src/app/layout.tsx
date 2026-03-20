import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
  display: "swap",
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
  const metrikaId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
  const chatScriptSrc = process.env.NEXT_PUBLIC_CHAT_WIDGET_SRC;

  return (
    <html lang="ru">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="upgrade-insecure-requests"
        />
        {metrikaId && (
          <Script id="yandex-metrika" strategy="afterInteractive">
            {`
              (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {
                  if (document.scripts[j].src === r) { return; }
                }
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
              })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
              ym(${JSON.stringify(metrikaId)}, "init", {
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true
              });
            `}
          </Script>
        )}
        {chatScriptSrc && (
          <Script
            id="external-chat-widget"
            src={chatScriptSrc}
            strategy="lazyOnload"
          />
        )}
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
