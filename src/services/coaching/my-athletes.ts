import { prisma } from '@/core/database';
import { nanoid } from 'nanoid';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface AthleteInvitation {
  id: string;
  trainerId: string;
  athleteEmail: string;
  athleteName: string | null;
  token: string;
  status: string;
  sentAt: Date;
  acceptedAt: Date | null;
  expiresAt: Date;
  message: string | null;
}

export interface CoachingRequest {
  id: string;
  athleteId: string;
  trainerId: string;
  status: string;
  requestedAt: Date;
  respondedAt: Date | null;
  message: string | null;
  trainerNotes: string | null;
  athlete: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    massiminoUsername: string | null;
  };
}

export interface TrainerClient {
  id: string;
  trainerId: string;
  clientId: string;
  status: string;
  startDate: Date;
  goals: string[];
  notes: string | null;
  lastSessionDate: Date | null;
  sessionsRemaining: number;
  source: string | null;
  client: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    massiminoUsername: string | null;
  };
  recentWorkouts?: any[];
  upcomingAppointments?: any[];
}

export interface MyAthletesData {
  withProfile: TrainerClient[];
  withoutProfile: AthleteInvitation[];
  pendingRequests: CoachingRequest[];
}

/**
 * Get all athletes (with profile, without profile, and pending requests)
 */
export async function getMyAthletes(trainerId: string): Promise<MyAthletesData> {
  // Get trainer profile ID
  const trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: trainerId },
  });

  if (!trainerProfile) {
    throw new Error('Trainer profile not found');
  }

  // Get athletes with profiles (existing clients)
  const withProfile = await prisma.trainer_clients.findMany({
    where: {
      trainerId: trainerProfile.id,
      status: { in: ['ACTIVE', 'INACTIVE', 'PAUSED'] },
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          massiminoUsername: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get pending invitations (athletes without profiles)
  const withoutProfile = await prisma.athlete_invitations.findMany({
    where: {
      trainerId,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    orderBy: {
      sentAt: 'desc',
    },
  });

  // Get pending coaching requests
  const pendingRequests = await prisma.coaching_requests.findMany({
    where: {
      trainerId,
      status: 'PENDING',
    },
    include: {
      athlete: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          massiminoUsername: true,
        },
      },
    },
    orderBy: {
      requestedAt: 'desc',
    },
  });

  return {
    withProfile: withProfile.map((tc) => ({
      ...tc,
      client: tc.users,
    })),
    withoutProfile,
    pendingRequests,
  };
}

/**
 * Invite an athlete by email
 */
export async function inviteAthlete(
  trainerId: string,
  email: string,
  name?: string,
  message?: string
): Promise<AthleteInvitation> {
  // Check if user already exists
  const existingUser = await prisma.users.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User already has a Massimino profile. Please add them directly.');
  }

  // Check if invitation already exists
  const existingInvitation = await prisma.athlete_invitations.findFirst({
    where: {
      trainerId,
      athleteEmail: email,
      status: 'PENDING',
    },
  });

  if (existingInvitation) {
    throw new Error('Invitation already sent to this email');
  }

  // Generate token
  const token = nanoid(32);

  // Create expiration date (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Create invitation
  const invitation = await prisma.athlete_invitations.create({
    data: {
      trainerId,
      athleteEmail: email,
      athleteName: name || null,
      token,
      status: 'PENDING',
      expiresAt,
      message: message || null,
    },
  });

  // Get trainer info
  const trainer = await prisma.users.findUnique({
    where: { id: trainerId },
    select: { name: true, email: true },
  });

  // Send email via Resend
  try {
    await resend.emails.send({
      from: 'Massimino <noreply@massimino.fitness>',
      to: email,
      subject: `${trainer?.name || 'Your coach'} invited you to Massimino`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #254967; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #254967; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Massimino</h1>
            </div>
            <div class="content">
              <p>Dear athlete,</p>
              <p>Your coach <strong>${trainer?.name || 'Your trainer'}</strong> has invited you to join them on Massimino.</p>
              ${message ? `<p><em>"${message}"</em></p>` : ''}
              <p>Click here to discover the workout log they have created for you:</p>
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/accept-invitation/${token}" class="button">
                  Join Massimino
                </a>
              </p>
              <p>Massimino is a safety-first fitness platform where everybody can have their own profile, discover new exercises, make friends, be part of teams, use our integrated AI called Massichat, and much more!</p>
            </div>
            <div class="footer">
              <p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/feedback">Give Us Your Feedback</a>
              </p>
              <p>We look forward to working out with you!</p>
              <p>Massimino Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    // Delete the invitation since email failed
    await prisma.athlete_invitations.delete({
      where: { id: invitation.id },
    });
    throw new Error('Failed to send invitation email. Please verify the email address and try again.');
  }

  return invitation;
}

/**
 * Accept a coaching request
 */
export async function acceptCoachingRequest(
  requestId: string,
  trainerId: string,
  notes?: string
): Promise<TrainerClient> {
  // Get the request
  const request = await prisma.coaching_requests.findUnique({
    where: { id: requestId },
    include: {
      athlete: true,
    },
  });

  if (!request) {
    throw new Error('Coaching request not found');
  }

  if (request.trainerId !== trainerId) {
    throw new Error('Unauthorized');
  }

  if (request.status !== 'PENDING') {
    throw new Error('Request already processed');
  }

  // Get trainer profile
  const trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: trainerId },
  });

  if (!trainerProfile) {
    throw new Error('Trainer profile not found');
  }

  // Create trainer-client relationship
  const trainerClient = await prisma.trainer_clients.create({
    data: {
      id: nanoid(),
      trainerId: trainerProfile.id,
      clientId: request.athleteId,
      status: 'ACTIVE',
      startDate: new Date(),
      notes: notes || `Accepted coaching request from ${request.athlete.name}`,
      goals: [],
      source: 'REQUEST',
      updatedAt: new Date(),
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          massiminoUsername: true,
        },
      },
    },
  });

  // Update request status
  await prisma.coaching_requests.update({
    where: { id: requestId },
    data: {
      status: 'ACCEPTED',
      respondedAt: new Date(),
      trainerNotes: notes || null,
    },
  });

  // Update trainer profile client count
  await prisma.trainer_profiles.update({
    where: { id: trainerProfile.id },
    data: {
      activeClients: {
        increment: 1,
      },
      totalClients: {
        increment: 1,
      },
    },
  });

  return {
    ...trainerClient,
    client: trainerClient.users,
  };
}

