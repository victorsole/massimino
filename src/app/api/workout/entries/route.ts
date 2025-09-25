/**
 * Workout Log Entries API Route
 * Handles CRUD operations for workout log entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { 
  getWorkoutLogEntries, 
  createWorkoutLogEntry,
  getWorkoutStats 
} from '@/core/database';
import { 
  createWorkoutEntriesRequestSchema,
  workoutFilterOptionsSchema,
  workoutSortOptionsSchema,
  paginationSchema,
} from '@/core/utils/workout-validation';
import { UserRole } from '@prisma/client';

// ============================================================================
// GET /api/workout/entries
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
    const filtersParam = searchParams.get('filters');
    const sortParam = searchParams.get('sort');
    const paginationParam = searchParams.get('pagination');
    const statsParam = searchParams.get('stats');

    // If stats parameter is present, return workout statistics
    if (statsParam === 'true') {
      const dateRangeParam = searchParams.get('dateRange');
      let dateRange;
      
      if (dateRangeParam) {
        try {
          const { start, end } = JSON.parse(dateRangeParam);
          dateRange = { start: new Date(start), end: new Date(end) };
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid date range format' },
            { status: 400 }
          );
        }
      }

      const stats = await getWorkoutStats(session.user.id, dateRange);
      return NextResponse.json(stats);
    }

    // Parse filters
    let filters = {};
    if (filtersParam) {
      try {
        const parsedFilters = JSON.parse(filtersParam);
        const validatedFilters = workoutFilterOptionsSchema.parse(parsedFilters);
        filters = validatedFilters;
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid filters format' },
          { status: 400 }
        );
      }
    }

    // Parse sort options
    let sort: any = { field: 'date', direction: 'desc' as const };
    if (sortParam) {
      try {
        const parsedSort = JSON.parse(sortParam);
        const validatedSort = workoutSortOptionsSchema.parse(parsedSort);
        const typedSort: import('@/types/workout').WorkoutSortOptions = {
          field: validatedSort.field as any,
          direction: validatedSort.direction,
        };
        sort = typedSort as any;
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid sort format' },
          { status: 400 }
        );
      }
    }

    // Parse pagination
    let pagination = { page: 1, limit: 50 };
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

    // Get workout log entries
    const result = await getWorkoutLogEntries(session.user.id, {
      filters,
      sort,
      pagination,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching workout entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/workout/entries
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
    const validatedRequest = createWorkoutEntriesRequestSchema.parse(body);
    const { sessionId: _sessionId, entries } = validatedRequest;

    // Create workout entries
    const createdEntries = [];
    const errors = [];

    for (const entryData of entries) {
      try {
        // Determine coach ID if user is a trainer
        const coachId = session.user.role === UserRole.TRAINER ? session.user.id : undefined;
        
        const data = Object.fromEntries(
          Object.entries(entryData).filter(([, v]) => v !== undefined)
        ) as any;
        const entry = await createWorkoutLogEntry(
          session.user.id,
          data,
          coachId
        );
        createdEntries.push(entry);
      } catch (error) {
        console.error('Error creating workout entry:', error);
        errors.push({
          entry: entryData,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Return results
    if (errors.length === 0) {
      return NextResponse.json({
        success: true,
        entries: createdEntries,
        message: `Successfully created ${createdEntries.length} workout entries`,
      });
    } else if (createdEntries.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          errors,
          message: 'Failed to create any workout entries',
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json({
        success: true,
        entries: createdEntries,
        errors,
        message: `Created ${createdEntries.length} entries with ${errors.length} errors`,
      });
    }
  } catch (error) {
    console.error('Error creating workout entries:', error);
    
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
