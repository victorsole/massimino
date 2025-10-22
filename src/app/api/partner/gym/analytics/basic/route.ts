import { NextResponse } from 'next/server';
import { verifyGymApiKey } from '@/services/partner_api_auth';
import { prisma } from '@/core/database';

function subDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function GET(req: Request) {
  try {
    const apiKey = (req.headers.get('x-api-key') || '').trim();
    const integ = await verifyGymApiKey(apiKey);
    if (!integ) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // MVP: global analytics (no per-partner user linking yet)
    const [sessions7, sessions30] = await Promise.all([
      prisma.workout_sessions.count({ where: { date: { gte: subDays(7) as any } } }),
      prisma.workout_sessions.count({ where: { date: { gte: subDays(30) as any } } }),
    ]);

    // Distinct active users in 30 days (approx via findMany)
    const users30 = await prisma.workout_sessions.findMany({
      where: { date: { gte: subDays(30) as any } },
      select: { userId: true },
      take: 5000,
    });
    const activeUsers30 = new Set(users30.map((u) => u.userId)).size;

    return NextResponse.json({
      timeframe: { last7Days: { sessions: sessions7 }, last30Days: { sessions: sessions30, activeUsers: activeUsers30 } },
    });
  } catch (err: any) {
    console.error('[partner/gym/analytics/basic] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

