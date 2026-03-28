import Link from "next/link";
import { DATA_FORMS_SUBMISSION_DISABLED } from "@/config/dataFormsSubmission";

type Props = { className?: string };

export default function DataFormsDisabledNotice({ className = "" }: Props) {
  if (!DATA_FORMS_SUBMISSION_DISABLED) return null;
  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-snug text-amber-950 ${className}`}
      role="status"
    >
      Приём заявок и сообщений с сайта временно отключён. Свяжитесь с нами через{" "}
      <Link
        href="/contacts"
        className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
      >
        страницу «Контакты»
      </Link>{" "}
      или напишите на{" "}
      <a
        href="mailto:info@etalonklimat.ru"
        className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
      >
        info@etalonklimat.ru
      </a>
      .
    </div>
  );
}
