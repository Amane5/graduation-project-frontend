import { useEffect } from "react";
import { MessagePayload, onMessage } from "firebase/messaging";
import { messaging } from "../lib/firebase";
import { translateI18nKey } from "@/lib/i18n-feedback";
export function useFirebaseNotifications() {
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log(payload);

      if (payload.data.type === "AI_PROGRESS" || payload.data.type == "Event") {
        return;
      }

      const title = translateI18nKey(payload.data?.titleKey || payload.notification?.title);
      const body = translateI18nKey(payload.data?.bodyKey || payload.notification?.body);

      new Notification(title || "", {
        body,
      });
    });

    return unsubscribe;
  }, []);
}

export function useNotificationHandler({
  type,
  handler,
}: {
  type: string;
  handler: (payloed: MessagePayload) => Promise<void> | void;
}) {
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log(payload);

      if (payload.data.type == type) {
        handler(payload);
      }
    });

    return unsubscribe;
  }, []);
}
