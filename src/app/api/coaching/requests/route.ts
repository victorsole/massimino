import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { requestCoaching, acceptCoachingRequest, declineCoachingRequest } from '@/services/coaching/my-athletes';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This endpoint is only for trainers to see their pending requests
    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Only trainers can access this endpoint' }, { status: 403 });
    }

    // Requests are already included in getMyAthletes
    // This endpoint can be used for filtering or specific queries if needed

    return NextResponse.json({ message: 'Use /api/coaching/athletes for full data' });
  } catch (error) {
    console.error('Error fetching coaching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coaching requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trainerId, message } = body;

    if (!trainerId) {
      return NextResponse.json({ error: 'Trainer ID is required' }, { status: 400 });
    }

    const coachingRequest = await requestCoaching(session.user.id, trainerId, message);

    return NextResponse.json(coachingRequest, { status: 201 });
  } catch (error: any) {
    console.error('Error creating coaching request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create coaching request' },
      { status: 400 }
    );
  }
}