/**
 * Decline a coaching request
 */
export async function declineCoachingRequest(
  requestId: string,
  trainerId: string,
  reason?: string
): Promise<void> {
  const request = await prisma.coaching_requests.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Coaching request not found');
  }

  if (request.trainerId !== trainerId) {
    throw new Error('Unauthorized');
  }

  if (request.status !== 'PENDING') {
    throw new Error('Request already processed');
  }

  await prisma.coaching_requests.update({
    where: { id: requestId },
    data: {
      status: 'DECLINED',
      respondedAt: new Date(),
      trainerNotes: reason || null,
    },
  });
}

/**
 * Request coaching from a trainer (athlete side)
 */
export async function requestCoaching(
  athleteId: string,
  trainerId: string,
  message?: string
): Promise<CoachingRequest> {
  // Check if request already exists
  const existingRequest = await prisma.coaching_requests.findUnique({
    where: {
      athleteId_trainerId: {
        athleteId,
        trainerId,
      },
    },
  });

  if (existingRequest) {
    if (existingRequest.status === 'PENDING') {
      throw new Error('You already have a pending request with this trainer');
    }
    if (existingRequest.status === 'ACCEPTED') {
      throw new Error('You are already being coached by this trainer');
    }
  }

  // Create request
  const request = await prisma.coaching_requests.create({
    data: {
      athleteId,
      trainerId,
      status: 'PENDING',
      message: message || null,
    },
    include: {
      athlete: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          massiminoUsername: true,
        },
      },
    },
  });

  return request;
}

/**
 * Get athlete's recent workouts
 */
