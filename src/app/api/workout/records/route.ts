/**
 * Personal Records API
 * GET: list PRs for current user
 * POST: create a new PR
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prs = await prisma.personal_records.findMany({
      where: { userId: session.user.id },
      include: { exercises: { select: { id: true, name: true, category: true } } },
      orderBy: { achievedAt: 'desc' },
      take: 200,
    });
    return NextResponse.json({ records: prs });
  } catch (error) {
    console.error('PRs GET error:', error);
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
    const { exerciseId, recordType, value, unit, reps, notes, achievedAt } = body || {};
    if (!exerciseId || typeof value !== 'number' || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const record = await prisma.personal_records.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        exerciseId,
        recordType: recordType || 'BEST_SET',
        value,
        unit,
        reps: reps ?? null,
        notes: notes ?? null,
        achievedAt: achievedAt ? new Date(achievedAt) : new Date(),
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('PRs POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

