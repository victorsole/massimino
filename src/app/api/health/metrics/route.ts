/**
 * Health Metrics API (weight, body fat)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // WEIGHT | BODY_FAT
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 });

    const where: any = { userId: session.user.id, dataType: type };
    if (start || end) {
      where.recordedAt = {} as any;
      if (start) where.recordedAt.gte = new Date(start);
      if (end) where.recordedAt.lte = new Date(end);
    }
    const metrics = await prisma.health_data.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 365,
    });
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Health metrics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { type, value, unit, recordedAt, source } = body || {};
    if (!type || typeof value !== 'number' || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const metric = await prisma.health_data.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        dataType: type,
        value,
        unit,
        source: source || 'MANUAL',
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });
    return NextResponse.json({ success: true, metric });
  } catch (error) {
    console.error('Health metrics POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

