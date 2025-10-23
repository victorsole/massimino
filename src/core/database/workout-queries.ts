// src/core/database/workout-queries.ts
/**
 * Workout Log Database Queries for Massimino
 * Comprehensive query functions for workout tracking and management
 */

import crypto from 'crypto';
import { prisma } from './client';
import type {
  workout_log_entries as WorkoutLogEntry,
  exercises as Exercise,
  workout_sessions as WorkoutSession,
} from '@prisma/client';
import {
  WorkoutFilterOptions,
  WorkoutSortOptions,
  WorkoutPagination,
  WorkoutLogEntryFormData,
  WorkoutSessionFormData,
  calculateAverageWeight,
  calculateTrainingVolume,
  generateOrder,
  OrderGenerationContext
} from '@/types/workout';
import { get_exercise_recommendations } from '@/services/ai/workout-suggestions';

// ============================================================================
// WORKOUT LOG ENTRY QUERIES
// ============================================================================

/**
 * Get unified workout entries (personal + team workouts) with filtering, sorting, and pagination
 */
export async function getUserWorkoutsUnified(
  userId: string,
  options: {
    filters?: WorkoutFilterOptions;
    sort?: WorkoutSortOptions;
    pagination?: Partial<WorkoutPagination>;
    includeTeamWorkouts?: boolean;
  } = {}
): Promise<{
  entries: (WorkoutLogEntry & {
    exercise: Exercise;
    user: { id: string; name: string | null; role: string };
    coach: { id: string; name: string | null; role: string } | null;
  })[];
  pagination: WorkoutPagination;
}> {
  const { filters = {}, sort = { field: 'date', direction: 'desc' }, pagination = {}, includeTeamWorkouts = true } = options;
  const page = pagination.page || 1;
  const limit = pagination.limit || 50;
  const offset = (page - 1) * limit;

  // Build where clause
  const where: any = {
    userId,
  };

  if (filters.dateRange) {
    where.date = {
      gte: filters.dateRange.start,
      lte: filters.dateRange.end,
    };
  }

  if (filters.exercises && filters.exercises.length > 0) {
    where.exerciseId = { in: filters.exercises };
  }

  if (filters.setTypes && filters.setTypes.length > 0) {
    where.setType = { in: filters.setTypes };
  }

  if (filters.coachId) {
    where.coachId = filters.coachId;
  }

  // Filter by team workout status if specified
  if (!includeTeamWorkouts) {
    where.isTeamWorkout = false;
  }

  // Get total count
  const total = await prisma.workout_log_entries.count({ where });

  // Get entries with relationships
  const entries = await prisma.workout_log_entries.findMany({
    where,
    include: {
      exercises: true,
      users_workout_log_entries_userIdTousers: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      users_workout_log_entries_coachIdTousers: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      [sort.field]: sort.direction,
    },
    skip: offset,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);

  // Map the Prisma relation names to the expected format
  const mappedEntries = entries.map((entry) => ({
    ...entry,
    exercise: entry.exercises,
    user: entry.users_workout_log_entries_userIdTousers,
    coach: entry.users_workout_log_entries_coachIdTousers,
  }));

  return {
    entries: mappedEntries,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Get workout log entries with filtering, sorting, and pagination
 */
export async function getWorkoutLogEntries(
  userId: string,
  options: {
    filters?: WorkoutFilterOptions;
    sort?: WorkoutSortOptions;
    pagination?: Partial<WorkoutPagination>;
  } = {}
): Promise<{
  entries: (WorkoutLogEntry & {
    exercise: Exercise;
    user: { id: string; name: string | null; role: string };
    coach: { id: string; name: string | null; role: string } | null;
  })[];
  pagination: WorkoutPagination;
}> {
  const { filters = {}, sort = { field: 'date', direction: 'desc' }, pagination = {} } = options;
  const page = pagination.page || 1;
  const limit = pagination.limit || 50;
  const offset = (page - 1) * limit;

  // Build where clause
  const where: any = {
    userId,
  };

  if (filters.dateRange) {
    where.date = {
      gte: filters.dateRange.start,
      lte: filters.dateRange.end,
    };
  }

  if (filters.exercises && filters.exercises.length > 0) {
    where.exerciseId = { in: filters.exercises };
  }

  if (filters.setTypes && filters.setTypes.length > 0) {
    where.setType = { in: filters.setTypes };
  }

  if (filters.coachId) {
    where.coachId = filters.coachId;
  }

  // Get total count
  const total = await prisma.workout_log_entries.count({ where });

  // Get entries with relationships
  const entries = await prisma.workout_log_entries.findMany({
    where,
    include: {
      exercises: true,
      users_workout_log_entries_userIdTousers: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      users_workout_log_entries_coachIdTousers: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      [sort.field]: sort.direction,
    },
    skip: offset,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);

  // Map the Prisma relation names to the expected format
  const mappedEntries = entries.map((entry) => ({
    ...entry,
    exercise: entry.exercises,
    user: entry.users_workout_log_entries_userIdTousers,
    coach: entry.users_workout_log_entries_coachIdTousers,
  }));

  return {
    entries: mappedEntries,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Get a single workout log entry by ID
 */
export async function getWorkoutLogEntry(
  id: string,
  userId: string
): Promise<(WorkoutLogEntry & {
  exercise: Exercise;
  user: { id: string; name: string | null; role: string };
  coach: { id: string; name: string | null; role: string } | null;
}) | null> {
  const entry = await prisma.workout_log_entries.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      exercises: true,
      users_workout_log_entries_userIdTousers: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      users_workout_log_entries_coachIdTousers: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!entry) return null;

  // Map the Prisma relation names to the expected format
  return {
    ...entry,
    exercise: entry.exercises,
    user: entry.users_workout_log_entries_userIdTousers,
    coach: entry.users_workout_log_entries_coachIdTousers,
  };
}

/**
 * Create a new workout log entry
 */
export async function createWorkoutLogEntry(
  userId: string,
  data: WorkoutLogEntryFormData,
  coachId?: string
): Promise<WorkoutLogEntry> {
  // Calculate training volume
  const averageWeight = calculateAverageWeight(data.weight);
  const trainingVolume = calculateTrainingVolume(
    1, // Single set
    data.reps,
    averageWeight,
    data.unit
  );

  // Check for personal records
  const is_weight_pr = await check_personal_record(
    userId,
    data.exerciseId,
    averageWeight,
    data.reps
  );

  const is_volume_pr = await check_volume_record(
    userId,
    data.exerciseId,
    trainingVolume
  );

  // Entry is a PR if it's either a weight PR or volume PR
  const is_personal_record = is_weight_pr || is_volume_pr;

  // Generate order based on set type
  const context: OrderGenerationContext = {
    currentSetType: data.setType,
    currentGroupNumber: data.setNumber,
    currentSubOrder: 'A',
    totalEntries: 0,
  };

  const order = generateOrder(data.setType, context);

  // Create entry and update exercise usage metrics in a transaction
  return prisma.$transaction(async (tx) => {
    const entry = await tx.workout_log_entries.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        coachId: coachId ?? null,
        date: new Date(data.date),
        exerciseId: data.exerciseId,
        order,
        setNumber: data.setNumber,
        setType: data.setType,
        reps: data.reps,
        weight: data.weight,
        unit: data.unit,
        ...(data.intensity !== undefined && { intensity: data.intensity }),
        ...(data.intensityType !== undefined && { intensityType: data.intensityType }),
        ...(data.tempo !== undefined && { tempo: data.tempo }),
        ...(data.restSeconds !== undefined && { restSeconds: data.restSeconds }),
        trainingVolume,
        personalRecord: is_personal_record,
        ...(data.userComments !== undefined && { userComments: data.userComments }),
        ...(data.coachFeedback !== undefined && { coachFeedback: data.coachFeedback }),
        updatedAt: new Date(),
      },
    });

    await tx.exercises.update({
      where: { id: data.exerciseId },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date(),
      },
    });

    return entry;
  });
}

/**
 * Update a workout log entry
 */
export async function updateWorkoutLogEntry(
  id: string,
  userId: string,
  data: Partial<WorkoutLogEntryFormData>
): Promise<WorkoutLogEntry | null> {
  // Get existing entry
  const existing = await prisma.workout_log_entries.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return null;
  }

  // Calculate new training volume if weight or reps changed
  let trainingVolume = existing.trainingVolume;
  if (data.weight || data.reps) {
    const newWeight = data.weight || existing.weight;
    const newReps = data.reps || existing.reps;
    const averageWeight = calculateAverageWeight(newWeight);
    trainingVolume = calculateTrainingVolume(
      1,
      newReps,
      averageWeight,
      data.unit || existing.unit
    );
  }

  const updated = await prisma.workout_log_entries.update({
    where: { id },
    data: {
      ...(data.date && { date: new Date(data.date) }),
      ...(data.exerciseId && { exerciseId: data.exerciseId }),
      ...(data.setNumber && { setNumber: data.setNumber }),
      ...(data.setType && { setType: data.setType }),
      ...(data.reps && { reps: data.reps }),
      ...(data.weight && { weight: data.weight }),
      ...(data.unit && { unit: data.unit }),
      ...(data.intensity && { intensity: data.intensity }),
      ...(data.intensityType && { intensityType: data.intensityType }),
      ...(data.tempo && { tempo: data.tempo }),
      ...(data.restSeconds && { restSeconds: data.restSeconds }),
      ...(trainingVolume !== undefined && { trainingVolume }),
      ...(data.userComments && { userComments: data.userComments }),
      ...(data.coachFeedback && { coachFeedback: data.coachFeedback }),
    },
  });

  // If exercise changed, update usage metrics for the new exercise
  if (data.exerciseId && data.exerciseId !== existing.exerciseId) {
    await prisma.exercises.update({
      where: { id: data.exerciseId },
      data: { usageCount: { increment: 1 }, lastUsed: new Date() },
    });
  }

  return updated;
}

