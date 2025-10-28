/**
 * Join Program API
 * POST: Subscribe to a program template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { programId, exerciseSelections } = body;

    if (!programId) {
      return NextResponse.json(
        { error: 'programId is required' },
        { status: 400 }
      );
    }

    // Get the program template
    const program = await prisma.program_templates.findUnique({
      where: { id: programId },
      include: {
        program_phases: {
          orderBy: { phaseNumber: 'asc' },
          take: 1,
        },
        exercise_slots: true,
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Check if user already subscribed
    const existing = await prisma.program_subscriptions.findFirst({
      where: {
        userId: session.user.id,
        programId,
        isActive: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already subscribed to this program', subscription: existing },
        { status: 400 }
      );
    }

    // Validate exercise selections if program has slots
    if (program.hasExerciseSlots && program.exercise_slots.length > 0) {
      if (!exerciseSelections || Object.keys(exerciseSelections).length === 0) {
        return NextResponse.json(
          { error: 'Exercise selections required for this program' },
          { status: 400 }
        );
      }

      // Validate all required slots have selections
      const requiredSlots = program.exercise_slots.filter(s => s.isRequired);
      for (const slot of requiredSlots) {
        if (!exerciseSelections[slot.id]) {
          return NextResponse.json(
            { error: `Exercise selection required for: ${slot.slotLabel}` },
            { status: 400 }
          );
        }
      }
    }

    // Create subscription
    const firstPhase = program.program_phases[0];
    const subscription = await prisma.program_subscriptions.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        programId,
        currentWeek: 1,
        currentDay: 1,
        startDate: new Date(),
        isActive: true,
        currentPhaseId: firstPhase?.id,
        currentWeekInPhase: 1,
        phaseStartedAt: new Date(),
        workoutsCompleted: 0,
        adherenceRate: 1.0,
        updatedAt: new Date(),
      },
    });

    // Create exercise selections if provided
    if (exerciseSelections && Object.keys(exerciseSelections).length > 0) {
      const selections = Object.entries(exerciseSelections).map(([slotId, exerciseId]) => ({
        id: crypto.randomUUID(),
        userId: session.user.id,
        subscriptionId: subscription.id,
        slotId,
        exerciseId: exerciseId as string,
      }));

      await prisma.user_exercise_selections.createMany({
        data: selections,
      });
    }

    // Fetch complete subscription with relations
    const completeSubscription = await prisma.program_subscriptions.findUnique({
      where: { id: subscription.id },
      include: {
        program_templates: {
          include: {
            legendary_athlete: true,
            program_phases: {
              orderBy: { phaseNumber: 'asc' },
            },
          },
        },
        user_exercise_selections: {
          include: {
            exercise_slots: true,
            exercises: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      subscription: completeSubscription,
      message: `Successfully joined ${program.name}!`,
    });
  } catch (error) {
    console.error('Join program error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Check if user has joined a program
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    if (!programId) {
      return NextResponse.json(
        { error: 'programId is required' },
        { status: 400 }
      );
    }

    const subscription = await prisma.program_subscriptions.findFirst({
      where: {
        userId: session.user.id,
        programId,
        isActive: true,
      },
      include: {
        user_exercise_selections: {
          include: {
            exercise_slots: true,
            exercises: true,
          },
        },
      },
    });

    return NextResponse.json({
      hasJoined: !!subscription,
      subscription,
    });
  } catch (error) {
    console.error('Check join status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
