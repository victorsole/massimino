import { prisma } from '@/core/database';
import { nanoid } from 'nanoid';

/**
 * Add athlete to a team (must be trainer's athlete and team)
 */
export async function addAthleteToTeam(
  teamId: string,
  athleteId: string,
  trainerId: string,
  role?: 'MEMBER' | 'CAPTAIN'
): Promise<any> {
  // Verify trainer owns the team
  const team = await prisma.teams.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    throw new Error('Team not found');
  }

  // Get trainer profile
  const trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: trainerId },
  });

  if (!trainerProfile) {
    throw new Error('Trainer profile not found');
  }

  // Verify athlete is trainer's client
  const relationship = await prisma.trainer_clients.findFirst({
    where: {
      trainerId: trainerProfile.id,
      clientId: athleteId,
      status: 'ACTIVE',
    },
  });

  if (!relationship) {
    throw new Error('Athlete is not your client');
  }

  // Check if athlete is already in team
  const existing = await prisma.team_members.findFirst({
    where: {
      teamId: teamId,
      userId: athleteId,
    },
  });

  if (existing) {
    throw new Error('Athlete is already in this team');
  }

  // Add to team
  const teamMember = await prisma.team_members.create({
    data: {
      id: nanoid(),
      teamId: teamId,
      userId: athleteId,
      role: role || 'MEMBER',
      joinedAt: new Date(),
    },
  });

  // Update team member count
  await prisma.teams.update({
    where: { id: teamId },
    data: {
      memberCount: { increment: 1 },
    },
  });

  return teamMember;
}

/**
 * Remove athlete from team
 */
export async function removeAthleteFromTeam(
  teamId: string,
  athleteId: string,
  trainerId: string
): Promise<void> {
  // Verify trainer owns the team
  const team = await prisma.teams.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    throw new Error('Team not found');
  }

  // Get trainer profile
  const trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: trainerId },
  });

  if (!trainerProfile) {
    throw new Error('Trainer profile not found');
  }

  // Remove from team
  await prisma.team_members.deleteMany({
    where: {
      teamId: teamId,
      userId: athleteId,
    },
  });

  // Update team member count
  await prisma.teams.update({
    where: { id: teamId },
    data: {
      memberCount: { decrement: 1 },
    },
  });
}

/**
 * Get trainer's teams with their athletes
 */
export async function getTrainerTeamsWithAthletes(trainerId: string): Promise<any[]> {
  const trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: trainerId },
  });

  if (!trainerProfile) {
    return [];
  }

  // Get trainer's clients
  const clients = await prisma.trainer_clients.findMany({
    where: {
      trainerId: trainerProfile.id,
      status: 'ACTIVE',
    },
    select: {
      clientId: true,
    },
  });

  const clientIds = clients.map(c => c.clientId);

  // Get teams that have any of trainer's clients
  const teams = await prisma.teams.findMany({
    where: {
      team_members: {
        some: {
          userId: { in: clientIds },
        },
      },
    },
    include: {
      team_members: {
        where: {
          userId: { in: clientIds },
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              image: true,
              massiminoUsername: true,
            },
          },
        },
      },
    },
  });

  return teams;
}

/**
 * Get athletes not in a specific team
 */
export async function getAthletesNotInTeam(
  teamId: string,
  trainerId: string
): Promise<any[]> {
  const trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: trainerId },
  });

  if (!trainerProfile) {
    return [];
  }

  // Get all trainer's clients
  const allClients = await prisma.trainer_clients.findMany({
    where: {
      trainerId: trainerProfile.id,
      status: 'ACTIVE',
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          image: true,
          massiminoUsername: true,
        },
      },
    },
  });

  // Get team members
  const teamMembers = await prisma.team_members.findMany({
    where: { teamId: teamId },
    select: { userId: true },
  });

  const teamMemberIds = new Set(teamMembers.map(tm => tm.userId));

  // Filter out athletes already in team
  return allClients
    .filter(client => !teamMemberIds.has(client.clientId))
    .map(client => client.client);
}