/**
 * Delete a workout log entry
 */
export async function deleteWorkoutLogEntry(
  id: string,
  userId: string
): Promise<boolean> {
  const result = await prisma.workout_log_entries.deleteMany({
    where: { id, userId },
  });

  return result.count > 0;
}

/**
 * Get workout statistics for a user
 */
export async function getWorkoutStats(
  userId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  averageWorkoutDuration: number;
  mostUsedExercises: { exerciseId: string; count: number; name: string }[];
  volumeByMuscleGroup: { muscleGroup: string; volume: number }[];
}> {
  const where: any = { userId };
  
  if (dateRange) {
    where.date = {
      gte: dateRange.start,
      lte: dateRange.end,
    };
  }

  const entries = await prisma.workout_log_entries.findMany({
    where,
    include: {
      exercises: true,
    },
  });

  const totalWorkouts = new Set(entries.map(e => e.date.toDateString())).size;
  const totalVolume = entries.reduce((sum, e) => sum + (e.trainingVolume || 0), 0);
  const totalSets = entries.length;
  const totalReps = entries.reduce((sum, e) => sum + e.reps, 0);

  // Calculate average workout duration
  const sessions = await prisma.workout_sessions.findMany({
    where,
    select: { duration: true },
  });
  const averageWorkoutDuration = sessions.length > 0 
    ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length 
    : 0;

  // Most used exercises
  const exerciseCounts = entries.reduce((acc, entry) => {
    const key = entry.exerciseId;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostUsedExercises = Object.entries(exerciseCounts)
    .map(([exerciseId, count]) => ({
      exerciseId,
      count,
      name: entries.find(e => e.exerciseId === exerciseId)?.exercises.name || '',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Volume by muscle group
  const volumeByMuscleGroup = entries.reduce((acc, entry) => {
    entry.exercises.muscleGroups.forEach(muscleGroup => {
      acc[muscleGroup] = (acc[muscleGroup] || 0) + (entry.trainingVolume || 0);
    });
    return acc;
  }, {} as Record<string, number>);

  return {
    totalWorkouts,
    totalVolume,
    totalSets,
    totalReps,
    averageWorkoutDuration,
    mostUsedExercises,
    volumeByMuscleGroup: Object.entries(volumeByMuscleGroup).map(([muscleGroup, volume]) => ({
      muscleGroup,
      volume,
    })),
  };
}

// ============================================================================
// EXERCISE QUERIES
// ============================================================================

/**
 * Get all exercises with optional filtering
 */
export async function getExercises(options: {
  category?: string;
  muscleGroups?: string[];
  equipment?: string[];
  difficulty?: string;
  isActive?: boolean;
  search?: string;
} = {}): Promise<Exercise[]> {
  const where: any = {};

  if (options.category) {
    where.category = options.category;
  }

  if (options.muscleGroups && options.muscleGroups.length > 0) {
    where.muscleGroups = {
      hasSome: options.muscleGroups,
    };
  }

  if (options.equipment && options.equipment.length > 0) {
    where.equipment = {
      hasSome: options.equipment,
    };
  }

  if (options.difficulty) {
    where.difficulty = options.difficulty;
  }

  if (options.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  if (options.search) {
    where.name = {
      contains: options.search,
      mode: 'insensitive',
    };
  }

  return prisma.exercises.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

/**
 * Get exercise by ID
 */
export async function getExercise(id: string): Promise<Exercise | null> {
  return prisma.exercises.findUnique({
    where: { id },
  });
}

/**
 * Create a new exercise
 */
export async function createExercise(data: {
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
  difficulty?: string;
  safetyNotes?: string;
  formCues?: string[];
  commonMistakes?: string[];
  createdBy?: string;
  isCustom?: boolean;
}) {
  return prisma.exercises.create({
    data: {
      id: crypto.randomUUID(),
      name: data.name,
      category: data.category,
      muscleGroups: data.muscleGroups,
      equipment: data.equipment,
      instructions: data.instructions ?? null,
      videoUrl: data.videoUrl ?? null,
      imageUrl: data.imageUrl ?? null,
      difficulty: data.difficulty || 'BEGINNER',
      safetyNotes: data.safetyNotes ?? null,
      formCues: data.formCues || [],
      commonMistakes: data.commonMistakes || [],
      createdBy: data.createdBy ?? null,
      isCustom: data.isCustom || false,
      updatedAt: new Date()
    },
  });
}

/**
 * Update an exercise
 */
export async function updateExercise(
  id: string,
  data: Partial<{
    name: string;
    category: string;
    muscleGroups: string[];
    equipment: string[];
    instructions: string;
    videoUrl: string;
    imageUrl: string;
    difficulty: string;
    safetyNotes: string;
    isActive: boolean;
  }>
): Promise<Exercise | null> {
  return prisma.exercises.update({
    where: { id },
    data,
  });
}

/**
 * Delete an exercise (soft delete by setting isActive to false)
 */
export async function deleteExercise(id: string): Promise<boolean> {
  const result = await prisma.exercises.update({
    where: { id },
    data: { isActive: false },
  });

  return result.isActive === false;
}

// ============================================================================
// EXERCISE VARIATION QUERIES
// ============================================================================

/**
 * Get exercise variations for an exercise
 */
export async function getExerciseVariations(exerciseId: string, options: {
  difficulty?: string;
} = {}) {
  const where: any = {
    exerciseId,
    isActive: true
  };

  if (options.difficulty) {
    where.difficulty = options.difficulty;
  }

  return prisma.exercise_variations.findMany({
    where,
    include: {
      exercises: {
        select: { id: true, name: true, category: true }
      }
    },
    orderBy: { difficulty: 'asc' }
  });
}

/**
 * Get exercise variation by ID
 */
export async function getExerciseVariationById(id: string) {
  return prisma.exercise_variations.findUnique({
    where: { id },
    include: {
      exercises: {
        select: { id: true, name: true, category: true }
      }
    }
  });
}

/**
 * Create exercise variation
 */
export async function createExerciseVariation(data: {
  exerciseId: string;
  name: string;
  description?: string;
  difficulty?: string;
  videoUrl?: string;
  imageUrl?: string;
  instructions?: string;
}) {
  return prisma.exercise_variations.create({
    data: {
      id: crypto.randomUUID(),
      exerciseId: data.exerciseId,
      name: data.name,
      description: data.description ?? null,
      difficulty: data.difficulty || 'BEGINNER',
      videoUrl: data.videoUrl ?? null,
      imageUrl: data.imageUrl ?? null,
      instructions: data.instructions ?? null,
      updatedAt: new Date()
    },
    include: {
      exercises: {
        select: { id: true, name: true, category: true }
      }
    }
  });
}

/**
 * Update exercise variation
 */
export async function updateExerciseVariation(id: string, data: any) {
  return prisma.exercise_variations.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.difficulty && { difficulty: data.difficulty }),
      ...(data.videoUrl && { videoUrl: data.videoUrl }),
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
      ...(data.instructions && { instructions: data.instructions }),
      ...(data.isActive !== undefined && { isActive: data.isActive })
    },
    include: {
      exercises: {
        select: { id: true, name: true, category: true }
      }
    }
  });
}

/**
 * Delete exercise variation
 */
export async function deleteExerciseVariation(id: string) {
  const result = await prisma.exercise_variations.update({
    where: { id },
    data: { isActive: false }
  });

  return result.isActive === false;
}

// ============================================================================
// WORKOUT SESSION QUERIES
// ============================================================================

/**
 * Get workout sessions for a user
 */
export async function getWorkoutSessions(
  userId: string,
  options: {
    dateRange?: { start: Date; end: Date };
    isComplete?: boolean;
    isTemplate?: boolean;
    pagination?: Partial<WorkoutPagination>;
  } = {}
): Promise<{
  sessions: (WorkoutSession & {
    user: { id: string; name: string | null; role: string };
    coach: { id: string; name: string | null; role: string } | null;
    entries: WorkoutLogEntry[];
  })[];
  pagination: WorkoutPagination;
}> {
  const { dateRange, isComplete, isTemplate, pagination = {} } = options;
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const offset = (page - 1) * limit;

  const where: any = { userId };

  if (dateRange) {
    where.date = {
      gte: dateRange.start,
      lte: dateRange.end,
    };
  }

  if (isComplete !== undefined) {
    where.isComplete = isComplete;
  }

  if (isTemplate !== undefined) {
    where.isTemplate = isTemplate;
  }

  const total = await prisma.workout_sessions.count({ where });

  const sessions = await prisma.workout_sessions.findMany({
    where,
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
    skip: offset,
    take: limit,
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

  return {
    sessions: mappedSessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single workout session by ID
 */
export async function getWorkoutSession(
  id: string,
  userId: string
): Promise<(WorkoutSession & {
  user: { id: string; name: string | null; role: string };
  coach: { id: string; name: string | null; role: string } | null;
  entries: (WorkoutLogEntry & { exercise: Exercise })[];
}) | null> {
  const session = await prisma.workout_sessions.findFirst({
    where: { id, userId },
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
  });

  if (!session) return null;

  // Map the Prisma relation names to the expected format
  return {
    ...session,
    user: session.users_workout_sessions_userIdTousers,
    coach: session.users_workout_sessions_coachIdTousers,
    entries: session.workout_log_entries.map((entry) => ({
      ...entry,
      exercise: entry.exercises,
    })),
  };
}

/**
 * Create a new workout session
 */
export async function createWorkoutSession(
  userId: string,
  data: WorkoutSessionFormData,
  coachId?: string
): Promise<WorkoutSession> {
  const startTime = new Date(`${data.date}T${data.startTime}`);
  const endTime = data.endTime ? new Date(`${data.date}T${data.endTime}`) : null;
  
  let duration: number | undefined;
  if (startTime && endTime) {
    duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  }

  return prisma.workout_sessions.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      coachId: coachId ?? null,
      date: new Date(data.date),
      startTime,
      endTime,
      ...(duration !== undefined && { duration }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.location !== undefined && { location: data.location }),
      isTemplate: data.isTemplate || false,
      updatedAt: new Date(),
    },
  });
}

/**
 * Update a workout session
 */
export async function updateWorkoutSession(
  id: string,
  userId: string,
  data: Partial<WorkoutSessionFormData>
): Promise<WorkoutSession | null> {
  const existing = await prisma.workout_sessions.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return null;
  }

  let startTime = existing.startTime;
  let endTime = existing.endTime;
  let duration = existing.duration;

  if (data.date && data.startTime) {
    startTime = new Date(`${data.date}T${data.startTime}`);
  }

  if (data.date && data.endTime) {
    endTime = new Date(`${data.date}T${data.endTime}`);
  }

  if (startTime && endTime) {
    duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  }

  return prisma.workout_sessions.update({
    where: { id },
    data: {
      ...(data.date && { date: new Date(data.date) }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(duration !== undefined && { duration }),
      ...(data.title && { title: data.title }),
      ...(data.notes && { notes: data.notes }),
      ...(data.location && { location: data.location }),
      ...(data.isTemplate !== undefined && { isTemplate: data.isTemplate }),
    },
  });
}

/**
 * Complete a workout session
 */
export async function completeWorkoutSession(
  id: string,
  userId: string,
  endTime?: Date
): Promise<WorkoutSession | null> {
  const session = await prisma.workout_sessions.findFirst({
    where: { id, userId },
  });

  if (!session) {
    return null;
  }

  const endTimeToUse = endTime || new Date();
  const duration = Math.floor((endTimeToUse.getTime() - session.startTime.getTime()) / 1000);

  // Calculate total volume and stats
  const entries = await prisma.workout_log_entries.findMany({
    where: { userId, date: session.date },
  });

  const totalVolume = entries.reduce((sum, entry) => sum + (entry.trainingVolume || 0), 0);
  const totalSets = entries.length;
  const totalReps = entries.reduce((sum, entry) => sum + entry.reps, 0);

  return prisma.workout_sessions.update({
    where: { id },
    data: {
      endTime: endTimeToUse,
      duration,
      isComplete: true,
      totalVolume,
      totalSets,
      totalReps,
    },
  });
}

/**
 * Delete a workout session
 */
export async function deleteWorkoutSession(
  id: string,
  userId: string
): Promise<boolean> {
  const result = await prisma.workout_sessions.deleteMany({
    where: { id, userId },
  });

  return result.count > 0;
}

// ============================================================================
// COACH-SPECIFIC QUERIES
// ============================================================================

/**
 * Get workout logs for clients assigned to a coach
 */
export async function getClientWorkoutLogs(
  coachId: string,
  options: {
    clientId?: string;
    dateRange?: { start: Date; end: Date };
    pagination?: Partial<WorkoutPagination>;
  } = {}
): Promise<{
  entries: (WorkoutLogEntry & {
    exercise: Exercise;
    user: { id: string; name: string | null; role: string };
  })[];
  pagination: WorkoutPagination;
}> {
  const { clientId, dateRange, pagination = {} } = options;
  const page = pagination.page || 1;
  const limit = pagination.limit || 50;
  const offset = (page - 1) * limit;

  const where: any = { coachId };

  if (clientId) {
    where.userId = clientId;
  }

  if (dateRange) {
    where.date = {
      gte: dateRange.start,
      lte: dateRange.end,
    };
  }

  const total = await prisma.workout_log_entries.count({ where });

  const entries = await prisma.workout_log_entries.findMany({
    where,
    include: {
      exercises: true,
      users_workout_log_entries_userIdTousers: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { date: 'desc' },
    skip: offset,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);

  // Map the Prisma relation names to the expected format
  const mappedEntries = entries.map((entry) => ({
    ...entry,
    exercise: entry.exercises,
    user: entry.users_workout_log_entries_userIdTousers,
  }));

  return {
    entries: mappedEntries,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Add coach feedback to a workout entry
 */
export async function addCoachFeedback(
  entryId: string,
  coachId: string,
  feedback: string
): Promise<WorkoutLogEntry | null> {
  return prisma.workout_log_entries.update({
    where: {
      id: entryId,
      coachId, // Ensure coach owns this entry
    },
    data: {
      coachFeedback: feedback,
    },
  });
}

// ============================================================================
// UTILITY QUERIES
// ============================================================================

/**
 * Get exercise categories for filtering
 */
export async function getExerciseCategories(): Promise<string[]> {
  const exercises = await prisma.exercises.findMany({
    select: { category: true },
    where: { isActive: true },
  });

  return [...new Set(exercises.map(e => e.category))];
}

/**
 * Get muscle groups for filtering
 */
export async function getMuscleGroups(): Promise<string[]> {
  const exercises = await prisma.exercises.findMany({
    select: { muscleGroups: true },
    where: { isActive: true },
  });

  const allMuscleGroups = exercises.flatMap(e => e.muscleGroups);
  return [...new Set(allMuscleGroups)];
}

/**
 * Get equipment types for filtering
 */
export async function getEquipmentTypes(): Promise<string[]> {
  const exercises = await prisma.exercises.findMany({
    select: { equipment: true },
    where: { isActive: true },
  });

  const allEquipment = exercises.flatMap(e => e.equipment);
  return [...new Set(allEquipment)];
}

/**
 * Search exercises by name
 */
export async function searchExercises(
  query: string,
  limit: number = 10
): Promise<Exercise[]> {
  return prisma.exercises.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive',
      },
      isActive: true,
    },
    orderBy: { usageCount: 'desc' },
    take: limit,
  });
}

// ============================================================================
// WORKOUT TEMPLATE QUERIES
// ============================================================================

/**
 * Get workout templates with filtering
 */
export async function getWorkoutTemplates(filters: {
  category?: string;
  difficulty?: string;
  priceRange?: string;
  minRating?: number;
  publicOnly?: boolean;
  limit?: number;
} = {}) {
  const where: any = {
    isActive: true,
  };

  if (filters.publicOnly) {
    where.isPublic = true;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }

  if (filters.minRating) {
    where.rating = { gte: filters.minRating };
  }

  if (filters.priceRange) {
    const [min, max] = filters.priceRange.split('-').map(Number);
    where.price = { gte: min, lte: max };
  }

  return prisma.workout_templates.findMany({
    where,
    include: {
      users: {
        select: { id: true, name: true, trainerVerified: true }
      },
      workout_template_exercises: {
        include: { exercises: true },
        orderBy: { order: 'asc' }
      },
      _count: {
        select: { template_ratings: true }
      }
    },
    orderBy: { rating: 'desc' },
    take: filters.limit || 20
  });
}

/**
 * Get workout template by ID
 */
export async function getWorkoutTemplateById(id: string) {
  return prisma.workout_templates.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, name: true, trainerVerified: true }
      },
      workout_template_exercises: {
        include: { exercises: true },
        orderBy: { order: 'asc' }
      },
      template_ratings: {
        include: { users: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: { template_ratings: true }
      }
    }
  });
}

