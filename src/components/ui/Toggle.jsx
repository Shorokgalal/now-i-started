import React from "react"
import clsx from "clsx"

export default function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button type="button"
      aria-label={label}
      onClick={() => !disabled && onChange && onChange(!checked)}
      className={clsx("toggle", checked ? "on" : "off", disabled && "opacity-60 cursor-not-allowed")}>
      <span className="ml-1"></span>
    </button>
  )
}
