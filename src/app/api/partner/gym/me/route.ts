import { NextResponse } from 'next/server';
import { verifyGymApiKey } from '@/services/partner_api_auth';
import { prisma } from '@/core/database';

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const apiKey = (req.headers.get('x-api-key') || '').trim();
    const integ = await verifyGymApiKey(apiKey);
    if (!integ) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const partner = await prisma.partners.findUnique({ where: { id: integ.partnerId } });
    return NextResponse.json({
      integration: {
        id: integ.id,
        partnerId: integ.partnerId,
        allowedFeatures: integ.allowedFeatures || [],
        webhookUrl: integ.webhookUrl || null,
        branding: integ.branding || null,
        status: integ.status,
        createdAt: integ.createdAt,
      },
      partner: partner ? { id: partner.id, name: partner.name, url: partner.url, logoUrl: partner.logoUrl } : null,
    });
  } catch (err: any) {
    console.error('[partner/gym/me] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

