// src/app/api/partners/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/core/database';

export async function GET() {
  try {
    const db: any = prisma as any;
    let rows: Array<any> = [];

    if (db?.partners?.findMany) {
      rows = await db.partners.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    const fallback = [
      { name: 'Amix', url: 'https://amix.com/?utm_source=massimino&utm_medium=partner_band&utm_campaign=amix', logoUrl: '/images/amix-logo.png', blurb: 'Quality sports supplements' },
      { name: 'Bo', url: 'http://app.hellobo.eu?utm_source=massimino&utm_medium=partner_band&utm_campaign=bo', logoUrl: '/images/Bo_logo.png', blurb: 'Local producer network' },
      { name: 'Quota Vita', url: 'https://www.quotavita.com/en?utm_source=massimino&utm_medium=partner_band&utm_campaign=quotavita', logoUrl: '/images/quotavitalogo.jpg', blurb: 'Mediterranean whey protein' },
    ];

    const byName = new Set<string>();
    const partners = [...fallback, ...(rows || [])].filter((p: any) => {
      const key = (p.name || '').toLowerCase().trim();
      if (!key) return false;
      // Exclude Jims from homepage partner band
      if (key === 'jims') return false;
      if (byName.has(key)) return false;
      byName.add(key);
      return true;
    });

    return NextResponse.json({ partners });
  } catch (error) {
    console.error('Failed to fetch partners:', error);
    const fallback = [
      { name: 'Amix', url: 'https://amix.com/?utm_source=massimino&utm_medium=partner_band&utm_campaign=amix', logoUrl: '/images/amix-logo.png', blurb: 'Quality sports supplements' },
      { name: 'Bo', url: 'http://app.hellobo.eu?utm_source=massimino&utm_medium=partner_band&utm_campaign=bo', logoUrl: '/images/Bo_logo.png', blurb: 'Local producer network' },
      { name: 'Quota Vita', url: 'https://www.quotavita.com/en?utm_source=massimino&utm_medium=partner_band&utm_campaign=quotavita', logoUrl: '/images/quotavitalogo.jpg', blurb: 'Mediterranean whey protein' },
    ];
    return NextResponse.json({ partners: fallback });
  }
}
