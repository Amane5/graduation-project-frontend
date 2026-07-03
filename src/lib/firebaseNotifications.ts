import { getToken } from "firebase/messaging";
import { fetchWithSession } from "./auth-session";
import { messaging } from "./firebase";

export async function requestNotificationPermission(accessToken?: string) {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") return;

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  });

  if (!token) return;

  await fetchWithSession(
    `${import.meta.env.VITE_API_URL}/ai/fcm-token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {}),
      },
      body: JSON.stringify({ token }),
    }
  );

  console.log("FCM Token:", token);
}
