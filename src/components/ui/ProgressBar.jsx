import React from "react"
export default function ProgressBar({ value=0, max=100 }){
  const pct = Math.max(0, Math.min(100, (value/max)*100))
  return (
    <div className="w-full h-2 bg-ring rounded-full overflow-hidden">
      <div className="h-full bg-accent" style={{ width: pct + "%" }}></div>
    </div>
  )
}