/**
 * Create workout template
 */
export async function createWorkoutTemplate(data: any) {
  return prisma.workout_templates.create({
    data: {
      id: crypto.randomUUID(), // Add this line to generate a unique ID
      updatedAt: new Date(), // Add this line to set the updatedAt timestamp
      name: data.name,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty || 'BEGINNER',
      duration: data.duration,
      equipment: data.equipment || [],
      isPublic: data.isPublic || false,
      price: data.price,
      currency: data.currency || 'USD',
      tags: data.tags || [],
      users: {
        connect: { id: data.createdBy }
      },
      workout_template_exercises: {
        create: data.exercises?.map((exercise: any) => ({
          exerciseId: exercise.exerciseId,
          order: exercise.order,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          restTime: exercise.restTime,
          notes: exercise.notes,
          isSuperset: exercise.isSuperset || false,
          supersetGroup: exercise.supersetGroup
        })) || []
      }
    },
    include: {
      workout_template_exercises: { include: { exercises: true } }
    }
  });
}

/**
 * Update workout template
 */
export async function updateWorkoutTemplate(id: string, data: any) {
  return prisma.workout_templates.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.category && { category: data.category }),
      ...(data.difficulty && { difficulty: data.difficulty }),
      ...(data.duration && { duration: data.duration }),
      ...(data.equipment && { equipment: data.equipment }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.tags && { tags: data.tags })
    }
  });
}

