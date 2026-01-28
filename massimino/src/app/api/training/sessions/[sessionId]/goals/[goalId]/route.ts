import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

// PATCH - Update a goal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; goalId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Trainers only' }, { status: 403 });
    }

    const { goalId } = await params;
    const body = await request.json();
    const { completed, description, targetValue, targetDate } = body;

    const goal = await prisma.session_goals.update({
      where: { id: goalId },
      data: {
        ...(description !== undefined && { description }),
        ...(targetValue !== undefined && { targetValue: targetValue ? parseFloat(targetValue) : null }),
        ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
        ...(completed !== undefined && {
          completed,
          completedAt: completed ? new Date() : null
        }),
      },
    });

    return NextResponse.json({ goal });
  } catch (error: any) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; goalId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Trainers only' }, { status: 403 });
    }

    const { goalId } = await params;

    await prisma.session_goals.delete({
      where: { id: goalId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
