import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

type ContentLayoutProps = {
  title: string;
  children: ReactNode;
};

export default function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="px-4 py-6 md:py-10">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white px-4 py-6 shadow-md shadow-slate-200/60 md:px-8 md:py-8">
          <h1 className="mb-4 text-2xl font-semibold text-[#0b1f33] md:text-3xl">
            {title}
          </h1>
          <div className="space-y-6 text-sm leading-relaxed text-slate-700 md:text-base">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

