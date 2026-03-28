"use client";

import Link from "next/link";

const LINK_REL = "nofollow noopener noreferrer";

type PersonalDataConsentCheckboxProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

/**
 * Обязательное согласие на обработку ПДн и принятие пользовательского соглашения (ФЗ-152).
 * label связан с input через id/htmlFor.
 */
export default function PersonalDataConsentCheckbox({
  id,
  checked,
  onChange,
  className = "",
}: PersonalDataConsentCheckboxProps) {
  return (
    <div className={className}>
      <div className="flex items-start gap-2">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00] focus:ring-offset-0"
        />
        <label
          htmlFor={id}
          className="cursor-pointer text-left text-sm leading-snug text-slate-600"
        >
          Даю согласие на{" "}
          <Link
            href="/privacy-policy"
            target="_blank"
            rel={LINK_REL}
            className="text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
            onClick={(e) => e.stopPropagation()}
          >
            обработку моих персональных данных
          </Link>{" "}
          и принимаю условия{" "}
          <Link
            href="/agreement"
            target="_blank"
            rel={LINK_REL}
            className="text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
            onClick={(e) => e.stopPropagation()}
          >
            пользовательского соглашения
          </Link>
          .
        </label>
      </div>
    </div>
  );
}

/** Классы для кнопки отправки, пока согласие не дано */
export const consentDisabledButtonClass =
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";
