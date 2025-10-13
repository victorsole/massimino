import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core/auth/config';
import { prisma } from '@/core/database';
import crypto from 'crypto';

// GET - Fetch comments for entry or session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentable_type = searchParams.get('type');
    const commentable_id = searchParams.get('id');

    if (!commentable_type || !commentable_id) {
      return NextResponse.json(
        { error: 'Missing type or id parameter' },
        { status: 400 }
      );
    }

    const comments = await prisma.comments.findMany({
      where: {
        workoutLogId: commentable_id
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Create new comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { commentable_type, commentable_id, content } = body;

    if (!commentable_type || !commentable_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate commentable type
    if (!['ENTRY', 'SESSION'].includes(commentable_type)) {
      return NextResponse.json(
        { error: 'Invalid commentable type' },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.comments.create({
      data: {
        id: crypto.randomUUID(),
        authorId: session.user.id,
        workoutLogId: commentable_id,
        content: content.trim(),
        updatedAt: new Date()
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete comment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const comment_id = searchParams.get('id');

    if (!comment_id) {
      return NextResponse.json(
        { error: 'Missing comment id' },
        { status: 400 }
      );
    }

    // Check ownership
    const comment = await prisma.comments.findUnique({
      where: { id: comment_id }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.comments.delete({
      where: { id: comment_id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
