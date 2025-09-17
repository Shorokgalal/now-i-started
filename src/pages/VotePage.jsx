// src/pages/VotePage.jsx
import React, { useEffect, useState } from "react"
import { useLang } from "../state/lang.jsx"
import { useAuth } from "../state/auth.jsx"
import { useNavigate } from "react-router-dom"

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  where,
  collection,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../lib/firebase"

import {
  HoverTime,
  ReactionButton,
  Avatar,
  MessageText,
} from "../components/ui/MessageHelpers.jsx"
import { Card, Page, Button } from "../components/ui"

// ----------------------------------------------------------------
// Journey keys + helpers
// ----------------------------------------------------------------
const DIGITAL_FREE = "digital_free"
const DRINK_WATER = "drink_water"
const JOURNALING = "journaling"
const READING = "reading"

const ALL_JOURNEYS = [DIGITAL_FREE, DRINK_WATER, JOURNALING, READING]

const GOAL_ID_MAP = {
  [DIGITAL_FREE]: "digital-free-1h",
  [DRINK_WATER]: "drink-water",
  [JOURNALING]: "journaling",
  [READING]: "reading",
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))
const pad2 = (n) => String(n).padStart(2, "0")
const ymd = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

function goalIdOf(k) {
  return GOAL_ID_MAP[k] || k
}
function shareIdFor(uid, k, day) {
  return `${uid}_${goalIdOf(k)}_${ymd(day)}`
}
function hmToSec(hh, mm) {
  const h = Math.max(0, parseInt(hh || "0", 10))
  const m = Math.max(0, parseInt(mm || "0", 10))
  return h * 3600 + m * 60
}

// ----------------------------------------------------------------
// Main Page
// ----------------------------------------------------------------
export default function VotePage() {
  const { t } = useLang()
  const { user } = useAuth()
  const [chosen, setChosen] = useState([])
  const [params, setParams] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedJourney, setSelectedJourney] = useState(null)

  useEffect(() => {
    if (!user?.uid) return
    const ref = doc(db, "users", user.uid)
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setChosen([])
        setParams({})
        setLoading(false)
        return
      }
      const data = snap.data()
      const j =
        data.journeys && typeof data.journeys === "object"
          ? data.journeys
          : {}
      setChosen(Array.isArray(j.chosen) ? j.chosen : [])
      setParams(j.params && typeof j.params === "object" ? j.params : {})
      setLoading(false)
    })
    return () => unsub()
  }, [user?.uid])

  if (!user) {
    return (
      <Page>
        <Card>
          <h3 className="text-xl font-semibold mb-2">{t("vote")}</h3>
          <p className="text-text/70">{t("pleaseSignIn")}</p>
        </Card>
      </Page>
    )
  }

  if (loading) {
    return (
      <Page>
        <Card>
          <h3 className="text-xl font-semibold mb-2">{t("vote")}</h3>
          <p className="text-text/70">Loading…</p>
        </Card>
      </Page>
    )
  }

  if (!selectedJourney) {
    return (
      <Page>
        <Card>
          <h2 className="text-xl font-semibold mb-4">{t("journeys")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {ALL_JOURNEYS.map((k) => (
              <JourneyCard
                key={k}
                journeyKey={k}
                active={chosen.includes(k)}
                onClick={() => setSelectedJourney(k)}
              />
            ))}
          </div>
        </Card>
      </Page>
    )
  }

  return (
    <Page className="space-y-4">
      <VoteCard
        user={user}
        journeyKey={selectedJourney}
        params={params?.[selectedJourney] || {}}
        onBack={() => setSelectedJourney(null)}
      />
    </Page>
  )
}

