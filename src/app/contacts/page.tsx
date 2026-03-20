import ContentLayout from "@/components/ContentLayout";
import ContactsMapSection from "@/components/ContactsMapSection";

export const metadata = {
  title: "Контакты — ETALON",
};

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#003366]/5 text-[#003366]">
        {icon}
      </div>
      <div className="space-y-0.5 text-sm md:text-base">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </div>
        <div className="text-slate-800">{children}</div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <ContentLayout title="Контакты">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <ContactRow
            label="Телефон"
            icon={
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M6.6 5.2 8.8 4a1 1 0 0 1 1.3.4l1.4 2.5a1 1 0 0 1-.2 1.2l-1.1 1.1a10.5 10.5 0 0 0 4.7 4.7l1.1-1.1a1 1 0 0 1 1.2-.2l2.5 1.4a1 1 0 0 1 .4 1.3l-1.2 2.2a1.5 1.5 0 0 1-1.4.8A14 14 0 0 1 4 6.6 1.5 1.5 0 0 1 4.8 5Z"
                  fill="currentColor"
                />
              </svg>
            }
          >
            <a
              href="tel:+74993980140"
              className="font-semibold text-[#003366] hover:text-[#ff8c00]"
            >
              +7 (499) 398-01-40
            </a>
          </ContactRow>

          <ContactRow
            label="E-mail"
            icon={
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M4 7.5 12 12l8-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            }
          >
            <a
              href="mailto:info@etalonklimat.ru"
              className="font-semibold text-[#003366] hover:text-[#ff8c00]"
            >
              info@etalonklimat.ru
            </a>
          </ContactRow>

          <ContactRow
            label="Адрес офиса"
            icon={
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M12 3a6 6 0 0 0-6 6c0 4.2 6 9.5 6 9.5S18 13.2 18 9a6 6 0 0 0-6-6Zm0 8.2A2.2 2.2 0 1 1 14.2 9 2.2 2.2 0 0 1 12 11.2Z"
                  fill="currentColor"
                />
              </svg>
            }
          >
            111141, г. Москва, проезд Перова Поля 3-й, д.8, стр.11, пом.236, этаж 2
          </ContactRow>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
            Реквизиты компании
          </h2>
          <ul className="space-y-1 text-sm text-slate-700 md:text-base">
            <li>ООО «ЭТАЛОН ПРОФИ»</li>
            <li>ИНН 7720486235 · КПП 772001001</li>
            <li>111141, г. Москва, проезд Перова Поля 3-й, д.8, стр.11, пом.236, этаж 2</li>
          </ul>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[#0b1f33] md:text-lg">
          Схема проезда
        </h2>
        <ContactsMapSection />
      </section>
    </ContentLayout>
  );
}

