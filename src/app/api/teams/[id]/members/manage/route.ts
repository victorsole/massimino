// src/app/api/teams/[id]/members/manage/route.ts
/**
 * Team Members Management API
 * Supports adding both active users and pending invitations to teams
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core/auth/config';
import {
  addPendingAthleteToTeam,
  addUserToTeam,
  getTeamMembers,
  removeMemberFromTeam,
} from '@/services/teams/pending_members';

// ============================================================================
// GET - Get all team members (active + pending)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;

    const members = await getTeamMembers(teamId);

    return NextResponse.json({ members }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Add member to team (user or pending invitation)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only trainers can add members' },
        { status: 403 }
      );
    }

    const { id: teamId } = await params;
    const body = await request.json();
    const { userId, athleteInvitationId } = body;

    // Must provide either userId OR athleteInvitationId
    if (!userId && !athleteInvitationId) {
      return NextResponse.json(
        { error: 'Either userId or athleteInvitationId is required' },
        { status: 400 }
      );
    }

    let member;

    if (athleteInvitationId) {
      // Add pending athlete
      member = await addPendingAthleteToTeam(teamId, session.user.id, athleteInvitationId);
    } else {
      // Add existing user
      member = await addUserToTeam(teamId, session.user.id, userId);
    }

    return NextResponse.json({ member, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add member' },
      { status: 400 }
    );
  }
}

// ============================================================================
// DELETE - Remove member from team
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only trainers can remove members' },
        { status: 403 }
      );
    }

    const { id: teamId } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    await removeMemberFromTeam(teamId, memberId, session.user.id);

    return NextResponse.json({ success: true, message: 'Member removed' }, { status: 200 });
  } catch (error: any) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove member' },
      { status: 400 }
    );
  }
}
