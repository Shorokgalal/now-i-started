// src/components/ui/Page.jsx
import React from "react"
import { useLang } from "../../state/lang.jsx"

export default function Page({ children, className = "" }) {
  const { lang } = useLang()

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={`max-w-3xl mx-auto px-4 ${className}`}
    >
      {children}
    </div>
  )
}
