/**
 * Scheduling Service - Business Logic for Appointment Management
 * Handles appointment creation, scheduling, and calendar management
 */

import { prisma } from '@/core/database';
import {
  appointments,
  AppointmentStatus,
  AppointmentType,
  users,
  trainer_clients,
  workout_sessions,
} from '@prisma/client';
import { randomUUID } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateAppointmentData {
  trainerId: string;
  clientId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration?: number; // in minutes
  type?: AppointmentType;
  location?: string;
  isVirtual?: boolean;
  meetingLink?: string;
  price?: number;
  currency?: string;
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {
  status?: AppointmentStatus;
  trainerNotes?: string;
  clientNotes?: string;
  rating?: number;
  feedback?: string;
  cancellationReason?: string;
}

export interface AppointmentWithDetails extends appointments {
  trainer: {
    id: string;
    user: Pick<users, 'id' | 'name' | 'email' | 'image'>;
    businessName?: string | null;
  };
  client: Pick<users, 'id' | 'name' | 'email' | 'image'>;
  trainerClient?: Pick<trainer_clients, 'id' | 'goals' | 'preferences'>;
  workoutSession?: Pick<workout_sessions, 'id' | 'title' | 'isComplete'>;
}

export interface ScheduleAvailability {
  date: string;
  slots: {
    time: string;
    available: boolean;
    appointmentId?: string;
    type?: AppointmentType;
  }[];
}

export interface AppointmentFilters {
  status?: AppointmentStatus[];
  type?: AppointmentType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  clientId?: string;
  search?: string;
}

// ============================================================================
// APPOINTMENT MANAGEMENT
// ============================================================================

/**
 * Create a new appointment
 */
export async function createAppointment(data: CreateAppointmentData): Promise<appointments> {
  try {
    // Validate trainer profile exists
    const trainerProfile = await prisma.trainer_profiles.findUnique({
      where: { id: data.trainerId },
      select: { id: true, userId: true, hourlyRate: true, currency: true }
    });

    if (!trainerProfile) {
      throw new Error('Trainer profile not found');
    }

    // Validate client exists
    const client = await prisma.users.findUnique({
      where: { id: data.clientId },
      select: { id: true, email: true }
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Check for scheduling conflicts
    const conflictingAppointment = await checkSchedulingConflict(
      data.trainerId,
      data.scheduledAt,
      data.duration || 60
    );

    if (conflictingAppointment) {
      throw new Error('Appointment conflicts with existing booking');
    }

    // Get trainer-client relationship
    const trainerClient = await prisma.trainer_clients.findUnique({
      where: {
        trainerId_clientId: {
          trainerId: data.trainerId,
          clientId: data.clientId
        }
      }
    });

    // Calculate price (use provided price or trainer's hourly rate)
    const appointmentPrice = data.price ||
      (trainerProfile.hourlyRate ? (trainerProfile.hourlyRate * ((data.duration || 60) / 60)) : undefined);

    // Create appointment
    const appointment = await prisma.appointments.create({
      data: {
        id: randomUUID(),
        trainerId: data.trainerId,
        clientId: data.clientId,
        trainerClientId: trainerClient?.id ?? null,
        title: data.title,
        description: data.description ?? null,
        scheduledAt: data.scheduledAt,
        duration: data.duration || 60,
        type: data.type || AppointmentType.PERSONAL_TRAINING,
        location: data.location ?? null,
        isVirtual: data.isVirtual || false,
        meetingLink: data.meetingLink ?? null,
        price: appointmentPrice ?? null,
        currency: data.currency || trainerProfile.currency || 'USD',
        status: AppointmentStatus.SCHEDULED,
        updatedAt: new Date(),
      }
    });

    console.log('Appointment created:', {
      appointmentId: appointment.id,
      trainerId: data.trainerId,
      clientId: data.clientId,
      scheduledAt: data.scheduledAt
    });

    return appointment;

  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
}

/**
 * Get appointments with filtering and pagination
 */
export async function getAppointments(
  trainerId: string,
  filters: AppointmentFilters = {},
  options: {
    page?: number;
    limit?: number;
    sortBy?: 'scheduledAt' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{
  appointments: AppointmentWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const { page = 1, limit = 20, sortBy = 'scheduledAt', sortOrder = 'asc' } = options;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      trainerId,
      ...(filters.status && { status: { in: filters.status } }),
      ...(filters.type && { type: { in: filters.type } }),
      ...(filters.dateRange && {
        scheduledAt: {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      }),
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { users: { name: { contains: filters.search, mode: 'insensitive' } } },
          { users: { email: { contains: filters.search, mode: 'insensitive' } } }
        ]
      })
    };

    // Get appointments with details
    const [rows, total] = await Promise.all([
      prisma.appointments.findMany({
        where,
        include: {
          trainer_profiles: {
            include: {
              users: {
                select: { id: true, name: true, email: true, image: true }
              }
            }
          },
          users: {
            select: { id: true, name: true, email: true, image: true }
          },
          trainer_clients: {
            select: { id: true, goals: true, preferences: true }
          },
          workout_sessions: {
            select: { id: true, title: true, isComplete: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),

      prisma.appointments.count({ where })
    ]);

    const appointments: AppointmentWithDetails[] = rows.map((row: any) => ({
      ...row,
      trainer: {
        id: row.trainer_profiles?.id,
        user: row.trainer_profiles?.users,
        businessName: row.trainer_profiles?.businessName ?? null,
      },
      client: row.users,
      trainerClient: row.trainer_clients ?? undefined,
      workoutSession: row.workout_sessions ?? undefined,
    }));

    return {
      appointments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };

  } catch (error) {
    console.error('Error getting appointments:', error);
    throw error;
  }
}

/**
 * Update appointment
 */
export async function updateAppointment(
  appointmentId: string,
  data: UpdateAppointmentData,
  updatedBy: string
): Promise<appointments> {
  try {
    const appointment = await prisma.appointments.findUnique({ where: { id: appointmentId } });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Handle status changes
    const updateData: any = { ...data };

    if (data.status) {
      switch (data.status) {
        case AppointmentStatus.CANCELLED:
          updateData.cancelledAt = new Date();
          updateData.cancelledBy = updatedBy;
          if (data.cancellationReason) {
            updateData.cancellationReason = data.cancellationReason;
          }
          break;

        case AppointmentStatus.COMPLETED:
          updateData.completedAt = new Date();
          break;

        case AppointmentStatus.IN_PROGRESS:
          // Create workout session if it doesn't exist
          if (!appointment.workoutSessionId) {
            const workoutSession = await prisma.workout_sessions.create({
              data: {
                id: randomUUID(),
                userId: appointment.clientId,
                coachId: appointment.trainerId,
                date: new Date(appointment.scheduledAt).toISOString().split('T')[0] as any,
                startTime: appointment.scheduledAt,
                title: appointment.title,
                location: appointment.location,
                isTemplate: false,
                updatedAt: new Date(),
              }
            });
            updateData.workoutSessionId = workoutSession.id;
          }
          break;
      }
    }

    // Handle rescheduling
    if (data.scheduledAt && data.scheduledAt.getTime() !== appointment.scheduledAt.getTime()) {
      // Check for conflicts
      const conflict = await checkSchedulingConflict(
        appointment.trainerId,
        data.scheduledAt,
        data.duration || appointment.duration,
        appointmentId
      );

      if (conflict) {
        throw new Error('New appointment time conflicts with existing booking');
      }

      updateData.status = AppointmentStatus.RESCHEDULED;
    }

    const updatedAppointment = await prisma.appointments.update({
      where: { id: appointmentId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    console.log('Appointment updated:', {
      appointmentId,
      changes: Object.keys(data),
      newStatus: data.status
    });

    return updatedAppointment;

  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(
  appointmentId: string,
  reason: string,
  cancelledBy: string
): Promise<appointments> {
  try {
    const appointment = await prisma.appointments.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new Error('Cannot cancel completed appointment');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new Error('Appointment is already cancelled');
    }

    const updatedAppointment = await prisma.appointments.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: reason,
        cancelledAt: new Date(),
        cancelledBy: cancelledBy
      }
    });

    console.log('Appointment cancelled:', {
      appointmentId,
      reason,
      cancelledBy
    });

    return updatedAppointment;

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
}

// ============================================================================
// SCHEDULE AVAILABILITY
// ============================================================================

/**
 * Check for scheduling conflicts
 */
export async function checkSchedulingConflict(
  trainerId: string,
  scheduledAt: Date,
  duration: number,
  excludeAppointmentId?: string
): Promise<appointments | null> {
  try {
    const endTime = new Date(scheduledAt.getTime() + (duration * 60 * 1000));

    const conflictingAppointment = await prisma.appointments.findFirst({
      where: {
        trainerId,
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS
          ]
        },
        OR: [
          // New appointment starts during existing appointment
          {
            AND: [
              { scheduledAt: { lte: scheduledAt } },
              {
                scheduledAt: {
                  gte: new Date(scheduledAt.getTime() - (60 * 60 * 1000)) // Assume max 1 hour appointments
                }
              }
            ]
          },
          // New appointment ends during existing appointment
          {
            AND: [
              { scheduledAt: { lte: endTime } },
              { scheduledAt: { gte: scheduledAt } }
            ]
          },
          // New appointment encompasses existing appointment
          {
            AND: [
              { scheduledAt: { gte: scheduledAt } },
              { scheduledAt: { lte: endTime } }
            ]
          }
        ]
      }
    });

    return conflictingAppointment;

  } catch (error) {
    console.error('Error checking scheduling conflict:', error);
    throw error;
  }
}

/**
 * Get trainer's availability for a date range
 */
export async function getTrainerAvailability(
  trainerId: string,
  startDate: Date,
  endDate: Date,
  timeSlotDuration: number = 60 // minutes
): Promise<ScheduleAvailability[]> {
  try {
    // Get trainer's available hours
    const trainerProfile = await prisma.trainer_profiles.findUnique({
      where: { id: trainerId },
      select: { availableHours: true, timezone: true }
    });

    if (!trainerProfile) {
      throw new Error('Trainer profile not found');
    }

    // Get existing appointments in the date range
    const appointments = await prisma.appointments.findMany({
      where: {
        trainerId,
        scheduledAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS
          ]
        }
      },
      select: {
        id: true,
        scheduledAt: true,
        duration: true,
        type: true
      }
    });

    const availability: ScheduleAvailability[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]!;
      const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Get available hours for this day (this would depend on the trainer's schedule)
      const daySchedule = getDaySchedule(trainerProfile.availableHours, dayOfWeek);

      if (daySchedule) {
        const slots = generateTimeSlots(
          current,
          daySchedule.start,
          daySchedule.end,
          timeSlotDuration,
          appointments
        );

        availability.push({
          date: dateStr,
          slots
        });
      } else {
        // No availability for this day
        availability.push({
          date: dateStr,
          slots: []
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return availability;

  } catch (error) {
    console.error('Error getting trainer availability:', error);
    throw error;
  }
}

/**
 * Get upcoming appointments for trainer
 */
export async function getUpcomingAppointments(
  trainerId: string,
  days: number = 7
): Promise<AppointmentWithDetails[]> {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    const rows = await prisma.appointments.findMany({
      where: {
        trainerId,
        scheduledAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED
          ]
        }
      },
      include: {
        trainer_profiles: {
          include: {
            users: { select: { id: true, name: true, email: true, image: true } }
          }
        },
        users: { select: { id: true, name: true, email: true, image: true } },
        trainer_clients: { select: { id: true, goals: true, preferences: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    const appointments: AppointmentWithDetails[] = rows.map((row: any) => ({
      ...row,
      trainer: {
        id: row.trainer_profiles?.id,
        user: row.trainer_profiles?.users,
        businessName: row.trainer_profiles?.businessName ?? null,
      },
      client: row.users,
      trainerClient: row.trainer_clients ?? undefined,
      workoutSession: row.workout_sessions ?? undefined,
    }));

    return appointments;

  } catch (error) {
    console.error('Error getting upcoming appointments:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get day schedule from trainer's available hours
 */
function getDaySchedule(availableHours: any, dayOfWeek: number): { start: string; end: string } | null {
  if (!availableHours || typeof availableHours !== 'object') {
    // Default availability (9 AM to 5 PM, Monday to Friday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      return { start: '09:00', end: '17:00' };
    }
    return null;
  }

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[dayOfWeek]!;

  return availableHours[dayName] || null;
}

/**
 * Generate time slots for a day
 */
function generateTimeSlots(
  date: Date,
  startTime: string,
  endTime: string,
  slotDuration: number,
  existingAppointments: { id: string; scheduledAt: Date; duration: number; type: AppointmentType }[]
): { time: string; available: boolean; appointmentId?: string; type?: AppointmentType }[] {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number) as [number, number];
  const [endHour, endMinute] = endTime.split(':').map(Number) as [number, number];

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const slotStart = new Date(date);
    slotStart.setHours(hour, minute, 0, 0);

    const slotEnd = new Date(slotStart.getTime() + (slotDuration * 60 * 1000));

    // Check if slot conflicts with existing appointment
    const conflictingAppointment = existingAppointments.find(apt => {
      const aptStart = new Date(apt.scheduledAt);
      const aptEnd = new Date(aptStart.getTime() + (apt.duration * 60 * 1000));

      return (slotStart >= aptStart && slotStart < aptEnd) ||
             (slotEnd > aptStart && slotEnd <= aptEnd) ||
             (slotStart <= aptStart && slotEnd >= aptEnd);
    });

    const slot: { time: string; available: boolean; appointmentId?: string; type?: AppointmentType } = {
      time: timeStr,
      available: !conflictingAppointment,
    };
    if (conflictingAppointment) {
      slot.appointmentId = conflictingAppointment.id;
      slot.type = conflictingAppointment.type;
    }
    slots.push(slot);
  }

  return slots;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type AppointmentModel = appointments;
export type { AppointmentStatus, AppointmentType };
