// src/components/ui/Button.jsx
import React from "react"
import clsx from "clsx"

export default function Button({ children, variant="primary", className="", ...props }) {
  const base = "rounded-xl px-4 py-2 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
  const styles = {
    primary: "bg-accent text-white shadow hover:bg-accent/90",
    ghost: "text-text/70 hover:bg-ring/10",
    danger: "bg-red-600 text-white hover:bg-red-700"
  }
  return (
    <button {...props} className={clsx(base, styles[variant], className)}>
      {children}
    </button>
  )
}
