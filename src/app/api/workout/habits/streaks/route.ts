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

    // Fetch last 365 days for simplicity
    const since = new Date();
    since.setDate(since.getDate() - 365);

    const logs = await prisma.habit_logs.findMany({
      where: { userId: session.user.id, date: { gte: since } },
      orderBy: { date: 'desc' },
    });

    // Compute daily score and streak of consecutive days with any rating > 0
    let streak = 0;
    let longestStreak = 0;
    let prevDate: Date | null = null;

    for (const log of logs) {
      const score = ([
        log.sleepRating,
        log.stressRating,
        log.resistanceRating,
        log.aerobicRating,
        log.calorieRating,
        log.proteinRating,
        log.vegetableRating,
        log.habit8Rating,
      ].reduce((sum: number, v) => sum + (v ?? 0), 0)) as number;

      if (score <= 0) break; // streak ends if zero for the most recent day

      if (!prevDate) {
        streak = 1;
        longestStreak = Math.max(longestStreak, streak);
        prevDate = log.date as unknown as Date;
        continue;
      }

      const curDate = log.date as unknown as Date;
      const diffDays = Math.round((prevDate.getTime() - curDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak += 1;
        longestStreak = Math.max(longestStreak, streak);
      } else if (diffDays > 1) {
        break;
      }
      prevDate = curDate;
    }

    return NextResponse.json({ streak, longestStreak });
  } catch (error) {
    console.error('Habits streaks GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