/**
 * Delete workout template
 */
export async function deleteWorkoutTemplate(id: string) {
  return prisma.workout_templates.update({
    where: { id },
    data: { isActive: false }
  });
}

/**
 * Get user's templates
 */
export async function getMyTemplates(userId: string) {
  return prisma.workout_templates.findMany({
    where: { createdBy: userId, isActive: true },
    include: {
      workout_template_exercises: {
        include: { exercises: true },
        orderBy: { order: 'asc' }
      },
      _count: {
        select: { template_ratings: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Search workout templates
 */
export async function searchWorkoutTemplates(query: string, options: any = {}) {
  return prisma.workout_templates.findMany({
    where: {
      isActive: true,
      ...(options.publicOnly && { isPublic: true }),
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }
      ]
    },
    include: {
      users: {
        select: { id: true, name: true, trainerVerified: true }
      },
      _count: {
        select: { template_ratings: true }
      }
    },
    orderBy: { rating: 'desc' },
    take: options.limit || 20
  });
}

/**
 * Purchase template
 */
export async function purchaseTemplate(templateId: string, userId: string) {
  const template = await prisma.workout_templates.findUnique({
    where: { id: templateId },
    select: { price: true, currency: true }
  });

  if (!template) throw new Error('Template not found');

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.template_purchases.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        templateId,
        price: template.price || 0,
        currency: template.currency
      }
    });

    await tx.workout_templates.update({
      where: { id: templateId },
      data: { purchaseCount: { increment: 1 } }
    });

    return purchase;
  });
}

/**
 * Rate template
 */
export async function rateTemplate(templateId: string, userId: string, data: any) {
  return prisma.$transaction(async (tx) => {
    const rating = await tx.template_ratings.upsert({
      where: { userId_templateId: { userId, templateId } },
      update: { rating: data.rating, review: data.review },
      create: {
        id: crypto.randomUUID(),
        userId,
        templateId,
        rating: data.rating,
        review: data.review
      }
    });

    // Recalculate average rating
    const ratings = await tx.template_ratings.findMany({
      where: { templateId },
      select: { rating: true }
    });

    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await tx.workout_templates.update({
      where: { id: templateId },
      data: {
        rating: avgRating,
        ratingCount: ratings.length
      }
    });

    return rating;
  });
}

// ============================================================================
// TRAINING PROGRAM QUERIES
// ============================================================================

/**
 * Get training programs with filtering
 */
export async function getTrainingPrograms(filters: any = {}) {
  const where: any = {
    isActive: true,
  };

  if (filters.publicOnly) {
    where.isPublic = true;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }

  if (filters.duration) {
    where.duration = filters.duration;
  }

  if (filters.minRating) {
    where.rating = { gte: filters.minRating };
  }

  if (filters.priceRange) {
    const [min, max] = filters.priceRange.split('-').map(Number);
    where.price = { gte: min, lte: max };
  }

  return prisma.program_templates.findMany({
    where,
    include: {
      users: {
        select: { id: true, name: true, trainerVerified: true }
      },
      program_weeks: { orderBy: { weekNumber: 'asc' } },
      _count: {
        select: { program_ratings: true, program_subscriptions: true }
      }
    },
    orderBy: { rating: 'desc' },
    take: filters.limit || 20
  });
}

/**
 * Get training program by ID
 */
export async function getTrainingProgramById(id: string) {
  return prisma.program_templates.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, name: true, trainerVerified: true }
      },
      program_weeks: { orderBy: { weekNumber: 'asc' } },
      workout_templates: {
        include: {
          workout_template_exercises: {
            include: { exercises: true },
            orderBy: { order: 'asc' }
          }
        }
      },
      program_ratings: {
        include: { users: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: { program_ratings: true, program_subscriptions: true }
      }
    }
  });
}

/**
 * Create training program
 */
export async function createTrainingProgram(data: any) {
  return prisma.program_templates.create({
    data: {
      id: crypto.randomUUID(), // Add this line
      updatedAt: new Date(),   // Add this line
      name: data.name,
      description: data.description,
      duration: data.duration,
      difficulty: data.difficulty || 'BEGINNER',
      category: data.category,
      isPublic: data.isPublic || false,
      price: data.price,
      currency: data.currency || 'USD',
      tags: data.tags || [],
      users: {
        connect: { id: data.createdBy }
      },
      program_weeks: {
        create: data.weeks?.map((week: any) => ({
          weekNumber: week.weekNumber,
          title: week.title,
          description: week.description,
          workouts: week.workouts
        })) || []
      }
    },
    include: {
      program_weeks: { orderBy: { weekNumber: 'asc' } }
    }
  });
}

/**
 * Update training program
 */
export async function updateTrainingProgram(id: string, data: any) {
  return prisma.program_templates.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.duration && { duration: data.duration }),
      ...(data.difficulty && { difficulty: data.difficulty }),
      ...(data.category && { category: data.category }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.tags && { tags: data.tags })
    }
  });
}

/**
 * Delete training program
 */
export async function deleteTrainingProgram(id: string) {
  return prisma.program_templates.update({
    where: { id },
    data: { isActive: false }
  });
}

/**
 * Get user's programs
 */
