import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

/**
 * Update user's program progress (current week/day)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, currentWeek, currentDay } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
    }

    // Verify subscription belongs to user
    const subscription = await prisma.program_subscriptions.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update progress
    const updateData: any = {};
    if (currentWeek !== undefined) updateData.currentWeek = currentWeek;
    if (currentDay !== undefined) updateData.currentDay = currentDay;

    const updated = await prisma.program_subscriptions.update({
      where: { id: subscriptionId },
      data: updateData,
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    console.error('Error updating program progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
