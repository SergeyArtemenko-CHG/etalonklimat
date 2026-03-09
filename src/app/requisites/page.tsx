import ContentLayout from "@/components/ContentLayout";

export const metadata = {
  title: "Реквизиты — ЭТАЛОН ПРОФИ",
};

export default function RequisitesPage() {
  return (
    <ContentLayout title="Реквизиты компании">
      <div className="space-y-4 text-sm md:text-base">
        <div>
          <p className="font-semibold text-slate-900">ООО «ЭТАЛОН ПРОФИ»</p>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-slate-900">Юридический адрес:</p>
          <p>
            111141, г. Москва, проезд Перова Поля 3-й, д.8, стр.11, пом.236, этаж 2
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-slate-900">Почтовый адрес:</p>
          <p>
            111141, г. Москва, проезд Перова Поля 3-й, д.8, стр.11, пом.236, этаж 2
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-slate-900">Контакты:</p>
          <p>Тел.: +7 925 182 81-79</p>
        </div>

        <div className="grid gap-1 md:grid-cols-2 md:gap-4">
          <div className="space-y-1">
            <p>
              <span className="font-semibold">ОГРН:</span> 1197746649638
            </p>
            <p>
              <span className="font-semibold">ИНН:</span> 7720486235
            </p>
            <p>
              <span className="font-semibold">КПП:</span> 772001001
            </p>
          </div>
          <div className="space-y-1">
            <p>
              <span className="font-semibold">Р/с:</span> 40702810106010000220
            </p>
            <p>
              <span className="font-semibold">К/с:</span> 30101810145250000411
            </p>
            <p>
              <span className="font-semibold">БИК:</span> 044525411
            </p>
            <p>
              в филиале «Центральный» Банка ВТБ ПАО, г. Москва
            </p>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}

