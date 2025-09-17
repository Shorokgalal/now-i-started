// src/pages/JourneySetup.jsx
import React, { useEffect, useState } from "react"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../state/auth.jsx"
import { useNavigate, useLocation } from "react-router-dom"
import Modal from "../components/ui/Modal.jsx"
import { Card, Button } from "../components/ui"   // ✅ now import Card + Button
import { useLang } from "../state/lang.jsx"

const DIGITAL_FREE = "digital_free"
const DRINK_WATER  = "drink_water"
const JOURNALING   = "journaling"
const READING      = "reading"

const MAX_ACTIVE  = 2
const MS_DAY      = 24 * 60 * 60 * 1000
const WINDOW_DAYS = 30

const DEFAULTS = {
  [DRINK_WATER]:  { why: "", approxTime: "08:00", dailyTargetMl: 2000, bottleMl: 600 },
  [DIGITAL_FREE]: { why: "", approxTime: "08:00", minutesPerDay: 60, activitySuggestion: "Nothing" },
  [JOURNALING]:   { why: "", approxTime: "08:00", minutesPerDay: 10, journalMethod: "Notebook and pen" },
  [READING]:      { why: "", approxTime: "08:00", minutesPerDay: 10, bookName: "" },
}

// ---------- helpers ----------
function minsToHM(mins = 0) {
  const total = Math.max(0, Math.round(mins || 0))
  const h = Math.floor(total / 60)
  const m = total % 60
  const hh = String(Math.min(h, 23)).padStart(2, "0")
  const mm = String(h > 23 ? 59 : m).padStart(2, "0")
  return `${hh}:${mm}`
}
function hmToMins(hm) {
  if (!hm || typeof hm !== "string" || !hm.includes(":")) return 0
  const [hStr, mStr] = hm.split(":")
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return Math.max(0, h * 60 + m)
}