export async function getMyPrograms(userId: string) {
  return prisma.program_templates.findMany({
    where: { createdBy: userId, isActive: true },
    include: {
      program_weeks: { orderBy: { weekNumber: 'asc' } },
      _count: {
        select: { program_ratings: true, program_subscriptions: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Search training programs
 */
export async function searchTrainingPrograms(query: string, options: any = {}) {
  return prisma.program_templates.findMany({
    where: {
      isActive: true,
      ...(options.publicOnly && { isPublic: true }),
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }
      ]
    },
    include: {
      users: {
        select: { id: true, name: true, trainerVerified: true }
      },
      _count: {
        select: { program_ratings: true, program_subscriptions: true }
      }
    },
    orderBy: { rating: 'desc' },
    take: options.limit || 20
  });
}

/**
 * Get user program subscriptions
 */
export async function getUserProgramSubscriptions(userId: string) {
  return prisma.program_subscriptions.findMany({
    where: { userId, isActive: true },
    include: {
      program_templates: {
        include: {
          users: {
            select: { id: true, name: true, trainerVerified: true }
          },
          program_weeks: { orderBy: { weekNumber: 'asc' } }
        }
      }
    },
    orderBy: { startDate: 'desc' }
  });
}

/**
 * Purchase program
 */
export async function purchaseProgram(programId: string, userId: string) {
  const program = await prisma.program_templates.findUnique({
    where: { id: programId },
    select: { price: true, currency: true }
  });

  if (!program) throw new Error('Program not found');

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.program_purchases.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        programId,
        price: program.price || 0,
        currency: program.currency
      }
    });

    await tx.program_templates.update({
      where: { id: programId },
      data: { purchaseCount: { increment: 1 } }
    });

    return purchase;
  });
}

/**
 * Subscribe to program
 */
export async function subscribeToProgram(programId: string, userId: string) {
  return prisma.program_subscriptions.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      programId,
      currentWeek: 1,
      currentDay: 1,
      updatedAt: new Date()
    }
  });
}

/**
 * Rate program
 */
export async function rateProgram(programId: string, userId: string, data: any) {
  return prisma.$transaction(async (tx) => {
    const rating = await tx.program_ratings.upsert({
      where: { userId_programId: { userId, programId } },
      update: { rating: data.rating, review: data.review },
      create: {
        id: crypto.randomUUID(),
        userId,
        programId,
        rating: data.rating,
        review: data.review
      }
    });

    // Recalculate average rating
    const ratings = await tx.program_ratings.findMany({
      where: { programId },
      select: { rating: true }
    });

    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await tx.program_templates.update({
      where: { id: programId },
      data: {
        rating: avgRating,
        ratingCount: ratings.length
      }
    });

    return rating;
  });
}

/**
 * Update program progress
 */
export async function updateProgramProgress(programId: string, userId: string, data: any) {
  return prisma.program_subscriptions.update({
    where: { userId_programId: { userId, programId } },
    data: {
      currentWeek: data.currentWeek,
      currentDay: data.currentDay,
      progressData: data.progressData
    }
  });
}

// ============================================================================
// ANALYTICS & PROGRESS TRACKING QUERIES
// ============================================================================

/**
 * Get workout analytics for a user
 */
export async function getWorkoutAnalytics(userId: string, options: {
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const where: any = { userId };

  if (options.startDate || options.endDate) {
    where.date = {};
    if (options.startDate) where.date.gte = options.startDate;
    if (options.endDate) where.date.lte = options.endDate;
  }

  return prisma.workout_analytics.findMany({
    where,
    orderBy: { date: 'desc' }
  });
}

/**
 * Get progress metrics for a user
 */
export async function getProgressMetrics(userId: string, options: {
  metricType?: string;
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const where: any = { userId };

  if (options.metricType) {
    where.metricType = options.metricType;
  }

  if (options.startDate || options.endDate) {
    where.recordedAt = {};
    if (options.startDate) where.recordedAt.gte = options.startDate;
    if (options.endDate) where.recordedAt.lte = options.endDate;
  }

  return prisma.progress_metrics.findMany({
    where,
    orderBy: { recordedAt: 'desc' }
  });
}

/**
 * Get personal records for a user
 */
export async function getPersonalRecords(userId: string, options: {
  exerciseId?: string;
} = {}) {
  const where: any = { userId };

  if (options.exerciseId) {
    where.exerciseId = options.exerciseId;
  }

  return prisma.personal_records.findMany({
    where,
    include: {
      exercises: {
        select: { id: true, name: true, category: true }
      }
    },
    orderBy: { achievedAt: 'desc' }
  });
}

/**
 * Add progress metric
 */
export async function addProgressMetric(data: {
  userId: string;
  metricType: string;
  value: number;
  unit?: string;
  bodyPart?: string;
  notes?: string;
  imageUrl?: string;
  recordedAt?: Date;
}) {
  return prisma.progress_metrics.create({
    data: {
      id: crypto.randomUUID(),
      userId: data.userId,
      metricType: data.metricType,
      value: data.value,
      unit: data.unit ?? null,
      bodyPart: data.bodyPart ?? null,
      notes: data.notes ?? null,
      imageUrl: data.imageUrl ?? null,
      recordedAt: data.recordedAt || new Date()
    }
  });
}

/**
 * Add personal record
 */
export async function addPersonalRecord(data: {
  userId: string;
  exerciseId: string;
  recordType: string;
  value: number;
  unit: string;
  reps?: number;
  notes?: string;
  achievedAt?: Date;
}) {
  return prisma.personal_records.create({
    data: {
      id: crypto.randomUUID(),
      userId: data.userId,
      exerciseId: data.exerciseId,
      recordType: data.recordType,
      value: data.value,
      unit: data.unit,
      reps: data.reps ?? null,
      notes: data.notes ?? null,
      achievedAt: data.achievedAt || new Date()
    }
  });
}

/**
 * Generate workout analytics for a user
 */
export async function generateWorkoutAnalytics(userId: string) {
  // Get last 30 days of workout data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const workoutLogs = await prisma.workout_log_entries.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate }
    },
    include: {
      exercises: true
    }
  });

  // Group by date and calculate daily stats
  const dailyStats = workoutLogs.reduce((acc, log) => {
    const dateKey = log.date.toISOString().split('T')[0];

    if (!dateKey) return acc;

    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: log.date,
        totalVolume: 0,
        totalSets: 0,
        totalReps: 0,
        muscleGroups: new Set()
      };
    }

    acc[dateKey].totalVolume += log.trainingVolume || 0;
    acc[dateKey].totalSets += 1;
    acc[dateKey].totalReps += log.reps;
    log.exercises.muscleGroups.forEach((mg: string) => acc[dateKey]?.muscleGroups.add(mg));

    return acc;
  }, {} as any);

  // Create or update analytics records
  const analyticsPromises = Object.entries(dailyStats).map(([dateKey, stats]: [string, any]) => {
    const topMuscleGroup = Array.from(stats.muscleGroups).length > 0
      ? Array.from(stats.muscleGroups)[0] as string
      : null;

    return prisma.workout_analytics.upsert({
      where: { userId_date: { userId, date: new Date(dateKey) } },
      update: {
        totalWorkouts: 1,
        totalVolume: stats.totalVolume,
        totalSets: stats.totalSets,
        totalReps: stats.totalReps,
        topMuscleGroup,
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        userId,
        date: new Date(dateKey),
        totalWorkouts: 1,
        totalVolume: stats.totalVolume,
        totalSets: stats.totalSets,
        totalReps: stats.totalReps,
        topMuscleGroup,
        updatedAt: new Date()
      }
    });
  });

  return Promise.all(analyticsPromises);
}

// ============================================================================
// MARKETPLACE QUERIES
// ============================================================================

/**
 * Get marketplace templates
 */
export async function getMarketplaceTemplates(filters: any = {}) {
  return getWorkoutTemplates({ ...filters, publicOnly: true });
}

/**
 * Get marketplace programs
 */
export async function getMarketplacePrograms(filters: any = {}) {
  return getTrainingPrograms({ ...filters, publicOnly: true });
}

/**
 * Get featured content
 */
export async function getFeaturedContent() {
  const [templates, programs] = await Promise.all([
    prisma.workout_templates.findMany({
      where: { isPublic: true, isActive: true, rating: { gte: 4.5 } },
      include: {
        users: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { template_ratings: true }
        }
      },
      orderBy: { rating: 'desc' },
      take: 6
    }),
    prisma.program_templates.findMany({
      where: { isPublic: true, isActive: true, rating: { gte: 4.5 } },
      include: {
        users: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { program_ratings: true, program_subscriptions: true }
        }
      },
      orderBy: { rating: 'desc' },
      take: 6
    })
  ]);

  return { templates, programs };
}

