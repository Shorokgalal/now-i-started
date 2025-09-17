import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { auth } from "../../lib/firebase"
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth"
import { Button, Card } from "../../components/ui"

export default function ConfirmResetPassword() {
  const [searchParams] = useSearchParams()
  const nav = useNavigate()

  const oobCode = searchParams.get("oobCode") // Firebase sends this in URL
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  // Verify reset code on mount
  useEffect(() => {
    if (!oobCode) {
      setError("Invalid reset link.")
      setLoading(false)
      return
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmail(email)
        setLoading(false)
      })
      .catch(() => {
        setError("This reset link is invalid or expired.")
        setLoading(false)
      })
  }, [oobCode])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
      setSuccess(true)
      setTimeout(() => nav("/auth"), 2000) // Redirect after 2s
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-text/70">
        Verifying reset link…
      </div>
    )
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md p-6 space-y-3">
        <h1 className="text-2xl font-bold">Set new password</h1>
        {email && <p className="text-sm text-text/70">For account: <b>{email}</b></p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="field">New Password</label>
          <input
            className="text"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <label className="field">Confirm Password</label>
          <input
            className="text"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button variant="primary" className="w-full">
            Reset Password
          </Button>
        </form>
        {success && <p className="text-green-700">Password has been reset! Redirecting…</p>}
        {error && <p className="text-red-600">{error}</p>}
      </Card>
    </div>
  )
}
