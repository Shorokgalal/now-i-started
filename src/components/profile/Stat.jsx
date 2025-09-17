// src/components/profile/Stat.jsx
import React from "react"

export default function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-ring p-3">
      <div className="text-xs uppercase tracking-wide text-text/60">
        {label}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}
