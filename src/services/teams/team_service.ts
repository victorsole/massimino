// src/services/teams/team_service.ts

/**
 * Team Service for Massimino
 * Consolidated service for all team-related operations including:
 * - Database operations, business rules, messaging, workout management, validation
 */

import {
  Team, TeamMember, TeamApplication, TeamMessage, TeamWorkoutLog,
  CreateTeamRequest, UpdateTeamRequest, TeamDiscoveryFilters,
  TEAM_VALIDATION_RULES, DEFAULT_TEAM_AESTHETICS,
  canManageTeam, isTeamMember, hasAvailableSpots, TeamMessageType
} from '@/types/teams';
import { prisma } from '@/core/database';
import crypto from 'crypto';

// Team Repository - Database operations
export class TeamRepository {
  static async createTeam(trainerId: string, teamData: CreateTeamRequest): Promise<Team> {
    const aestheticSettings = {
      ...DEFAULT_TEAM_AESTHETICS,
      ...teamData.aestheticSettings
    };

    const team = await prisma.teams.create({
      data: {
        id: crypto.randomUUID(),
        name: teamData.name,
        description: teamData.description ?? null,
        type: teamData.type,
        customTypeDescription: teamData.customTypeDescription ?? null,
        trainerId,
        visibility: teamData.visibility,
        maxMembers: teamData.maxMembers,
        aestheticSettings: aestheticSettings as any,
        spotifyPlaylistUrl: teamData.spotifyPlaylistUrl ?? null,
        allowComments: teamData.allowComments,
        allowMemberInvites: teamData.allowMemberInvites,
        isActive: true,
        memberCount: 1, // Trainer is automatically a member
        updatedAt: new Date(),
        // Create the trainer as the first member
        team_members: {
          create: {
            id: crypto.randomUUID(),
            userId: trainerId,
            status: 'ACTIVE',
            canInviteOthers: true,
            canComment: true,
            canViewAllWorkouts: true,
            joinedAt: new Date()
          }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            trainerVerified: true
          }
        },
        team_members: {
          include: {
            users_team_members_userIdTousers: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          }
        }
      }
    });

