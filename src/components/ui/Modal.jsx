import React from "react"
import clsx from "clsx" // we already use clsx elsewhere

export default function Modal({ open, onClose, title, children, footer, center = false }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={clsx("modal relative", center && "text-center")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button pinned top-right */}
        <button
          className="absolute right-4 top-4 text-2xl leading-none"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        {/* Title */}
        <h3 className={clsx("text-2xl font-semibold mb-4", center && "mx-auto")}>
          {title}
        </h3>

        {/* Body */}
        <div className={clsx(center && "flex flex-col items-center")}>{children}</div>

        {/* Optional footer */}
        {footer && (
          <div className={clsx("mt-6 flex gap-3", center ? "justify-center" : "justify-end")}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
