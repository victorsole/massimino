// src/services/teams/pending_members.ts
import { prisma } from '@/core/database';
import { nanoid } from 'nanoid';

export interface TeamMember {
  id: string;
  teamId: string;
  type: 'ACTIVE' | 'PENDING';
  status: string;
  joinedAt: Date;
  userId: string | null;
  name: string;
  email: string;
  image: string | null;
  massiminoUsername: string | null;
  athleteInvitationId: string | null;
  invitationStatus: string | null;
  canComment: boolean;
  canInviteOthers: boolean;
  canViewAllWorkouts: boolean;
}

/**
 * Add pending athlete invitation to team
 */
export async function addPendingAthleteToTeam(
  teamId: string,
  trainerId: string,
  athleteInvitationId: string
): Promise<any> {
  // Verify trainer owns the team
  const team = await prisma.teams.findUnique({
    where: { id: teamId },
  });

  if (!team || team.trainerId !== trainerId) {
    throw new Error('Unauthorized - you do not own this team');
  }

  // Verify trainer owns the invitation
  const invitation = await prisma.athlete_invitations.findUnique({
    where: { id: athleteInvitationId },
  });

  if (!invitation || invitation.trainerId !== trainerId) {
    throw new Error('Invalid invitation - you do not own this invitation');
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('Invitation has already been accepted or expired');
  }

  // Check if already a member
  const existing = await prisma.team_members.findFirst({
    where: {
      teamId,
      athleteInvitationId,
    },
  });

  if (existing) {
    throw new Error('Athlete already in team');
  }

  // Add to team
  const member = await prisma.team_members.create({
    data: {
      id: nanoid(),
      teamId,
      userId: null,
      athleteInvitationId,
      athleteInvitationEmail: invitation.athleteEmail,
      status: 'PENDING',
      invitedBy: trainerId,
      canInviteOthers: false,
      canComment: false, // Can't comment until they accept
      canViewAllWorkouts: true,
    },
  });

  return member;
}

/**
 * Add existing user to team
 */
export async function addUserToTeam(
  teamId: string,
  trainerId: string,
  userId: string
): Promise<any> {
  // Verify trainer owns the team
  const team = await prisma.teams.findUnique({
    where: { id: teamId },
  });

  if (!team || team.trainerId !== trainerId) {
    throw new Error('Unauthorized - you do not own this team');
  }

  // Check if already a member
  const existing = await prisma.team_members.findFirst({
    where: {
      teamId,
      userId,
    },
  });

  if (existing) {
    throw new Error('User already in team');
  }

  // Add to team
  const member = await prisma.team_members.create({
    data: {
      id: nanoid(),
      teamId,
      userId,
      status: 'ACTIVE',
      invitedBy: trainerId,
      canInviteOthers: false,
      canComment: true,
      canViewAllWorkouts: true,
    },
  });

  return member;
}

/**
 * Transfer pending team members when invitation accepted
 */
export async function transferPendingTeamMemberships(
  athleteInvitationId: string,
  userId: string
): Promise<{ transferred: number; failed: number }> {
  try {
    const result = await prisma.team_members.updateMany({
      where: {
        athleteInvitationId,
        userId: null,
      },
      data: {
        userId,
        status: 'ACTIVE',
        athleteInvitationId: null,
        athleteInvitationEmail: null,
        canComment: true, // Enable commenting now
      },
    });

    return { transferred: result.count, failed: 0 };
  } catch (error) {
    console.error('Error transferring team memberships:', error);
    return { transferred: 0, failed: 1 };
  }
}

/**
 * Get all team members (active + pending)
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const members = await prisma.team_members.findMany({
    where: {
      teamId,
      status: { in: ['ACTIVE', 'PENDING'] },
    },
    include: {
      users_team_members_userIdTousers: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          massiminoUsername: true,
        },
      },
      athlete_invitation: {
        select: {
          id: true,
          athleteEmail: true,
          athleteName: true,
          status: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });

  // Transform to unified format
  return members.map((m) => ({
    id: m.id,
    teamId: m.teamId,
    type: m.userId ? 'ACTIVE' : 'PENDING',
    status: m.status,
    joinedAt: m.joinedAt,

    // User info (might be null)
    userId: m.userId,
    name:
      m.users_team_members_userIdTousers?.name ||
      m.athlete_invitation?.athleteName ||
      m.athleteInvitationEmail ||
      'Unknown',
    email: m.users_team_members_userIdTousers?.email || m.athleteInvitationEmail || '',
    image: m.users_team_members_userIdTousers?.image || null,
    massiminoUsername: m.users_team_members_userIdTousers?.massiminoUsername || null,

    // Invitation info (might be null)
    athleteInvitationId: m.athleteInvitationId,
    invitationStatus: m.athlete_invitation?.status || null,

    // Permissions
    canComment: m.canComment,
    canInviteOthers: m.canInviteOthers,
    canViewAllWorkouts: m.canViewAllWorkouts,
  })) as TeamMember[];
}

/**
 * Remove member from team
 */
export async function removeMemberFromTeam(
  teamId: string,
  memberId: string,
  trainerId: string
): Promise<void> {
  // Verify trainer owns the team
  const team = await prisma.teams.findUnique({
    where: { id: teamId },
  });

  if (!team || team.trainerId !== trainerId) {
    throw new Error('Unauthorized');
  }

  await prisma.team_members.delete({
    where: { id: memberId },
  });
}