export async function getAthleteWorkouts(
  athleteId: string,
  trainerId: string,
  limit: number = 10
): Promise<any[]> {
  // Verify trainer-client relationship
  const trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: trainerId },
  });

  if (!trainerProfile) {
    throw new Error('Trainer profile not found');
  }

  const relationship = await prisma.trainer_clients.findFirst({
    where: {
      trainerId: trainerProfile.id,
      clientId: athleteId,
    },
  });

  if (!relationship) {
    throw new Error('Not authorized to view this athlete\'s workouts');
  }

  // Get recent workouts
  const workouts = await prisma.workout_sessions.findMany({
    where: {
      userId: athleteId,
    },
    orderBy: {
      startTime: 'desc',
    },
    take: limit,
    include: {
      workout_log_entries: {
        include: {
          exercises: {
            select: {
              name: true,
              muscleGroups: true,
            },
          },
        },
      },
    },
  });

  return workouts;
}

/**
 * Get athlete's progress summary
 */
export async function getAthleteProgress(
  athleteId: string,
  trainerId: string
): Promise<any> {
  // Verify trainer-client relationship
  const trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: trainerId },
  });

  if (!trainerProfile) {
    throw new Error('Trainer profile not found');
  }

  const relationship = await prisma.trainer_clients.findFirst({
    where: {
      trainerId: trainerProfile.id,
      clientId: athleteId,
    },
  });

  if (!relationship) {
    throw new Error('Not authorized to view this athlete\'s progress');
  }

  // Get workout count (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const workoutCount = await prisma.workout_sessions.count({
    where: {
      userId: athleteId,
      startTime: { gte: thirtyDaysAgo },
    },
  });

  // Get total exercises logged
  const totalExercises = await prisma.workout_log_entries.count({
    where: {
      userId: athleteId,
    },
  });

  // Get personal records
  const personalRecords = await prisma.personal_records.findMany({
    where: {
      userId: athleteId,
    },
    orderBy: {
      achievedAt: 'desc',
    },
    take: 5,
    include: {
      exercises: {
        select: {
          name: true,
        },
      },
    },
  });

  // Get program subscription
  const programSubscription = await prisma.program_subscriptions.findFirst({
    where: {
      userId: athleteId,
      isActive: true,
    },
    include: {
      program_templates: {
        select: {
          name: true,
          difficulty: true,
        },
      },
    },
  });

  return {
    workoutCount30Days: workoutCount,
    totalExercises,
    personalRecords,
    currentProgram: programSubscription,
    lastWorkoutDate: relationship.lastSessionDate,
  };
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(
  invitationId: string,
  trainerId: string
): Promise<void> {
  const invitation = await prisma.athlete_invitations.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.trainerId !== trainerId) {
    throw new Error('Unauthorized');
  }

  await prisma.athlete_invitations.update({
    where: { id: invitationId },
    data: {
      status: 'CANCELLED',
    },
  });
}

/**
 * Resend an invitation
 */
export async function resendInvitation(
  invitationId: string,
  trainerId: string
): Promise<void> {
  const invitation = await prisma.athlete_invitations.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.trainerId !== trainerId) {
    throw new Error('Unauthorized');
  }

  // Get trainer info
  const trainer = await prisma.users.findUnique({
    where: { id: trainerId },
    select: { name: true, email: true },
  });

  // Resend email
  try {
    await resend.emails.send({
      from: 'Massimino <noreply@massimino.fitness>',
      to: invitation.athleteEmail,
      subject: `${trainer?.name || 'Your coach'} invited you to Massimino`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #254967; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #254967; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Massimino</h1>
            </div>
            <div class="content">
              <p>Dear athlete,</p>
              <p>Your coach <strong>${trainer?.name || 'Your trainer'}</strong> has invited you to join them on Massimino.</p>
              ${invitation.message ? `<p><em>"${invitation.message}"</em></p>` : ''}
              <p>Click here to discover the workout log they have created for you:</p>
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/accept-invitation/${invitation.token}" class="button">
                  Join Massimino
                </a>
              </p>
              <p>Massimino is a safety-first fitness platform where everybody can have their own profile, discover new exercises, make friends, be part of teams, use our integrated AI called Massichat, and much more!</p>
            </div>
            <div class="footer">
              <p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/feedback">Give Us Your Feedback</a>
              </p>
              <p>We look forward to working out with you!</p>
              <p>Massimino Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Failed to resend invitation email:', error);
    throw new Error('Failed to send email');
  }

  // Update sentAt timestamp
  await prisma.athlete_invitations.update({
    where: { id: invitationId },
    data: {
      sentAt: new Date(),
    },
  });
}
