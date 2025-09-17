// src/components/ui/Card.jsx
import React from "react"

export default function Card({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`rounded-xl border border-ring bg-white p-6 shadow-sm ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  )
}
