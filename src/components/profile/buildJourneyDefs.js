// src/components/profile/useJourneyDefs.js
import { useLang } from "../../state/lang.jsx"

export default function useJourneyDefs({
  chosen,
  params,
  shares,
  startBy,
  fallbackStartMs,
}) {
  const { t } = useLang()   // ✅ now valid, inside a hook
  const defs = []
  const push = (key, def) => defs.push({ key, ...def })

  if (chosen.includes("digital_free")) {
    push("digital_free", {
      key: "digital_free",
      title: t("digitalFree"),
      monthlyUnit: t("h"),
      dailyTargetRaw:
        params?.digital_free?.minutesPerDay ??
        (params?.digital_free?.hoursPerDay
          ? params.digital_free.hoursPerDay * 60
          : 60),
      toSeconds: (min) => min * 60,
      amountOfShare: (s) => Math.max(0, s.actualSec || s.plannedSec || 0),
      filter: (s) =>
        s.type === "achieved" &&
        ((s.goalId || "").startsWith("digital-free")),
      startMs: startBy?.digital_free ?? fallbackStartMs,
    })
  }

  if (chosen.includes("reading")) {
    const dailyMin =
      params?.reading?.minutesPerDay ??
      params?.reading?.dailyMin ??
      10
    push("reading", {
      key: "reading",
      title: t("reading"),
      monthlyUnit: "min",
      dailyTargetRaw: dailyMin,
      toSeconds: (min) => min * 60,
      amountOfShare: (s) => Math.max(0, s.actualSec || s.plannedSec || 0),
      filter: (s) =>
        s.type === "achieved" &&
        (s.goalId === "reading" || s.journeyKey === "reading"),
      startMs: startBy?.reading ?? fallbackStartMs,
    })
  }

  if (chosen.includes("journaling")) {
    push("journaling", {
      key: "journaling",
      title: t("journaling"),
      monthlyUnit: t("days"),
      dailyTargetRaw: 1,
      toSeconds: null,
      amountOfShare: () => 1,
      filter: (s) => s.type === "achieved" && s.goalId === "journaling",
      startMs: startBy?.journaling ?? fallbackStartMs,
    })
  }

  if (chosen.includes("drink_water")) {
    push("drink_water", {
      key: "drink_water",
      title: t("drinkWater"),
      monthlyUnit: "ml",
      dailyTargetRaw: params?.drink_water?.dailyTargetMl ?? 2000,
      toSeconds: null,
      amountOfShare: (s) => Math.max(0, s.waterMl || 0),
      filter: (s) => s.type === "achieved" && s.goalId === "drink-water",
      startMs: startBy?.drink_water ?? fallbackStartMs,
    })
  }

  return defs.map((d) => ({ ...d, shares }))
}