    return team as any;
  }

  static async getTeamById(teamId: string): Promise<Team | null> {
    const team = await prisma.teams.findUnique({
      where: { id: teamId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            trainerVerified: true
          }
        },
        team_members: {
          where: { status: 'ACTIVE' },
          include: {
            users_team_members_userIdTousers: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!team) return null;

    // Map DB shape to Team type: users -> trainer, team_members -> members
    const mapped: Team = {
      id: team.id,
      name: team.name,
      description: team.description ?? undefined,
      type: team.type as any,
      customTypeDescription: team.customTypeDescription ?? undefined,
      trainerId: team.trainerId,
      trainer: team.users as any,
      visibility: team.visibility as any,
      maxMembers: team.maxMembers,
      isActive: team.isActive,
      aestheticSettings: team.aestheticSettings as any,
      spotifyPlaylistUrl: team.spotifyPlaylistUrl ?? undefined,
      allowComments: team.allowComments,
      allowMemberInvites: team.allowMemberInvites,
      memberCount: team.memberCount,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      members: (team.team_members || []).map((m: any) => ({
        id: m.id,
        teamId: m.teamId,
        userId: m.userId,
        status: m.status,
        joinedAt: m.joinedAt,
        leftAt: m.leftAt ?? undefined,
        invitedBy: m.invitedBy ?? undefined,
        canInviteOthers: m.canInviteOthers,
        canComment: m.canComment,
        canViewAllWorkouts: m.canViewAllWorkouts,
        user: m.users_team_members_userIdTousers as any,
      })),
    };

    return mapped;
  }

  static async getTrainerTeams(trainerId: string): Promise<Team[]> {
    const teams = await prisma.teams.findMany({
      where: {
        trainerId,
        isActive: true
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            trainerVerified: true
          }
        },
        team_members: {
          where: { status: 'ACTIVE' },
          include: {
            users_team_members_userIdTousers: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return teams.map((team: any) => ({
      id: team.id,
      name: team.name,
      description: team.description ?? undefined,
      type: team.type as any,
      customTypeDescription: team.customTypeDescription ?? undefined,
      trainerId: team.trainerId,
      trainer: team.users as any,
      visibility: team.visibility as any,
      maxMembers: team.maxMembers,
      isActive: team.isActive,
      aestheticSettings: team.aestheticSettings as any,
      spotifyPlaylistUrl: team.spotifyPlaylistUrl ?? undefined,
      allowComments: team.allowComments,
      allowMemberInvites: team.allowMemberInvites,
      memberCount: team.memberCount,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      members: (team.team_members || []).map((m: any) => ({
        id: m.id,
        teamId: m.teamId,
        userId: m.userId,
        status: m.status,
        joinedAt: m.joinedAt,
        leftAt: m.leftAt ?? undefined,
        invitedBy: m.invitedBy ?? undefined,
        canInviteOthers: m.canInviteOthers,
        canComment: m.canComment,
        canViewAllWorkouts: m.canViewAllWorkouts,
        user: m.users_team_members_userIdTousers as any,
      })),
    })) as Team[];
  }

  static async updateTeam(teamId: string, updates: UpdateTeamRequest): Promise<Team> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.visibility !== undefined) updateData.visibility = updates.visibility;
    if (updates.maxMembers !== undefined) updateData.maxMembers = updates.maxMembers;
    if (updates.aestheticSettings !== undefined) updateData.aestheticSettings = updates.aestheticSettings;
    if (updates.spotifyPlaylistUrl !== undefined) updateData.spotifyPlaylistUrl = updates.spotifyPlaylistUrl;
    if (updates.allowComments !== undefined) updateData.allowComments = updates.allowComments;
    if (updates.allowMemberInvites !== undefined) updateData.allowMemberInvites = updates.allowMemberInvites;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    updateData.updatedAt = new Date();

    const team = await prisma.teams.update({
      where: { id: teamId },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            trainerVerified: true
          }
        },
        team_members: {
          where: { status: 'ACTIVE' },
          include: {
            users_team_members_userIdTousers: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          }
        }
      }
    });

    return team as any;
  }

  static async deleteTeam(teamId: string): Promise<void> {
    // Soft delete - set isActive to false
    await prisma.teams.update({
      where: { id: teamId },
      data: { isActive: false }
    });
  }

  static async discoverTeams(filters: TeamDiscoveryFilters, page = 1, limit = 20): Promise<{ teams: Team[], total: number }> {
    const where: any = {
      isActive: true,
      visibility: 'PUBLIC'
    };

    // Apply type filter
    if (filters.type && filters.type.length > 0) {
      where.type = { in: filters.type };
    }

    // Apply trainer verified filter
    if (filters.trainerVerified) {
      where.users = {
        trainerVerified: true
      };
    }

    // Apply available spots filter - this will be filtered in application logic
    // Note: Prisma doesn't support field references in queries
    // This would need to be done with raw SQL or filtered after fetching

    // Apply search query
    if (filters.searchQuery) {
      where.OR = [
        { name: { contains: filters.searchQuery, mode: 'insensitive' } },
        { description: { contains: filters.searchQuery, mode: 'insensitive' } }
      ];
    }

    const [teams] = await Promise.all([
      prisma.teams.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              trainerVerified: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.teams.count({ where })
    ]);

    // Filter teams with available spots if requested
    let filteredTeams = teams as any[];
    if (filters.hasSpots) {
      filteredTeams = teams.filter((team: any) => team.memberCount < team.maxMembers);
    }

    return { teams: filteredTeams, total: filteredTeams.length };
  }
}

export class TeamMembershipService {
  static async applyToJoinTeam(teamId: string, userId: string, message?: string): Promise<TeamApplication> {
    // Check if user already has a pending or approved application
    const existingApplication = await prisma.team_applications.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    if (existingApplication) {
      throw new Error('You already have an application for this team');
    }

    // Check if user is already a member
    const existingMember = await prisma.team_members.findFirst({
      where: {
        teamId,
        userId,
        status: 'ACTIVE'
      }
    });

    if (existingMember) {
      throw new Error('You are already a member of this team');
    }

    const application = await prisma.team_applications.create({
      data: {
        id: crypto.randomUUID(),
        teamId,
        userId,
        message: message ?? null,
        status: 'PENDING',
        appliedAt: new Date()
      },
      include: {
        teams: true,
        users_team_applications_userIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      }
    });

    return application as any;
  }

  static async inviteToTeam(teamId: string, userId: string, invitedBy: string): Promise<TeamMember> {
    // Check if user is already a member
    const existingMember = await prisma.team_members.findFirst({
      where: {
        teamId,
        userId
      }
    });

    if (existingMember) {
      throw new Error('User is already a member of this team');
    }

    // Check team capacity
    const team = await prisma.teams.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.memberCount >= team.maxMembers) {
      throw new Error('Team is full');
    }

