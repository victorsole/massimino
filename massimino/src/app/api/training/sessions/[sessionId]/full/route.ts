import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only trainers can access this endpoint
    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Trainers only' }, { status: 403 });
    }

    const { sessionId } = await params;

    // Fetch the workout session with user
    const workoutSession = await prisma.workout_sessions.findUnique({
      where: { id: sessionId },
      include: {
        users_workout_sessions_userIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        athlete_invitation: {
          select: {
            id: true,
            athleteName: true,
            athleteEmail: true,
          },
        },
      },
    });

    if (!workoutSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify trainer-client relationship
    const trainerProfile = await prisma.trainer_profiles.findFirst({
      where: { userId: session.user.id },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
    }

    // Check authorization based on whether this is a pending athlete or not
    let isAuthorized = false;

    if (!workoutSession.userId && workoutSession.athleteInvitationId) {
      // This is a pending athlete session - verify trainer owns the invitation
      const invitation = await prisma.athlete_invitations.findUnique({
        where: { id: workoutSession.athleteInvitationId },
      });

      if (invitation && invitation.trainerId === trainerProfile.id) {
        isAuthorized = true;
      }
    } else if (workoutSession.userId) {
      // Regular athlete session - check trainer-client relationship
      const relationship = await prisma.trainer_clients.findFirst({
        where: {
          trainerId: trainerProfile.id,
          clientId: workoutSession.userId,
        },
      });

      // Also allow if the trainer is the coach assigned to this session
      const isAssignedCoach = workoutSession.coachId === session.user.id;

      if (relationship || isAssignedCoach) {
        isAuthorized = true;
      }
    }

    // Admin always authorized
    if (session.user.role === 'ADMIN') {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Not authorized to view this session' },
        { status: 403 }
      );
    }

    // Fetch workout entries with exercises and media
    const workoutEntries = await prisma.workout_log_entries.findMany({
      where: { sessionId },
      include: {
        exercises: {
          include: {
            exercise_media: {
              select: {
                id: true,
                provider: true,
                url: true,
                title: true,
                thumbnailUrl: true,
                durationSec: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Sort entries by media priority (WITH media first, WITHOUT media second)
    const sortedEntries = [...workoutEntries].sort((a, b) => {
      const aMediaCount = a.exercises?.exercise_media?.length || 0;
      const bMediaCount = b.exercises?.exercise_media?.length || 0;

      if (aMediaCount > 0 && bMediaCount === 0) return -1;
      if (aMediaCount === 0 && bMediaCount > 0) return 1;

      return (parseInt(a.order) || 0) - (parseInt(b.order) || 0);
    });

    // Fetch session comments
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Fetch workout history for this session (completed workouts)
    const history = await prisma.workout_log_entries.findMany({
      where: {
        sessionId,
        createdAt: {
          lt: new Date(), // Past entries
        },
      },
      include: {
        exercises: {
          select: {
            id: true,
            name: true,
            category: true,
            muscleGroups: true,
            equipment: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group history by date
    const historyByDate = history.reduce((acc: any, entry: any) => {
      const dateKey = new Date(entry.createdAt).toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      return acc;
    }, {});

    // Format the response
    const formattedSession = {
      id: workoutSession.id,
      title: workoutSession.title || 'Workout Session',
      date: workoutSession.date,
      startTime: workoutSession.startTime,
      endTime: workoutSession.endTime,
      duration: workoutSession.duration,
      status: workoutSession.status || 'ACTIVE',
      isComplete: workoutSession.isComplete,
      athleteId: workoutSession.userId || workoutSession.athleteInvitationId,
      athleteName: workoutSession.users_workout_sessions_userIdTousers?.name ||
                   workoutSession.users_workout_sessions_userIdTousers?.email ||
                   workoutSession.athlete_invitation?.athleteName ||
                   workoutSession.athlete_invitation?.athleteEmail ||
                   'Pending Athlete',
      trainerId: workoutSession.coachId,
      notes: workoutSession.notes,
      totalVolume: workoutSession.totalVolume,
      totalSets: workoutSession.totalSets,
      totalReps: workoutSession.totalReps,
      exercises: sortedEntries.map((entry) => ({
        id: entry.id,
        exerciseId: entry.exerciseId,
        exerciseName: entry.exercises?.name || 'Unknown Exercise',
        category: entry.exercises?.category,
        muscleGroups: entry.exercises?.muscleGroups,
        equipment: entry.exercises?.equipment,
        order: entry.order,
        setNumber: entry.setNumber,
        setType: entry.setType,
        reps: entry.reps,
        weight: entry.weight,
        unit: entry.unit,
        intensity: entry.intensity,
        tempo: entry.tempo,
        restSeconds: entry.restSeconds,
        actualRPE: entry.actualRPE,
        targetRPE: entry.targetRPE,
        formQuality: entry.formQuality,
        coachFeedback: entry.coachFeedback,
        userComments: entry.userComments,
        personalRecord: entry.personalRecord,
        volumeRecord: entry.volumeRecord,
        media: entry.exercises?.exercise_media?.map((m: any) => ({
          id: m.id,
          provider: m.provider,
          url: m.url,
          title: m.title,
          thumbnailUrl: m.thumbnailUrl,
          durationSec: m.durationSec,
        })) || [],
      })),
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        userId: comment.userId,
        userName: comment.users.name || comment.users.email,
        userRole: comment.users.role,
      })),
      history: historyByDate,
      goals: [], // Will be populated in Phase 4
    };

    return NextResponse.json(formattedSession);
  } catch (error: any) {
    console.error('Error fetching session data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session data' },
      { status: 500 }
    );
  }
}
