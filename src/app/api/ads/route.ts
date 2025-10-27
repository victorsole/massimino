// src/app/api/ads/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/core/auth/config';
import PartnershipsService from '@/services/partnerships_service';
import { cookies } from 'next/headers';

// Mark as dynamic since it uses cookies() and getServerSession
export const dynamic = 'force-dynamic';

function getCapWindowMs() { return 60 * 60 * 1000; } // 1 hour
function getCapLimit() { return 3; } // max 3 impressions per placement per hour

async function readFreqCookie() {
  const store = await cookies();
  try {
    const raw = store.get('ad_freq')?.value || '{}';
    return JSON.parse(raw || '{}') as Record<string, number[]>;
  } catch { return {}; }
}

// @ts-ignore - utility function kept for potential future use
async function _writeFreqCookie(freq: Record<string, number[]>) {
  const store = await cookies();
  store.set('ad_freq', JSON.stringify(freq), { httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 });
}

async function readLastCookie() {
  const store = await cookies();
  try {
    return JSON.parse(store.get('ad_last')?.value || '{}') as Record<string, string>;
  } catch { return {}; }
}

// @ts-ignore - utility function kept for potential future use
async function _writeLastCookie(last: Record<string, string>) {
  const store = await cookies();
  store.set('ad_last', JSON.stringify(last), { httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const placement = url.searchParams.get('placement') || 'feed';
    const session = await getServerSession(authOptions);
    // Simple frequency cap via cookie per placement (anonymous or logged)
    const freq = await readFreqCookie();
    const now = Date.now();
    const windowMs = getCapWindowMs();
    const withinWindow = (freq[placement] || []).filter((t) => now - t < windowMs);
    if (withinWindow.length >= getCapLimit()) {
      return NextResponse.json({ creative: null });
    }
    const last = await readLastCookie();
    const lastId = last[placement];
    const creative = await PartnershipsService.selectAdForUser({ userId: session?.user?.id ?? null, placement, excludeCreativeId: lastId ?? null });
    if (!creative) return NextResponse.json({ creative: null });
    // Record local cookie impression only after creative exists
    const updated = [...withinWindow, now];
    freq[placement] = updated;
    const res = NextResponse.json({
      creative: {
        id: creative.id,
        type: creative.type,
        assetUrl: creative.assetUrl,
        title: creative.title,
        body: creative.body,
        cta: creative.cta,
        clickUrl: creative.clickUrl,
      },
    });
    // update cookies: frequency + last id
    res.cookies.set('ad_freq', JSON.stringify(freq), { httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 });
    last[placement] = creative.id;
    res.cookies.set('ad_last', JSON.stringify(last), { httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 });
    return res;
  } catch (err: any) {
    console.error('[api/ads] GET error', err);
    return NextResponse.json({ creative: null });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body?.action === 'click' && body?.creativeId) {
      const session = await getServerSession(authOptions);
      const placement = typeof body?.placement === 'string' ? body.placement : undefined;
      const redirectUrl = await PartnershipsService.recordClick(body.creativeId, session?.user?.id, placement);
      return NextResponse.json({ ok: true, redirectUrl });
    }
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    console.error('[api/ads] POST error', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 400 });
  }
}
