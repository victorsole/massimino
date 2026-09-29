// GET  /api/auth/reset-password?token=...  -> is the link still valid?
// POST /api/auth/reset-password { token, password } -> set the new password (single use)

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, fail } from '@/lib/api'
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
import {
  checkPasswordResetToken,
  resetPasswordWithToken,
  MIN_PASSWORD_LENGTH,
} from '@/services/auth/password_reset'

export const dynamic = 'force-dynamic'

const TokenSchema = z.string().regex(/^[a-f0-9]{64}$/)

const LINK_MESSAGES = {
  invalid: 'This reset link is not valid. It may have been used already. Request a new one.',
  expired: 'This reset link has expired. Request a new one.',
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token') || ''
  if (!TokenSchema.safeParse(token).success) return ok({ status: 'invalid' as const })
  return ok({ status: await checkPasswordResetToken(token) })
}

const BodySchema = z.object({
  token: TokenSchema,
  password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`).max(200),
})

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(`reset:${getClientIdentifier(request)}`, RATE_LIMITS.auth)
  if (!rl.success) {
    return fail('RATE_LIMITED', 'Too many attempts. Please try again in a minute.', 429, undefined, getRateLimitHeaders(rl))
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    const passwordIssue = parsed.error.issues.find((i) => i.path[0] === 'password')
    return fail('VALIDATION_ERROR', passwordIssue?.message || LINK_MESSAGES.invalid, 400)
  }

  try {
    const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password)
    if (result !== 'ok') return fail('VALIDATION_ERROR', LINK_MESSAGES[result], 400, { reason: result })
    return ok({ message: 'Your password has been changed. You can now sign in.' })
  } catch (error) {
    console.error('reset-password failed:', error)
    return fail('INTERNAL', 'We could not change your password. Please request a new link and try again.', 500)
  }
}
