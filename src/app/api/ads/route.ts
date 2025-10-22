// src/app/api/ads/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/core/auth/config';
import PartnershipsService from '@/services/partnerships_service';
import { cookies } from 'next/headers';

function getCapWindowMs() { return 60 * 60 * 1000; } // 1 hour
function getCapLimit() { return 3; } // max 3 impressions per placement per hour

function readFreqCookie() {
  const store = cookies();
  try {
    const raw = store.get('ad_freq')?.value || '{}';
    return JSON.parse(raw || '{}') as Record<string, number[]>;
  } catch { return {}; }
}

function _writeFreqCookie(freq: Record<string, number[]>) {
  const store = cookies();
  store.set('ad_freq', JSON.stringify(freq), { httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 });
}

function readLastCookie() {
  const store = cookies();
  try {
    return JSON.parse(store.get('ad_last')?.value || '{}') as Record<string, string>;
  } catch { return {}; }
}

function _writeLastCookie(last: Record<string, string>) {
  const store = cookies();
  store.set('ad_last', JSON.stringify(last), { httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const placement = url.searchParams.get('placement') || 'feed';
    const session = await getServerSession(authOptions);
    // Simple frequency cap via cookie per placement (anonymous or logged)
    const freq = readFreqCookie();
    const now = Date.now();
    const windowMs = getCapWindowMs();
    const withinWindow = (freq[placement] || []).filter((t) => now - t < windowMs);
    if (withinWindow.length >= getCapLimit()) {
      return NextResponse.json({ creative: null });
    }
    const last = readLastCookie();
    const lastId = last[placement];
    const creative = await PartnershipsService.selectAdForUser({ userId: session?.user?.id, placement, excludeCreativeId: lastId });
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
