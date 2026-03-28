import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

/** Синхронно со страницей «Контакты» (src/app/contacts/page.tsx) */
const SITE_HOST = "etalonklimat.ru";
const CONTACT_EMAIL = "info@etalonklimat.ru";
const COMPANY_FULL_NAME = "ООО «ЭТАЛОН ПРОФИ»";
const COMPANY_INN = "7720486235";
const COMPANY_KPP = "772001001";
const COMPANY_ADDRESS =
  "111141, г. Москва, проезд Перова Поля 3-й, д.8, стр.11, пом.236, этаж 2";

export const metadata = {
  title: "Пользовательское соглашение — ETALON",
  description:
    "Публичная оферта и условия использования сайта etalonklimat.ru, статус партнёра, заказы и персональные данные.",
};

export default function AgreementPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <article className="rounded-2xl bg-white p-6 shadow-md shadow-slate-200/60 md:p-10">
          <nav className="mb-8 text-sm text-slate-500">
            <Link href="/" className="hover:text-[#003366]">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#0b1f33]">Пользовательское соглашение</span>
          </nav>

          <h1 className="mb-2 text-2xl font-bold text-[#0b1f33] md:text-3xl">
            Пользовательское соглашение (Публичная оферта)
          </h1>
          <p className="mb-10 text-sm text-slate-500">
            Дата публикации: 28 марта 2026 г.
          </p>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-[#003366] border-b-2 border-slate-200 pb-3">
              1. ОБЩИЕ ПОЛОЖЕНИЯ
            </h2>
            <ol className="list-none space-y-4 pl-0 text-slate-700 leading-relaxed">
              <li>
                <strong>1.1.</strong> Настоящее Пользовательское соглашение (далее — Соглашение)
                регулирует использование Сайта {SITE_HOST} (далее — Сайт). Сведения о товарах,
                ценах и характеристиках, размещённые в каталоге Сайта до индивидуального согласования
                заказа, носят{" "}
                <strong>информационно-справочный характер</strong> и не являются публичной офертой в
                смысле ст. 437 ГК РФ. Индивидуальные условия поставки конкретного товара (наименование,
                количество, цена, сроки, порядок оплаты) определяются при{" "}
                <strong>подтверждении заказа Администрацией Сайта и выставлении счёта на оплату</strong>{" "}
                (либо ином согласованном сторонами порядке акцепта) и в этом объёме могут
                рассматриваться как оферта и акцепт в соответствии с ГК РФ.
              </li>
              <li>
                <strong>1.2.</strong> Использование сервисов Сайта, регистрация Личного кабинета или
                оформление заказа означают полное и безоговорочное согласие Пользователя с условиями
                настоящего Соглашения.
              </li>
              <li>
                <strong>1.3.</strong> В случае несогласия с условиями Соглашения Пользователь обязан
                немедленно прекратить использование Сайта.
              </li>
              <li>
                <strong>1.4.</strong> Администратор Сайта, оператор персональных данных в случаях,
                предусмотренных Политикой в отношении обработки персональных данных, и продавец по
                договорам купли-продажи, заключаемым в рамках Сайта:{" "}
                <strong>{COMPANY_FULL_NAME}</strong>, ИНН {COMPANY_INN}, КПП {COMPANY_KPP},
                юридический адрес: {COMPANY_ADDRESS}. Контактный e-mail:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
                >
                  {CONTACT_EMAIL}
                </a>
                , телефон и иные реквизиты — на странице{" "}
                <Link
                  href="/contacts"
                  className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
                >
                  «Контакты»
                </Link>
                .
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-[#003366] border-b-2 border-slate-200 pb-3">
              2. СТАТУС ПОЛЬЗОВАТЕЛЯ И ПОРЯДОК ЦЕНООБРАЗОВАНИЯ
            </h2>
            <ol className="list-none space-y-4 pl-0 text-slate-700 leading-relaxed">
              <li>
                <strong>2.1.</strong> Сайт предоставляет специализированный сервис для подбора
                промышленного оборудования.
              </li>
              <li>
                <strong>2.2.</strong> Цены на Сайте формируются динамически на основании Статуса
                партнера (1, 2 или 3), который присваивается Пользователю Администрацией Сайта после
                верификации данных в Личном кабинете.
              </li>
              <li>
                <strong>2.3.</strong> Пользователь несет ответственность за достоверность данных,
                предоставленных при регистрации для получения партнерского статуса.
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-[#003366] border-b-2 border-slate-200 pb-3">
              3. ПОРЯДОК ОФОРМЛЕНИЯ ЗАКАЗА
            </h2>
            <ol className="list-none space-y-4 pl-0 text-slate-700 leading-relaxed">
              <li>
                <strong>3.1.</strong> Для уточнения технических характеристик промышленных горелок и
                комплектующих Пользователь может воспользоваться{" "}
                <strong>виджетом онлайн-чата</strong> на Сайте, <strong>формами запроса</strong> в
                карточке товара (цена, скидка, срок поставки) либо обратиться{" "}
                <strong>по телефону и e-mail</strong>, указанным на странице{" "}
                <Link
                  href="/contacts"
                  className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
                >
                  «Контакты»
                </Link>{" "}
                ({SITE_HOST}/contacts).
              </li>
              <li>
                <strong>3.2.</strong> Оформление заказа на Сайте выражает намерение Пользователя
                заключить договор купли-продажи. Договор по конкретному заказу считается заключённым с
                момента подтверждения заказа менеджером и выставления счёта на оплату (либо иного
                акцепта в порядке, согласованном сторонами).{" "}
                <strong>
                  Условия заказов, подтверждённых до изменения текста Соглашения, сохраняют силу в
                  части, согласованной на момент подтверждения и оплаты (принятия к исполнению)
                </strong>
                , независимо от последующих редакций Соглашения.
              </li>
              <li>
                <strong>3.3.</strong> Администрация Сайта оставляет за собой право аннулировать заказ
                в случае отсутствия товара на складе или технической ошибки в указании цены.
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-[#003366] border-b-2 border-slate-200 pb-3">
              4. ПЕРСОНАЛЬНЫЕ ДАННЫЕ И РАССЫЛКИ
            </h2>
            <ol className="list-none space-y-4 pl-0 text-slate-700 leading-relaxed">
              <li>
                <strong>4.1.</strong> Порядок обработки персональных данных регулируется отдельным
                документом — Политикой в отношении обработки персональных данных, доступной по
                адресу:{" "}
                <Link
                  href="/privacy-policy"
                  className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
                >
                  {SITE_HOST}/privacy-policy
                </Link>
                .
              </li>
              <li>
                <strong>4.2.</strong> Принимая условия настоящего Соглашения, Пользователь
                соглашается на получение системных уведомлений (статусы заказов, подтверждение
                входа) на указанный e-mail или номер телефона.
              </li>
              <li>
                <strong>4.3.</strong> Согласие на получение рекламных рассылок является добровольным и
                может быть отозвано Пользователем в любое время через настройки Личного кабинета
                (при наличии) либо путём направления запроса на адрес электронной почты{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-[#003366] border-b-2 border-slate-200 pb-3">
              5. ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ
            </h2>
            <ol className="list-none space-y-4 pl-0 text-slate-700 leading-relaxed">
              <li>
                <strong>5.1.</strong> Администрация Сайта не несет ответственности за убытки,
                возникшие у Пользователя вследствие неправильного использования промышленного
                оборудования или ошибок при самостоятельном подборе комплектующих без консультации
                со специалистом.
              </li>
              <li>
                <strong>5.2.</strong> Сайт может быть временно недоступен в связи с проведением
                технических работ.
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-[#003366] border-b-2 border-slate-200 pb-3">
              6. ПОРЯДОК ИЗМЕНЕНИЯ СОГЛАШЕНИЯ
            </h2>
            <ol className="list-none space-y-4 pl-0 text-slate-700 leading-relaxed">
              <li>
                <strong>6.1.</strong> Администрация Сайта имеет право в одностороннем порядке
                изменять условия настоящего Соглашения. Новая редакция публикуется на Сайте и вступает
                в силу с момента её размещения, если иной срок вступления в силу не указан в тексте
                редакции. При существенных изменениях Администрация вправе направить уведомление на
                адрес электронной почты, указанный Пользователем при регистрации или в заказе.
              </li>
              <li>
                <strong>6.2.</strong> Продолжение использования Сайта после вступления в силу новой
                редакции означает согласие Пользователя с её условиями, если иное не вытекает из
                пункта 3.2 настоящего Соглашения.
              </li>
            </ol>
          </section>

          <p className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
            Дата публикации: 28 марта 2026 г.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
