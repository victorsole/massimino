// POST /api/auth/forgot-password
// Always answers the same way, so it cannot be used to discover which emails have accounts.

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/core/database'
import { ok, fail } from '@/lib/api'
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
import { createPasswordResetToken, RESET_TOKEN_TTL_MINUTES } from '@/services/auth/password_reset'
import { sendEmail } from '@/services/email/email_service'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({ email: z.string().trim().toLowerCase().email() })

const GENERIC_MESSAGE =
  'If an account exists for that email, we have sent instructions to reset the password. Check your inbox and spam folder.'

function appUrl(): string {
  return (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://massimino.fitness').replace(/\/$/, '')
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(`forgot:${getClientIdentifier(request)}`, RATE_LIMITS.auth)
  if (!rl.success) {
    return fail('RATE_LIMITED', 'Too many requests. Please try again in a minute.', 429, undefined, getRateLimitHeaders(rl))
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Please enter a valid email address.', 400)
  }

  try {
    const user = await prisma.users.findFirst({
      where: { email: { equals: parsed.data.email, mode: 'insensitive' } },
      select: { id: true, email: true, name: true, password: true, status: true },
    })

    if (user && user.status !== 'BANNED') {
      const greeting = user.name ? `Hi ${user.name.split(' ')[0]},` : 'Hi,'
      if (user.password) {
        const token = await createPasswordResetToken(user.id)
        const link = `${appUrl()}/reset-password?token=${token}`
        await sendEmail({
          to: user.email,
          subject: 'Reset your Massimino password',
          text:
            `${greeting}\n\nSomeone asked to reset the password for your Massimino account. ` +
            `If it was you, open this link within ${RESET_TOKEN_TTL_MINUTES} minutes to choose a new password:\n\n${link}\n\n` +
            `If you did not ask for this, you can ignore this email; your password will not change.\n\nMassimino`,
        })
      } else {
        // Account created with Google, LinkedIn or Facebook: there is no password to reset
        await sendEmail({
          to: user.email,
          subject: 'Signing in to Massimino',
          text:
            `${greeting}\n\nSomeone asked to reset the password for your Massimino account. ` +
            `Your account uses Google, LinkedIn or Facebook to sign in, so it has no Massimino password. ` +
            `Sign in with the same provider at ${appUrl()}/login.\n\nMassimino`,
        })
      }
    }
  } catch (error) {
    // Log, but keep the response identical so failures reveal nothing about accounts
    console.error('forgot-password failed:', error)
  }

  return ok({ message: GENERIC_MESSAGE })
}
