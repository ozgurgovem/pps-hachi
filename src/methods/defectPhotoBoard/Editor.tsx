import { useTranslation } from "react-i18next";
import type { MethodEditorProps } from "../types";
import type { DefectPhotoBoardPayload } from "./schema";

/**
 * All of this method's real content lives outside `payload` — the entry's
 * title (the caption) and its one photo, rendered by the generic
 * `EntryImagesField` shell (`EntryEditorDialog`, driven by
 * `defectPhotoBoardMethod.imageSlots`) plus, when the user chooses to mark
 * it up, the shared `EntryAnnotationEditor`. This `Editor` has nothing of
 * its own to edit, so it renders a hint rather than an empty box —
 * `before-after-photos`' own precedent (D-193).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- MethodEditorProps kept for a uniform Editor signature across every plugin; this method's only real content lives outside payload.
export function DefectPhotoBoardEditor(_props: MethodEditorProps<DefectPhotoBoardPayload>) {
  const { t } = useTranslation();
  return <p className="font-body text-sm text-ink-muted">{t("methods.defectPhotoBoard.hint")}</p>;
}
