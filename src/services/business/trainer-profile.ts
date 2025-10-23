/**
 * Trainer Profile Service - Business Logic for Trainer Profiles
 * Handles trainer profile creation, management, and business operations
 */

import { prisma } from '@/core/database';
import {
  trainer_profiles,
  users,
  UserRole,
  trainer_clients,
  ClientStatus
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTrainerProfileData {
  userId: string;
  businessName?: string;
  businessDescription?: string;
  hourlyRate?: number;
  currency?: string;
  taxId?: string;
  businessAddress?: any;
  certifications?: any[];
  specializations?: string[];
  experienceYears?: number;
  languages?: string[];
  availableHours?: any;
  timezone?: string;
}

export interface UpdateTrainerProfileData extends Partial<CreateTrainerProfileData> {
  isVerified?: boolean;
  verificationLevel?: string;
}

export interface TrainerProfileWithStats extends trainer_profiles {
  user: Pick<users, 'id' | 'name' | 'email' | 'image' | 'role'>;
  _count: {
    trainer_clients: number;
    appointments: number;
    trainer_reviews: number;
  };
  averageRating: number;
  monthlyEarnings: number;
  activeClients: number;
}

export interface ClientManagementData {
  clientId: string;
  packageId?: string;
  monthlyRate?: number;
  goals?: string[];
  notes?: string;
  emergencyContact?: any;
  medicalConditions?: string[];
  preferences?: any;
}

// ============================================================================
// TRAINER PROFILE MANAGEMENT
// ============================================================================

/**
 * Create a new trainer profile
 */
export async function createTrainerProfile(data: CreateTrainerProfileData): Promise<trainer_profiles> {
  try {
    // Validate user exists and is a trainer
    const user = await prisma.users.findUnique({
      where: { id: data.userId },
      select: { id: true, role: true, email: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== UserRole.TRAINER) {
      throw new Error('User must be a trainer to create trainer profile');
    }

    // Check if profile already exists
    const existingProfile = await prisma.trainer_profiles.findUnique({
      where: { userId: data.userId }
    });

    if (existingProfile) {
      throw new Error('Trainer profile already exists for this user');
    }

    // Create trainer profile
    const trainerProfile = await prisma.trainer_profiles.create({
      data: {
        id: crypto.randomUUID(),
        userId: data.userId,
        businessName: data.businessName ?? null,
        businessDescription: data.businessDescription ?? null,
        hourlyRate: data.hourlyRate ?? null,
        currency: data.currency || 'USD',
        taxId: data.taxId ?? null,
        businessAddress: data.businessAddress ?? {},
        certifications: data.certifications || [],
        specializations: data.specializations || [],
        experienceYears: data.experienceYears || 0,
        languages: data.languages || ['English'],
        availableHours: data.availableHours ?? {},
        timezone: data.timezone || 'UTC',
        updatedAt: new Date(),
      }
    });

    console.log('Trainer profile created:', {
      trainerId: trainerProfile.id,
      userId: data.userId,
      businessName: trainerProfile.businessName
    });

    return trainerProfile;

  } catch (error) {
    console.error('Error creating trainer profile:', error);
    throw error;
  }
}

/**
 * Get trainer profile with comprehensive stats
 */
export async function getTrainerProfileWithStats(userId: string): Promise<TrainerProfileWithStats | null> {
  try {
    const profile = await prisma.trainer_profiles.findUnique({
      where: { userId },
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
        _count: {
          select: {
            trainer_clients: {
              where: { status: ClientStatus.ACTIVE }
            },
            appointments: true,
            trainer_reviews: true
          }
        }
      }
    });

    if (!profile) {
      return null;
    }

    // Calculate additional stats
    const [ratingStats, earningsStats, activeClients] = await Promise.all([
      // Average rating
      prisma.trainer_reviews.aggregate({
        where: { trainerId: profile.id },
        _avg: { rating: true }
      }),

      // Monthly earnings
      prisma.payments.aggregate({
        where: {
          trainerId: profile.id,
          status: 'COMPLETED',
          paymentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { trainerEarnings: true }
      }),

      // Active clients count
      prisma.trainer_clients.count({
        where: {
          trainerId: profile.id,
          status: ClientStatus.ACTIVE
        }
      })
    ]);

    return {
      ...profile,
      user: profile.users,
      averageRating: ratingStats._avg.rating || 0,
      monthlyEarnings: earningsStats._sum.trainerEarnings || 0,
      activeClients
    } as any;

  } catch (error) {
    console.error('Error getting trainer profile with stats:', error);
    throw error;
  }
}

/**
 * Update trainer profile
 */
export async function updateTrainerProfile(
  userId: string,
  data: UpdateTrainerProfileData
): Promise<trainer_profiles> {
  try {
    const profile = await prisma.trainer_profiles.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('Trainer profile not found');
    }

    const updatedProfile = await prisma.trainer_profiles.update({
      where: { userId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    console.log('Trainer profile updated:', {
      trainerId: profile.id,
      userId,
      changes: Object.keys(data)
    });

    return updatedProfile;

  } catch (error) {
    console.error('Error updating trainer profile:', error);
    throw error;
  }
}

// ============================================================================
// CLIENT MANAGEMENT
// ============================================================================

/**
 * Add a new client to trainer
 */
export async function addClientToTrainer(
  trainerId: string,
  data: ClientManagementData
): Promise<trainer_clients> {
  try {
    // Validate trainer profile exists
    const trainerProfile = await prisma.trainer_profiles.findUnique({
      where: { id: trainerId }
    });

    if (!trainerProfile) {
      throw new Error('Trainer profile not found');
    }

    // Validate client exists
    const client = await prisma.users.findUnique({
      where: { id: data.clientId },
      select: { id: true, role: true, email: true }
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Check if relationship already exists
    const existingRelationship = await prisma.trainer_clients.findUnique({
      where: {
        trainerId_clientId: {
          trainerId,
          clientId: data.clientId
        }
      }
    });

    if (existingRelationship) {
      throw new Error('Client is already associated with this trainer');
    }

    // Create trainer-client relationship
    const trainerClient = await prisma.trainer_clients.create({
      data: {
        id: crypto.randomUUID(),
        trainerId,
        clientId: data.clientId,
        packageId: data.packageId ?? null,
        monthlyRate: data.monthlyRate ?? null,
        goals: data.goals || [],
        notes: data.notes ?? null,
        emergencyContact: data.emergencyContact ?? null,
        medicalConditions: data.medicalConditions || [],
        preferences: data.preferences || {},
        status: ClientStatus.ACTIVE,
        updatedAt: new Date(),
      }
    });

    // Update trainer's active client count
    await prisma.trainer_profiles.update({
      where: { id: trainerId },
      data: {
        activeClients: {
          increment: 1
        },
        totalClients: {
          increment: 1
        }
      }
    });

    console.log('Client added to trainer:', {
      trainerId,
      clientId: data.clientId,
      relationshipId: trainerClient.id
    });

    return trainerClient;

  } catch (error) {
    console.error('Error adding client to trainer:', error);
    throw error;
  }
}

/**
 * Get trainer's clients with filtering and pagination
 */
export async function getTrainerClients(
  trainerId: string,
  options: {
    status?: ClientStatus;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  clients: (trainer_clients & {
    client: Pick<users, 'id' | 'name' | 'email' | 'image'>;
    _count: {
      appointments: number;
      progress_reports: number;
    };
  })[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const { status, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      trainerId,
      ...(status && { status }),
      ...(search && {
        client: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      })
    };

    // Get clients with counts
    const [clients, total] = await Promise.all([
      prisma.trainer_clients.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          _count: {
            select: {
              appointments: true,
              progress_reports: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),

      prisma.trainer_clients.count({ where })
    ]);

    return {
      clients: clients.map(c => ({ ...c, client: c.users })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    } as any;

  } catch (error) {
    console.error('Error getting trainer clients:', error);
    throw error;
  }
}

/**
 * Update client relationship
 */
export async function updateTrainerClient(
  relationshipId: string,
  data: Partial<ClientManagementData & { status: ClientStatus }>
): Promise<trainer_clients> {
  try {
    const relationship = await prisma.trainer_clients.findUnique({
      where: { id: relationshipId }
    });

    if (!relationship) {
      throw new Error('Trainer-client relationship not found');
    }

    const updatedRelationship = await prisma.trainer_clients.update({
      where: { id: relationshipId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    // If status changed to inactive, update trainer's active client count
    if (data.status && data.status !== ClientStatus.ACTIVE && relationship.status === ClientStatus.ACTIVE) {
      await prisma.trainer_profiles.update({
        where: { id: relationship.trainerId },
        data: {
          activeClients: {
            decrement: 1
          }
        }
      });
    }

    // If status changed to active, update trainer's active client count
    if (data.status === ClientStatus.ACTIVE && relationship.status !== ClientStatus.ACTIVE) {
      await prisma.trainer_profiles.update({
        where: { id: relationship.trainerId },
        data: {
          activeClients: {
            increment: 1
          }
        }
      });
    }

    console.log('Trainer-client relationship updated:', {
      relationshipId,
      changes: Object.keys(data)
    });

    return updatedRelationship;

  } catch (error) {
    console.error('Error updating trainer-client relationship:', error);
    throw error;
  }
}

// ============================================================================
// TRAINER DASHBOARD STATS
// ============================================================================

/**
 * Get comprehensive trainer dashboard statistics
 */
export async function getTrainerDashboardStats(trainerId: string): Promise<{
  overview: {
    totalClients: number;
    activeClients: number;
    totalEarnings: number;
    monthlyEarnings: number;
    averageRating: number;
    totalReviews: number;
  };
  recentActivity: {
    upcomingAppointments: number;
    pendingReports: number;
    newClients: number;
    completedSessions: number;
  };
  trends: {
    clientGrowth: number;
    earningsGrowth: number;
    sessionCompletion: number;
  };
}> {
  try {
    const [
      trainerProfile,
      activeClientsCount,
      upcomingAppointments,
      pendingReports,
      newClientsThisMonth,
      completedSessionsThisMonth,
      lastMonthEarnings,
      lastMonthClients,
      sessionStats
    ] = await Promise.all([
      // Basic trainer profile
      prisma.trainer_profiles.findUnique({
        where: { id: trainerId },
        select: {
          totalClients: true,
          activeClients: true,
          totalEarnings: true,
          monthlyEarnings: true,
          trainerRating: true
        }
      }),

      // Active clients
      prisma.trainer_clients.count({
        where: { trainerId, status: ClientStatus.ACTIVE }
      }),

      // Upcoming appointments (next 7 days)
      prisma.appointments.count({
        where: {
          trainerId,
          scheduledAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          },
          status: { in: ['SCHEDULED', 'CONFIRMED'] }
        }
      }),

      // Pending progress reports
      prisma.progress_reports.count({
        where: {
          trainerId,
          isShared: false
        }
      }),

      // New clients this month
      prisma.trainer_clients.count({
        where: {
          trainerId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),

      // Completed sessions this month
      prisma.appointments.count({
        where: {
          trainerId,
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),

      // Last month's earnings for comparison
      prisma.payments.aggregate({
        where: {
          trainerId,
          status: 'COMPLETED',
          paymentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { trainerEarnings: true }
      }),

      // Last month's client count
      prisma.trainer_clients.count({
        where: {
          trainerId,
          createdAt: {
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),

      // Session completion stats
      prisma.appointments.groupBy({
        by: ['status'],
        where: {
          trainerId,
          scheduledAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _count: true
      })
    ]);

    if (!trainerProfile) {
      throw new Error('Trainer profile not found');
    }

    // Calculate review stats
    const reviewStats = await prisma.trainer_reviews.aggregate({
      where: { trainerId },
      _avg: { rating: true },
      _count: true
    });

    // Calculate trends
    const clientGrowth = lastMonthClients > 0
      ? ((activeClientsCount - lastMonthClients) / lastMonthClients) * 100
      : 100;

    const earningsGrowth = (lastMonthEarnings._sum.trainerEarnings || 0) > 0
      ? ((trainerProfile.monthlyEarnings - (lastMonthEarnings._sum.trainerEarnings || 0)) / (lastMonthEarnings._sum.trainerEarnings || 1)) * 100
      : 100;

    const totalSessions = sessionStats.reduce((sum: number, stat: { _count: number }) => sum + stat._count, 0);
    const completedSessions = sessionStats.find((stat: { status: string; _count: number }) => stat.status === 'COMPLETED')?._count || 0;
    const sessionCompletion = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    return {
      overview: {
        totalClients: trainerProfile.totalClients,
        activeClients: activeClientsCount,
        totalEarnings: trainerProfile.totalEarnings,
        monthlyEarnings: trainerProfile.monthlyEarnings,
        averageRating: reviewStats._avg.rating || 0,
        totalReviews: reviewStats._count
      },
      recentActivity: {
        upcomingAppointments,
        pendingReports,
        newClients: newClientsThisMonth,
        completedSessions: completedSessionsThisMonth
      },
      trends: {
        clientGrowth: Math.round(clientGrowth * 100) / 100,
        earningsGrowth: Math.round(earningsGrowth * 100) / 100,
        sessionCompletion: Math.round(sessionCompletion * 100) / 100
      }
    };

  } catch (error) {
    console.error('Error getting trainer dashboard stats:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  trainer_profiles as TrainerProfile,
  trainer_clients as TrainerClient,
  ClientStatus
};
