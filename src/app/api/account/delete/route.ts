// POST /api/account/delete { confirm: 'DELETE' }
// Blocks sign-in now and erases the account after the grace period (GDPR Art. 17).
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/core/database'
import { withAuth, ok, fail } from '@/lib/api'
import { DELETION_GRACE_DAYS, requestAccountDeletion } from '@/services/account/account_data'
import { sendEmail } from '@/services/email/email_service'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({ confirm: z.literal('DELETE') })

export const POST = withAuth(async ({ session }, req: NextRequest) => {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Type DELETE to confirm.', 400)

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, role: true },
  })
  if (!user) return fail('NOT_FOUND', 'Account not found.', 404)
  if (user.role === 'ADMIN') {
    return fail('FORBIDDEN', 'Administrator accounts cannot be deleted here. Contact hello@beresol.eu.', 403)
  }

  const eraseAt = await requestAccountDeletion(session.user.id)
  const when = eraseAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  await sendEmail({
    to: user.email,
    subject: 'Your Massimino account will be deleted',
    text:
      `Hi${user.name ? ` ${user.name.split(' ')[0]}` : ''},\n\n` +
      `We received a request to delete your Massimino account. You can no longer sign in, and on ${when} ` +
      `(${DELETION_GRACE_DAYS} days from now) we will permanently erase your personal data.\n\n` +
      `If this was a mistake, reply to this email or write to hello@beresol.eu before then and we will restore your account.\n\nMassimino`,
  }).catch((error) => console.error('Deletion confirmation email failed:', error))

  return ok({ eraseAt: eraseAt.toISOString(), message: `Your account is scheduled for deletion on ${when}.` })
})
