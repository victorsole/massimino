'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LinkStatus = 'checking' | 'ok' | 'invalid' | 'expired'

const MIN_LENGTH = 8

export function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams()?.get('token') || ''
  const [status, setStatus] = useState<LinkStatus>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((body) => { if (!cancelled) setStatus(body?.data?.status ?? 'invalid') })
      .catch(() => { if (!cancelled) setStatus('invalid') })
    return () => { cancelled = true }
  }, [token])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_LENGTH) return setError(`Password must be at least ${MIN_LENGTH} characters.`)
    if (password !== confirm) return setError('The two passwords do not match.')
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const body = await res.json().catch(() => null)
      if (res.ok && body?.success) {
        router.push('/login?success=password-reset')
        return
      }
      setError(body?.error?.message || 'Something went wrong. Please try again.')
      const reason = body?.error?.details?.reason
      if (reason === 'invalid' || reason === 'expired') setStatus(reason)
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'checking') {
    return <p className="text-sm text-center text-gray-600">Checking your link…</p>
  }

  if (status !== 'ok') {
    return (
      <div className="space-y-4 text-center">
        <p role="alert" className="text-sm text-red-700">
          {status === 'expired'
            ? 'This reset link has expired.'
            : 'This reset link is not valid. It may have been used already.'}
        </p>
        <Link href="/forgot-password" className="text-sm font-medium text-brand-primary hover:underline">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" type="password" autoComplete="new-password" required minLength={MIN_LENGTH}
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input id="confirm" type="password" autoComplete="new-password" required minLength={MIN_LENGTH}
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save new password'}
      </Button>
    </form>
  )
}
