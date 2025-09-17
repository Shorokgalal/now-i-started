// src/pages/auth/ResetPassword.jsx
import React, { useState } from "react"
import { useAuth } from "../../state/auth.jsx"
import { Button, Card } from "../../components/ui"

export default function ResetPassword() {
  const { sendReset } = useAuth()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function onSubmit(e) {
    e.preventDefault()
    try {
      await sendReset(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md p-6 space-y-3">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="field">Email</label>
          <input
            className="text"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button variant="primary" className="w-full">
            Send reset email
          </Button>
        </form>
        {sent && <p className="text-green-700">Check your inbox for the reset email.</p>}
        {error && <p className="text-red-600">{error}</p>}
      </Card>
    </div>
  )
}
 