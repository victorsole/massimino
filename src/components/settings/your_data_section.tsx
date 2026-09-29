'use client'

// Settings > Privacy: download your data and delete your account (GDPR Art. 17 and 20).
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Download, Trash2 } from 'lucide-react'
import { notify } from '@/lib/notify'

export function YourDataSection() {
  const [showDelete, setShowDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function deleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: confirmText.trim() }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        notify(body?.error?.message || 'We could not delete your account. Please try again.', 'error')
        return
      }
      notify(body?.data?.message || 'Your account is scheduled for deletion.', 'success')
      await signOut({ callbackUrl: '/?account=deleted' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Your data</h3>
      <p className="text-xs text-gray-500 mb-4">
        Download a copy of everything we hold about you, or delete your account.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href="/api/account/export"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download my data
        </a>
        {!showDelete && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete my account
          </button>
        )}
      </div>

      {showDelete && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-900">
            You will be signed out and will not be able to sign in again. After 30 days your personal data
            (profile, body metrics, nutrition logs, AI chats and photos) is permanently erased and your training
            history is anonymised. To cancel within those 30 days, email hello@beresol.eu.
          </p>
          <label htmlFor="confirm-delete" className="mt-3 block text-sm font-medium text-red-900">
            Type DELETE to confirm
          </label>
          <input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 sm:w-60"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={confirmText.trim() !== 'DELETE' || deleting}
              onClick={deleteAccount}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete my account'}
            </button>
            <button
              type="button"
              onClick={() => { setShowDelete(false); setConfirmText('') }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
