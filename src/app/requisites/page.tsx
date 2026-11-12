import ContentLayout from "@/components/ContentLayout";
import {
  COMPANY_ADDRESS,
  COMPANY_FULL_NAME,
  COMPANY_INN,
  COMPANY_OGRNIP,
  COMPANY_OGRNIP_DATE,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
} from "@/lib/company";

export const metadata = {
  title: "Реквизиты — ЭТАЛОН ПРОФИ",
};

export default function RequisitesPage() {
  return (
    <ContentLayout title="Реквизиты компании">
      <div className="space-y-4 text-sm md:text-base">
        <div>
          <p className="font-semibold text-text-main">{COMPANY_FULL_NAME}</p>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-text-main">Адрес:</p>
          <p>{COMPANY_ADDRESS}</p>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-text-main">Контакты:</p>
          <p>
            Тел.:{" "}
            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="font-medium text-primary hover:text-accent"
            >
              {CONTACT_PHONE_DISPLAY}
            </a>
          </p>
          <p>
            E-mail:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-primary hover:text-accent"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <div className="space-y-1">
          <p>
            <span className="font-semibold">ИНН:</span> {COMPANY_INN}
          </p>
          <p>
            <span className="font-semibold">ОГРНИП:</span> {COMPANY_OGRNIP} от{" "}
            {COMPANY_OGRNIP_DATE}
          </p>
        </div>
      </div>
    </ContentLayout>
  );
}
