// GET /api/cron/purge-deleted-accounts
// Daily job: erase accounts whose deletion grace period has ended.
// Requires `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron sends it automatically
// when CRON_SECRET is set; on other hosts the scheduler must send it).
import type { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api'
import { purgeDueAccountDeletions } from '@/services/account/account_data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return fail('INTERNAL', 'CRON_SECRET is not configured.', 503)
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return fail('AUTH_REQUIRED', 'Not authorised.', 401)
  }
  const erased = await purgeDueAccountDeletions()
  return ok({ erased })
}