/**
 * Get top rated content
 */
export async function getTopRatedContent() {
  const [templates, programs] = await Promise.all([
    prisma.workout_templates.findMany({
      where: { isPublic: true, isActive: true, ratingCount: { gte: 5 } },
      include: {
        users: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { template_ratings: true }
        }
      },
      orderBy: [{ rating: 'desc' }, { ratingCount: 'desc' }],
      take: 10
    }),
    prisma.program_templates.findMany({
      where: { isPublic: true, isActive: true, ratingCount: { gte: 5 } },
      include: {
        users: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { program_ratings: true, program_subscriptions: true }
        }
      },
      orderBy: [{ rating: 'desc' }, { ratingCount: 'desc' }],
      take: 10
    })
  ]);

  return { templates, programs };
}

/**
 * Get popular content
 */
export async function getPopularContent() {
  const [templates, programs] = await Promise.all([
    prisma.workout_templates.findMany({
      where: { isPublic: true, isActive: true },
      include: {
        users: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { template_ratings: true }
        }
      },
      orderBy: { purchaseCount: 'desc' },
      take: 10
    }),
    prisma.program_templates.findMany({
      where: { isPublic: true, isActive: true },
      include: {
        users: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { program_ratings: true, program_subscriptions: true }
        }
      },
      orderBy: { purchaseCount: 'desc' },
      take: 10
    })
  ]);

  return { templates, programs };
}

/**
 * Get recommended content for a user
 */
export async function getRecommendedContent(userId?: string) {
  if (!userId) {
    // Return popular content for anonymous users
    return getPopularContent();
  }

  // Get user's preferences and past purchases
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      fitnessGoals: true,
      experienceLevel: true,
      preferredWorkoutTypes: true,
      template_purchases: {
        include: {
          workout_templates: {
            select: { category: true, difficulty: true, tags: true }
          }
        }
      },
      program_purchases: {
        include: {
          program_templates: {
            select: { category: true, difficulty: true, tags: true }
          }
        }
      }
    }
  });

  if (!user) {
    return getPopularContent();
  }

  // Extract user preferences for recommendations
  const userCategories = [
    ...user.template_purchases.map((p: any) => p.workout_templates.category),
    ...user.program_purchases.map((p: any) => p.program_templates.category)
  ].filter(Boolean) as string[];

  const userTags = [
    ...user.template_purchases.flatMap((p: any) => p.workout_templates.tags),
    ...user.program_purchases.flatMap((p: any) => p.program_templates.tags),
    ...user.fitnessGoals,
    ...user.preferredWorkoutTypes
  ].filter(Boolean) as string[];

  const [templates, programs] = await Promise.all([
    prisma.workout_templates.findMany({
      where: {
        isPublic: true,
        isActive: true,
        OR: [
          { category: { in: userCategories } },
          { difficulty: user.experienceLevel },
          { tags: { hasSome: userTags } }
        ]
      },
      include: {
        users: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { template_ratings: true }
        }
      },
      orderBy: { rating: 'desc' },
      take: 10
    }),
    prisma.program_templates.findMany({
      where: {
        isPublic: true,
        isActive: true,
        OR: [
          { category: { in: userCategories } },
          { difficulty: user.experienceLevel },
          { tags: { hasSome: userTags } }
        ]
      },
      include: {
        users: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { program_ratings: true, program_subscriptions: true }
        }
      },
      orderBy: { rating: 'desc' },
      take: 10
    })
  ]);

  return { templates, programs };
}

// ============================================================================
// ASSESSMENT INTEGRATION QUERIES
// ============================================================================

interface AssessmentData {
  fitness_level: string;
  primary_goal: string;
  movement_limitations: string[];
  experience_years: number;
}

// Link workout session to assessment
export async function link_session_to_assessment(
  session_id: string,
  assessment_id: string
) {
  const assessment = await prisma.assessments.findUnique({
    where: { id: assessment_id }
  });

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  // Extract fitness level and goals from assessment
  const assessment_data: AssessmentData = {
    fitness_level: determine_fitness_level(assessment),
    primary_goal: assessment.primaryGoal || 'GENERAL_FITNESS',
    movement_limitations: assessment.limitations || [],
    experience_years: assessment.experienceYears || 0
  };

  return prisma.workout_sessions.update({
    where: { id: session_id },
    data: {
      assessmentId: assessment_id,
      fitnessLevel: assessment_data.fitness_level,
      primaryGoal: assessment_data.primary_goal,
      updatedAt: new Date()
    }
  });
}

// Determine fitness level from assessment scores
function determine_fitness_level(assessment: any): string {
  // Analyse assessment metrics
  const squat_score = assessment.squatScore || 0;
  const push_score = assessment.pushScore || 0;
  const pull_score = assessment.pullScore || 0;

  const average_score = (squat_score + push_score + pull_score) / 3;

  if (average_score >= 8) return 'ADVANCED';
  if (average_score >= 5) return 'INTERMEDIATE';
  return 'BEGINNER';
}

// Get workout recommendations based on assessment
export async function get_assessment_based_recommendations(
  user_id: string
) {
  // Get most recent assessment
  const latest_assessment = await prisma.assessments.findFirst({
    where: { clientId: user_id },
    orderBy: { createdAt: 'desc' }
  });

  if (!latest_assessment) {
    return null;
  }

  const fitness_level = determine_fitness_level(latest_assessment);

  // Get exercise recommendations
  const exercise_recommendations = get_exercise_recommendations(
    fitness_level,
    latest_assessment.primaryGoal || 'GENERAL_FITNESS',
    'SQUAT' // Example pattern
  );

  return {
    fitness_level,
    recommended_volume: calculate_recommended_volume(fitness_level),
    recommended_frequency: calculate_recommended_frequency(fitness_level),
    training_phase: exercise_recommendations.progression_level,
    coaching_cues: exercise_recommendations.coaching_cues
  };
}

function calculate_recommended_volume(fitness_level: string): number {
  const volume_map = {
    BEGINNER: 10, // 10 sets per session
    INTERMEDIATE: 15,
    ADVANCED: 20
  };
  return volume_map[fitness_level as keyof typeof volume_map] || 12;
}

function calculate_recommended_frequency(fitness_level: string): number {
  const frequency_map = {
    BEGINNER: 3, // 3 sessions per week
    INTERMEDIATE: 4,
    ADVANCED: 5
  };
  return frequency_map[fitness_level as keyof typeof frequency_map] || 3;
}

// ============================================================================
// AI DATA PIPELINE QUERIES
// ============================================================================

interface AITrainingData {
  user_profile: {
    fitness_level: string;
    primary_goal: string;
    experience_years: number;
  };
  workout_history: {
    total_sessions: number;
    average_volume: number;
    favourite_exercises: string[];
    consistency_score: number;
  };
  performance_metrics: {
    strength_progression: number;
    volume_progression: number;
    technique_scores: number[];
  };
  preferences: {
    preferred_set_types: string[];
    preferred_rep_ranges: [number, number];
    preferred_rest_durations: number[];
  };
}

