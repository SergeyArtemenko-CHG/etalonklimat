import ContentLayout from "@/components/ContentLayout";

export const metadata = {
  title: "Бренд ЭнергоГаз Сервис — ETALON",
};

export default function EgsBrandPage() {
  return (
    <ContentLayout title="ЭнергоГаз Сервис">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:min-w-[220px]">
          <img
            src="/images/brands/ICI.png"
            alt="ЭнергоГаз Сервис"
            className="max-h-14 w-auto object-contain"
          />
        </div>
        <div className="space-y-3">
          <p>
            «ЭнергоГаз Сервис» — российский бренд, специализирующийся на поставках и сервисе котельного и
            горелочного оборудования для промышленных и коммерческих объектов. Оборудование бренда применяется
            в системах теплоснабжения, технологическом пароснабжении и энергетике.
          </p>
          <p>
            Решения «ЭнергоГаз Сервис» сочетают высокую эффективность, надёжность и продуманную конструкцию,
            упрощающую монтаж и дальнейшее обслуживание. Линейка включает оборудование для работы с различными
            типами горелок и топлива.
          </p>
          <p>
            Специалисты ETALON подберут решения «ЭнергоГаз Сервис» под ваши требования по мощности, типу топлива
            и схеме подключения, а также подготовят техническое и коммерческое предложение.
          </p>
        </div>
      </div>
    </ContentLayout>
  );
}

