import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import ar from "./ar.json";

const LANGUAGE_KEY = "lang";
const LEGACY_LANGUAGE_KEY = "language";

const getStoredLanguage = () => {
  const savedLang =
    localStorage.getItem(LANGUAGE_KEY) ||
    localStorage.getItem(LEGACY_LANGUAGE_KEY) ||
    "en";

  if (savedLang && localStorage.getItem(LANGUAGE_KEY) !== savedLang) {
    localStorage.setItem(LANGUAGE_KEY, savedLang);
  }

  if (localStorage.getItem(LEGACY_LANGUAGE_KEY)) {
    localStorage.removeItem(LEGACY_LANGUAGE_KEY);
  }

  return savedLang;
};

const savedLang = getStoredLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      ar: {
        translation: ar,
      },
    },

    lng: savedLang, 
    fallbackLng: "en",

    interpolation: {
      escapeValue: false,
    },
  });
i18n.on("languageChanged", (lng) => {
  localStorage.setItem(LANGUAGE_KEY, lng);
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
});
export default i18n;
