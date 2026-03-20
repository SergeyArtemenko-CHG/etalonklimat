import ContentLayout from "@/components/ContentLayout";

export const metadata = {
  title: "Частые вопросы — ETALON",
};

export default function FaqPage() {
  return (
    <ContentLayout title="Частые вопросы">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0b1f33]">Личный кабинет</h2>

        <div className="space-y-2">
          <h3 className="font-medium text-slate-900">Как создать аккаунт на сайте?</h3>
          <p>
            Нажмите кнопку входа в правом верхнем углу сайта, перейдите в личный
            кабинет, укажите ваши контактные данные и продолжите регистрацию по
            кнопке «Далее».
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-slate-900">Какие возможности дает личный кабинет?</h3>
          <p>
            В личном кабинете удобно оформлять заявки, смотреть документы по
            отгрузкам и контролировать текущий статус заказов. Также там можно
            найти контакты менеджера, который сопровождает ваш заказ.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-slate-900">
            Видны ли в личном кабинете заказы, оформленные не через сайт?
          </h3>
          <p>
            Да. Если заказ оформлен на добавленную в кабинет организацию, он
            отображается в общем списке ваших заказов.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-slate-900">
            Куда обратиться, если возникли вопросы по кабинету?
          </h3>
          <p>
            По вопросам работы личного кабинета и сайта напишите нам на{" "}
            <a
              href="mailto:info@etalonklimat.ru"
              className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#ff8c00]"
            >
              info@etalonklimat.ru
            </a>
            .
          </p>
        </div>
      </section>
    </ContentLayout>
  );
}

