import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-4 text-2xl font-semibold text-slate-900">
          Личный кабинет
        </h1>
        <p className="text-sm text-slate-600">
          Здесь позже можно вывести историю заказов, данные компании и другие
          элементы личного кабинета. Сейчас эта страница служит целевой точкой
          после входа.
        </p>
      </main>
      <Footer />
    </div>
  );
}

