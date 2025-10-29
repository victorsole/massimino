/**
 * Progress Metrics API (circumferences, skinfolds, photos)
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
    const metricType = searchParams.get('metricType') || undefined;
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const where: any = { userId: session.user.id };
    if (metricType) where.metricType = metricType;
    if (start || end) {
      where.recordedAt = {} as any;
      if (start) where.recordedAt.gte = new Date(start);
      if (end) where.recordedAt.lte = new Date(end);
    }

    const metrics = await prisma.progress_metrics.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 500,
    });
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Progress metrics GET error:', error);
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
    const { metricType, value, unit, bodyPart, notes, imageUrl, recordedAt } = body || {};
    if (!metricType || typeof value !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const metric = await prisma.progress_metrics.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        metricType,
        value,
        unit: unit ?? null,
        bodyPart: bodyPart ?? null,
        notes: notes ?? null,
        imageUrl: imageUrl ?? null,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });
    return NextResponse.json({ success: true, metric });
  } catch (error) {
    console.error('Progress metrics POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

