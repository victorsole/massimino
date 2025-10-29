// src/app/api/workout/entries/route.ts
/**
 * Workout Log Entries API Route
 * Handles CRUD operations for workout log entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
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
import { prisma } from '@/core/database';
import { nanoid } from 'nanoid';
import { sendEmail } from '@/services/email/email_service';

// Helper function to notify trainer of workout completion
async function notifyTrainerOfWorkoutCompletion(entry: any, coachId: string, userId: string) {
  try {
    // Get user and exercise details
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const exercise = await prisma.exercises.findUnique({
      where: { id: entry.exerciseId },
      select: { name: true },
    });

    const trainer = await prisma.users.findUnique({
      where: { id: coachId },
      select: { name: true, email: true },
    });

    if (!user || !exercise || !trainer) return;

    const athleteName = user.name || user.email;
    const exerciseName = exercise.name;

    // Create push notification
    await prisma.push_notifications.create({
      data: {
        id: nanoid(),
        userId: coachId,
        type: 'PROGRESS_UPDATE',
        title: 'Workout Completed',
        body: `${athleteName} completed ${exerciseName} - ${entry.reps} reps @ ${entry.weight}${entry.unit === 'KG' ? 'kg' : 'lbs'}`,
        status: 'PENDING',
        createdAt: new Date(),
      },
    });

    // Send email notification
    if (trainer.email) {
      await sendEmail({
        to: trainer.email,
        subject: `${athleteName} completed a workout on Massimino`,
        text: `Your athlete ${athleteName} just completed a workout:\n\nExercise: ${exerciseName}\nSet ${entry.setNumber}: ${entry.reps} reps @ ${entry.weight}${entry.unit === 'KG' ? 'kg' : 'lbs'}\n\nLog in to view their progress: ${process.env.NEXTAUTH_URL}/my-athletes`,
      }).catch((err) => console.error('Failed to send workout completion email:', err));
    }
  } catch (error) {
    console.error('Error notifying trainer of workout completion:', error);
  }
}

// Helper function to check and award first workout bonus
async function checkFirstWorkoutBonus(userId: string) {
  try {
    // Check if this is the user's first workout entry
    const workoutCount = await prisma.workout_log_entries.count({
      where: { userId }
    });

    // If this is their first workout, check if they were invited
    if (workoutCount === 1) {
      const invitation = await prisma.invitations.findFirst({
        where: {
          receiverId: userId,
          status: 'ACCEPTED'
        },
        include: {
          users_invitations_senderIdTousers: { select: { id: true, role: true } }
        }
      });

      // Award bonus points to the trainer who invited them
      if (invitation && (invitation as any).users_invitations_senderIdTousers?.role === 'TRAINER') {
        await prisma.trainer_points.create({
          data: {
            trainerId: invitation.senderId,
            pointType: 'BONUS_FIRST_WORKOUT',
            points: 25,
            description: `First workout completed by invited user: ${invitation.email}`,
            sourceId: invitation.id
          }
        });

        console.log('First workout bonus awarded:', {
          trainerId: invitation.senderId,
          invitedUserId: userId,
          invitationId: invitation.id,
          points: 25
        });
      }
    }
  } catch (error) {
    console.error('Error checking first workout bonus:', error);
  }
}

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
    const teamIdParam = searchParams.get('team_id');
    const userIdParam = searchParams.get('user_id') || searchParams.get('userId');
    
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
        pagination = {
          page: validatedPagination.page ?? 1,
          limit: validatedPagination.limit ?? 50
        };
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid pagination format' },
          { status: 400 }
        );
      }
    }

    // Determine target user (trainer/admin may request member logs within team scope)
    let targetUserId = session.user.id;
    if (userIdParam && userIdParam !== session.user.id) {
      const role = (session.user as any).role;
      if (role === 'ADMIN') {
        targetUserId = userIdParam;
      } else if (role === 'TRAINER' && teamIdParam) {
        const { prisma } = await import('@/core/database');
        const rel = await prisma.team_members.findFirst({
          where: {
            teamId: teamIdParam,
            userId: userIdParam,
            status: 'ACTIVE',
            teams: { trainerId: session.user.id }
          }
        });
        if (rel) {
          targetUserId = userIdParam;
        } else {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          );
        }
      }
    }

    // Get workout log entries
    const result = await getWorkoutLogEntries(targetUserId, {
      filters,
      sort,
      pagination,
    });

    // Optional team filter (filter unified data by team flags if present)
    if (teamIdParam) {
      (result as any).entries = (result as any).entries.filter((e: any) => e.isTeamWorkout === true && (e.teamWorkoutId === teamIdParam));
      // Note: if unified flags use different field names, adjust here accordingly.
    }

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
    const createdEntries: any[] = [];
    const errors: any[] = [];

    for (const entryData of entries) {
      try {
        const { prisma } = await import('@/core/database');
        let targetUserId = session.user.id;
        let coachId: string | undefined = session.user.role === UserRole.TRAINER ? session.user.id : undefined;

        // Determine session and enforce RBAC
        const sessionId = entryData.sessionId || _sessionId;
        if (sessionId) {
          const targetSession = await prisma.workout_sessions.findUnique({ where: { id: sessionId } });
          if (!targetSession) {
            throw new Error('Session not found');
          }
          if (session.user.role === UserRole.TRAINER) {
            const rel = await prisma.trainer_clients.findUnique({
              where: { trainerId_clientId: { trainerId: session.user.id, clientId: targetSession.userId } }
            });
            if (!rel) throw new Error('Forbidden');
            coachId = session.user.id;
          } else if (session.user.role === UserRole.CLIENT && targetSession.userId !== session.user.id) {
            throw new Error('Forbidden');
          }
          // Admin allowed
          targetUserId = targetSession.userId;
        } else {
          // No sessionId provided
          if (session.user.role !== UserRole.CLIENT) {
            throw new Error('Session is required for trainer/admin');
          }
        }

        const data = Object.fromEntries(
          Object.entries(entryData).filter(([, v]) => v !== undefined)
        ) as any;
        if (sessionId) data.sessionId = sessionId;

        const entry = await createWorkoutLogEntry(
          targetUserId,
          data,
          coachId
        );
        createdEntries.push(entry);

        await checkFirstWorkoutBonus(targetUserId);

        // Notify trainer if this is a trainer-assigned workout
        if (coachId && targetUserId !== coachId) {
          await notifyTrainerOfWorkoutCompletion(entry, coachId, targetUserId);
        }
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
      const firstError = errors[0]?.error || 'Failed to create any workout entries';
      return NextResponse.json(
        { 
          success: false,
          error: firstError,
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
    // Return a 400 with details for validation issues instead of 500
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.toLowerCase().includes('validation')) {
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
