import ContentLayout from "@/components/ContentLayout";

export const metadata = {
  title: "Бренд FBR — ETALON",
};

export default function FbrBrandPage() {
  return (
    <ContentLayout title="FBR">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:min-w-[220px]">
          <img
            src="/images/brands/FBR.png"
            alt="FBR"
            className="max-h-14 w-auto object-contain"
          />
        </div>
        <div className="space-y-3">
          <p>
            FBR — европейский бренд промышленного горелочного оборудования. В линейке представлены газовые,
            дизельные и комбинированные горелки для котлов различной мощности, в том числе для высоконагруженных
            промышленных объектов.
          </p>
          <p>
            Горелки FBR отличаются устойчивой работой в широком диапазоне нагрузок, точной модуляцией мощности,
            современными системами управления и соответствием европейским требованиям по безопасности и
            энергоэффективности.
          </p>
          <p>
            ETALON поставляет горелки FBR, подбирает модели под конкретные котлы и условия эксплуатации, а также
            помогает с подбором автоматики и обвязки.
          </p>
        </div>
      </div>
    </ContentLayout>
  );
}

