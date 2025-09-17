// src/components/ui/ProfileMenu.jsx
import React, { useState, useRef, useEffect } from "react"
import { useAuth } from "../../state/auth.jsx"
import { useLang } from "../../state/lang.jsx"
import { Button, Card } from "./index"

export default function ProfileMenu() {
  const { user, signOut } = useAuth()
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  if (!user) return null

  // ✅ close on outside click OR escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    function handleEsc(e) {
      if (e.key === "Escape") setOpen(false)
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEsc)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [open])

  // ✅ apply RTL/LTR when lang changes
  useEffect(() => {
    if (lang === "ar") {
      document.documentElement.dir = "rtl"
    } else {
      document.documentElement.dir = "ltr"
    }
  }, [lang])

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2"
      >
        <span className="truncate max-w-[150px] text-sm">
          {user.email}
        </span>
        <span className="text-lg">▾</span>
      </Button>

      {open && (
        <Card className="absolute right-0 mt-2 w-48 shadow-lg p-2 z-50 space-y-1">
          {/* Language toggle */}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              const newLang = lang === "en" ? "ar" : "en"
              setLang(newLang)
              setOpen(false)
            }}
          >
            {lang === "en" ? "العربية" : "English"}
          </Button>

          {/* Sign out */}
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600"
            onClick={() => {
              signOut()
              setOpen(false)
            }}
          >
            Sign out
          </Button>
        </Card>
      )}
    </div>
  )
}
