import { useTranslation } from "react-i18next";
import type { MethodEditorProps } from "../types";
import type { SpaghettiDiagramPayload } from "./schema";

/** No payload of its own — see `schema.ts`. Mirrors `before-after-photos`/`defect-photo-board`'s hint-only Editor. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- MethodEditorProps kept for a uniform Editor signature across every plugin; this method's only real content lives outside payload.
export function SpaghettiDiagramEditor(_props: MethodEditorProps<SpaghettiDiagramPayload>) {
  const { t } = useTranslation();
  return <p className="font-body text-sm text-ink-muted">{t("methods.spaghettiDiagram.hint")}</p>;
}
