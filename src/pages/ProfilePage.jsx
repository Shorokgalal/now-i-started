// src/pages/ProfilePage.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useLang } from "../state/lang.jsx"; 
import { useAuth } from "../state/auth.jsx"
import { useNavigate, useParams } from "react-router-dom"
import { db } from "../lib/firebase"
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  orderBy,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore"
import { updateProfile } from "firebase/auth"

// UI Components
import { Page, Card, Button } from "../components/ui"
import Stat from "../components/profile/Stat.jsx"
import { EditIcon, CheckIcon, XIcon } from "../components/profile/Icons.jsx"
import JourneyCard from "../components/profile/JourneyCard.jsx"
import MonthGridCard from "../components/profile/MonthGridCard.jsx"

import useJourneyDefs from "../components/profile/buildJourneyDefs.js"

// ---------- helpers ----------
function fmtHM(totalSec = 0) {
  const m = Math.floor(totalSec / 60)
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${h}h ${mm}m`
}

function dayKey(d) {
  const dt = d instanceof Date ? d : d?.toDate?.() || new Date()
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, "0")
  const dd = String(dt.getDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

// ---------- page ----------
export default function ProfilePage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const { uid: routeUid } = useParams()
  const viewingUid = routeUid || user?.uid
  const isSelf = !routeUid || routeUid === user?.uid
  const { t } = useLang()
  
  // profiles/*
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    if (!viewingUid) return
    const ref = doc(db, "profiles", viewingUid)
    return onSnapshot(ref, (s) => setProfile(s.data() || null))
  }, [viewingUid])

  // users/*
  const [userCfg, setUserCfg] = useState(null)
  useEffect(() => {
    if (!viewingUid) return
    const ref = doc(db, "users", viewingUid)
    return onSnapshot(ref, (s) => setUserCfg(s.data() || null))
  }, [viewingUid])

  // shares/*
  const [shares, setShares] = useState([])
  useEffect(() => {
    if (!viewingUid) return
    const q = query(
      collection(db, "shares"),
      where("uid", "==", viewingUid),
      orderBy("createdAt", "desc")
    )
    return onSnapshot(q, (snap) =>
      setShares(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
  }, [viewingUid])

  // live totals
  const [heartsTotal, setHeartsTotal] = useState(0)
  const [inspiresTotal, setInspiresTotal] = useState(0)
  useEffect(() => {
    const heartMap = new Map()
    const inspMap = new Map()
    const unsubs = []
    shares.forEach((s) => {
      const rRef = collection(db, "shares", s.id, "reactions")
      const iRef = collection(db, "shares", s.id, "inspirations")
      const ur = onSnapshot(rRef, (snap) => {
        heartMap.set(s.id, snap.size)
        setHeartsTotal([...heartMap.values()].reduce((a, b) => a + b, 0))
      })
      const ui = onSnapshot(iRef, (snap) => {
        inspMap.set(s.id, snap.size)
        setInspiresTotal([...inspMap.values()].reduce((a, b) => a + b, 0))
      })
      unsubs.push(ur, ui)
    })
    return () => unsubs.forEach((u) => u && u())
  }, [shares])

  // backfill startedAtMs
  useEffect(() => {
    if (!user || !isSelf) return
    const j = userCfg?.journeys
    const chosen = j?.chosen || []
    const started = j?.startedAtMs
    if (chosen.length > 0 && !started) {
      setDoc(
        doc(db, "users", user.uid),
        { journeys: { startedAtMs: Date.now() }, updatedAt: serverTimestamp() },
        { merge: true }
      )
    }
  }, [isSelf, user?.uid, userCfg?.journeys?.chosen, userCfg?.journeys?.startedAtMs])

  // earliest share anchor
  const earliestShareMs = useMemo(() => {
    if (!shares.length) return null
    let min = Infinity
    for (const s of shares) {
      const t = s.finishedAt?.toDate
        ? s.finishedAt.toDate()
        : s.createdAt?.toDate
        ? s.createdAt.toDate()
        : null
      if (!t) continue
      const ms = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()
      if (ms < min) min = ms
    }
    return min === Infinity ? null : min
  }, [shares])

  // chosen journeys
  const inferredChosen = useMemo(() => {
    const set = new Set()
    for (const s of shares) {
      if (s.journeyKey) set.add(s.journeyKey)
      const g = s.goalId || ""
      if (g.startsWith("digital-free")) set.add("digital_free")
      if (g === "drink-water") set.add("drink_water")
      if (g === "journaling") set.add("journaling")
      if (g === "reading") set.add("reading")
    }
    return Array.from(set)
  }, [shares])

  const chosen = useMemo(() => {
    const fromCfg = userCfg?.journeys?.chosen
    if (!fromCfg) return []
    if (isSelf) return fromCfg
    return Array.isArray(fromCfg) && fromCfg.length > 0 ? fromCfg : inferredChosen
  }, [isSelf, userCfg?.journeys?.chosen, inferredChosen])

  const params = userCfg?.journeys?.params || {}
  const showSetupCTA =
    isSelf &&
    (!userCfg ||
      !userCfg.journeys ||
      !Array.isArray(userCfg.journeys.chosen) ||
      userCfg.journeys.chosen.length === 0)

  // Use custom hook for journey defs (valid hooks usage)
  const journeyDefs = useJourneyDefs({
    chosen,
    params,
    shares,
    startBy: userCfg?.journeys?.startBy || {},
    fallbackStartMs: earliestShareMs || Date.now(),
  })

  const visibleJourneys = journeyDefs.slice(0, 2)
  const twoUp = visibleJourneys.length === 2

  // guard: no user
  if (!user) {
    return (
      <Page>
        <Card className="text-center">
          <h2 className="text-2xl font-semibold mb-2">{t("profile")}</h2>
          <p className="text-text/70 mb-4">{t("signInPrompt")}</p>
          <Button variant="primary" onClick={() => nav("/sign-in")}>
            {t("signIn")}
          </Button>
        </Card>
      </Page>
    )
  }

  // name editing
  const emailName = isSelf ? (user?.email || "").split("@")[0] : ""
  const [name, setName] = useState(
    isSelf ? user?.displayName || emailName || "User" : "User"
  )
  useEffect(() => {
    if (isSelf) return
    const otherName =
      userCfg?.displayName ||
      profile?.displayName ||
      shares[0]?.authorName ||
      "User"
    setName(otherName)
  }, [isSelf, userCfg?.displayName, profile?.displayName, shares])
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(name)
  const [savingName, setSavingName] = useState(false)
  const [nameErr, setNameErr] = useState("")
  const initial = (name || "U").trim().charAt(0).toUpperCase()

  async function saveName() {
    if (!isSelf) return
    const newName = (nameDraft || "").trim()
    if (!newName) {
      setNameErr("Please enter a name.")
      return
    }
    if (newName === name) {
      setEditingName(false)
      setNameErr("")
      return
    }
    setSavingName(true)
    try {
      await setDoc(doc(db, "profiles", user.uid), { displayName: newName }, { merge: true })
      await updateProfile(user, { displayName: newName })
      setName(newName)
      setEditingName(false)
      setNameErr("")
    } catch (err) {
      console.error("Failed to update name:", err)
      setNameErr("Could not save name. Try again.")
    } finally {
      setSavingName(false)
    }
  }

  // ---------- RETURN ----------
  return (
    <Page>
      {/* Profile card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-accent/10 text-accent border border-ring h-16 w-16 grid place-items-center text-2xl font-semibold">
            {initial}
          </div>
          <div className="flex-1 grid gap-3">
            {/* Name / Edit */}
            {!editingName ? (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-semibold break-all">{name}</div>
                {isSelf && (
                  <button
                    className="p-2 rounded-lg hover:bg-muted/50"
                    onClick={() => {
                      setNameDraft(name)
                      setEditingName(true)
                    }}
                  >
                    <EditIcon className="h-5 w-5 text-text/70" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  className="text flex-1"
                  value={nameDraft}
                  maxLength={40}
                  onChange={(e) => setNameDraft(e.target.value)}
                  autoFocus
                />
                {isSelf && (
                  <button
                    className="p-2 rounded-lg hover:bg-muted/50"
                    onClick={saveName}
                    disabled={savingName}
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                )}
                <button
                  className="p-2 rounded-lg hover:bg-muted/50"
                  onClick={() => {
                    setEditingName(false)
                    setNameDraft(name)
                    setNameErr("")
                  }}
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            )}
            {nameErr && <p className="text-sm text-red-600">{nameErr}</p>}
            
            {/* 3 metrics */}
            <div className="grid grid-cols-3 gap-3 mt-2">
              <Stat label={t("reacts")} value={heartsTotal} />
              <Stat label={t("inspiring")} value={inspiresTotal} />
              <Stat label={t("journeys")} value={Array.isArray(chosen) ? chosen.length : 0} />
            </div>
          </div>
        </div>
      </Card>

      {/* CTA */}
      {isSelf && showSetupCTA && (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{t("noJourneyYet")}</h3>
              <p className="text-sm text-text/70">{t("ctaDescription")}</p>
            </div>
            <Button variant="primary" className="shrink-0" onClick={() => nav("/journey")}>
              {t("setUpJourney")}
            </Button>
          </div>
        </Card>
      )}

      {/* Journeys */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-[#2B1B47]">{t("yourJourneys")}</h2>
          {isSelf && (
            <button
              onClick={() => nav("/journey")}
              className="text-sm text-[#7C6AE6] hover:underline"
            >
              {t("editJourneys")}
            </button>
          )}
        </div>

        {chosen.length > 0 ? (
          <div className={twoUp ? "grid sm:grid-cols-2 gap-4" : "grid gap-4"}>
            {visibleJourneys.map(({ key, ...rest }) => (
              <JourneyCard key={key} {...rest} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text/60 italic">{t("noJourneysYet")}</p>
        )}
      </div>

      {/* Monthday pattern */}
      {chosen.length > 0 && (
        <div className="grid gap-4">
          {journeyDefs.map((d) => (
            <MonthGridCard key={d.key} def={d} />
          ))}
        </div>
      )}
    </Page>
  )
}
