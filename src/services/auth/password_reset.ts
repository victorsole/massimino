// src/services/auth/password_reset.ts
// Password reset tokens, stored hashed in the NextAuth `verificationtokens` table
// under the identifier `password-reset:{userId}`. Only the email ever contains
// the raw token; a database leak cannot be used to reset passwords.

import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/core/database'

const IDENTIFIER_PREFIX = 'password-reset:'
export const RESET_TOKEN_TTL_MINUTES = 30
export const MIN_PASSWORD_LENGTH = 8

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

/** Issue a fresh token for the user, replacing any previous one. Returns the raw token. */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const identifier = `${IDENTIFIER_PREFIX}${userId}`
  const rawToken = crypto.randomBytes(32).toString('hex')
  await prisma.verificationtokens.deleteMany({ where: { identifier } })
  await prisma.verificationtokens.create({
    data: {
      identifier,
      token: hashToken(rawToken),
      expires: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
    },
  })
  return rawToken
}

export type ResetResult = 'ok' | 'invalid' | 'expired'

/** Check a raw token without consuming it (used to show the form or an error). */
export async function checkPasswordResetToken(rawToken: string): Promise<ResetResult> {
  const record = await prisma.verificationtokens.findUnique({ where: { token: hashToken(rawToken) } })
  if (!record || !record.identifier.startsWith(IDENTIFIER_PREFIX)) return 'invalid'
  if (record.expires.getTime() < Date.now()) return 'expired'
  return 'ok'
}

/** Consume the token and set the new password. Single use. */
export async function resetPasswordWithToken(rawToken: string, newPassword: string): Promise<ResetResult> {
  const record = await prisma.verificationtokens.findUnique({ where: { token: hashToken(rawToken) } })
  if (!record || !record.identifier.startsWith(IDENTIFIER_PREFIX)) return 'invalid'

  // Always remove the token once it has been presented
  await prisma.verificationtokens.deleteMany({ where: { identifier: record.identifier } })
  if (record.expires.getTime() < Date.now()) return 'expired'

  const userId = record.identifier.slice(IDENTIFIER_PREFIX.length)
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.users.update({
    where: { id: userId },
    // A working reset link proves control of the inbox, so the email counts as verified
    data: { password: passwordHash, emailVerified: new Date(), updatedAt: new Date() },
  })
  return 'ok'
}