// ----------------------------------------------------------------
// Journey summary card
// ----------------------------------------------------------------
function JourneyCard({ journeyKey, active, onClick }) {
  const { t } = useLang()
  const [subsCount, setSubsCount] = useState(0)
  const [voteCount, setVoteCount] = useState(0)
  const todayKey = ymd(new Date())
  const nav = useNavigate()

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("journeys.chosen", "array-contains", journeyKey)
    )
    return onSnapshot(q, (snap) => setSubsCount(snap.size))
  }, [journeyKey])

  useEffect(() => {
    const q = query(
      collection(db, "shares"),
      where("goalId", "==", GOAL_ID_MAP[journeyKey]),
      where("dayKey", "==", todayKey),
      where("source", "==", "vote")
    )
    return onSnapshot(q, (snap) => setVoteCount(snap.size))
  }, [journeyKey, todayKey])

  return (
    <Card
      onClick={active ? onClick : undefined}
      className={`transition ${
        active
          ? "hover:shadow-md cursor-pointer border-primary bg-primary/5"
          : "hover:shadow-md cursor-pointer"
      }`}
    >
      <h3 className="font-semibold mb-1">
        {t(journeyKey === DRINK_WATER ? "drinkWater" : journeyKey)}
      </h3>
      <p className="text-sm text-text/70 mb-2">
        {t(journeyKey + "Quote")}
      </p>

      <div className="flex items-center justify-between text-sm mt-2">
        <div className="flex flex-col">
          <span>{subsCount} {t("subscribers")}</span>
          <span>{voteCount} {t("votersToday")}</span>
        </div>

        <div>
          {active ? (
            <Button variant="ghost" size="sm" disabled>
              {t("joined")}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                nav(`/journeys?join=${journeyKey}`)
              }}
            >
              {t("join")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// ----------------------------------------------------------------
// Vote Card
// ----------------------------------------------------------------
function VoteCard({ user, journeyKey, params, onBack }) {
  const { t } = useLang()
  const [when, setWhen] = useState("today")
  const [existing, setExisting] = useState(null)
  const [editing, setEditing] = useState(false)
  const [done, setDone] = useState(null)
  const [h, setH] = useState("00")
  const [m, setM] = useState("10")
  const [ml, setMl] = useState("600")
  const [saving, setSaving] = useState(false)

  const [hasReflection, setHasReflection] = useState(false)
  const [writingReflection, setWritingReflection] = useState(false)
  const [reflection, setReflection] = useState("")

  const selectedDay = () => {
    const d = new Date()
    if (when === "yesterday") d.setDate(d.getDate() - 1)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const day = selectedDay()

  // Load existing vote
  useEffect(() => {
    if (!user?.uid || !journeyKey) return
    const ref = doc(db, "shares", shareIdFor(user.uid, journeyKey, day))
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setExisting(data)
        setDone(data.done ?? null)
        if (journeyKey === DRINK_WATER && data.waterMl) {
          setMl(String(data.waterMl))
        } else if (data.actualSec) {
          const hh = Math.floor(data.actualSec / 3600)
          const mm = Math.floor((data.actualSec % 3600) / 60)
          setH(String(hh).padStart(2, "0"))
          setM(String(mm).padStart(2, "0"))
        }
        setHasReflection(!!data.reflectionAdded)
      } else {
        setExisting(null)
        setDone(null)
        setHasReflection(false)
      }
    })
    return () => unsub()
  }, [user?.uid, journeyKey, when])

  async function saveVote(finalize = false) {
    if (!user?.uid) return
    setSaving(true)
    try {
      const ref = doc(db, "shares", shareIdFor(user.uid, journeyKey, day))
      const snap = await getDoc(ref)
      let prev = snap.exists() ? snap.data() : {}

      let addSec = 0
      let addMl = 0
      if (done) {
        if (journeyKey === DRINK_WATER) {
          addMl = parseInt(ml || "0", 10)
        } else {
          addSec = hmToSec(h, m)
        }
      }

      const totalSec = (prev.actualSec || 0) + addSec
      const totalMl = (prev.waterMl || 0) + addMl

      // ✅ classify vote
      let voteClass = "no"
      if (done) {
        if (journeyKey === DRINK_WATER) {
          voteClass = totalMl >= (params?.dailyTargetMl || 2000) ? "exceed" : "done"
        } else {
          const targetMin =
            journeyKey === "reading"
              ? params?.minutesPerDay ?? params?.dailyMin ?? 10
              : journeyKey === "journaling"
              ? params?.minutesPerDay ?? 10
              : journeyKey === "digital_free"
              ? params?.minutesPerDay ?? 60
              : 0
          voteClass = totalSec >= targetMin * 60 ? "exceed" : "done"
        }
      }

      await setDoc(
        ref,
        {
          uid: user.uid,
          journeyKey,
          goalId: goalIdOf(journeyKey),
          dayKey: ymd(day),
          createdAt: prev.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
          source: "vote",
          actualSec: totalSec || null,
          waterMl: totalMl || null,
          done: !!done,
          finalized: finalize ? true : prev.finalized || false,
          voteClass, // ✅ saved for poll results
        },
        { merge: true }
      )

      // ✅ update local state immediately
      setExisting({
        ...prev,
        actualSec: totalSec,
        waterMl: totalMl,
        done: !!done,
        finalized: finalize ? true : prev.finalized || false,
        voteClass,
      })

      setEditing(false)
    } catch (e) {
      console.error("saveVote error", e)
    } finally {
      setSaving(false)
    }
  }



  async function saveReflection() {
    if (!user?.uid) return
    const ref = doc(db, "shares", shareIdFor(user.uid, journeyKey, day))
    try {
      await setDoc(
        ref,
        {
          reflection: reflection.trim(),
          reflectionAdded: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      setWritingReflection(false)
      setHasReflection(true)
      setReflection("")
    } catch (e) {
      console.error("saveReflection error", e)
    }
  }

  const finalized = !!existing?.finalized
  const showVoteBtn = !finalized && !editing

  return (
    <div className="space-y-4">
      <Card>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              {t("back")}
            </Button>
            <h3 className="text-xl font-semibold">{t(journeyKey)}</h3>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <select
              className="text !w-28"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            >
              <option value="today">{t("today")}</option>
              <option value="yesterday">{t("yesterday")}</option>
            </select>
            <span
              className={`badge ${
                finalized
                  ? "bg-slate-100 text-slate-700"
                  : "bg-amber-50 text-amber-700"
              }`}
              style={{ minWidth: 70, textAlign: "center" }}
            >
              {finalized ? t("finalized") : t("draft")}
            </span>
            {showVoteBtn && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                {t("vote")}
              </Button>
            )}
            {editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                {t("close")}
              </Button>
            )}
          </div>
        </div>

        {/* Inline form */}
        {editing && (
          <div className="grid gap-4 mb-4">
            <fieldset className="space-y-2">
              <legend className="field">{t("haveYouDone")}</legend>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="done" checked={done === true} onChange={() => setDone(true)} />
                  <span>{t("yes")}</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="done" checked={done === false} onChange={() => setDone(false)} />
                  <span>{t("no")}</span>
                </label>
              </div>
            </fieldset>

            {done === true && journeyKey === DRINK_WATER && (
              <div className="flex items-center gap-2">
                <label className="field whitespace-nowrap">{t("ml")}</label>
                <input
                  className="text !w-24"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={ml}
                  onChange={(e) => setMl((e.target.value || "0").replace(/[^\d]/g, ""))}
                />
              </div>
            )}

            {done === true && journeyKey !== DRINK_WATER && (
              <div className="flex items-center gap-2">
                <label className="field whitespace-nowrap">{t("duration")}</label>
                <input
                  className="text !w-16 text-center"
                  type="number"
                  min="0"
                  value={h}
                  onChange={(e) => setH(String(clamp(parseInt(e.target.value || "0", 10), 0, 23)).padStart(2, "0"))}
                />
                <span>:</span>
                <input
                  className="text !w-16 text-center"
                  type="number"
                  min="0"
                  value={m}
                  onChange={(e) => setM(String(clamp(parseInt(e.target.value || "0", 10), 0, 59)).padStart(2, "0"))}
                />
              </div>
            )}
          </div>
        )}

        {editing && (
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => saveVote(false)} disabled={saving}>
              {t("toBeContinued")}
            </Button>
            <Button variant="primary" onClick={() => saveVote(true)} disabled={saving || !done}>
              {saving ? t("saving") : t("done")}
            </Button>
          </div>
        )}

        <PollResults goalId={goalIdOf(journeyKey)} dayKey={ymd(day)} myShareId={shareIdFor(user.uid, journeyKey, day)} />
      </Card>

      {!hasReflection && !writingReflection && (
        <Button variant="outline" onClick={() => setWritingReflection(true)}>+ {t("reflection")}</Button>
      )}
      {writingReflection && (
        <Card className="p-4">
          <textarea
            className="text w-full mb-3"
            rows={3}
            placeholder={t("reflectionPlaceholder")}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setWritingReflection(false)}>{t("cancel")}</Button>
            <Button variant="primary" onClick={saveReflection} disabled={!reflection.trim()}>{t("share")}</Button>
          </div>
        </Card>
      )}

      <ContributionCard journeyKey={journeyKey} currentUser={user} />
    </div>
  )
}

