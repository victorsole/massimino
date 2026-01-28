import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { declineCoachingRequest } from '@/services/coaching/my-athletes';

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
      return NextResponse.json({ error: 'Only trainers can decline requests' }, { status: 403 });
    }

    const body = await request.json();
    const { reason } = body;

    await declineCoachingRequest(id, session.user.id, reason);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error declining coaching request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to decline coaching request' },
      { status: 400 }
    );
  }
}
