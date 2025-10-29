import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { getMyAthletes, inviteAthlete, cancelInvitation, resendInvitation } from '@/services/coaching/my-athletes';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a trainer
    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Only trainers can access this endpoint' }, { status: 403 });
    }

    const athletes = await getMyAthletes(session.user.id);

    return NextResponse.json(athletes);
  } catch (error) {
    console.error('Error fetching athletes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch athletes' },
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

    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Only trainers can access this endpoint' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, message } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const invitation = await inviteAthlete(session.user.id, email, name, message);

    return NextResponse.json(invitation, { status: 201 });
  } catch (error: any) {
    console.error('Error inviting athlete:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to invite athlete' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Only trainers can access this endpoint' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    await cancelInvitation(invitationId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error canceling invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel invitation' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Only trainers can access this endpoint' }, { status: 403 });
    }

    const body = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    await resendInvitation(invitationId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resend invitation' },
      { status: 400 }
    );
  }
}
