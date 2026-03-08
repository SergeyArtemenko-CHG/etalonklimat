import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

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

          <h1 className="mb-6 text-2xl font-bold text-[#0b1f33] md:text-3xl">
            Пользовательское соглашение
          </h1>
          <p className="mb-10 text-slate-600 leading-relaxed">
            Мы рады приветствовать вас на нашем сайте! Для достижения взаимопонимания приводим текст
            Пользовательского соглашения, в котором изложены правила пользования услугами
            Интернет-магазина «Etalonklimat.ru». Пожалуйста, внимательно ознакомьтесь с ним, чтобы
            продолжить наше сотрудничество!
          </p>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              1. Термины и определения
            </h2>
            <dl className="space-y-4 text-slate-700 leading-relaxed">
              <div>
                <dt className="font-medium text-slate-800">Продавец</dt>
                <dd>
                  ООО «ЭТАЛОН ПРОФИ», ИНН 7720486235, КПП 772001001. Юридический адрес: 111141, г. Москва,
                  проезд Перова Поля 3-й, д.8, стр.11, пом.236, этаж 2.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Покупатель</dt>
                <dd>
                  Физическое или юридическое лицо, способное принять и оплатить Товар в порядке и на
                  условиях, установленных настоящим Соглашением и законодательством РФ.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Товар</dt>
                <dd>Материальный объект купли-продажи, информация о котором размещена на Сайте.</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Интернет-магазин</dt>
                <dd>Торговая площадка Продавца в сети интернет с каталогом Товаров и механизмом оформления Заказа.</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Сайт</dt>
                <dd>Веб-ресурс https://etalonklimat.ru</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Заказ</dt>
                <dd>Документ с перечнем Товаров, выбранных Покупателем. Формируется в электронном виде на Сайте.</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Доставка</dt>
                <dd>Доставка Товара третьим лицом (перевозчиком) Покупателю.</dd>
              </div>
            </dl>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              2. Общие условия
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>2.1.</strong> Заказывая Товары на Сайте, Покупатель принимает условия
                настоящего Соглашения. В случае несогласия обязан прекратить использование сервиса.
              </p>
              <p>
                <strong>2.2.</strong> Товар представлен на Сайте через фотообразцы, графические и
                текстовые материалы, не являющиеся публичной офертой.
              </p>
              <p>
                <strong>2.3.</strong> Регистрируясь на Сайте, Покупатель соглашается с Политикой
                конфиденциальности Продавца.
              </p>
              <p>
                <strong>2.4.</strong> Продавец осуществляет продажу Товаров на территории РФ.
              </p>
              <p>
                <strong>2.5.</strong> Продавец в одностороннем порядке принимает и изменяет условия
                Соглашения.
              </p>
              <p>
                <strong>2.6.</strong> Применяются положения ГК РФ о розничной купле-продаже, Закон
                «О защите прав потребителей» № 2300-1 и иные правовые акты.
              </p>
              <p>
                <strong>2.7.</strong> Закон «О защите прав потребителей» не распространяется на
                юридических лиц и ИП, приобретающих Товар для предпринимательской деятельности.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              3. Предмет соглашения
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>3.1.</strong> Продавец продает Товар по ценам, опубликованным на Сайте, при
                предварительной оплате 100%. Покупатель оплачивает и принимает Товар.
              </p>
              <p>
                <strong>3.2.</strong> Доставка осуществляется способом и в сроки, оговоренные сторонами.
              </p>
              <p>
                <strong>3.4.</strong> Продавец вправе отказать в продаже при нарушении условий Соглашения.
              </p>
              <p>
                <strong>3.5.</strong> Продавец вправе модифицировать Соглашение без предварительного
                уведомления, но это не освобождает от обязательств по уже оформленным Заказам.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              4. Информация о Товаре
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>4.1.</strong> Фотообразцы имитируют представленный Товар. Реальный вид может
                не совпадать с изображением. Каждый фотообразец сопровождается артикулом, ценой и
                описанием.
              </p>
              <p>
                <strong>4.3.</strong> При приобретении технически сложных товаров, требующих
                специализированной установки, Продавец не несет ответственности за правильность
                подключения, за исключением случаев, когда Покупатель пользуется услугами
                Интернет-магазина.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              5. Заказ Товара
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>5.1.</strong> Заказ оформляется через Сайт или по телефонам, указанным на Сайте.
              </p>
              <p>
                <strong>5.2.</strong> При заказе через Сайт Покупатель проходит регистрацию и
                указывает персональные данные. Условия хранения — в Политике конфиденциальности.
              </p>
              <p>
                <strong>5.3.</strong> При отсутствии заказанного Товара Продавец информирует
                Покупателя в течение 1 рабочего дня. Покупатель вправе согласиться на замену или
                аннулировать Заказ.
              </p>
              <p>
                <strong>5.5.</strong> Покупатель вправе изменить состав Заказа до момента завершения
                формирования.
              </p>
              <p>
                <strong>5.6.</strong> Информирование о заказе может осуществляться по телефону, SMS,
                email, Viber, WhatsApp, push-уведомлениям.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              6. Оплата Товара
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>6.1.</strong> Оплата по ценам, устанавливаемым Продавцом.
              </p>
              <p>
                <strong>6.2.</strong> Цены в рублях, включают налоги. Стоимость Доставки обговаривается
                отдельно.
              </p>
              <p>
                <strong>6.3.</strong> Цена может быть изменена Продавцом в одностороннем порядке.
              </p>
              <p>
                <strong>6.4.</strong> Оплата: платежной картой при оформлении Заказа; перечислением
                на расчетный счет; электронными средствами; почтовым переводом по реквизитам Продавца.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              7. Доставка Товара
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>7.1.</strong> Способы доставки:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>самовывоз из пункта выдачи, склада или офиса — бесплатно;</li>
                <li>курьер по городу;</li>
                <li>курьерская служба в регионы;</li>
                <li>транспортная компания в регионы.</li>
              </ul>
              <p>
                <strong>7.3.</strong> Расходы по Доставке оплачиваются Покупателем.
              </p>
              <p>
                <strong>7.6.</strong> При приеме Товара Покупателю необходимо проверить комплектацию,
                внешний вид, наличие документов.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              8. Возврат Товара и денежных средств
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>8.1.</strong> Возврат и обмен — в соответствии с ГК РФ и Законом «О защите
                прав потребителей» № 2300-1.
              </p>
              <p>
                <strong>8.2.</strong> Возврат Товара надлежащего качества возможен в течение 7 дней
                при сохранении товарного вида, пломб и ярлыков.
              </p>
              <p>
                <strong>8.3.</strong> Товар ненадлежащего качества может быть заменен или возвращен.
                Расходы по Доставке в этом случае оплачивает Продавец.
              </p>
              <p>
                <strong>8.8.</strong> Возврат денежных средств — не позднее 30 календарных дней со
                дня получения заявления Покупателя.
              </p>
              <p>
                По вопросам возврата:{" "}
                <a href="mailto:info@etalonklimat.ru" className="text-[#FF8C00] underline hover:text-[#ff9f26]">
                  info@etalonklimat.ru
                </a>
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              9. Гарантия на Товар
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>9.1.</strong> Продавец несет ответственность за недостатки в течение
                гарантийного срока.
              </p>
              <p>
                <strong>9.2.</strong> Гарантийный срок устанавливается в договоре или гарантийном талоне.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              10. Авторское право
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Вся информация на Сайте (изображения, характеристики, тексты, дизайн, логотип) — собственность
              Продавца. Копирование и иное использование контента запрещено.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              11. Конфиденциальность
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>11.1.</strong> Продавец гарантирует сохранение конфиденциальности данных о Покупателе.
              </p>
              <p>
                <strong>11.2.</strong> Интернет-магазин вправе прекратить доступ в Личный кабинет и
                заблокировать регистрацию без предварительного уведомления.
              </p>
              <p>
                <strong>11.6.</strong> Адреса электронной почты, указанные при регистрации, могут
                включаться в рассылку. Покупатель вправе отказаться, перейдя по ссылке в рассылке.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              12. Ответственность сторон
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Продавец не несет ответственности за недостоверные данные Покупателя; за действия
                банков, почты, провайдеров; за расходы и ущерб, возникшие не по вине
                Интернет-магазина.
              </p>
              <p>
                <strong>12.3.</strong> Использование Сайта допускается совершеннолетними лицами.
                Покупатель несет ответственность за использование учетной записи несовершеннолетним.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              13. Урегулирование споров
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Споры разрешаются путем переговоров. При невозможности — в порядке, установленном
              законодательством РФ.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              14. Особые условия, форс-мажор
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Стороны освобождаются от ответственности при неисполнении обязательств вследствие
              форс-мажора (наводнения, пожары, землетрясения, военные действия и т.п.), которые не
              могли быть предвидены или предотвращены.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-[#003366] border-b border-slate-200 pb-2">
              15. Срок действия
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Соглашение вступает в силу с момента регистрации Покупателя на Сайте или обращения к
              Продавцу для приобретения Товара. Моментом обращения считается начало действий,
              направленных на приобретение Товара.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
