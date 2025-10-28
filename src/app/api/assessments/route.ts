import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get assessments where the user is either the client or the trainer
    const assessments = await prisma.assessments.findMany({
      where: {
        OR: [
          { clientId: session.user.id },
          { trainerId: session.user.id },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        status: true,
        primaryGoal: true,
        experienceYears: true,
        limitations: true,
        squatScore: true,
        pushScore: true,
        pullScore: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ assessments });
  } catch (error) {
    console.error('Failed to fetch assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}
