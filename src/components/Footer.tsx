import Link from "next/link";

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white/90 transition hover:border-[#FF8C00] hover:bg-[#FF8C00] hover:text-white"
      aria-label={label}
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#003366] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* О компании */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">
              О компании
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link href="/about" className="transition hover:text-[#FF8C00]">
                  О нас
                </Link>
              </li>
              <li>
                <Link href="/requisites" className="transition hover:text-[#FF8C00]">
                  Реквизиты
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-[#FF8C00]">
                  Отзывы
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="transition hover:text-[#FF8C00]">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Каталог */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">
              Каталог
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link href="/category/gorelki-dlya-kotlov-otopleniya" className="transition hover:text-[#FF8C00]">
                  Горелки для котлов
                </Link>
              </li>
              <li>
                <Link href="/category/kotly-vodogreinye" className="transition hover:text-[#FF8C00]">
                  Котлы водогрейные
                </Link>
              </li>
              <li>
                <Link href="/category/kotly-parovye" className="transition hover:text-[#FF8C00]">
                  Котлы паровые
                </Link>
              </li>
              <li>
                <Link href="/category/deaeratory" className="transition hover:text-[#FF8C00]">
                  Деаэраторы
                </Link>
              </li>
            </ul>
          </div>

          {/* Клиентам */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">
              Клиентам
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link href="/delivery" className="transition hover:text-[#FF8C00]">
                  Доставка и оплата
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-[#FF8C00]">
                  Как сделать заказ
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-[#FF8C00]">
                  Возврат и обмен
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">
              Контакты
            </h3>
            <a
              href="tel:+74993980140"
              className="mb-2 block text-lg font-semibold text-white hover:text-[#FF8C00]"
            >
              +7 (499) 398-01-40
            </a>
            <p className="mb-2 text-sm text-white/80">
              111141, г. Москва, проезд Перова Поля 3-й, д.8, стр.11, пом.236, этаж 2
            </p>
            <a
              href="mailto:info@etalonklimat.ru"
              className="mb-4 block text-sm text-white/80 underline-offset-2 hover:text-[#FF8C00] hover:underline"
            >
              info@etalonklimat.ru
            </a>
            <div className="flex gap-2">
              <SocialIcon href="https://vk.com" label="ВКонтакте">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.335-3.202C2.666 10.536 2.048 8.4 2.048 8.07c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.717-.576.717z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://t.me" label="Telegram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.098.155.229.171.322.016.094.036.308.02.475z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://youtube.com" label="YouTube">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </SocialIcon>
            </div>
          </div>
        </div>

        {/* Bottom: legal */}
        <div className="mt-10 border-t border-white/20 pt-6">
          <div className="flex flex-col gap-2 text-center text-[11px] text-white/70 leading-snug max-w-2xl mx-auto">
            <p>
              Продолжая использовать наш сайт, вы даете согласие на обработку Cookies и других
              данных в соответствии с{" "}
              <Link
                href="/privacy-policy"
                className="underline underline-offset-1 hover:text-[#FF8C00] transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                Политикой конфиденциальности
              </Link>{" "}
              и{" "}
              <Link
                href="/agreement"
                className="underline underline-offset-1 hover:text-[#FF8C00] transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                Пользовательским соглашением
              </Link>
              .
            </p>
            <p>
              Вся информация на сайте – собственность Etalonklimat.ru. Публикация без разрешения
              запрещена. Информация на сайте не является публичной офертой, определяемой положениями Статьи 437 ГК РФ.
            </p>
          </div>
          <p className="mt-4 text-center text-[11px] text-white/60">
            © {new Date().getFullYear()} ООО «ЭТАЛОН ПРОФИ» · ИНН 7720486235 · КПП 772001001 · 111141,
            г. Москва, проезд Перова Поля 3-й, д.8, стр.11, пом.236, этаж 2
          </p>
        </div>
      </div>
    </footer>
  );
}
