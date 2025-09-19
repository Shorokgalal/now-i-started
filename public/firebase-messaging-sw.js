// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDr2XSTmdtMA1LD8UEv39HVYuZTf8AAbHo",
  authDomain: "timeisnow-b3923.firebaseapp.com",
  projectId: "timeisnow-b3923",
  storageBucket: "timeisnow-b3923.appspot.com", // ✅ fixed bucket
  messagingSenderId: "85315532113",
  appId: "1:85315532113:web:14339f7e6ebbc7177b4f70",
});

const messaging = firebase.messaging();

// ✅ Show notification when app is closed/background
messaging.onBackgroundMessage((payload) => {
  console.log("📩 Received background message:", payload);

  const notification = payload.notification || {};
  const title = notification.title || "إشعار جديد"; // fallback Arabic
  const body = notification.body || "لديك رسالة جديدة"; 

  return self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",   // ✅ small icon for notification
    badge: "/icon-512.png", // ✅ safer default icon
  });
});
