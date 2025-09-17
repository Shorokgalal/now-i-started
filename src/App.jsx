import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./state/auth.jsx";
import { LangProvider } from "./state/lang.jsx";

import { requestNotificationPermission, onForegroundMessage } from "./lib/firebase";

import AppLayout from "./layouts/AppLayout.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import VotePage from "./pages/VotePage.jsx";
import QuestionsPage from "./pages/QuestionsPage.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import ConfirmResetPassword from "./pages/auth/ConfirmResetPassword.jsx";
import CompleteEmail from "./pages/auth/CompleteEmail.jsx";
import JourneySetup from "./pages/JourneySetup.jsx";
import AuthPage from "./pages/AuthPage.jsx";

function RequireAuth({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  return user ? children : <Navigate to="/auth" replace />;
}

function AuthOnly({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  return user ? <Navigate to="/vote" replace /> : children;
}

export default function App() {
  const { user } = useAuth(); // get logged-in user

  // 🔔 Push notifications init
  useEffect(() => {
    async function init() {
      const token = await requestNotificationPermission();

      if (token && user) {
        try {
          // send token + uid to backend
          await fetch("http://localhost:3001/api/save-fcm-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: user.uid,
              token,
            }),
          });
          console.log("FCM token saved for user:", user.uid);
        } catch (err) {
          console.error("Failed to save FCM token:", err);
        }
      }

      // Listen for foreground notifications
      onForegroundMessage((payload) => {
        alert(`📩 ${payload.notification.title}: ${payload.notification.body}`);
      });
    }

    init();
  }, [user]);

  return (
    <LangProvider>
      <Routes>
        {/* Public */}
        <Route path="/reset" element={<AuthOnly><ResetPassword /></AuthOnly>} />
        <Route path="/confirm-reset" element={<ConfirmResetPassword />} />
        <Route path="/complete-email" element={<AuthOnly><CompleteEmail /></AuthOnly>} />
        <Route path="/auth/*" element={<AuthPage />} />

        {/* Protected */}
        <Route path="/questions" element={<RequireAuth><AppLayout><QuestionsPage /></AppLayout></RequireAuth>} />
        <Route path="/vote" element={<RequireAuth><AppLayout><VotePage /></AppLayout></RequireAuth>} />
        <Route path="/journeys" element={<RequireAuth><AppLayout><JourneySetup /></AppLayout></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><AppLayout><ProfilePage /></AppLayout></RequireAuth>} />
        <Route path="/profile/:uid" element={<RequireAuth><AppLayout><ProfilePage key="other" /></AppLayout></RequireAuth>} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/vote" replace />} />
        <Route path="*" element={<Navigate to="/vote" replace />} />
      </Routes>
    </LangProvider>
  );
}