// ----------------------------------------------------------------
// Poll Results
// ----------------------------------------------------------------
function PollResults({ goalId, dayKey, myShareId }) {
  const { t } = useLang()
  const [counts, setCounts] = useState({ exceed: 0, done: 0, no: 0 })
  const [myClass, setMyClass] = useState(null)
  const [myValue, setMyValue] = useState(null) // ✅ store your total ml or minutes

  useEffect(() => {
    const q = query(
      collection(db, "shares"),
      where("goalId", "==", goalId),
      where("dayKey", "==", dayKey),
      where("source", "==", "vote")
    )

    const unsub = onSnapshot(q, (snap) => {
      let exceed = 0, done = 0, no = 0
      let mine = null
      let totalSec = 0
      let totalMl = 0

      snap.forEach((docSnap) => {
        const d = docSnap.data()
        const c = d.voteClass || (d.status === "skipped" ? "no" : "done")
        if (c === "exceed") exceed++
        else if (c === "done") done++
        else no++

        if (docSnap.id === myShareId) mine = c

        // ✅ sum up your own values across the day
        if (d.uid === myShareId.split("_")[0]) {
          if (d.waterMl) totalMl += d.waterMl
          if (d.actualSec) totalSec += d.actualSec
        }
      })

  setCounts({ exceed, done, no })
  setMyClass(mine)

  // format myValue
  if (totalMl > 0) {
    setMyValue(totalMl >= 1000 ? `${(totalMl / 1000).toFixed(1)} L` : `${totalMl} ml`)
  } else if (totalSec > 0) {
    const totalMin = Math.round(totalSec / 60)
    if (totalMin < 60) {
      setMyValue(`${totalMin} min`)
    } else {
      const hh = Math.floor(totalMin / 60)
      const mm = totalMin % 60
      setMyValue(`${hh}h${mm > 0 ? ` ${mm}m` : ""}`)
    }
  } else {
    setMyValue(null)
  }
})


    return () => unsub()
  }, [goalId, dayKey, myShareId])

  const maxCount = Math.max(1, counts.exceed, counts.done, counts.no)

  const Row = ({ label, n, tone, selected }) => (
    <div className="flex items-center gap-3 py-1">
      <span className={`inline-block h-2 w-2 rounded-full ${tone.dot}`} />
      <span className="font-medium">{label}</span>
      {selected && myValue && (
        <span className="badge bg-slate-800 text-white">{myValue}</span>
      )}
      <div className="flex-1 rounded bg-black/5 overflow-hidden" style={{ height: 6 }}>
        <div
          className={`${tone.bar}`}
          style={{ height: "100%", width: `${Math.max(6, (n / maxCount) * 100)}%` }}
        />
      </div>
      <span className="text-xs text-text/60 w-6 text-right">{n}</span>
    </div>
  )

  return (
    <div className="space-y-2">
      <Row
        label={t("exceeded")}
        n={counts.exceed}
        tone={{ dot: "bg-green-600", bar: "bg-green-500/80" }}
        selected={myClass === "exceed"}
      />
      <Row
        label={t("done")}
        n={counts.done}
        tone={{ dot: "bg-blue-600", bar: "bg-blue-500/80" }}
        selected={myClass === "done"}
      />
      <Row
        label={t("no")}
        n={counts.no}
        tone={{ dot: "bg-rose-600", bar: "bg-rose-500/80" }}
        selected={myClass === "no"}
      />
    </div>
  )
}


// ----------------------------------------------------------------
// Contribution Card
// ----------------------------------------------------------------
function ContributionCard({ journeyKey, currentUser }) {
  const { t } = useLang()
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, "shares"),
      where("journeyKey", "==", journeyKey),
      where("reflectionAdded", "==", true)
    )
    const unsub = onSnapshot(q, (snap) => {
      const list = []
      snap.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }))
      list.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))
      setMessages(list)
    })
    return () => unsub()
  }, [journeyKey])

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">{t("communityContributions")}</h3>
      {messages.length === 0 ? (
        <p className="text-sm text-text/60">{t("noContributions")}</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 items-start">
              <Avatar src={msg.authorPhotoURL || msg.photoURL} name={msg.authorName} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{msg.authorName}</span>
                  <HoverTime ts={msg.createdAt} />
                </div>
                <MessageText text={msg.reflection} />
                <div className="mt-2">
                  <ReactionButton messageId={msg.id} uid={currentUser?.uid} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
