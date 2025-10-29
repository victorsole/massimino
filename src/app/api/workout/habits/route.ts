/**
 * Habit Logs API
 * GET: list habits (optionally by date range)
 * POST: upsert a habit log for a specific day
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { parseISO, isValid, getISOWeek, getDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const where: any = { userId: session.user.id };
    if (start || end) {
      where.date = {} as any;
      if (start) where.date.gte = new Date(start);
      if (end) where.date.lte = new Date(end);
    }

    const logs = await prisma.habit_logs.findMany({
      where,
      orderBy: { date: 'asc' },
    });
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Habits GET error:', error);
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
    const dateStr: string = body.date;
    const ratings: any = body.ratings || {};
    const notes: string | undefined = body.notes;

    if (!dateStr) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const date = parseISO(dateStr);
    if (!isValid(date)) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }

    const weekNumber = getISOWeek(date);
    // getDay: 0 (Sun) .. 6 (Sat). Convert to 1..7 with Monday=1, Sunday=7
    const jsDay = getDay(date); // Sun=0
    const dayOfWeek = jsDay === 0 ? 7 : jsDay; // 1..7

    const allRatings = [
      ratings.sleepRating,
      ratings.stressRating,
      ratings.resistanceRating,
      ratings.aerobicRating,
      ratings.calorieRating,
      ratings.proteinRating,
      ratings.vegetableRating,
      ratings.habit8Rating,
    ].filter((v) => typeof v === 'number');
    const weeklyScore = allRatings.length ? allRatings.reduce((a: number, b: number) => a + b, 0) : null;

    const data = {
      userId: session.user.id,
      date,
      weekNumber,
      dayOfWeek,
      sleepRating: ratings.sleepRating ?? null,
      stressRating: ratings.stressRating ?? null,
      resistanceRating: ratings.resistanceRating ?? null,
      aerobicRating: ratings.aerobicRating ?? null,
      calorieRating: ratings.calorieRating ?? null,
      proteinRating: ratings.proteinRating ?? null,
      vegetableRating: ratings.vegetableRating ?? null,
      habit8Rating: ratings.habit8Rating ?? null,
      weeklyScore: weeklyScore ?? null,
      notes: notes ?? null,
    };

    const log = await prisma.habit_logs.upsert({
      where: { userId_date: { userId: session.user.id, date } },
      update: data,
      create: { id: crypto.randomUUID(), ...data },
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Habits POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

