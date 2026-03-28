import { NextResponse } from "next/server";
import {
  DATA_FORMS_SUBMISSION_DISABLED,
  DATA_FORMS_DISABLED_USER_MESSAGE,
} from "@/config/dataFormsSubmission";

export function rejectIfDataFormsDisabled(): NextResponse | null {
  if (!DATA_FORMS_SUBMISSION_DISABLED) return null;
  return NextResponse.json(
    {
      ok: false,
      error: DATA_FORMS_DISABLED_USER_MESSAGE,
      code: "DATA_FORMS_SUBMISSION_DISABLED",
    },
    { status: 503 }
  );
}
