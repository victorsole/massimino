import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { sendTeamInvitationEmail, isEmailServiceConfigured } from '@/services/email/email_service'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!isEmailServiceConfigured()) {
    return NextResponse.json({ success: false, error: 'Email service not configured (RESEND_API_KEY missing)' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({})) as { to?: string, message?: string }
  const to = body.to || session.user.email
  if (!to) {
    return NextResponse.json({ success: false, error: 'No recipient email provided' }, { status: 400 })
  }

  const result = await sendTeamInvitationEmail({
    to,
    teamName: 'Massimino Test Team',
    trainerName: 'Massimino Admin',
    inviteToken: 'test-token',
    message: body.message || 'This is a test email from Massimino.',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error || 'Failed to send test email' }, { status: 400 })
  }

  return NextResponse.json({ success: true, messageId: result.messageId })
}

