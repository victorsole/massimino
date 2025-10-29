import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { parseISO, startOfWeek, endOfWeek } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: { week_number: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const anchor = searchParams.get('anchor'); // optional, any date string within the target week
    let dateRange: { start?: Date; end?: Date } = {};
    if (anchor) {
      const d = parseISO(anchor);
      if (!isNaN(d.getTime())) {
        dateRange.start = startOfWeek(d, { weekStartsOn: 1 });
        dateRange.end = endOfWeek(d, { weekStartsOn: 1 });
      }
    }

    const weekNumber = parseInt(params.week_number, 10);
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 53) {
      return NextResponse.json({ error: 'Invalid week number' }, { status: 400 });
    }

    const where: any = { userId: session.user.id, weekNumber };
    if (dateRange.start && dateRange.end) {
      where.date = { gte: dateRange.start, lte: dateRange.end };
    }

    const logs = await prisma.habit_logs.findMany({
      where,
      orderBy: { date: 'asc' },
    });
    return NextResponse.json({ logs, weekNumber });
  } catch (error) {
    console.error('Habits week GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
