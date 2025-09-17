// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { LangProvider } from "./state/lang.jsx";
import { AuthProvider } from "./state/auth.jsx";
import { AppProvider } from "./state/appState.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LangProvider>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <App />
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </LangProvider>
  </React.StrictMode>
);

// 🔔 Register the service worker for push notifications
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("✅ Service Worker registered:", registration);
    })
    .catch((err) => {
      console.error("❌ Service Worker registration failed:", err);
    });
}
