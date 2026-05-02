"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const YANDEX_METRIKA_ID = 109012283;

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
  }
}

export default function YandexMetrika() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [tagReady, setTagReady] = useState(false);
  const skipInitialHit = useRef(true);

  useEffect(() => {
    if (!tagReady || typeof window === "undefined" || typeof window.ym !== "function") return;
    if (skipInitialHit.current) {
      skipInitialHit.current = false;
      return;
    }
    window.ym(YANDEX_METRIKA_ID, "hit", window.location.href);
  }, [pathname, query, tagReady]);

  return (
    <Script
      id="yandex-metrika"
      strategy="afterInteractive"
      onLoad={() => setTagReady(true)}
      dangerouslySetInnerHTML={{
        __html: `
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {
    if (document.scripts[j].src === r) { return; }
  }
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(${YANDEX_METRIKA_ID}, "init", {
  clickmap:true,
  trackLinks:true,
  accurateTrackBounce:true,
  webvisor:true,
  ecommerce:"dataLayer"
});
`,
      }}
    />
  );
}
