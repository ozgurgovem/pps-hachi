import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/common.json";
import tr from "./locales/tr/common.json";
import { readStoredUiLanguage } from "./uiLanguage";

void i18next.use(initReactI18next).init({
  resources: {
    en: { common: en },
    tr: { common: tr },
  },
  defaultNS: "common",
  fallbackLng: "en",
  // Real gap found in Barış's own first trial run, 2026-09-10: this was
  // hardcoded "en" with no read of any stored preference — see
  // uiLanguage.ts's own header comment for the full history.
  lng: readStoredUiLanguage() ?? "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
