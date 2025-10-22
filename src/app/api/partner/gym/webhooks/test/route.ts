import { NextResponse } from 'next/server';
import { verifyGymApiKey } from '@/services/partner_api_auth';

export async function POST(req: Request) {
  try {
    const apiKey = (req.headers.get('x-api-key') || '').trim();
    const integ = await verifyGymApiKey(apiKey);
    if (!integ) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // Echo payload to confirm we accept and parse, without external calls
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({ ok: true, received: body, webhookConfigured: Boolean(integ.webhookUrl) });
  } catch (err: any) {
    console.error('[partner/gym/webhooks/test] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

