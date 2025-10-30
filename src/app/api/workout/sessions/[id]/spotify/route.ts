/**
 * Session Spotify Link API
 * PATCH: Update Spotify URL for a session
 * DELETE: Remove Spotify URL from a session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const sessionId = params.id;
    const body = await request.json();
    const { spotifyUrl } = body;

    if (!spotifyUrl) {
      return NextResponse.json(
        { error: 'Spotify URL is required' },
        { status: 400 }
      );
    }

    // Validate Spotify URL format
    const spotifyRegex = /^https:\/\/(open\.spotify\.com\/(track|playlist|album)\/[a-zA-Z0-9]+|spotify:(track|playlist|album):[a-zA-Z0-9]+)/;
    if (!spotifyRegex.test(spotifyUrl)) {
      return NextResponse.json(
        { error: 'Invalid Spotify URL. Must be a track, playlist, or album link.' },
        { status: 400 }
      );
    }

    // Try to update program subscription first
    const programSub = await prisma.program_subscriptions.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (programSub) {
      const updated = await prisma.program_subscriptions.update({
        where: { id: sessionId },
        data: {
          spotifyUrl,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        session: {
          id: updated.id,
          type: 'program',
          spotifyUrl: updated.spotifyUrl,
        },
      });
    }

    // Try to update custom workout session
    const workoutSession = await prisma.workout_sessions.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (workoutSession) {
      const updated = await prisma.workout_sessions.update({
        where: { id: sessionId },
        data: {
          spotifyUrl,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        session: {
          id: updated.id,
          type: 'custom',
          spotifyUrl: updated.spotifyUrl,
        },
      });
    }

    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error updating Spotify URL:', error);
    return NextResponse.json(
      { error: 'Failed to update Spotify URL' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const sessionId = params.id;

    // Try to update program subscription first
    const programSub = await prisma.program_subscriptions.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (programSub) {
      const updated = await prisma.program_subscriptions.update({
        where: { id: sessionId },
        data: {
          spotifyUrl: null,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        session: {
          id: updated.id,
          type: 'program',
          spotifyUrl: null,
        },
      });
    }

    // Try to update custom workout session
    const workoutSession = await prisma.workout_sessions.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (workoutSession) {
      const updated = await prisma.workout_sessions.update({
        where: { id: sessionId },
        data: {
          spotifyUrl: null,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        session: {
          id: updated.id,
          type: 'custom',
          spotifyUrl: null,
        },
      });
    }

    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error removing Spotify URL:', error);
    return NextResponse.json(
      { error: 'Failed to remove Spotify URL' },
      { status: 500 }
    );
  }
}
