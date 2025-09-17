import React from "react"

export default function Avatar({ name, size=56 }) {
  const letter = (name||"?").trim().charAt(0).toUpperCase()
  return (
    <div className="rounded-full border border-ring grid place-items-center bg-white text-text/80"
      style={{ width: size, height: size}}>
      <span className="text-xl">{letter}</span>
    </div>
  )
}
