importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAdqD5UMapo8WoFUZ9Leq4lUULcZ__vKCA",
    authDomain:"graduation-ai-d062f.firebaseapp.com",
    projectId:"graduation-ai-d062f",
    messagingSenderId:"836096715886",
    appId:"1:836096715886:web:ac3e16269f23e56b978a7f"
});

const messaging = firebase.messaging();

const LANGUAGE_DB = "kidspark-i18n";
const LANGUAGE_STORE = "settings";
const LANGUAGE_RECORD_KEY = "language";

const notificationTranslations = {
  en: {
    notification_ai_response_ready_title: "AI Response Ready",
    notification_ai_response_ready_body: "Your answer is ready.",
  },
  ar: {
    notification_ai_response_ready_title: "أصبح رد الذكاء الاصطناعي جاهزًا",
    notification_ai_response_ready_body: "إجابتك أصبحت جاهزة.",
  },
};

function getStoredLanguage() {
  return new Promise((resolve) => {
    const request = indexedDB.open(LANGUAGE_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LANGUAGE_STORE)) {
        db.createObjectStore(LANGUAGE_STORE);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(LANGUAGE_STORE, "readonly");
      const getRequest = transaction.objectStore(LANGUAGE_STORE).get(LANGUAGE_RECORD_KEY);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || "en");
        db.close();
      };

      getRequest.onerror = () => {
        resolve("en");
        db.close();
      };
    };

    request.onerror = () => resolve("en");
  });
}

function translateNotificationKey(key, lang) {
  if (!key) {
    return "";
  }

  const translations = notificationTranslations[lang] || notificationTranslations.en;
  return translations[key] || notificationTranslations.en[key] || key;
}

messaging.onBackgroundMessage(async (payload) => {
  const lang = await getStoredLanguage();
  const title = translateNotificationKey(payload.data?.titleKey, lang) || payload.notification?.title;
  const body = translateNotificationKey(payload.data?.bodyKey, lang) || payload.notification?.body;

  self.registration.showNotification(
    title || "",
    {
      body,
    }
  );
});
