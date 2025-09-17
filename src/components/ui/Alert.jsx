import React from "react"
import clsx from "clsx"

export default function Alert({ children, type="info" }) {
  const base = "rounded-xl p-3 text-sm"
  const styles = {
    success: "bg-green-50 text-green-700",
    error: "bg-red-50 text-red-700",
    warning: "bg-yellow-50 text-yellow-700",
    info: "bg-accent/10 text-accent"
  }
  return (
    <div role="alert" className={clsx(base, styles[type])}>
      {children}
    </div>
  )
}
