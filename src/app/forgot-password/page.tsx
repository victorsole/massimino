import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth_shell'
import { ForgotPasswordForm } from './forgot_password_form'

export const metadata: Metadata = {
  title: 'Forgot your password? | Massimino',
  description: 'Reset the password for your Massimino account.',
  robots: { index: false },
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot your password?" description="Enter your email and we will send you a link to choose a new one.">
      <ForgotPasswordForm />
    </AuthShell>
  )
}
