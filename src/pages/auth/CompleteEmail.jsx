// src/pages/auth/CompleteEmail.jsx
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../state/auth.jsx"
import { isEmailLink } from "../../lib/firebase.js"
import { Button, Card } from "../../components/ui"

export default function CompleteEmail() {
  const nav = useNavigate()
  const { completeEmailLinkSignIn } = useAuth()
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(true)
  const [needsEmail, setNeedsEmail] = useState(false)
  const [err, setErr] = useState("")

  useEffect(() => {
    async function run() {
      try {
        if (!isEmailLink(window.location.href)) {
          setErr("Invalid or expired link.")
          return
        }
        let stored = null
        try { stored = window.localStorage.getItem("emailForSignIn") } catch {}
        if (stored) {
          await completeEmailLinkSignIn(stored)
          nav("/vote", { replace: true })   // ✅ changed to /vote
          return
        }
        setNeedsEmail(true)
      } catch (e) {
        setErr(e?.message || String(e))
      } finally {
        setBusy(false)
      }
    }
    run()
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setErr(""); setBusy(true)
    try {
      await completeEmailLinkSignIn(email)
      nav("/vote", { replace: true })   // ✅ changed to /vote
    } catch (e) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  if (busy) return <div className="p-6">Completing sign-in…</div>
  if (err)  return <div className="p-6 text-red-600">{err}</div>
  if (!needsEmail) return <div className="p-6">Finishing up…</div>

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Confirm your email</h1>
      <p className="text-text/70 mb-4">Enter the email that received the link.</p>
      <form className="grid gap-3" onSubmit={onSubmit}>
        <input
          className="text"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button variant="primary" disabled={busy}>
          {busy ? "Signing in…" : "Finish sign-in"}
        </Button>
        {err && <div className="text-red-600 text-sm">{err}</div>}
      </form>
    </Card>
  )
}
