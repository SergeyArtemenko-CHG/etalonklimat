import ContentLayout from "@/components/ContentLayout";

export const metadata = {
  title: "Бренд Энергостандарт — ETALON",
};

export default function EnergostandartBrandPage() {
  return (
    <ContentLayout title="Энергостандарт">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:min-w-[220px]">
          <img
            src="/images/brands/ENERGOSTANDART.png"
            alt="Энергостандарт"
            className="max-h-14 w-auto object-contain"
          />
        </div>
        <div className="space-y-3">
          <p>
            «Энергостандарт» — российский производитель оборудования для котельных и систем теплоснабжения.
            Линейка бренда включает водогрейные и паровые котлы, деаэраторы, баки и вспомогательное оборудование
            для промышленных и коммунальных объектов.
          </p>
          <p>
            Оборудование «Энергостандарт» отличается надёжной конструкцией, адаптацией к российским условиям
            эксплуатации, удобством обслуживания и конкурентной стоимостью. Решения бренда применяются
            на объектах энергетики, ЖКХ, промышленных предприятиях и в коммерческой недвижимости.
          </p>
          <p>
            Специалисты ETALON помогут подобрать оборудование «Энергостандарт» под ваши задачи, подготовить
            техническое решение и коммерческое предложение, а также организовать поставку по России.
          </p>
        </div>
      </div>
    </ContentLayout>
  );
}

