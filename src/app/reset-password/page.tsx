import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth_shell'
import { ResetPasswordForm } from './reset_password_form'

export const metadata: Metadata = {
  title: 'Choose a new password | Massimino',
  robots: { index: false },
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" description="Use at least 8 characters.">
      <Suspense fallback={<p className="text-sm text-center text-gray-600">Checking your link…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
