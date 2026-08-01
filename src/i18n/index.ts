import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/common.json";
import tr from "./locales/tr/common.json";

void i18next.use(initReactI18next).init({
  resources: {
    en: { common: en },
    tr: { common: tr },
  },
  defaultNS: "common",
  fallbackLng: "en",
  lng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