    // Create member
    const member = await prisma.team_members.create({
      data: {
        id: crypto.randomUUID(),
        teamId,
        userId,
        invitedBy,
        status: 'ACTIVE',
        joinedAt: new Date(),
        canInviteOthers: false,
        canComment: true,
        canViewAllWorkouts: true
      },
      include: {
        users_team_members_userIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      }
    });

    // Update team member count
    await prisma.teams.update({
      where: { id: teamId },
      data: {
        memberCount: {
          increment: 1
        }
      }
    });

    return member as any;
  }

  static async acceptTeamApplication(applicationId: string, reviewerId: string): Promise<void> {
    const application = await prisma.team_applications.findUnique({
      where: { id: applicationId },
      include: { teams: true }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'PENDING') {
      throw new Error('Application has already been reviewed');
    }

    // Check team capacity
    if (application.teams.memberCount >= application.teams.maxMembers) {
      throw new Error('Team is full');
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction([
      // Update application
      prisma.team_applications.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: reviewerId
        }
      }),
      // Create team member
      prisma.team_members.create({
        data: {
          id: crypto.randomUUID(),
          teamId: application.teamId,
          userId: application.userId,
          status: 'ACTIVE',
          joinedAt: new Date(),
          canInviteOthers: false,
          canComment: true,
          canViewAllWorkouts: true
        }
      }),
      // Update team member count
      prisma.teams.update({
        where: { id: application.teamId },
        data: {
          memberCount: {
            increment: 1
          }
        }
      })
    ]);
  }

  static async rejectTeamApplication(applicationId: string, reviewerId: string, reason?: string): Promise<void> {
    const application = await prisma.team_applications.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'PENDING') {
      throw new Error('Application has already been reviewed');
    }

    await prisma.team_applications.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        rejectionReason: reason ?? null
      }
    });
  }

  static async removeMemberFromTeam(teamId: string, userId: string): Promise<void> {
    const member = await prisma.team_members.findFirst({
      where: {
        teamId,
        userId,
        status: 'ACTIVE'
      }
    });

    if (!member) {
      throw new Error('Member not found');
    }

    // Use transaction
    await prisma.$transaction([
      // Update member status
      prisma.team_members.update({
        where: { id: member.id },
        data: {
          status: 'KICKED',
          leftAt: new Date()
        }
      }),
      // Update team member count
      prisma.teams.update({
        where: { id: teamId },
        data: {
          memberCount: {
            decrement: 1
          }
        }
      })
    ]);
  }

  static async leaveTeam(teamId: string, userId: string): Promise<void> {
    const member = await prisma.team_members.findFirst({
      where: {
        teamId,
        userId,
        status: 'ACTIVE'
      }
    });

    if (!member) {
      throw new Error('You are not a member of this team');
    }

    // Use transaction
    await prisma.$transaction([
      // Update member status
      prisma.team_members.update({
        where: { id: member.id },
        data: {
          status: 'LEFT',
          leftAt: new Date()
        }
      }),
      // Update team member count
      prisma.teams.update({
        where: { id: teamId },
        data: {
          memberCount: {
            decrement: 1
          }
        }
      })
    ]);
  }

  static async getTeamApplications(teamId: string): Promise<TeamApplication[]> {
    const applications = await prisma.team_applications.findMany({
      where: {
        teamId,
        status: 'PENDING'
      },
      include: {
        users_team_applications_userIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });

    return applications as any[];
  }
}

export class TeamMessagingService {
  static async sendTeamMessage(
    teamId: string,
    userId: string,
    content: string,
    type: TeamMessageType = 'TEXT',
    mediaUrl?: string,
    linkedExerciseId?: string,
    linkedWorkoutLogId?: string,
    linkedSocialMediaUrl?: string
  ): Promise<TeamMessage> {
    const message = await prisma.team_messages.create({
      data: {
        id: crypto.randomUUID(),
        teamId,
        userId,
        content,
        type,
        mediaUrl: mediaUrl ?? null,
        linkedExerciseId: linkedExerciseId ?? null,
        linkedWorkoutLogId: linkedWorkoutLogId ?? null,
        linkedSocialMediaUrl: linkedSocialMediaUrl ?? null,
        isDeleted: false,
        createdAt: new Date()
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      }
    });

    return message as any;
  }

  static async replyToMessage(messageId: string, userId: string, content: string): Promise<any> {
    const reply = await prisma.team_message_replies.create({
      data: {
        id: crypto.randomUUID(),
        messageId,
        userId,
        content,
        createdAt: new Date()
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      }
    });

    return reply;
  }

