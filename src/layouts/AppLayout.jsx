// src/layouts/AppLayout.jsx
import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../state/auth.jsx"
import { useLang } from "../state/lang.jsx"
import { Button } from "../components/ui"
import ProfileMenu from "../components/ui/ProfileMenu.jsx"


export default function AppLayout({ children }) {
  const { user } = useAuth()
  const nav = useNavigate()
  const { t,lang, setLang } = useLang()


  return (
    <div
      className="min-h-screen flex flex-col bg-background text-text"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 border-b border-ring bg-white">
        <div className={`max-w-4xl w-full mx-auto px-2 sm:px-4 py-2 flex items-center justify-between ${lang === "ar" ? "flex-row-reverse" : ""}`}>
          {/* Logo */}
          <Link to="/vote" className="font-semibold text-lg">
            🩷
          </Link>
          {/* Navigation icons */}
          <nav className={`flex items-center gap-4 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
            <Link to="/vote" aria-label={t("vote")}> {/* Vote icon */}
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V6M5 12l7-7 7 7"/></svg>
            </Link>
            <Link to="/questions" aria-label={t("questions")}> {/* Questions icon */}
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </Link>
            <Link to="/profile" aria-label={t("profile")}> {/* Profile icon */}
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>
            </Link>
            {/* ✅ Profile menu or Sign in */}
            {user ? (
              <ProfileMenu />
            ) : (
              <Button variant="primary" size="sm" className="w-full sm:w-auto" onClick={() => nav("/auth")}> 
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              </Button>
            )}
          </nav>
        </div>
      </header>
      {/* Main */}
      <main className="flex-1 w-full pt-[64px]">
        <div className="max-w-4xl w-full mx-auto px-2 sm:px-4 py-4 sm:py-6">{children}</div>
      </main>
      {/* Footer */}
      <footer className="border-t border-ring text-sm text-text/70 w-full">
        <div className="max-w-4xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© {new Date().getFullYear()} Aldaem</p>
          <p className="italic text-center sm:text-right">{t("footerQuote")}</p>
        </div>
      </footer>
    </div>
  );
}
