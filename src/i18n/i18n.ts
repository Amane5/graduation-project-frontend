import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import ar from "./ar.json";

const LANGUAGE_KEY = "lang";
const LEGACY_LANGUAGE_KEY = "language";
const LANGUAGE_DB = "kidspark-i18n";
const LANGUAGE_STORE = "settings";
const LANGUAGE_RECORD_KEY = "language";

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

const persistLanguageForNotifications = (lng: string) => {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  const request = window.indexedDB.open(LANGUAGE_DB, 1);

  request.onupgradeneeded = () => {
    const db = request.result;

    if (!db.objectStoreNames.contains(LANGUAGE_STORE)) {
      db.createObjectStore(LANGUAGE_STORE);
    }
  };

  request.onsuccess = () => {
    const db = request.result;
    const transaction = db.transaction(LANGUAGE_STORE, "readwrite");
    transaction.objectStore(LANGUAGE_STORE).put(lng, LANGUAGE_RECORD_KEY);
    transaction.oncomplete = () => db.close();
  };
};

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
  persistLanguageForNotifications(lng);
});

persistLanguageForNotifications(savedLang);
export default i18n;
