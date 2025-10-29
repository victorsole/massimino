import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { getAthleteWorkouts, getAthleteProgress } from '@/services/coaching/my-athletes';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Only trainers can access this endpoint' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'workouts';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (type === 'progress') {
      const progress = await getAthleteProgress(id, session.user.id);
      return NextResponse.json(progress);
    }

    const workouts = await getAthleteWorkouts(id, session.user.id, limit);
    return NextResponse.json(workouts);
  } catch (error: any) {
    console.error('Error fetching athlete data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch athlete data' },
      { status: 400 }
    );
  }
}