// Prepare workout data for AI analysis
export async function prepare_ai_training_data(
  user_id: string
): Promise<AITrainingData> {
  // Get all user sessions from last 90 days
  const ninety_days_ago = new Date();
  ninety_days_ago.setDate(ninety_days_ago.getDate() - 90);

  const sessions = await prisma.workout_sessions.findMany({
    where: {
      userId: user_id,
      date: { gte: ninety_days_ago },
      isComplete: true
    },
    include: {
      workout_log_entries: {
        include: {
          exercises: true
        }
      }
    },
    orderBy: { date: 'asc' }
  });

  const entries = sessions.flatMap(s => s.workout_log_entries);

  // Calculate metrics
  const total_volume = entries.reduce((sum, e) => sum + (e.trainingVolume || 0), 0);
  const average_volume = sessions.length > 0 ? total_volume / sessions.length : 0;

  // Find favourite exercises (most frequently used)
  const exercise_frequency = new Map<string, number>();
  entries.forEach(e => {
    exercise_frequency.set(
      e.exerciseId,
      (exercise_frequency.get(e.exerciseId) || 0) + 1
    );
  });

  const favourite_exercises = Array.from(exercise_frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  // Calculate consistency score (sessions per week)
  const weeks_in_period = 13; // ~90 days
  const consistency_score = (sessions.length / weeks_in_period) / 4; // Normalised to 0-1

  // Get latest assessment
  const latest_assessment = await prisma.assessments.findFirst({
    where: { clientId: user_id },
    orderBy: { createdAt: 'desc' }
  });

  return {
    user_profile: {
      fitness_level: 'INTERMEDIATE', // Default since assessments doesn't have fitnessLevel field
      primary_goal: latest_assessment?.primaryGoal || 'GENERAL_FITNESS',
      experience_years: latest_assessment?.experienceYears || 1
    },
    workout_history: {
      total_sessions: sessions.length,
      average_volume,
      favourite_exercises,
      consistency_score: Math.min(consistency_score, 1)
    },
    performance_metrics: {
      strength_progression: calculate_strength_progression(entries),
      volume_progression: calculate_volume_progression(sessions),
      technique_scores: entries
        .filter(e => e.formQuality !== null)
        .map(e => e.formQuality!)
    },
    preferences: {
      preferred_set_types: calculate_preferred_set_types(entries),
      preferred_rep_ranges: calculate_preferred_rep_range(entries),
      preferred_rest_durations: calculate_preferred_rest_durations(entries)
    }
  };
}

function calculate_strength_progression(entries: any[]): number {
  // Compare first 20% of entries with last 20%
  const total = entries.length;
  if (total < 10) return 0; // Need minimum data

  const early_entries = entries.slice(0, Math.floor(total * 0.2));
  const recent_entries = entries.slice(Math.floor(total * 0.8));

  const early_avg_volume = early_entries.reduce((sum, e) => sum + (e.trainingVolume || 0), 0) / early_entries.length;
  const recent_avg_volume = recent_entries.reduce((sum, e) => sum + (e.trainingVolume || 0), 0) / recent_entries.length;

  return early_avg_volume > 0 ? ((recent_avg_volume - early_avg_volume) / early_avg_volume) * 100 : 0;
}

function calculate_volume_progression(sessions: any[]): number {
  if (sessions.length < 2) return 0;

  const first_session = sessions[0];
  const last_session = sessions[sessions.length - 1];

  const first_volume = first_session.totalVolume || 0;
  const last_volume = last_session.totalVolume || 0;

  return first_volume > 0 ? ((last_volume - first_volume) / first_volume) * 100 : 0;
}

function calculate_preferred_set_types(entries: any[]): string[] {
  const set_type_counts = new Map<string, number>();
  entries.forEach(e => {
    set_type_counts.set(e.setType, (set_type_counts.get(e.setType) || 0) + 1);
  });

  return Array.from(set_type_counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);
}

function calculate_preferred_rep_range(entries: any[]): [number, number] {
  const reps = entries.map(e => e.reps).filter(r => r > 0);
  if (reps.length === 0) return [8, 12];

  reps.sort((a, b) => a - b);
  const percentile_25 = reps[Math.floor(reps.length * 0.25)];
  const percentile_75 = reps[Math.floor(reps.length * 0.75)];

  return [percentile_25, percentile_75];
}

function calculate_preferred_rest_durations(entries: any[]): number[] {
  const rest_durations = entries
    .map(e => e.restSeconds)
    .filter(r => r !== null && r !== undefined) as number[];

  if (rest_durations.length === 0) return [60, 90, 120];

  const avg = rest_durations.reduce((sum, r) => sum + r, 0) / rest_durations.length;
  return [Math.floor(avg * 0.8), Math.floor(avg), Math.floor(avg * 1.2)];
}

// ============================================================================
// GAMIFICATION SYSTEM QUERIES
// ============================================================================

interface AchievementCriteria {
  type: 'VOLUME' | 'CONSISTENCY' | 'STRENGTH' | 'TECHNIQUE' | 'MILESTONE';
  threshold: number;
  comparison: 'GREATER_THAN' | 'EQUALS' | 'STREAK';
  metric: string;
}

interface ExperiencePointsBreakdown {
  base_points: number;
  volume_bonus: number;
  technique_bonus: number;
  consistency_bonus: number;
  achievement_bonus: number;
  total: number;
}

// Calculate experience points for a session
export async function calculate_session_experience_points(
  session_id: string
): Promise<ExperiencePointsBreakdown> {
  const session = await prisma.workout_sessions.findUnique({
    where: { id: session_id },
    include: {
      workout_log_entries: true
    }
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const breakdown: ExperiencePointsBreakdown = {
    base_points: 100, // Base points for completing session
    volume_bonus: 0,
    technique_bonus: 0,
    consistency_bonus: 0,
    achievement_bonus: 0,
    total: 0
  };

  // Volume bonus (1 point per 100kg total volume)
  const total_volume = session.totalVolume || 0;
  breakdown.volume_bonus = Math.floor(total_volume / 100);

  // Technique bonus (average form quality)
  const entries_with_form = session.workout_log_entries.filter(e => e.formQuality !== null);
  if (entries_with_form.length > 0) {
    const avg_form = entries_with_form.reduce((sum, e) => sum + (e.formQuality || 0), 0) / entries_with_form.length;
    breakdown.technique_bonus = Math.floor(avg_form * 20); // Max 100 bonus for perfect form
  }

  // Consistency bonus (check if session continues a streak)
  const streak_bonus = await calculate_consistency_streak_bonus(session.userId, session.date);
  breakdown.consistency_bonus = streak_bonus;

  // Achievement bonus (any personal records)
  const pr_count = session.workout_log_entries.filter(e => e.personalRecord || e.volumeRecord).length;
  breakdown.achievement_bonus = pr_count * 50; // 50 points per PR

  breakdown.total = breakdown.base_points + breakdown.volume_bonus + breakdown.technique_bonus + breakdown.consistency_bonus + breakdown.achievement_bonus;

  return breakdown;
}

async function calculate_consistency_streak_bonus(user_id: string, session_date: Date): Promise<number> {
  // Get recent sessions to calculate streak
  const seven_days_ago = new Date(session_date);
  seven_days_ago.setDate(seven_days_ago.getDate() - 7);

  const recent_sessions = await prisma.workout_sessions.findMany({
    where: {
      userId: user_id,
      date: {
        gte: seven_days_ago,
        lte: session_date
      },
      isComplete: true
    },
    orderBy: { date: 'desc' }
  });

  // Award bonus for 3+ sessions in 7 days
  if (recent_sessions.length >= 3) {
    return 50 * recent_sessions.length; // Escalating bonus
  }

  return 0;
}

// Check and award achievements after session
export async function check_and_award_achievements(
  user_id: string,
  session_id: string
): Promise<string[]> {
  const awarded_achievement_ids: string[] = [];

  // Get all achievements
  const all_achievements = await prisma.achievements.findMany();

  // Get user's existing achievements
  const existing_achievements = await prisma.user_achievements.findMany({
    where: { userId: user_id },
    select: { achievementId: true }
  });

  const existing_ids = new Set(existing_achievements.map(a => a.achievementId));

  // Check each achievement
  for (const achievement of all_achievements) {
    if (existing_ids.has(achievement.id)) continue; // Already earned

    const criteria = achievement.criteria as unknown as AchievementCriteria;
    const meets_criteria = await check_achievement_criteria(user_id, session_id, criteria);

    if (meets_criteria) {
      // Award achievement
      await prisma.user_achievements.create({
        data: {
          id: crypto.randomUUID(),
          userId: user_id,
          achievementId: achievement.id,
          sessionId: session_id
        }
      });

      awarded_achievement_ids.push(achievement.id);
    }
  }

  return awarded_achievement_ids;
}

async function check_achievement_criteria(
  user_id: string,
  session_id: string,
  criteria: AchievementCriteria
): Promise<boolean> {
  switch (criteria.type) {
    case 'VOLUME':
      return check_volume_achievement(user_id, session_id, criteria);
    case 'CONSISTENCY':
      return check_consistency_achievement(user_id, criteria);
    case 'STRENGTH':
      return check_strength_achievement(user_id, criteria);
    case 'TECHNIQUE':
      return check_technique_achievement(user_id, session_id, criteria);
    case 'MILESTONE':
      return check_milestone_achievement(user_id, criteria);
    default:
      return false;
  }
}

async function check_volume_achievement(
  _user_id: string,
  session_id: string,
  criteria: AchievementCriteria
): Promise<boolean> {
  const session = await prisma.workout_sessions.findUnique({
    where: { id: session_id }
  });

  if (!session) return false;

  const total_volume = session.totalVolume || 0;
  return total_volume >= criteria.threshold;
}

// ============================================================================
// USER EXERCISES (CUSTOM EXERCISES) QUERIES
// ============================================================================

/**
 * List user's custom exercises
 */
export async function listUserExercisesDB(userId: string, filters: any = {}) {
  const where: any = {
    createdBy: userId,
    isCustom: true,
    isActive: true
  };

  if (filters.q) {
    where.name = { contains: filters.q, mode: 'insensitive' };
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.muscle) {
    where.muscleGroups = { has: filters.muscle };
  }
  if (filters.equipment) {
    where.equipment = { has: filters.equipment };
  }

  return prisma.exercises.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Create user's custom exercise
 */
export async function createUserExerciseDB(userId: string, data: any) {
  return prisma.exercises.create({
    data: {
      id: crypto.randomUUID(),
      name: data.name || 'Custom Exercise',
      category: data.category || 'Custom',
      muscleGroups: data.muscleGroups || [],
      equipment: data.equipment || [],
      instructions: data.instructions ?? null,
      difficulty: data.difficulty || 'BEGINNER',
      safetyNotes: data.safetyNotes ?? null,
      // TODO: Add 'tags' field to exercises table
      // tags: data.tags || [],
      createdBy: userId,
      isCustom: true,
      updatedAt: new Date()
    }
  });
}

/**
 * Get user's custom exercise by ID
 */
export async function getUserExerciseDB(userId: string, exerciseId: string) {
  return prisma.exercises.findFirst({
    where: {
      id: exerciseId,
      createdBy: userId,
      isCustom: true
    }
  });
}

/**
 * Update user's custom exercise
 */
export async function updateUserExerciseDB(userId: string, exerciseId: string, data: any) {
  // First verify ownership
  const exercise = await prisma.exercises.findFirst({
    where: {
      id: exerciseId,
      createdBy: userId,
      isCustom: true
    }
  });

  if (!exercise) {
    throw new Error('Exercise not found or not owned by user');
  }

  return prisma.exercises.update({
    where: { id: exerciseId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}

/**
 * Delete user's custom exercise
 */
export async function deleteUserExerciseDB(userId: string, exerciseId: string) {
  // First verify ownership
  const exercise = await prisma.exercises.findFirst({
    where: {
      id: exerciseId,
      createdBy: userId,
      isCustom: true
    }
  });

  if (!exercise) {
    throw new Error('Exercise not found or not owned by user');
  }

  return prisma.exercises.update({
    where: { id: exerciseId },
    data: {
      isActive: false,
      updatedAt: new Date()
    }
  });
}

// ============================================================================
// EXERCISE MEDIA QUERIES
// ============================================================================

/**
 * List exercise media
 */
export async function listExerciseMediaDB(exerciseId: string) {
  // Placeholder: Return empty array as media table may not exist
  return [];
}

/**
 * Add exercise media
 */
export async function addExerciseMediaDB(exerciseId: string, data: any) {
  // Placeholder: Return mock media object
  return {
    id: crypto.randomUUID(),
    exerciseId,
    url: data.url,
    type: data.type || 'image',
    createdAt: new Date()
  };
}

/**
 * Update exercise media
 */
export async function updateExerciseMediaDB(mediaId: string, data: any) {
  // Placeholder: Return mock updated media object
  return {
    id: mediaId,
    ...data,
    updatedAt: new Date()
  };
}

/**
 * Delete exercise media
 */
export async function deleteExerciseMediaDB(mediaId: string) {
  // Placeholder: Return success
  return { success: true, id: mediaId };
}

/**
 * Attach media to workout entry
 */
export async function attachMediaToEntryDB(entryId: string, mediaId: string) {
  // Placeholder: Return success
  return { success: true, entryId, mediaId };
}

/**
 * Detach media from workout entry
 */
export async function detachMediaFromEntryDB(entryId: string, mediaId: string) {
  // Placeholder: Return success
  return { success: true, entryId, mediaId };
}

async function check_consistency_achievement(
  user_id: string,
  criteria: AchievementCriteria
): Promise<boolean> {
  const thirty_days_ago = new Date();
  thirty_days_ago.setDate(thirty_days_ago.getDate() - 30);

  const session_count = await prisma.workout_sessions.count({
    where: {
      userId: user_id,
      date: { gte: thirty_days_ago },
      isComplete: true
    }
  });

  return session_count >= criteria.threshold;
}

async function check_strength_achievement(
  user_id: string,
  criteria: AchievementCriteria
): Promise<boolean> {
  // Check for personal records
  const pr_count = await prisma.workout_log_entries.count({
    where: {
      userId: user_id,
      personalRecord: true
    }
  });

  return pr_count >= criteria.threshold;
}

async function check_technique_achievement(
  _user_id: string,
  session_id: string,
  criteria: AchievementCriteria
): Promise<boolean> {
  const session = await prisma.workout_sessions.findUnique({
    where: { id: session_id },
    include: {
      workout_log_entries: true
    }
  });

  if (!session) return false;

  const entries_with_form = session.workout_log_entries.filter(e => e.formQuality !== null);
  if (entries_with_form.length === 0) return false;

  const avg_form = entries_with_form.reduce((sum, e) => sum + (e.formQuality || 0), 0) / entries_with_form.length;
  return avg_form >= criteria.threshold;
}

async function check_milestone_achievement(
  user_id: string,
  criteria: AchievementCriteria
): Promise<boolean> {
  const total_sessions = await prisma.workout_sessions.count({
    where: {
      userId: user_id,
      isComplete: true
    }
  });

  return total_sessions === criteria.threshold; // Exact milestone
}

// Update session with XP and achievements
export async function finalise_session_with_gamification(
  session_id: string
) {
  const session = await prisma.workout_sessions.findUnique({
    where: { id: session_id }
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Calculate XP
  const xp_breakdown = await calculate_session_experience_points(session_id);

  // Check achievements
  const new_achievements = await check_and_award_achievements(session.userId, session_id);

  // Add achievement bonus to XP
  const achievement_xp = new_achievements.length * 100;
  xp_breakdown.achievement_bonus = achievement_xp;
  xp_breakdown.total += achievement_xp;

  // Update session
  await prisma.workout_sessions.update({
    where: { id: session_id },
    data: {
      experiencePoints: xp_breakdown.total,
      achievementsEarned: new_achievements,
      updatedAt: new Date()
    }
  });

  return {
    experience_points: xp_breakdown,
    achievements_earned: new_achievements
  };
}

// ============================================================================
// PERSONAL RECORDS DETECTION
// ============================================================================

/**
 * Check if a workout entry is a personal record for weight
 * @param userId - User ID
 * @param exerciseId - Exercise ID
 * @param weight - Weight lifted (numeric value)
 * @param reps - Number of reps
 * @returns true if this is a PR, false otherwise
 */
async function check_personal_record(
  userId: string,
  exerciseId: string,
  weight: number,
  reps: number
): Promise<boolean> {
  // Find the highest weight for this exercise with the same or more reps
  const previous_best = await prisma.workout_log_entries.findFirst({
    where: {
      userId,
      exerciseId,
      reps: { gte: reps }
    },
    orderBy: {
      trainingVolume: 'desc'
    },
    select: {
      weight: true,
      trainingVolume: true
    }
  });

  if (!previous_best) {
    // First time doing this exercise - it's a PR!
    return true;
  }

  // Extract numeric weight from previous best (handles "135 lbs" format)
  const previous_weight = parseFloat(previous_best.weight.replace(/[^\d.,]/g, ''));

  // Is current weight higher than previous best?
  return weight > previous_weight;
}

/**
 * Check if a workout entry is a volume record
 * @param userId - User ID
 * @param exerciseId - Exercise ID
 * @param volume - Training volume (weight × reps)
 * @returns true if this is a volume PR, false otherwise
 */
async function check_volume_record(
  userId: string,
  exerciseId: string,
  volume: number
): Promise<boolean> {
  // Find the highest training volume for this exercise
  const previous_best = await prisma.workout_log_entries.findFirst({
    where: {
      userId,
      exerciseId
    },
    orderBy: {
      trainingVolume: 'desc'
    },
    select: {
      trainingVolume: true
    }
  });

  if (!previous_best || !previous_best.trainingVolume) {
    // First time doing this exercise - it's a volume PR!
    return true;
  }

  // Is current volume higher than previous best?
  return volume > previous_best.trainingVolume;
}
