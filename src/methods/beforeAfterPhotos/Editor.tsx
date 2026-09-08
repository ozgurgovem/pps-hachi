import { useTranslation } from "react-i18next";
import type { MethodEditorProps } from "../types";
import type { BeforeAfterPhotosPayload } from "./schema";

/**
 * All of this method's real content lives outside `payload` — the entry's
 * own title (the caption) and the two role-tagged photos, rendered by the
 * generic `EntryImagesField` shell (`EntryEditorPanel`, driven by
 * `beforeAfterPhotosMethod.imageSlots`). This `Editor` has nothing of its
 * own to edit, so it renders a hint rather than an empty box.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- MethodEditorProps kept for a uniform Editor signature across every plugin; this method's only real content lives outside payload.
export function BeforeAfterPhotosEditor(_props: MethodEditorProps<BeforeAfterPhotosPayload>) {
  const { t } = useTranslation();
  return <p className="font-body text-sm text-ink-muted">{t("methods.beforeAfterPhotos.hint")}</p>;
}
