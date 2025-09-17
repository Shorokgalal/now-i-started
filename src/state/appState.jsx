// src/state/appState.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useAuth } from "./auth.jsx"
import { db } from "../lib/firebase"
import {
  collection, onSnapshot, orderBy, query
} from "firebase/firestore"

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const { user } = useAuth()

  // ⏳ community viewing allowance (per calendar day, persisted)
  const [communityLock, setCommunityLock] = useState({ leftSec: 15 * 60, lockedUntil: null })
  useEffect(() => {
    const key = "communityLock:" + new Date().toISOString().slice(0, 10)
    const saved = localStorage.getItem(key)
    if (saved) setCommunityLock(JSON.parse(saved))
  }, [])
  useEffect(() => {
    const key = "communityLock:" + new Date().toISOString().slice(0, 10)
    localStorage.setItem(key, JSON.stringify(communityLock))
  }, [communityLock])

  // 🔄 live shares feed (used in Questions & Vote pages)
  const [feed, setFeed] = useState([])
  useEffect(() => {
    const q = query(collection(db, "shares"), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      setFeed(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const value = useMemo(() => ({
    communityLock, setCommunityLock,
    feed,
  }), [communityLock, feed])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export const useApp = () => useContext(AppCtx)
