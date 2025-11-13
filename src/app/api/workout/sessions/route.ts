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
  completeWorkoutSession,
  calculate_session_experience_points,
  check_and_award_achievements,
  prisma
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
    const statusParam = searchParams.get('status');
    const actionParam = searchParams.get('action');
    const targetUserIdParam = searchParams.get('userId');
    const invitationIdParam = searchParams.get('invitationId');
    
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
        pagination = {
          page: validatedPagination.page ?? 1,
          limit: validatedPagination.limit ?? 20
        };
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid pagination format' },
          { status: 400 }
        );
      }
    }

    // Trainer/Admin: support listing clients via action=clients
    if (actionParam === 'clients' && (session.user.role === UserRole.TRAINER || session.user.role === UserRole.ADMIN)) {
      // Get active clients
      const list = await prisma.trainer_clients.findMany({
        where: session.user.role === UserRole.TRAINER ? { trainerId: session.user.id } : {},
        include: {
          users: {
            select: { id: true, name: true, email: true, image: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 200
      });

      // Get pending invitations
      const invitations = await prisma.athlete_invitations.findMany({
        where: session.user.role === UserRole.TRAINER
          ? { trainerId: session.user.id, status: 'PENDING' }
          : { status: 'PENDING' },
        orderBy: { sentAt: 'desc' },
        take: 100
      });

      // Combine clients and pending invitations
      const clients = [
        ...list.map((tc) => ({
          id: tc.users.id,
          name: tc.users.name,
          email: tc.users.email,
          image: tc.users.image,
          type: 'client' as const
        })),
        ...invitations.map((inv) => ({
          id: inv.id,
          name: inv.athleteName || null,
          email: inv.athleteEmail,
          image: null,
          type: 'invitation' as const
        }))
      ];

      return NextResponse.json({ clients });
    }

    // Handle invitation ID parameter (for pending athletes)
    if (invitationIdParam && (session.user.role === UserRole.TRAINER || session.user.role === UserRole.ADMIN)) {
      // Verify trainer owns the invitation
      const invitation = await prisma.athlete_invitations.findUnique({
        where: { id: invitationIdParam }
      });

      if (!invitation) {
        return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
      }

      if (session.user.role === UserRole.TRAINER && invitation.trainerId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Get sessions for this invitation
      const sessions = await prisma.workout_sessions.findMany({
        where: { athleteInvitationId: invitationIdParam },
        include: {
          users_workout_sessions_userIdTousers: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          users_workout_sessions_coachIdTousers: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          workout_log_entries: {
            include: {
              exercises: true,
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { date: 'desc' },
        take: pagination.limit || 20,
      });

      // Map the Prisma relation names to the expected format
      const mappedSessions = sessions.map((session) => ({
        ...session,
        user: session.users_workout_sessions_userIdTousers,
        coach: session.users_workout_sessions_coachIdTousers,
        entries: session.workout_log_entries.map((entry) => ({
          ...entry,
          exercise: entry.exercises,
        })),
      }));

      return NextResponse.json({
        sessions: mappedSessions,
        pagination: {
          page: pagination.page || 1,
          limit: pagination.limit || 20,
          total: sessions.length,
          totalPages: 1,
          hasMore: false,
        },
      });
    }

    // Determine target user ID based on role and optional userId param
    let targetUserId = session.user.id;
    if (targetUserIdParam && (session.user.role === UserRole.TRAINER || session.user.role === UserRole.ADMIN)) {
      targetUserId = targetUserIdParam;
      // Optional: enforce trainer-client relationship here if TRAINER
      if (session.user.role === UserRole.TRAINER) {
        // Ensure trainer has relationship with the client
        const rel = await (await import('@/core/database')).prisma.trainer_clients.findUnique({
          where: { trainerId_clientId: { trainerId: session.user.id, clientId: targetUserId } }
        });
        if (!rel) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // If requesting active session, return the most recent incomplete session
    if (statusParam === 'active') {
      const prisma = (await import('@/core/database')).prisma;
      const active = await prisma.workout_sessions.findFirst({
        where: { userId: targetUserId, isComplete: false },
        orderBy: { startTime: 'desc' }
      });
      return NextResponse.json({ activeSession: active || null });
    }

    // Get workout sessions list
    const result = await getWorkoutSessions(targetUserId, {
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

    // Flexible body handling: accept either { date, startTime, ... } or { start_time: ISO, end_time?: ISO }
    let normalized: any = { ...body };
    if (!normalized.date && normalized.start_time) {
      const start = new Date(normalized.start_time);
      const pad = (n: number) => n.toString().padStart(2, '0');
      normalized.date = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
      normalized.startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
      if (normalized.end_time) {
        const end = new Date(normalized.end_time);
        normalized.endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
      }
      delete normalized.start_time;
      delete normalized.end_time;
    }

    // Default missing date/startTime to now (UX fallback)
    if (!normalized.date || !normalized.startTime) {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      if (!normalized.date) {
        normalized.date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      }
      if (!normalized.startTime) {
        normalized.startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      }
    }

    // Handle either userId OR athleteInvitationId (for pending invited athletes)
    const targetUserId: string | undefined = body.userId;
    const athleteInvitationId: string | undefined = body.athleteInvitationId;
    let ownerUserId: string | null = session.user.id;
    let coachId: string | undefined = undefined;
    let athleteEmail: string | undefined = undefined;

    // For pending invited athletes (invitation ID provided)
    if (athleteInvitationId && (session.user.role === UserRole.TRAINER || session.user.role === UserRole.ADMIN)) {
      const { prisma } = await import('@/core/database');

      // Verify trainer owns the invitation
      const invitation = await prisma.athlete_invitations.findUnique({
        where: { id: athleteInvitationId },
      });

      if (!invitation || invitation.trainerId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden - invalid invitation' }, { status: 403 });
      }

      if (invitation.status !== 'PENDING') {
        return NextResponse.json({ error: 'Invitation already processed' }, { status: 400 });
      }

      // Session for pending athlete - no userId yet
      ownerUserId = null;
      coachId = session.user.id;
      athleteEmail = invitation.athleteEmail;
    }
    // For existing users
    else if (targetUserId && (session.user.role === UserRole.TRAINER || session.user.role === UserRole.ADMIN)) {
      ownerUserId = targetUserId;
      if (session.user.role === UserRole.TRAINER) {
        // Verify trainer-client relationship
        const { prisma } = await import('@/core/database');
        const rel = await prisma.trainer_clients.findUnique({
          where: { trainerId_clientId: { trainerId: session.user.id, clientId: targetUserId } }
        });
        if (!rel) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        coachId = session.user.id;
      }
      if (session.user.role === UserRole.ADMIN) {
        coachId = undefined; // Admin not a coach by default
      }
    } else if (targetUserId && session.user.role === UserRole.CLIENT) {
      // Clients cannot create sessions for others
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } else {
      // If the requester is a trainer creating for self, set coachId as trainer
      if (session.user.role === UserRole.TRAINER) coachId = session.user.id;
    }

    // Validate normalized payload
    const validatedData = createWorkoutSessionSchema.parse(normalized);
    const data: any = Object.fromEntries(Object.entries(validatedData).filter(([, v]) => v !== undefined));

    // Add invitation fields if creating for pending athlete
    if (athleteInvitationId) {
      data.athleteInvitationId = athleteInvitationId;
      data.athleteInvitationEmail = athleteEmail;
    }

    // Create workout session
    const workoutSession = await createWorkoutSession(ownerUserId, data, coachId);

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
    let sessionId = searchParams.get('sessionId');
    let endTimeParam = searchParams.get('endTime');

    // Accept JSON body as fallback
    if (!sessionId) {
      try {
        const body = await request.json();
        sessionId = body.sessionId || sessionId;
        endTimeParam = body.endTime || endTimeParam;
      } catch {
        // no body provided
      }
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Parse end time if provided (default to now if not provided)
    let endTime: Date | undefined;
    if (endTimeParam) {
      const parsed = new Date(endTimeParam);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid end time format' }, { status: 400 });
      }
      endTime = parsed;
    } else {
      endTime = new Date();
    }

    // Complete workout session
    const completedSession = await completeWorkoutSession(sessionId, session.user.id, endTime);

    if (!completedSession) {
      return NextResponse.json(
        { error: 'Workout session not found' },
        { status: 404 }
      );
    }

    // Compute XP breakdown and award achievements (skip for pending invited athletes)
    if (!completedSession.userId) {
      return NextResponse.json({ error: 'Cannot complete session for pending athlete' }, { status: 400 });
    }
    const xp = await calculate_session_experience_points(sessionId);
    const awarded = await check_and_award_achievements(completedSession.userId, sessionId);

    // Reload session to include updated XP/achievements if the awarder updated them
    const updated = await prisma.workout_sessions.findUnique({ where: { id: sessionId } });

    return NextResponse.json({
      success: true,
      session: updated || completedSession,
      gamification: {
        experience_points: xp,
        achievements_earned: awarded,
      },
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
