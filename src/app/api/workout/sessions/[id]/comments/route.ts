import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { v4 as uuidv4 } from 'uuid';
import { notifyCommentAdded } from '@/lib/notifications/training-notifications';

// GET - Fetch comments for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    const comments = await prisma.workout_session_comments.findMany({
      where: { sessionId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      userId: comment.userId,
      userName: comment.users.name || comment.users.email,
      userRole: comment.users.role,
    }));

    return NextResponse.json({ comments: formattedComments });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Add a comment to a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Fetch session to determine recipient
    const workoutSession = await prisma.workout_sessions.findUnique({
      where: { id: sessionId },
      select: {
        userId: true,
        coachId: true,
      },
    });

    const comment = await prisma.workout_session_comments.create({
      data: {
        id: uuidv4(),
        sessionId,
        userId: session.user.id,
        content: content.trim(),
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Send notification to the other party
    if (workoutSession) {
      const recipientId = session.user.id === workoutSession.coachId
        ? workoutSession.userId  // Trainer commented, notify athlete
        : workoutSession.coachId;  // Athlete commented, notify trainer

      if (recipientId) {
        notifyCommentAdded(sessionId, session.user.id, recipientId).catch(err =>
          console.error('Failed to send notification:', err)
        );
      }
    }

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        userId: comment.userId,
        userName: comment.users.name || comment.users.email,
        userRole: comment.users.role,
      },
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    );
  }
}
