import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { acceptCoachingRequest } from '@/services/coaching/my-athletes';

export async function PUT(
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
      return NextResponse.json({ error: 'Only trainers can accept requests' }, { status: 403 });
    }

    const body = await request.json();
    const { notes } = body;

    const trainerClient = await acceptCoachingRequest(id, session.user.id, notes);

    return NextResponse.json(trainerClient);
  } catch (error: any) {
    console.error('Error accepting coaching request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept coaching request' },
      { status: 400 }
    );
  }
}
