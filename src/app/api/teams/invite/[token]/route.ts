// src/app/api/teams/invite/[token]/route.ts

/**
 * Team Invitation Token API
 * Handles invitation retrieval and acceptance via email token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { TeamInvitationService } from '@/services/teams/team_service';
import { isActiveUser } from '@/types/auth';

/**
 * GET - Retrieve invitation details by token
 * Public endpoint (no authentication required to view invitation)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await TeamInvitationService.getInvitationByToken(token);

    if (!invite) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Mark invitation as viewed (first time)
    if (!invite.viewedAt) {
      const { prisma } = await import('@/core/database');
      await prisma.team_invites.update({
        where: { id: invite.id },
        data: { viewedAt: new Date() }
      });
    }

    // Return invitation details
    return NextResponse.json({
      success: true,
      data: {
        id: invite.id,
        teamId: invite.teamId,
        teamName: invite.team.name,
        teamDescription: invite.team.description,
        teamType: invite.team.type,
        trainerName: invite.team.trainer.name,
        trainerImage: invite.team.trainer.image,
        inviterName: invite.inviter.name,
        inviterImage: invite.inviter.image,
        message: invite.message,
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        email: invite.email
      }
    });

  } catch (error) {
    console.error('[Invite Token API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Accept invitation (requires authentication)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { token } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isActiveUser(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Account not in good standing' },
        { status: 403 }
      );
    }

    // Accept the invitation
    const result = await TeamInvitationService.acceptInvitation({
      token,
      userId: session.user.id
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to accept invitation' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.member,
      message: 'You have successfully joined the team!'
    });

  } catch (error) {
    console.error('[Invite Token API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
