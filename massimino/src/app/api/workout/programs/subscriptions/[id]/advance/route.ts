/**
 * Advance Subscription Day API
 * PATCH: Skip to a specific day in the program (e.g., skip rest day)
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

    const subscriptionId = params.id;
    const body = await request.json();
    const { targetDay } = body;

    if (!targetDay || typeof targetDay !== 'number') {
      return NextResponse.json(
        { error: 'targetDay is required and must be a number' },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to the user
    const subscription = await prisma.program_subscriptions.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Deactivate all other subscriptions first
    await prisma.program_subscriptions.updateMany({
      where: {
        userId: session.user.id,
        isCurrentlyActive: true,
        id: { not: subscriptionId },
      },
      data: {
        isCurrentlyActive: false,
        updatedAt: new Date(),
      },
    });

    // Update the subscription to the target day and set as active
    const updated = await prisma.program_subscriptions.update({
      where: { id: subscriptionId },
      data: {
        currentDay: targetDay,
        isCurrentlyActive: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: updated.id,
        currentWeek: updated.currentWeek,
        currentDay: updated.currentDay,
      },
    });
  } catch (error) {
    console.error('Error advancing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to advance subscription' },
      { status: 500 }
    );
  }
}
