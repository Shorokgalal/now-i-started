// src/components/profile/AnalyticsStat.jsx
import React from "react"

export default function AnalyticsStat({ label, value }) {
  return (
    <div className="rounded-xl border border-ring p-4 text-center">
      <div className="text-sm text-text/60 mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
