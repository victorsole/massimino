'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const body = await res.json().catch(() => null)
      if (res.ok && body?.success) {
        setMessage(body.data.message)
      } else {
        setError(body?.error?.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (message) {
    return (
      <div className="space-y-4 text-center">
        <p role="status" className="text-sm text-gray-700">{message}</p>
        <Link href="/login" className="text-sm font-medium text-brand-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send reset link'}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-brand-primary hover:underline">Back to sign in</Link>
      </p>
    </form>
  )
}