// ---------- main ----------
export default function JourneySetup() {
  const { user } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const joinKey = query.get("join")
  const { t } = useLang();


  const [loading, setLoading]     = useState(true)
  const [chosen, setChosen]       = useState([])
  const [params, setParams]       = useState(DEFAULTS)
  const [startBy, setStartBy]     = useState({})

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorKey, setEditorKey]   = useState(null)
  const [draft, setDraft]           = useState({})

  // Load user journeys
  useEffect(() => {
    if (!user?.uid) return
    ;(async () => {
      try {
        const ref = doc(db, "users", user.uid)
        const snap = await getDoc(ref)
        const data = snap.exists() ? snap.data() : {}
        const j = data.journeys || {}
        const loadedChosen  = Array.isArray(j.chosen) ? j.chosen : []
        const loadedParams  = j.params || {}
        const loadedStartBy = j.startBy || {}

        setChosen(loadedChosen)
        setParams(prev => mergeParamsWithDefaults(prev, loadedParams))
        setStartBy(loadedStartBy)
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.uid])

  // Auto-open join key
  useEffect(() => {
    if (!loading && joinKey && [DIGITAL_FREE, DRINK_WATER, JOURNALING, READING].includes(joinKey)) {
      openEditor(joinKey)
    }
  }, [loading, joinKey])

  const now = Date.now()
  const isLocked = (key) => {
    const ms = startBy?.[key]
    if (!ms) return false
    return now < ms + WINDOW_DAYS * MS_DAY
  }
  const daysLeft = (key) => {
    const ms = startBy?.[key]
    if (!ms) return 0
    return Math.max(0, Math.ceil((ms + WINDOW_DAYS * MS_DAY - now) / MS_DAY))
  }

  function mergeParamsWithDefaults(currentDefaults, loaded) {
    const next = { ...currentDefaults }
    for (const key of [DIGITAL_FREE, DRINK_WATER, JOURNALING, READING]) {
      next[key] = { ...currentDefaults[key], ...(loaded?.[key] || {}) }
      if (key === DIGITAL_FREE) {
        const hours = loaded?.[key]?.hoursPerDay
        if (typeof hours === "number" && !Number.isNaN(hours)) {
          next[key].minutesPerDay = Math.round(hours * 60)
        }
      }
      if (key === READING) {
        const m = loaded?.[key]?.minutesPerDay ?? loaded?.[key]?.dailyMin
        if (typeof m === "number" && !Number.isNaN(m)) {
          next[key].minutesPerDay = m
        }
      }
      if (key === JOURNALING) {
        const hasTools = loaded?.[key]?.hasTools
        if (typeof hasTools === "boolean" && !loaded?.[key]?.journalMethod) {
          next[key].journalMethod = hasTools ? "Notebook and pen" : ""
        }
      }
    }
    return next
  }

  function openEditor(key) {
    if (!chosen.includes(key) && chosen.length >= MAX_ACTIVE) return
    if (chosen.includes(key) && isLocked(key)) return
    setEditorKey(key)
    setDraft({ ...(params[key] || DEFAULTS[key] || {}) })
    setEditorOpen(true)
  }
  function closeEditor() {
    setEditorOpen(false)
    setEditorKey(null)
    setDraft({})
  }

  async function applyDraft() {
    if (!editorKey || !user?.uid) return
    const isSelected = chosen.includes(editorKey)
    const nextParamsForKey = { ...(params[editorKey] || {}), ...draft }
    setParams(prev => ({ ...prev, [editorKey]: nextParamsForKey }))

    try {
      const userRef = doc(db, "users", user.uid)
      if (isSelected) {
        await setDoc(
          userRef,
          { journeys: { params: { [editorKey]: nextParamsForKey } }, updatedAt: serverTimestamp() },
          { merge: true }
        )
      } else {
        const nextChosen = [...chosen, editorKey]
        const nextStartBy = { ...startBy, [editorKey]: Date.now() }
        setChosen(nextChosen)
        setStartBy(nextStartBy)
        await setDoc(
          userRef,
          {
            journeys: { chosen: nextChosen, params: { [editorKey]: nextParamsForKey }, startBy: nextStartBy, setupDone: nextChosen.length > 0 },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      }
    } catch (e) {
      console.error("Failed to save journey params", e)
    }
    closeEditor()
  }

  async function unselectUnlocked(key) {
    if (!chosen.includes(key)) return
    if (isLocked(key)) return
    const nextChosen = chosen.filter(k => k !== key)
    const nextStartBy = { ...startBy }
    delete nextStartBy[key]
    setChosen(nextChosen)
    setStartBy(nextStartBy)
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { journeys: { chosen: nextChosen, startBy: nextStartBy }, updatedAt: serverTimestamp() },
        { merge: true }
      )
    } catch (e) {
      console.error("Failed to unselect journey", e)
    }
  }

  if (!user) {
    return (
      <Card className="p-6 mx-auto max-w-xl text-center">
        <h3 className="text-xl font-semibold mb-2">Journeys</h3>
        <p className="text-text/70">Please sign in.</p>
      </Card>
    )
  }
  if (loading) {
    return (
      <Card className="p-6 mx-auto max-w-xl text-center">
        <h3 className="text-xl font-semibold mb-2">Journeys</h3>
        <p className="text-text/70">Loading…</p>
      </Card>
    )
  }

  const addableLeft = Math.max(0, MAX_ACTIVE - chosen.length)

  return (
    <Card className="p-6 mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" onClick={() => nav(-1)}>{t("back")}</Button>
        <h3 className="text-xl font-semibold">{t("chooseJourneys")}</h3>
        

      </div>
      <p className="text-text/70 mb-4">
        {t("pickUpTo")} <b>{MAX_ACTIVE}</b> {t("journeys")}. {t("eachRunsFor")} <b>{WINDOW_DAYS} {t("days")}</b>. 
        {t("whileActiveLocked")} {addableLeft ? `${addableLeft} ${t("more")}` : t("more")} {t("nowOrLater")}.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <GoalCard title={t("digitalFree")} subtitle={t("digitalFreeSub")} checked={chosen.includes(DIGITAL_FREE)} locked={isLocked(DIGITAL_FREE)} daysLeft={daysLeft(DIGITAL_FREE)} onOpen={() => openEditor(DIGITAL_FREE)} onUnselect={() => unselectUnlocked(DIGITAL_FREE)} disabled={!chosen.includes(DIGITAL_FREE) && chosen.length >= MAX_ACTIVE} />
        <GoalCard title={t("drinkWater")} subtitle={t("drinkWaterSub")} checked={chosen.includes(DRINK_WATER)} locked={isLocked(DRINK_WATER)} daysLeft={daysLeft(DRINK_WATER)} onOpen={() => openEditor(DRINK_WATER)} onUnselect={() => unselectUnlocked(DRINK_WATER)} disabled={!chosen.includes(DRINK_WATER) && chosen.length >= MAX_ACTIVE} />
        <GoalCard title={t("journaling")} subtitle={t("journalingSub")} checked={chosen.includes(JOURNALING)} locked={isLocked(JOURNALING)} daysLeft={daysLeft(JOURNALING)} onOpen={() => openEditor(JOURNALING)} onUnselect={() => unselectUnlocked(JOURNALING)} disabled={!chosen.includes(JOURNALING) && chosen.length >= MAX_ACTIVE} />
        <GoalCard title={t("reading")} subtitle={t("readingSub")} checked={chosen.includes(READING)} locked={isLocked(READING)} daysLeft={daysLeft(READING)} onOpen={() => openEditor(READING)} onUnselect={() => unselectUnlocked(READING)} disabled={!chosen.includes(READING) && chosen.length >= MAX_ACTIVE} />
      </div>

      <Modal open={editorOpen} onClose={closeEditor} title={labelFor(editorKey)}>
        {editorKey && <EditorForm keyName={editorKey} draft={draft} setDraft={setDraft} />}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={closeEditor}>Cancel</Button>
          <Button variant="primary" onClick={applyDraft}>Save</Button>
        </div>
      </Modal>
    </Card>
  )
}

// ---------- helpers ----------
function labelFor(key) {
  if (key === DIGITAL_FREE) return "Digital free time"
  if (key === DRINK_WATER)  return "Drink water"
  if (key === JOURNALING)   return "Journaling"
  if (key === READING)      return "Reading"
  return "Goal"
}

function GoalCard({ goal, title, subtitle, checked, locked, daysLeft, disabled, onOpen }) {
  const { t } = useLang();   // ✅ now available

  const selectedCls = checked ? "border-primary bg-primary/10 text-primary" : "border-ring hover:bg-muted/40"
  const canEditSelected = checked && !locked
  const ctaLabel = checked ? (locked ? t("locked") : t("edit")) : (disabled ? t("locked") : t("setUp"))
  const ctaDisabled = (!checked && disabled) || (checked && locked)

  return (
    <div
      className={`p-4 rounded-xl border transition cursor-pointer ${selectedCls} ${(!checked && disabled) ? "opacity-50" : ""}`}
      onClick={() => { if ((!checked && !disabled) || canEditSelected) onOpen() }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-text/60">{subtitle}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-text/60">
          {checked
            ? (locked ? `${t("locked")} • ${daysLeft}${t("daysLeft")}` : t("selectedTapToEdit"))
            : (disabled ? t("fullWait") : t("notSet"))}
        </span>
        <Button
          variant={checked ? "ghost" : "primary"}
          onClick={(e) => { e.stopPropagation(); if ((!checked && !disabled) || canEditSelected) onOpen() }}
          disabled={ctaDisabled}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  )
}


function EditorForm({ keyName, draft, setDraft }) {
  const set = (field, value) => setDraft(prev => ({ ...prev, [field]: value }))
  const { t } = useLang();  
  const CommonSection = (
    <div className="grid gap-3">
      <div>
        <label  className="field">{t("whyDo you want to do this?")}</label>
        <input className="text" value={draft.why ?? ""} onChange={(e) => set("why", e.target.value)} placeholder={t("Your reason or motivation")} />
      </div>
      <div>
        <label className="field">{t("When will you work on this goal?")} (approx.)</label>
        <input type="time" className="text !w-40" value={draft.approxTime ?? "07:00"} onChange={(e) => set("approxTime", e.target.value)} />
      </div>
      {keyName !== DRINK_WATER ? (
        <div>
          <label className="field">{t("Target duration (hh:mm)")}</label>
          <input type="time" step="60" className="text !w-28" value={minsToHM(draft.minutesPerDay ?? 10)} onChange={(e) => set("minutesPerDay", hmToMins(e.target.value))} />
        </div>
      ) : (
        <div>
          <label className="field">{t(">Daily target (ml)")}</label>
          <input type="number" min="200" step="50" className="text !w-28" value={draft.dailyTargetMl ?? 2000} onChange={(e) => set("dailyTargetMl", Math.max(100, parseInt(e.target.value || "2000", 10)))} />
        </div>
      )}
    </div>
  )

  if (keyName === DIGITAL_FREE) {
    return (
      <div className="grid gap-4">
        {CommonSection}
        <div>
          <label className="field">{t("What can you do in this time?")}</label>
          <input className="text" value={draft.activitySuggestion ?? "Nothing"} onChange={(e) => set("activitySuggestion", e.target.value)} placeholder={t("e.g., Nothing, walking, tea, stretching")} />
        </div>
      </div>
    )
  }
  if (keyName === DRINK_WATER) {
    return (
      <div className="grid gap-4">
        {CommonSection}
        <div>
          <label className="field">{t("Bottle/cup size (ml)")}</label>
          <input type="number" min="50" step="50" className="text !w-28" value={draft.bottleMl ?? 600} onChange={(e) => set("bottleMl", Math.max(50, parseInt(e.target.value || "600", 10)))} />
        </div>
      </div>
    )
  }
  if (keyName === JOURNALING) {
    return (
      <div className="grid gap-4">
        {CommonSection}
        <div>
          <label className="field">{t(">How are you going to journal?")}</label>
          <input className="text" value={draft.journalMethod ?? "Notebook and pen"} onChange={(e) => set("journalMethod", e.target.value)} placeholder={t("e.g., Notebook and pen")} />
          <p className="text-xs text-text/60 mt-1">
            {t("suggestion")}:
            <Button
              variant="ghost"
              size="sm"
              className="underline px-1"
              onClick={() => set("journalMethod", "Notebook and pen")}
            >
              {t("Notebook and pen")}
            </Button>
          </p>
        </div>
      </div>
    )
  }
  if (keyName === READING) {
    return (
      <div className="grid gap-4">
        {CommonSection}
        <div>
          <label className="field">{t("What is the book you will read?")}</label>
          <input className="text" value={draft.bookName ?? ""} onChange={(e) => set("bookName", e.target.value)} placeholder={t("e.g., Atomic Habits")} />
        </div>
      </div>
    )
  }
  return CommonSection
}
