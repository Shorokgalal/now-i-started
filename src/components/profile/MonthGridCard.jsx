// src/components/profile/MonthGridCard.jsx
import React, { useMemo } from "react"
import { useLang } from "../../state/lang.jsx"   // ✅ import translations

const MS_DAY = 24 * 60 * 60 * 1000

// English + Arabic labels
const DAY_LABELS_EN = ["S", "M", "T", "W", "T", "F", "S"]
const DAY_LABELS_AR = ["أ", "إث", "ث", "أر", "خ", "ج", "س"]

function startOfDay(msOrDate) {
  const d =
    msOrDate instanceof Date ? new Date(msOrDate) : new Date(msOrDate || Date.now())
  d.setHours(0, 0, 0, 0)
  return +d
}

function keyOf(ms) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
}

export default function MonthGridCard({ def }) {
  const { lang, t } = useLang()   // ✅ get lang + translation function
  const start0 = startOfDay(def.startMs || Date.now())
  const end = start0 + 30 * MS_DAY

  const byDay = useMemo(() => {
    const m = new Map()
    def.shares.filter(def.filter).forEach((s) => {
      const t = s.finishedAt?.toDate?.() || s.createdAt?.toDate?.()
      if (!t) return
      const d0 = startOfDay(t)
      if (d0 < start0 || d0 >= end) return
      const k = keyOf(d0)
      const amt = def.amountOfShare(s)
      m.set(k, (m.get(k) || 0) + amt)
    })
    return m
  }, [def, start0, end])

  // ✅ pick labels based on language
  const DAY_LABELS = lang === "ar" ? DAY_LABELS_AR : DAY_LABELS_EN

  const cells = []
  const todayMs = startOfDay(Date.now());
  for (let i = 0; i < 35; i++) {
    const dMs = start0 + i * MS_DAY;
    if (i >= 30) {
      cells.push({ kind: "blank", label: "", pct: 0 });
      continue;
    }

    // If the day is after today, render as empty
    if (dMs > todayMs) {
      cells.push({ kind: "future", label: DAY_LABELS[new Date(dMs).getDay()], pct: 0, ms: dMs });
      continue;
    }

    const k = keyOf(dMs);
    const amt = byDay.get(k) || 0;
    const target = def.toSeconds
      ? def.toSeconds(def.dailyTargetRaw)
      : def.dailyTargetRaw;

    const pct = target ? amt / target : 0;
    const dayLetter = DAY_LABELS[new Date(dMs).getDay()];

    cells.push({
      kind: "day",
      label: dayLetter,
      pct: pct,
      ms: dMs,
    });
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">
          {def.title} — {t("30days")} {/* ✅ translated */}
        </div>
        <span className="text-xs text-text/60">
          {t("firstRowNote")} {/* ✅ translated */}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-y-1 gap-x-[2px]">
        {cells.map((c, i) => {
          if (c.kind === "blank") {
            return <div key={i} className="h-10 w-10 rounded border bg-gray-100" />;
          }
          if (c.kind === "future") {
            return (
              <div key={i} className="h-10 w-10 rounded border bg-gray-50 opacity-40 grid place-items-center text-[10px] text-center leading-tight">
                <div className="font-bold">{c.label}</div>
              </div>
            );
          }

          const bg = `rgba(99,102,241,${0.12 + 0.55 * c.pct})`;
          const br = `rgba(99,102,241,${0.4 + 0.4 * c.pct})`;

          let style = { background: bg, borderColor: br };

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (c.ms === +today) {
            style = {
              ...style,
              borderColor: "rgba(59,130,246,.7)",
              background: "rgba(59,130,246,.12)",
            };
          }

          return (
            <div
              key={i}
              className="h-10 w-10 grid place-items-center rounded border text-[10px] text-center leading-tight"
              style={style}
              title={`${t("day")} ${i + 1}: ${Math.round(c.pct * 100)}%`}
            >
              <div className="font-bold">{c.label}</div>
              <div className="opacity-70">{Math.round(c.pct * 100)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
