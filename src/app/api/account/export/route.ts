// GET /api/account/export -> download all personal data as JSON (GDPR Art. 20)
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api'
import { exportAccountData } from '@/services/account/account_data'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async ({ session }) => {
  const data = await exportAccountData(session.user.id)
  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="massimino-data-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  })
})
