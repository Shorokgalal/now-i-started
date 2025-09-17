import React, { createContext, useContext, useEffect, useState } from "react"
import { locales } from "../locales.js"   // ✅ import the full dictionary

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem("lang") || "en"
  })

  const setLang = (newLang) => {
    setLangState(newLang)
    localStorage.setItem("lang", newLang)
  }

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
  }, [lang])

  // ✅ use the imported dictionary
  const t = (key) => locales[lang]?.[key] || key

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