  static async getTeamMessages(teamId: string, page = 1, limit = 50): Promise<TeamMessage[]> {
    const messages = await prisma.team_messages.findMany({
      where: {
        teamId,
        isDeleted: false
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        team_message_replies: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    return messages as any[];
  }
}

export class TeamWorkoutService {
  static async createTeamWorkout(
    teamId: string,
    createdBy: string,
    workoutData: {
      title: string;
      description?: string;
      date: Date;
      duration?: number;
      exercises: {
        exerciseId: string;
        order: number;
        sets: number;
        reps: string;
        weight?: string;
        restSeconds?: number;
        notes?: string;
        instagramUrl?: string;
        tiktokUrl?: string;
        instructionalVideoUrl?: string;
      }[];
      allowComments?: boolean;
      isTemplate?: boolean;
    }
  ): Promise<TeamWorkoutLog> {
    const workout = await prisma.team_workout_logs.create({
      data: {
        id: crypto.randomUUID(),
        teamId,
        createdBy,
        title: workoutData.title,
        description: workoutData.description ?? null,
        date: workoutData.date,
        duration: workoutData.duration ?? null,
        allowComments: workoutData.allowComments ?? true,
        isTemplate: workoutData.isTemplate ?? false,
        updatedAt: new Date(),
        team_workout_exercises: {
          create: workoutData.exercises.map(ex => ({
            id: crypto.randomUUID(),
            exercises: {
              connect: { id: ex.exerciseId }
            },
            order: ex.order,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight ?? null,
            restSeconds: ex.restSeconds ?? null,
            notes: ex.notes ?? null,
            instagramUrl: ex.instagramUrl ?? null,
            tiktokUrl: ex.tiktokUrl ?? null,
            instructionalVideoUrl: ex.instructionalVideoUrl ?? null
          }))
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        team_workout_exercises: {
          include: {
            exercises: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        team_workout_comments: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        team_workout_completions: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          }
        }
      }
    });

    return workout as any;
  }

  static async completeTeamWorkout(workoutLogId: string, userId: string, duration?: number, notes?: string): Promise<any> {
    // Check if already completed
    const existing = await prisma.team_workout_completions.findUnique({
      where: {
        workoutLogId_userId: {
          workoutLogId,
          userId
        }
      }
    });

    if (existing) {
      throw new Error('You have already completed this workout');
    }

    const completion = await prisma.team_workout_completions.create({
      data: {
        id: crypto.randomUUID(),
        workoutLogId,
        userId,
        completedAt: new Date(),
        duration: duration ?? null,
        notes: notes ?? null
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      }
    });

    return completion;
  }

  static async commentOnWorkout(workoutLogId: string, userId: string, content: string): Promise<any> {
    const comment = await prisma.team_workout_comments.create({
      data: {
        id: crypto.randomUUID(),
        workoutLogId,
        userId,
        content,
        createdAt: new Date()
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      }
    });

    return comment;
  }

  static async getTeamWorkouts(teamId: string, page = 1, limit = 20): Promise<TeamWorkoutLog[]> {
    const workouts = await prisma.team_workout_logs.findMany({
      where: {
        teamId
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        team_workout_exercises: {
          include: {
            exercises: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        team_workout_comments: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        team_workout_completions: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    return workouts as any[];
  }
}

// Team Email Invitation Service
export class TeamInvitationService {
  /**
   * Create and send an email invitation to join a team
   */
  static async sendEmailInvitation(params: {
    teamId: string;
    invitedBy: string;
    email: string;
    message?: string;
  }): Promise<{ success: boolean; invite?: any; error?: string }> {
    try {
      // Import email service
      const { sendTeamInvitationEmail, isValidEmail, isEmailServiceConfigured } = await import('@/services/email/email_service');

      if (!isEmailServiceConfigured()) {
        console.warn('[TeamInvitationService] Email service not configured - RESEND_API_KEY and EMAIL_FROM are required');
        return { success: false, error: 'Email invitations are temporarily unavailable. Please use the User ID invitation method or contact support.' };
      }

      // Validate email format
      if (!isValidEmail(params.email)) {
        return { success: false, error: 'Invalid email address' };
      }

      // Get team details
      const team = await prisma.teams.findUnique({
        where: { id: params.teamId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!team) {
        return { success: false, error: 'Team not found' };
      }

      // Check if user is already invited or a member
      const existingInvite = await prisma.team_invites.findFirst({
        where: {
          teamId: params.teamId,
          email: params.email,
          status: { in: ['PENDING', 'ACCEPTED'] }
        }
      });

      if (existingInvite) {
        if (existingInvite.status === 'ACCEPTED') {
          return { success: false, error: 'User already accepted invitation' };
        }
        return { success: false, error: 'User already has a pending invitation' };
      }

      // Check if email belongs to existing user who is already a member
      const existingUser = await prisma.users.findUnique({
        where: { email: params.email }
      });

      if (existingUser) {
        const existingMember = await prisma.team_members.findFirst({
          where: {
            teamId: params.teamId,
            userId: existingUser.id,
            status: 'ACTIVE'
          }
        });

        if (existingMember) {
          return { success: false, error: 'User is already a team member' };
        }
      }

      // Create invitation with 7-day expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invite = await prisma.team_invites.create({
        data: {
          id: crypto.randomUUID(),
          teamId: params.teamId,
          email: params.email,
          invitedBy: params.invitedBy,
          status: 'PENDING',
          message: params.message ?? null,
          token: crypto.randomUUID(),
          expiresAt,
          createdAt: new Date()
        },
        include: {
          teams: true,
          inviter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Send email invitation
      const emailResult = await sendTeamInvitationEmail({
        to: params.email,
        teamName: team.name,
        trainerName: invite.inviter.name || 'Your trainer',
        inviteToken: invite.token,
        ...(params.message && { message: params.message }),
        expiresAt
      });

      if (!emailResult.success) {
        // Delete invite if email failed
        await prisma.team_invites.delete({ where: { id: invite.id } });
        return { success: false, error: 'Failed to send invitation email' };
      }

      return { success: true, invite };
    } catch (error: any) {
      console.error('[TeamInvitationService] Error sending email invitation:', error);
      return { success: false, error: error.message || 'Failed to send invitation' };
    }
  }

  /**
   * Get invitation by token
   */
  static async getInvitationByToken(token: string): Promise<any> {
    const invite = await prisma.team_invites.findUnique({
      where: { token },
      include: {
        teams: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        inviter: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return invite;
  }

  /**
   * Accept team invitation
   */
  static async acceptInvitation(params: {
    token: string;
    userId: string;
  }): Promise<{ success: boolean; member?: any; error?: string }> {
    try {
      const invite = await prisma.team_invites.findUnique({
        where: { token: params.token },
        include: { teams: true }
      });

      if (!invite) {
        return { success: false, error: 'Invitation not found' };
      }

      if (invite.status !== 'PENDING') {
        return { success: false, error: 'Invitation is no longer valid' };
      }

      if (new Date() > invite.expiresAt) {
        await prisma.team_invites.update({
          where: { id: invite.id },
          data: { status: 'EXPIRED' }
        });
        return { success: false, error: 'Invitation has expired' };
      }

      // Check if team has available spots
      if (invite.teams.memberCount >= invite.teams.maxMembers) {
        return { success: false, error: 'Team is full' };
      }

      // Check if user is already a member
      const existingMember = await prisma.team_members.findFirst({
        where: {
          teamId: invite.teamId,
          userId: params.userId,
          status: 'ACTIVE'
        }
      });

      if (existingMember) {
        await prisma.team_invites.update({
          where: { id: invite.id },
          data: { status: 'ACCEPTED', acceptedAt: new Date() }
        });
        return { success: false, error: 'You are already a team member' };
      }

      // Use transaction to create member and update invite
      const result = await prisma.$transaction(async (tx) => {
        // Create team member
        const member = await tx.team_members.create({
          data: {
            id: crypto.randomUUID(),
            teamId: invite.teamId,
            userId: params.userId,
            status: 'ACTIVE',
            invitedBy: invite.invitedBy,
            joinedAt: new Date(),
            canInviteOthers: false,
            canComment: true,
            canViewAllWorkouts: true
          },
          include: {
            users_team_members_userIdTousers: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        });

        // Update invitation status
        await tx.team_invites.update({
          where: { id: invite.id },
          data: { status: 'ACCEPTED', acceptedAt: new Date() }
        });

        // Increment team member count
        await tx.teams.update({
          where: { id: invite.teamId },
          data: { memberCount: { increment: 1 } }
        });

        return member;
      });

      return { success: true, member: result };
    } catch (error: any) {
      console.error('[TeamInvitationService] Error accepting invitation:', error);
      return { success: false, error: error.message || 'Failed to accept invitation' };
    }
  }

  /**
   * Cancel/revoke an invitation
   */
  static async cancelInvitation(inviteId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const invite = await prisma.team_invites.findUnique({
        where: { id: inviteId },
        include: { teams: true }
      });

      if (!invite) {
        return { success: false, error: 'Invitation not found' };
      }

      // Only the inviter or team trainer can cancel
      if (invite.invitedBy !== userId && invite.teams.trainerId !== userId) {
        return { success: false, error: 'You cannot cancel this invitation' };
      }

      if (invite.status !== 'PENDING') {
        return { success: false, error: 'Cannot cancel a non-pending invitation' };
      }

      await prisma.team_invites.update({
        where: { id: inviteId },
        data: { status: 'CANCELLED' }
      });

      return { success: true };
    } catch (error: any) {
      console.error('[TeamInvitationService] Error cancelling invitation:', error);
      return { success: false, error: error.message || 'Failed to cancel invitation' };
    }
  }

  /**
   * Get all pending invitations for a team
   */
  static async getTeamInvitations(teamId: string, status?: string): Promise<any[]> {
    const where: any = { teamId };
    if (status) {
      where.status = status;
    }

    const invitations = await prisma.team_invites.findMany({
      where,
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return invitations;
  }

  /**
   * Create a shareable invite link (no email required)
   * This creates a team_invite record that can be shared via any channel
   */
  static async createShareableInviteLink(params: {
    teamId: string;
    invitedBy: string;
    expiresInDays?: number;
  }): Promise<{ success: boolean; invite?: any; inviteUrl?: string; error?: string }> {
    try {
      // Get team details
      const team = await prisma.teams.findUnique({
        where: { id: params.teamId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!team) {
        return { success: false, error: 'Team not found' };
      }

      // Check team capacity
      if (team.memberCount >= team.maxMembers) {
        return { success: false, error: 'Team is full' };
      }

      // Create invitation with configurable expiration (default 30 days for shareable links)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (params.expiresInDays || 30));

      const token = crypto.randomUUID();
      const invite = await prisma.team_invites.create({
        data: {
          id: crypto.randomUUID(),
          teamId: params.teamId,
          email: `link-invite-${token.substring(0, 8)}@shareable.massimino.app`, // Placeholder for link invites
          invitedBy: params.invitedBy,
          status: 'PENDING',
          message: null,
          token,
          expiresAt,
          createdAt: new Date()
        },
        include: {
          teams: true,
          inviter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/team_invite/${invite.token}`;

      return { success: true, invite, inviteUrl };
    } catch (error: any) {
      console.error('[TeamInvitationService] Error creating shareable invite link:', error);
      return { success: false, error: error.message || 'Failed to create invite link' };
    }
  }

  /**
   * Resend invitation email
   */
  static async resendInvitation(inviteId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { sendTeamInvitationEmail } = await import('@/services/email/email_service');

      const invite = await prisma.team_invites.findUnique({
        where: { id: inviteId },
        include: {
          teams: true,
          inviter: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!invite) {
        return { success: false, error: 'Invitation not found' };
      }

      if (invite.status !== 'PENDING') {
        return { success: false, error: 'Can only resend pending invitations' };
      }

      if (new Date() > invite.expiresAt) {
        return { success: false, error: 'Invitation has expired' };
      }

      const emailResult = await sendTeamInvitationEmail({
        to: invite.email,
        teamName: invite.teams.name,
        trainerName: invite.inviter.name || 'Your trainer',
        inviteToken: invite.token,
        ...(invite.message && { message: invite.message }),
        expiresAt: invite.expiresAt
      });

      if (!emailResult.success) {
        return { success: false, error: 'Failed to resend invitation email' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[TeamInvitationService] Error resending invitation:', error);
      return { success: false, error: error.message || 'Failed to resend invitation' };
    }
  }
}

export class TeamBusinessLogic {
  static validateTeamCreation(teamData: CreateTeamRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate name
    if (!teamData.name || teamData.name.length < TEAM_VALIDATION_RULES.name.minLength) {
      errors.push(`Team name must be at least ${TEAM_VALIDATION_RULES.name.minLength} characters`);
    }
    if (teamData.name && teamData.name.length > TEAM_VALIDATION_RULES.name.maxLength) {
      errors.push(`Team name must be no more than ${TEAM_VALIDATION_RULES.name.maxLength} characters`);
    }
    if (teamData.name && !TEAM_VALIDATION_RULES.name.pattern.test(teamData.name)) {
      errors.push('Team name contains invalid characters');
    }

    // Validate description
    if (teamData.description && teamData.description.length > TEAM_VALIDATION_RULES.description.maxLength) {
      errors.push(`Description must be no more than ${TEAM_VALIDATION_RULES.description.maxLength} characters`);
    }

    // Validate maxMembers
    if (teamData.maxMembers < TEAM_VALIDATION_RULES.maxMembers.min) {
      errors.push(`Team must allow at least ${TEAM_VALIDATION_RULES.maxMembers.min} members`);
    }
    if (teamData.maxMembers > TEAM_VALIDATION_RULES.maxMembers.max) {
      errors.push(`Team cannot exceed ${TEAM_VALIDATION_RULES.maxMembers.max} members`);
    }

    // Validate Spotify URL
    if (teamData.spotifyPlaylistUrl) {
      try {
        new URL(teamData.spotifyPlaylistUrl);
        if (!teamData.spotifyPlaylistUrl.includes('spotify.com')) {
          errors.push('Spotify playlist URL must be a valid Spotify URL');
        }
      } catch {
        errors.push('Invalid Spotify playlist URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static async canTrainerCreateTeam(_trainerId: string): Promise<{ canCreate: boolean; reason?: string }> {
    // Placeholder implementation
    return { canCreate: true };
  }

  static async canUserJoinTeam(_teamId: string, _userId: string): Promise<{ canJoin: boolean; reason?: string }> {
    // Placeholder implementation
    return { canJoin: false, reason: 'Team functionality not available until database migration is complete' };
  }

  static async validateTeamRequirements(_teamId: string): Promise<{ isValid: boolean; issues: string[] }> {
    // Placeholder implementation
    return { isValid: false, issues: ['Team functionality not available until database migration is complete'] };
  }
}

// Main team service export
export const TeamService = {
  // Repository operations
  create: TeamRepository.createTeam,
  getById: TeamRepository.getTeamById,
  getTrainerTeams: TeamRepository.getTrainerTeams,
  update: TeamRepository.updateTeam,
  delete: TeamRepository.deleteTeam,
  discover: TeamRepository.discoverTeams,

  // Membership operations
  applyToJoin: TeamMembershipService.applyToJoinTeam,
  invite: TeamMembershipService.inviteToTeam,
  acceptApplication: TeamMembershipService.acceptTeamApplication,
  rejectApplication: TeamMembershipService.rejectTeamApplication,
  removeMember: TeamMembershipService.removeMemberFromTeam,
  leave: TeamMembershipService.leaveTeam,
  getApplications: TeamMembershipService.getTeamApplications,

  // Messaging operations
  sendMessage: TeamMessagingService.sendTeamMessage,
  replyToMessage: TeamMessagingService.replyToMessage,
  getMessages: TeamMessagingService.getTeamMessages,

  // Workout operations
  createWorkout: TeamWorkoutService.createTeamWorkout,
  completeWorkout: TeamWorkoutService.completeTeamWorkout,
  commentOnWorkout: TeamWorkoutService.commentOnWorkout,
  getWorkouts: TeamWorkoutService.getTeamWorkouts,

  // Business logic
  validateCreation: TeamBusinessLogic.validateTeamCreation,
  canTrainerCreate: TeamBusinessLogic.canTrainerCreateTeam,
  canUserJoin: TeamBusinessLogic.canUserJoinTeam,
  validateRequirements: TeamBusinessLogic.validateTeamRequirements,

  // Utility functions
  canManage: canManageTeam,
  isMember: isTeamMember,
  hasSpots: hasAvailableSpots
};

// ============================================================================
// UNIFIED WORKOUT SYSTEM - Migration Functions
// ============================================================================

/**
 * Migrate existing team workouts to the unified workout_log_entries system
 * This creates individual entries in workout_log_entries for each set in team workouts
 */
export async function migrateTeamWorkoutsToUnified() {
  console.log('Starting team workout migration to unified system...')

  const oldWorkouts = await prisma.team_workout_logs.findMany({
    include: {
      team_workout_exercises: true
    },
    where: {
      // Don't re-migrate already processed workouts
      workout_log_entries: {
        none: {}
      }
    }
  })

  let migratedCount = 0
  let entryCount = 0

  for (const oldWorkout of oldWorkouts) {
    for (const exercise of oldWorkout.team_workout_exercises) {
      const setsCount = exercise.sets || 1

      for (let setNum = 1; setNum <= setsCount; setNum++) {
        await prisma.workout_log_entries.create({
          data: {
            id: crypto.randomUUID(),
            userId: oldWorkout.createdBy,
            exerciseId: exercise.exerciseId,
            date: oldWorkout.date,
            order: exercise.order?.toString() || '0',
            setNumber: setNum,
            setType: 'STRAIGHT',
            reps: parseInt(exercise.reps),
            weight: exercise.weight || '',
            unit: 'KG',
            restSeconds: exercise.restSeconds,
            trainingVolume: (exercise.weight ? parseFloat(exercise.weight) : 0) * parseInt(exercise.reps),
            userComments: exercise.notes,
            allowComments: oldWorkout.allowComments,
            teamWorkoutId: oldWorkout.id,
            isTeamWorkout: true,
            workoutTitle: oldWorkout.title,
            workoutDescription: oldWorkout.description,
            instructionalVideoUrl: exercise.instructionalVideoUrl,
            instagramUrl: exercise.instagramUrl,
            tiktokUrl: exercise.tiktokUrl,
            createdAt: oldWorkout.createdAt,
            updatedAt: oldWorkout.updatedAt,
          }
        })
        entryCount++
      }
    }
    migratedCount++
  }

  return {
    migratedWorkouts: migratedCount,
    createdEntries: entryCount
  }
}

/**
 * Get migration status for admin dashboard
 */
export async function getMigrationStatus() {
  const [oldCount, migratedCount] = await Promise.all([
    prisma.team_workout_logs.count(),
    prisma.workout_log_entries.count({
      where: { isTeamWorkout: true }
    })
  ])

  return {
    oldTeamWorkoutsCount: oldCount,
    migratedCount: Math.floor(migratedCount / 3), // Approx (assuming avg 3 sets)
    totalEntriesCreated: migratedCount
  }
}

/**
 * Create team workout in unified system
 * Creates workout_log_entries directly instead of using old team_workout_logs table
 */
export async function createTeamWorkoutUnified(params: {
  teamId: string
  trainerId: string
  title: string
  description?: string
  date: Date
  exercises: Array<{
    exerciseId: string
    order: number
    sets: number
    reps: number
    weight?: string
    unit?: string
    restSeconds?: number
    tempo?: string
    intensity?: number
    intensityType?: string
    notes?: string
    instructionalVideoUrl?: string
    instagramUrl?: string
    tiktokUrl?: string
  }>
  allowComments?: boolean
}) {
  const {
    teamId,
    trainerId,
    title,
    description,
    date,
    exercises,
    allowComments = true
  } = params

  // Verify trainer owns the team
  const team = await prisma.teams.findFirst({
    where: {
      id: teamId,
      trainerId,
      isActive: true
    }
  })

  if (!team) {
    throw new Error('Team not found or trainer does not have permission')
  }

  // Create workout log entries for each exercise and set
  const createdEntries: any[] = []

  for (const exercise of exercises) {
    const setsCount = exercise.sets || 1

    for (let setNum = 1; setNum <= setsCount; setNum++) {
      const entry = await prisma.workout_log_entries.create({
        data: {
          id: crypto.randomUUID(),
          userId: trainerId,
          exerciseId: exercise.exerciseId,
          date: date,
          order: exercise.order.toString(),
          setNumber: setNum,
          setType: 'STRAIGHT',
          reps: exercise.reps,
          weight: exercise.weight || '0',
          unit: (exercise.unit || 'KG') as any,
          restSeconds: exercise.restSeconds ?? null,
          tempo: exercise.tempo ?? null,
          intensity: exercise.intensity?.toString() ?? null,
          intensityType: (exercise.intensityType as any) ?? null,
          trainingVolume: parseFloat(exercise.weight || '0') * exercise.reps,
          userComments: exercise.notes ?? null,
          allowComments,
          // Team workout specific fields
          teamWorkoutId: teamId,
          isTeamWorkout: true,
          workoutTitle: title,
          workoutDescription: description ?? null,
          instructionalVideoUrl: exercise.instructionalVideoUrl ?? null,
          instagramUrl: exercise.instagramUrl ?? null,
          tiktokUrl: exercise.tiktokUrl ?? null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      createdEntries.push(entry)
    }

    // Update exercise usage count
    await prisma.exercises.update({
      where: { id: exercise.exerciseId },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      }
    })
  }

  return {
    success: true,
    teamId,
    workoutTitle: title,
    entriesCreated: createdEntries.length,
    entries: createdEntries
  }
}
