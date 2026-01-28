import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export async function GET(
  _request: NextRequest,
  { params }: { params: { exercise: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exerciseId = params.exercise;
    const prs = await prisma.personal_records.findMany({
      where: { userId: session.user.id, exerciseId },
      orderBy: { achievedAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ records: prs });
  } catch (error) {
    console.error('PRs by exercise GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

