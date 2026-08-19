import { useTranslation } from "react-i18next";
import type { MethodEditorProps } from "../types";
import type { ValueStreamMapPayload } from "./schema";

/** No payload of its own — see `schema.ts`. Mirrors `spaghetti-diagram`/`defect-photo-board`'s hint-only Editor. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- MethodEditorProps kept for a uniform Editor signature across every plugin; this method's only real content lives outside payload.
export function ValueStreamMapEditor(_props: MethodEditorProps<ValueStreamMapPayload>) {
  const { t } = useTranslation();
  return <p className="font-body text-sm text-ink-muted">{t("methods.valueStreamMap.hint")}</p>;
}
