import ContentLayout from "@/components/ContentLayout";

export const metadata = {
  title: "Доставка и оплата — ETALON",
};

export default function DeliveryPage() {
  return (
    <ContentLayout title="Доставка и оплата">
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[#0b1f33] md:text-lg">
          Доставка оборудования
        </h2>
        <p>
          Поставки осуществляются по всей территории России через проверенные транспортные
          компании. Мы подбираем оптимальный вариант по срокам и стоимости, учитывая габариты
          и особенности груза.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Отгрузка со склада в Москве или с заводов-производителей.</li>
          <li>Доставка до терминала ТК или до двери заказчика.</li>
          <li>Оформление сопроводительных документов и страхование по запросу.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[#0b1f33] md:text-lg">
          Условия оплаты
        </h2>
        <p>
          Работаем только с юридическими лицами и ИП. Все цены указаны с НДС, возможна оплата
          по безналичному расчёту в рублях.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>100% предоплата по счёту.</li>
          <li>По крупным проектам возможен поэтапный график платежей.</li>
          <li>Предоставление полного пакета закрывающих документов.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[#0b1f33] md:text-lg">
          Сроки поставки
        </h2>
        <p>
          Сроки зависят от наличия на складе и производственного цикла завода. Точные даты
          отгрузки фиксируются в коммерческом предложении и договоре поставки.
        </p>
      </section>
    </ContentLayout>
  );
}

