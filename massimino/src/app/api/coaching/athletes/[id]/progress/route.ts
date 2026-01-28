import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { getAthleteProgress } from '@/services/coaching/my-athletes';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only trainers can view athlete progress
    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Forbidden - Trainers only' }, { status: 403 });
    }

    const { id } = await params;

    const progress = await getAthleteProgress(id, session.user.id);

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error('Error fetching athlete progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch athlete progress' },
      { status: 500 }
    );
  }
}
