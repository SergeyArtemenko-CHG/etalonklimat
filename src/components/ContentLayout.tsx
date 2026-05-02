import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

type ContentLayoutProps = {
  title: string;
  children: ReactNode;
  /** Блок под основной карточкой, на ширине каталога (например фильтр + товары) */
  afterCard?: ReactNode;
};

export default function ContentLayout({
  title,
  children,
  afterCard,
}: ContentLayoutProps) {
  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main className="px-4 py-6 md:py-10">
        <div className="mx-auto max-w-4xl rounded-2xl bg-card-bg px-4 py-6 shadow-md shadow-text-muted/8 md:px-8 md:py-8">
          <h1 className="mb-4 text-2xl font-semibold text-primary md:text-3xl">
            {title}
          </h1>
          <div className="space-y-6 text-sm leading-relaxed text-text-main md:text-base">
            {children}
          </div>
        </div>
        {afterCard ? (
          <div className="mx-auto mt-8 max-w-6xl">{afterCard}</div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

