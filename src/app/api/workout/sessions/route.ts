/**
 * Workout Sessions API Route
 * Handles CRUD operations for workout sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { 
  getWorkoutSessions,
  createWorkoutSession,
  completeWorkoutSession
} from '@/core/database';
import { 
  createWorkoutSessionSchema,
  workoutSessionFilterOptionsSchema,
  paginationSchema
} from '@/core/utils/workout-validation';
import { UserRole } from '@prisma/client';

// ============================================================================
// GET /api/workout/sessions
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const dateRangeParam = searchParams.get('dateRange');
    const isCompleteParam = searchParams.get('isComplete');
    const isTemplateParam = searchParams.get('isTemplate');
    const paginationParam = searchParams.get('pagination');

    // Parse filters
    let filters = {};
    if (dateRangeParam) {
      try {
        const { start, end } = JSON.parse(dateRangeParam);
        filters = { dateRange: { start: new Date(start), end: new Date(end) } };
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid date range format' },
          { status: 400 }
        );
      }
    }

    if (isCompleteParam !== null) {
      filters = { ...filters, isComplete: isCompleteParam === 'true' };
    }

    if (isTemplateParam !== null) {
      filters = { ...filters, isTemplate: isTemplateParam === 'true' };
    }

    // Validate filters
    try {
      workoutSessionFilterOptionsSchema.parse(filters);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid filter parameters' },
        { status: 400 }
      );
    }

    // Parse pagination
    let pagination = { page: 1, limit: 20 };
    if (paginationParam) {
      try {
        const parsedPagination = JSON.parse(paginationParam);
        const validatedPagination = paginationSchema.parse(parsedPagination);
        pagination = validatedPagination;
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid pagination format' },
          { status: 400 }
        );
      }
    }

    // Get workout sessions
    const result = await getWorkoutSessions(session.user.id, {
      ...filters,
      pagination,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching workout sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/workout/sessions
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate request
    const validatedData = createWorkoutSessionSchema.parse(body);
    const data: any = Object.fromEntries(Object.entries(validatedData).filter(([,v]) => v !== undefined));

    // Determine coach ID if user is a trainer
    const coachId = session.user.role === UserRole.TRAINER ? session.user.id : undefined;

    // Create workout session
    const workoutSession = await createWorkoutSession(
      session.user.id,
      data,
      coachId
    );

    return NextResponse.json({
      success: true,
      session: workoutSession,
      message: 'Workout session created successfully',
    });
  } catch (error) {
    console.error('Error creating workout session:', error);
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/workout/sessions/complete
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const endTimeParam = searchParams.get('endTime');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Parse end time if provided
    let endTime: Date | undefined;
    if (endTimeParam) {
      try {
        endTime = new Date(endTimeParam);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid end time format' },
          { status: 400 }
        );
      }
    }

    // Complete workout session
    const completedSession = await completeWorkoutSession(
      sessionId,
      session.user.id,
      endTime
    );

    if (!completedSession) {
      return NextResponse.json(
        { error: 'Workout session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: completedSession,
      message: 'Workout session completed successfully',
    });
  } catch (error) {
    console.error('Error completing workout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
