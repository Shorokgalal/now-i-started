// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, isSignInWithEmailLink } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// ✅ Firebase Config (uses env vars, falls back to defaults)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyDr2XSTmdtMA1LD8UEv39HVYuZTf8AAbHo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "timeisnow-b3923.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "timeisnow-b3923",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "timeisnow-b3923.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "85315532113",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:85315532113:web:14339f7e6ebbc7177b4f70",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? undefined,
};

// ✅ Initialize app once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 🔐 Auth + Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const isEmailLink = (url) =>
  isSignInWithEmailLink(auth, url ?? window.location.href);

// 🔔 Messaging (Push Notifications)
let messaging;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn("⚠️ Messaging not supported in this environment:", err);
}

// ✅ Ask for permission + get device token
export async function requestNotificationPermission() {
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    try {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, // ✅ use env var safely
      });
      console.log("✅ FCM Token:", token);
      return token;
    } catch (err) {
      console.error("❌ Error getting FCM token:", err);
      return null;
    }
  } else {
    console.warn("⚠️ Notification permission not granted.");
    return null;
  }
}

// ✅ Foreground notifications
export function onForegroundMessage(callback) {
  if (!messaging) return;
  return onMessage(messaging, callback);
}

export default app;
