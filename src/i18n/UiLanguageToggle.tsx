import { useTranslation } from "react-i18next";
import { Button } from "../ui";
import { storeUiLanguage, type UiLanguage } from "./uiLanguage";

/**
 * The interface's own display language — independent of `project.meta.
 * language` (the exported A3's content language, `LaunchScreen.tsx`'s
 * "Project language" dialog). See `uiLanguage.ts`'s own header comment for
 * why this exists. Reused on `LaunchScreen` (SPEC.md §2.1's own "language
 * toggle (TR / EN)" line) and in `SettingsScreen`'s permanent sections.
 *
 * "Türkçe"/"English" are deliberately self-referential — each language's own
 * name, in that language, regardless of which language is currently active
 * (the standard convention for a language switcher: a reader who only reads
 * Turkish should be able to recognize "Türkçe" even inside an English UI).
 * Both locale files carry the identical value for these two keys so the
 * strings still flow through i18next rather than being hardcoded in JSX.
 */
export function UiLanguageToggle() {
  const { t, i18n } = useTranslation();
  const current: UiLanguage = i18n.language === "tr" ? "tr" : "en";

  function select(language: UiLanguage) {
    if (language === current) return;
    storeUiLanguage(language);
    void i18n.changeLanguage(language);
  }

  return (
    <div role="group" aria-label={t("uiLanguage.groupLabel")} className="flex gap-2">
      <Button size="sm" variant={current === "tr" ? "primary" : "secondary"} onClick={() => select("tr")} aria-pressed={current === "tr"}>
        {t("uiLanguage.turkish")}
      </Button>
      <Button size="sm" variant={current === "en" ? "primary" : "secondary"} onClick={() => select("en")} aria-pressed={current === "en"}>
        {t("uiLanguage.english")}
      </Button>
    </div>
  );
}
