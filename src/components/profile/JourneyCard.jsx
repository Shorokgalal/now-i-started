// src/components/profile/JourneyCard.jsx
import React from "react"
import { useLang } from "../../state/lang.jsx"   // ✅ import

const UNIT_MAP = {
  reading: { unit: "min", monthlyUnit: "h" },
  journaling: { unit: "min", monthlyUnit: "h" },
  digital_free: { unit: "min", monthlyUnit: "h" },
  drink_water: { unit: "ml", monthlyUnit: "L" },
}

export default function JourneyCard({
  journeyKey,
  title,
  unit,
  monthlyUnit,
  dailyTargetRaw,
  toSeconds,
  monthlyTargetCalc,
  shares = [],
  filterShare,
  amountOfShare,
  starThresholdMult = 1.5,
  startMs,
  compact = false,
}) {
  const { t } = useLang()

  // defaults
  const defaults = UNIT_MAP[journeyKey] || {}
  const resolvedUnit = unit || defaults.unit || "unit"
  const resolvedMonthlyUnit = monthlyUnit || defaults.monthlyUnit || "units"

  const MS = 24 * 60 * 60 * 1000
  const MAX_DAYS = 30
  const COLS = 7,
    ROWS = 5

  // translate journey title
  const journeyTitle =
    journeyKey === "digital_free" ? t("digitalFree")
    : journeyKey === "drink_water" ? t("drinkWater")
    : journeyKey === "journaling"  ? t("journaling")
    : journeyKey === "reading"     ? t("reading")
    : title || t("journeys")
    
  // normalize start
  const periodStart = new Date(startMs || Date.now())
  periodStart.setHours(0, 0, 0, 0)
  const start = +periodStart
  const end = start + MAX_DAYS * MS
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = +today

  // start date label
  const startDateLabel = (() => {
    const d = new Date(start)
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`
  })()

  // targets
  const dailyTarget = toSeconds ? toSeconds(dailyTargetRaw) : dailyTargetRaw
  const monthlyTargetCalcDisplay = monthlyTargetCalc
    ? monthlyTargetCalc(dailyTargetRaw)
    : 30 * dailyTargetRaw
  const dailyTargetHuman = `${dailyTargetRaw} ${t(resolvedUnit)}`

  // aggregate shares
  const byDay = new Map()
  const keyOf = (ms) => {
    const d = new Date(ms)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`
  }

  shares
    .filter(filterShare || (() => true)) // ✅ include all if no filter
    .forEach((s) => {
      const t = s.finishedAt?.toDate?.() || s.createdAt?.toDate?.() || null
      if (!t) return
      const dMs = +new Date(t.getFullYear(), t.getMonth(), t.getDate())
      if (dMs < start || dMs >= end) return
      const k = keyOf(dMs)
      byDay.set(
        k,
        (byDay.get(k) || 0) + (amountOfShare ? amountOfShare(s) : 0)
      )
    })

  // build cells
  let achievedDays = 0
  let goldDays = 0
  const cells = []
  for (let i = 0; i < ROWS * COLS; i++) {
    if (i >= MAX_DAYS) {
      cells.push({ kind: "placeholder", label: "", ms: start + i * MS })
      continue
    }
    const dMs = start + i * MS
    const k = keyOf(dMs)
    const amt = byDay.get(k) || 0

    let kind = "miss"
    if (dMs > todayMs) kind = "future"
    else if (amt >= dailyTarget) {
      kind = "star"
      achievedDays++
      if (amt >= dailyTarget * (starThresholdMult || 1.5)) goldDays++
    } else if (amt > 0) kind = "dot"

    cells.push({ kind, label: String(i + 1), ms: dMs, amt })
  }

  // status
  const daysElapsed = Math.min(
    MAX_DAYS,
    Math.floor((todayMs - start) / MS) + 1
  )
  
  let statusKey = "onTrack"
  if (achievedDays >= daysElapsed && goldDays >= 3) {
    statusKey = "overachieving"
  }

  const padCls = compact ? "p-4" : "p-6"
  const titleCls = compact ? "text-lg" : "text-xl"
  const cellSize = compact ? "h-6 w-6" : "h-7 w-7"
  const headerMb = compact ? "mb-2" : "mb-3"

  return (
    <div className={`card ${padCls}`}>
      <div className={`flex items-center justify-between ${headerMb}`}>
        <div>
          <h3 className={`${titleCls} font-semibold`}>{journeyTitle}</h3>
          <p className="text-sm text-text/70">
            {t("target")}: <b>{monthlyTargetCalcDisplay}</b> {t(resolvedMonthlyUnit)}{" "}
            ({t("daily")}: {dailyTargetHuman})
          </p>
          <p className="text-xs text-text/60 mt-0.5">
            {t("started")}: <b>{startDateLabel}</b>
          </p>
        </div>
        <span
          className={`badge ${
            statusKey === "overachieving"
              ? "bg-green-50 text-green-700"
              : statusKey === "onTrack"
              ? "bg-blue-50 text-blue-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {t(statusKey)}
        </span>
      </div>

      {/* 7×5 grid */}
      <div className="grid grid-cols-7 gap-y-1 gap-x-[2px]">
        {cells.map((c) => {
          const base = `${cellSize} grid place-items-center rounded border text-xs select-none`
          let style = {}, char = ""

          if (c.kind === "star") {
            char = "★"
            style = {
              borderColor: "rgba(16,185,129,.45)",
              background: "rgba(16,185,129,.12)",
              color: "rgba(16,185,129,1)",
            }
          } else if (c.kind === "dot") {
            char = "•"
            style = {
              borderColor: "rgba(99,102,241,.45)",
              background: "rgba(99,102,241,.12)",
              color: "rgba(99,102,241,1)",
            }
          } else if (c.kind === "miss") {
            char = "×"
            style = {
              borderColor: "rgba(239,68,68,.35)",
              background: "rgba(239,68,68,.08)",
              color: "rgba(239,68,68,1)",
            }
          } else if (c.kind === "future") {
            style = {
              borderColor: "rgba(148,163,184,.15)",
              background: "rgba(148,163,184,.06)",
              color: "rgba(148,163,184,.4)",
            }
          } else {
            style = {
              borderColor: "rgba(0,0,0,.05)",
              background: "rgba(0,0,0,.02)",
            }
          }

          // special highlight for today
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (c.ms === +today) {
            style = {
              ...style,
              borderColor: "rgba(59,130,246,.7)",
              background: "rgba(59,130,246,.12)",
            }
          }

          return (
            <div
              key={c.ms}
              className={base}
              style={style}
              title={c.label ? `Day ${c.label}` : ""}
            >
              {char}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-1 text-sm text-text/70 mt-3">
        <span>
          {t("metTargetOn")} <b>{achievedDays}</b> / {Math.max(0, daysElapsed)}{" "}
          {t("days")}
        </span>
        <span className="opacity-90 ml-">
          ⭐ {t("exceeded")} • {t("partial")} × {t("missed")}
        </span>
      </div>
    </div>
  )
}
