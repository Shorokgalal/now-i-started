// src/pages/AuthPage.jsx
import React, { useState } from "react"
import { useAuth } from "../state/auth.jsx"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "../components/ui"

export default function AuthPage() {
  const { signIn, signUp, sendReset, startEmailLinkSignIn } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || "/vote"

  const [mode, setMode] = useState("signin") // "signin" | "signup"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [username, setUsername] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const [msg, setMsg] = useState("")

  async function onSubmit(e) {
    e.preventDefault()
    setErr("")
    setMsg("")
    setBusy(true)

    try {
      if (mode === "signup") {
        if (!username.trim()) throw new Error("Please enter a username.")
        if (password.length < 6) throw new Error("Password must be at least 6 characters.")
        if (password !== confirm) throw new Error("Passwords do not match.")

        await signUp({ email, password, displayName: username })
      } else {
        await signIn({ email, password })
      }

      nav(from, { replace: true })
    } catch (e) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  async function onForgot() {
    setErr("")
    setMsg("")
    try {
      if (!email) throw new Error("Enter your email first.")
      await sendReset(email)
      setMsg("Password reset email sent.")
    } catch (e) {
      setErr(e?.message || String(e))
    }
  }

  async function onSendLink() {
    setErr("")
    setMsg("")
    try {
      if (!email) throw new Error("Enter your email first.")
      await startEmailLinkSignIn(email)
      setMsg("Sign-in link sent. Check your inbox.")
    } catch (e) {
      setErr(e?.message || String(e))
    }
  }

  return (
    <div className="card p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-center">
        {mode === "signup" ? "Create account" : "Sign in"}
      </h1>

      <form className="grid gap-3" onSubmit={onSubmit}>
        {mode === "signup" && (
          <>
            <label className="field">Username</label>
            <input
              className="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </>
        )}

        <label className="field">Email</label>
        <input
          className="text"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="field">Password</label>
        <input
          className="text"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        

        {mode === "signup" && (
          <>
            <label className="field">Confirm password</label>
            <input
              className="text"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </>
        )}

        <Button variant="primary" className="mt-2" disabled={busy} type="submit">
          {busy
            ? mode === "signup"
              ? "Creating…"
              : "Signing in…"
            : mode === "signup"
            ? "Sign up"
            : "Sign in"}
        </Button>
      </form>

      {mode === "signin" && (
        <div className="mt-3 flex flex-col gap-2 text-sm text-center">
          <Button variant="ghost" onClick={onForgot}>
            Forgot password?
          </Button>
          <Button variant="ghost" onClick={onSendLink}>
            Send me a magic sign-in link
          </Button>
        </div>
      )}

      {msg && <div className="text-green-700 text-sm mt-2">{msg}</div>}
      {err && <div className="text-red-600 text-sm mt-2">{err}</div>}

      <div className="mt-6 text-sm text-center">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Button variant="ghost" onClick={() => setMode("signin")}>
              Sign in
            </Button>
          </>
        ) : (
          <>
            New here?{" "}
            <Button variant="ghost" onClick={() => setMode("signup")}>
              Create account
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
