/**
 * Workout Log Database Queries for Massimino
 * Comprehensive query functions for workout tracking and management
 */

import { prisma } from './client';
import { 
  type WorkoutLogEntry,
  type Exercise,
  type WorkoutSession 
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

// ============================================================================
// WORKOUT LOG ENTRY QUERIES
// ============================================================================

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
  const total = await prisma.workoutLogEntry.count({ where });

  // Get entries with relationships
  const entries = await prisma.workoutLogEntry.findMany({
    where,
    include: {
      exercise: true,
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      coach: {
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

  return {
    entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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
  return prisma.workoutLogEntry.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      exercise: true,
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      coach: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });
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
    const entry = await tx.workoutLogEntry.create({
      data: {
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
        ...(data.userComments !== undefined && { userComments: data.userComments }),
        ...(data.coachFeedback !== undefined && { coachFeedback: data.coachFeedback }),
      },
    });

    await tx.exercise.update({
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
  const existing = await prisma.workoutLogEntry.findFirst({
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

  const updated = await prisma.workoutLogEntry.update({
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
    await prisma.exercise.update({
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
  const result = await prisma.workoutLogEntry.deleteMany({
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

  const entries = await prisma.workoutLogEntry.findMany({
    where,
    include: {
      exercise: true,
    },
  });

  const totalWorkouts = new Set(entries.map(e => e.date.toDateString())).size;
  const totalVolume = entries.reduce((sum, e) => sum + (e.trainingVolume || 0), 0);
  const totalSets = entries.length;
  const totalReps = entries.reduce((sum, e) => sum + e.reps, 0);

  // Calculate average workout duration
  const sessions = await prisma.workoutSession.findMany({
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
      name: entries.find(e => e.exerciseId === exerciseId)?.exercise.name || '',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Volume by muscle group
  const volumeByMuscleGroup = entries.reduce((acc, entry) => {
    entry.exercise.muscleGroups.forEach(muscleGroup => {
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

  return prisma.exercise.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

/**
 * Get exercise by ID
 */
export async function getExercise(id: string): Promise<Exercise | null> {
  return prisma.exercise.findUnique({
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
}): Promise<Exercise> {
  return prisma.exercise.create({
    data: {
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
      isCustom: data.isCustom || false
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
  return prisma.exercise.update({
    where: { id },
    data,
  });
}

/**
 * Delete an exercise (soft delete by setting isActive to false)
 */
export async function deleteExercise(id: string): Promise<boolean> {
  const result = await prisma.exercise.update({
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

  return prisma.exerciseVariation.findMany({
    where,
    include: {
      exercise: {
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
  return prisma.exerciseVariation.findUnique({
    where: { id },
    include: {
      exercise: {
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
  return prisma.exerciseVariation.create({
    data: {
      exerciseId: data.exerciseId,
      name: data.name,
      description: data.description ?? null,
      difficulty: data.difficulty || 'BEGINNER',
      videoUrl: data.videoUrl ?? null,
      imageUrl: data.imageUrl ?? null,
      instructions: data.instructions ?? null
    },
    include: {
      exercise: {
        select: { id: true, name: true, category: true }
      }
    }
  });
}

/**
 * Update exercise variation
 */
export async function updateExerciseVariation(id: string, data: any) {
  return prisma.exerciseVariation.update({
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
      exercise: {
        select: { id: true, name: true, category: true }
      }
    }
  });
}

/**
 * Delete exercise variation
 */
export async function deleteExerciseVariation(id: string) {
  const result = await prisma.exerciseVariation.update({
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

  const total = await prisma.workoutSession.count({ where });

  const sessions = await prisma.workoutSession.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      coach: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      entries: {
        include: {
          exercise: true,
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { date: 'desc' },
    skip: offset,
    take: limit,
  });

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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
  return prisma.workoutSession.findFirst({
    where: { id, userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      coach: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      entries: {
        include: {
          exercise: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  });
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

  return prisma.workoutSession.create({
    data: {
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
  const existing = await prisma.workoutSession.findFirst({
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

  return prisma.workoutSession.update({
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
  const session = await prisma.workoutSession.findFirst({
    where: { id, userId },
  });

  if (!session) {
    return null;
  }

  const endTimeToUse = endTime || new Date();
  const duration = Math.floor((endTimeToUse.getTime() - session.startTime.getTime()) / 1000);

  // Calculate total volume and stats
  const entries = await prisma.workoutLogEntry.findMany({
    where: { userId, date: session.date },
  });

  const totalVolume = entries.reduce((sum, entry) => sum + (entry.trainingVolume || 0), 0);
  const totalSets = entries.length;
  const totalReps = entries.reduce((sum, entry) => sum + entry.reps, 0);

  return prisma.workoutSession.update({
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
  const result = await prisma.workoutSession.deleteMany({
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

  const total = await prisma.workoutLogEntry.count({ where });

  const entries = await prisma.workoutLogEntry.findMany({
    where,
    include: {
      exercise: true,
      user: {
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

  return {
    entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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
  return prisma.workoutLogEntry.update({
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
  const exercises = await prisma.exercise.findMany({
    select: { category: true },
    where: { isActive: true },
  });

  return [...new Set(exercises.map(e => e.category))];
}

/**
 * Get muscle groups for filtering
 */
export async function getMuscleGroups(): Promise<string[]> {
  const exercises = await prisma.exercise.findMany({
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
  const exercises = await prisma.exercise.findMany({
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
  return prisma.exercise.findMany({
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

  return prisma.workoutTemplate.findMany({
    where,
    include: {
      creator: {
        select: { id: true, name: true, trainerVerified: true }
      },
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' }
      },
      _count: {
        select: { purchases: true, ratings: true }
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
  return prisma.workoutTemplate.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, name: true, trainerVerified: true }
      },
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' }
      },
      ratings: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: { purchases: true, ratings: true }
      }
    }
  });
}

/**
 * Create workout template
 */
export async function createWorkoutTemplate(data: any) {
  return prisma.workoutTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      createdBy: data.createdBy,
      category: data.category,
      difficulty: data.difficulty || 'BEGINNER',
      duration: data.duration,
      equipment: data.equipment || [],
      isPublic: data.isPublic || false,
      price: data.price,
      currency: data.currency || 'USD',
      tags: data.tags || [],
      exercises: {
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
      exercises: { include: { exercise: true } }
    }
  });
}

/**
 * Update workout template
 */
export async function updateWorkoutTemplate(id: string, data: any) {
  return prisma.workoutTemplate.update({
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
  return prisma.workoutTemplate.update({
    where: { id },
    data: { isActive: false }
  });
}

/**
 * Get user's templates
 */
export async function getMyTemplates(userId: string) {
  return prisma.workoutTemplate.findMany({
    where: { createdBy: userId, isActive: true },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' }
      },
      _count: {
        select: { purchases: true, ratings: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Search workout templates
 */
export async function searchWorkoutTemplates(query: string, options: any = {}) {
  return prisma.workoutTemplate.findMany({
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
      creator: {
        select: { id: true, name: true, trainerVerified: true }
      },
      _count: {
        select: { purchases: true, ratings: true }
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
  const template = await prisma.workoutTemplate.findUnique({
    where: { id: templateId },
    select: { price: true, currency: true }
  });

  if (!template) throw new Error('Template not found');

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.templatePurchase.create({
      data: {
        userId,
        templateId,
        price: template.price || 0,
        currency: template.currency
      }
    });

    await tx.workoutTemplate.update({
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
    const rating = await tx.templateRating.upsert({
      where: { userId_templateId: { userId, templateId } },
      update: { rating: data.rating, review: data.review },
      create: {
        userId,
        templateId,
        rating: data.rating,
        review: data.review
      }
    });

    // Recalculate average rating
    const ratings = await tx.templateRating.findMany({
      where: { templateId },
      select: { rating: true }
    });

    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await tx.workoutTemplate.update({
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

  return prisma.programTemplate.findMany({
    where,
    include: {
      creator: {
        select: { id: true, name: true, trainerVerified: true }
      },
      weeks: { orderBy: { weekNumber: 'asc' } },
      _count: {
        select: { purchases: true, ratings: true, subscriptions: true }
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
  return prisma.programTemplate.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, name: true, trainerVerified: true }
      },
      weeks: { orderBy: { weekNumber: 'asc' } },
      workouts: {
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' }
          }
        }
      },
      ratings: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: { purchases: true, ratings: true, subscriptions: true }
      }
    }
  });
}

/**
 * Create training program
 */
export async function createTrainingProgram(data: any) {
  return prisma.programTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      createdBy: data.createdBy,
      duration: data.duration,
      difficulty: data.difficulty || 'BEGINNER',
      category: data.category,
      isPublic: data.isPublic || false,
      price: data.price,
      currency: data.currency || 'USD',
      tags: data.tags || [],
      weeks: {
        create: data.weeks?.map((week: any) => ({
          weekNumber: week.weekNumber,
          title: week.title,
          description: week.description,
          workouts: week.workouts
        })) || []
      }
    },
    include: {
      weeks: { orderBy: { weekNumber: 'asc' } }
    }
  });
}

/**
 * Update training program
 */
export async function updateTrainingProgram(id: string, data: any) {
  return prisma.programTemplate.update({
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
  return prisma.programTemplate.update({
    where: { id },
    data: { isActive: false }
  });
}

/**
 * Get user's programs
 */
export async function getMyPrograms(userId: string) {
  return prisma.programTemplate.findMany({
    where: { createdBy: userId, isActive: true },
    include: {
      weeks: { orderBy: { weekNumber: 'asc' } },
      _count: {
        select: { purchases: true, ratings: true, subscriptions: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Search training programs
 */
export async function searchTrainingPrograms(query: string, options: any = {}) {
  return prisma.programTemplate.findMany({
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
      creator: {
        select: { id: true, name: true, trainerVerified: true }
      },
      _count: {
        select: { purchases: true, ratings: true, subscriptions: true }
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
  return prisma.programSubscription.findMany({
    where: { userId, isActive: true },
    include: {
      program: {
        include: {
          creator: {
            select: { id: true, name: true, trainerVerified: true }
          },
          weeks: { orderBy: { weekNumber: 'asc' } }
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
  const program = await prisma.programTemplate.findUnique({
    where: { id: programId },
    select: { price: true, currency: true }
  });

  if (!program) throw new Error('Program not found');

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.programPurchase.create({
      data: {
        userId,
        programId,
        price: program.price || 0,
        currency: program.currency
      }
    });

    await tx.programTemplate.update({
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
  return prisma.programSubscription.create({
    data: {
      userId,
      programId,
      currentWeek: 1,
      currentDay: 1
    }
  });
}

/**
 * Rate program
 */
export async function rateProgram(programId: string, userId: string, data: any) {
  return prisma.$transaction(async (tx) => {
    const rating = await tx.programRating.upsert({
      where: { userId_programId: { userId, programId } },
      update: { rating: data.rating, review: data.review },
      create: {
        userId,
        programId,
        rating: data.rating,
        review: data.review
      }
    });

    // Recalculate average rating
    const ratings = await tx.programRating.findMany({
      where: { programId },
      select: { rating: true }
    });

    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await tx.programTemplate.update({
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
  return prisma.programSubscription.update({
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

  return prisma.workoutAnalytics.findMany({
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

  return prisma.progressMetric.findMany({
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

  return prisma.personalRecord.findMany({
    where,
    include: {
      exercise: {
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
  return prisma.progressMetric.create({
    data: {
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
  return prisma.personalRecord.create({
    data: {
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

  const workoutLogs = await prisma.workoutLogEntry.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate }
    },
    include: {
      exercise: true
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
    log.exercise.muscleGroups.forEach(mg => acc[dateKey]?.muscleGroups.add(mg));

    return acc;
  }, {} as any);

  // Create or update analytics records
  const analyticsPromises = Object.entries(dailyStats).map(([dateKey, stats]: [string, any]) => {
    const topMuscleGroup = Array.from(stats.muscleGroups).length > 0
      ? Array.from(stats.muscleGroups)[0] as string
      : null;

    return prisma.workoutAnalytics.upsert({
      where: { userId_date: { userId, date: new Date(dateKey) } },
      update: {
        totalWorkouts: 1,
        totalVolume: stats.totalVolume,
        totalSets: stats.totalSets,
        totalReps: stats.totalReps,
        topMuscleGroup
      },
      create: {
        userId,
        date: new Date(dateKey),
        totalWorkouts: 1,
        totalVolume: stats.totalVolume,
        totalSets: stats.totalSets,
        totalReps: stats.totalReps,
        topMuscleGroup
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
    prisma.workoutTemplate.findMany({
      where: { isPublic: true, isActive: true, rating: { gte: 4.5 } },
      include: {
        creator: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { purchases: true, ratings: true }
        }
      },
      orderBy: { rating: 'desc' },
      take: 6
    }),
    prisma.programTemplate.findMany({
      where: { isPublic: true, isActive: true, rating: { gte: 4.5 } },
      include: {
        creator: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { purchases: true, ratings: true, subscriptions: true }
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
    prisma.workoutTemplate.findMany({
      where: { isPublic: true, isActive: true, ratingCount: { gte: 5 } },
      include: {
        creator: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { purchases: true, ratings: true }
        }
      },
      orderBy: [{ rating: 'desc' }, { ratingCount: 'desc' }],
      take: 10
    }),
    prisma.programTemplate.findMany({
      where: { isPublic: true, isActive: true, ratingCount: { gte: 5 } },
      include: {
        creator: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { purchases: true, ratings: true, subscriptions: true }
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
    prisma.workoutTemplate.findMany({
      where: { isPublic: true, isActive: true },
      include: {
        creator: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { purchases: true, ratings: true }
        }
      },
      orderBy: { purchaseCount: 'desc' },
      take: 10
    }),
    prisma.programTemplate.findMany({
      where: { isPublic: true, isActive: true },
      include: {
        creator: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { purchases: true, ratings: true, subscriptions: true }
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fitnessGoals: true,
      experienceLevel: true,
      preferredWorkoutTypes: true,
      templatePurchases: {
        include: {
          template: {
            select: { category: true, difficulty: true, tags: true }
          }
        }
      },
      programPurchases: {
        include: {
          program: {
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
    ...user.templatePurchases.map(p => p.template.category),
    ...user.programPurchases.map(p => p.program.category)
  ].filter(Boolean) as string[];

  const userTags = [
    ...user.templatePurchases.flatMap(p => p.template.tags),
    ...user.programPurchases.flatMap(p => p.program.tags),
    ...user.fitnessGoals,
    ...user.preferredWorkoutTypes
  ].filter(Boolean) as string[];

  const [templates, programs] = await Promise.all([
    prisma.workoutTemplate.findMany({
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
        creator: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { purchases: true, ratings: true }
        }
      },
      orderBy: { rating: 'desc' },
      take: 10
    }),
    prisma.programTemplate.findMany({
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
        creator: {
          select: { id: true, name: true, trainerVerified: true }
        },
        _count: {
          select: { purchases: true, ratings: true, subscriptions: true }
        }
      },
      orderBy: { rating: 'desc' },
      take: 10
    })
  ]);

  return { templates, programs };
}
