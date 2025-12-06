/**
 * Workout Log Validation Schemas for Massimino
 * Comprehensive validation using Zod for workout tracking and management
 */

import { z } from 'zod';
import { SetType, WeightUnit, IntensityType } from '@prisma/client';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Date string validation (YYYY-MM-DD format)
 */
export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be in YYYY-MM-DD format',
});

/**
 * Time string validation (HH:MM format)
 */
export const timeStringSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
  message: 'Time must be in HH:MM format',
});

/**
 * Duration string validation (HH:MM:SS format)
 */
export const durationStringSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
  message: 'Duration must be in HH:MM:SS format',
});

/**
 * Weight string validation (single number or comma-separated)
 */
export const weightStringSchema = z.string().refine(
  (value) => {
    const weights = value.split(',').map(w => w.trim());
    return weights.every(w => !isNaN(parseFloat(w)) && parseFloat(w) > 0);
  },
  {
    message: 'Weight must be a single number or comma-separated numbers (e.g., "40" or "40,45,50")',
  }
);

/**
 * Intensity string validation (%1RM or RPE format)
 */
export const intensityStringSchema = z.string().refine(
  (value) => {
    // Check for percentage format (e.g., "85%")
    if (/^\d{1,3}%$/.test(value)) {
      const percentage = parseInt(value);
      return percentage >= 1 && percentage <= 100;
    }
    // Check for RPE format (e.g., "RPE 8" or "8")
    if (/^(RPE\s?)?[1-9](\.[0-9])?$/.test(value)) {
      const rpe = parseFloat(value.replace('RPE', '').trim());
      return rpe >= 1 && rpe <= 10;
    }
    return false;
  },
  {
    message: 'Intensity must be percentage (e.g., "85%") or RPE (e.g., "RPE 8" or "8")',
  }
);

/**
 * Tempo string validation (e.g., "3-1-1-0")
 */
export const tempoStringSchema = z.string().regex(/^\d+-\d+-\d+-\d+$/, {
  message: 'Tempo must be in format: eccentric-pause-concentric-pause (e.g., "3-1-1-0")',
});

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const setTypeSchema = z.nativeEnum(SetType);
export const weightUnitSchema = z.nativeEnum(WeightUnit);
export const intensityTypeSchema = z.nativeEnum(IntensityType);

// ============================================================================
// WORKOUT LOG ENTRY SCHEMAS
// ============================================================================

/**
 * Base workout log entry schema
 */
export const workoutLogEntryBaseSchema = z.object({
  sessionId: z.string().uuid().optional(),
  date: dateStringSchema,
  exerciseId: z.string().min(1, 'Exercise is required'),
  setNumber: z.number().int().positive('Set number must be a positive integer'),
  setType: setTypeSchema,
  reps: z.number().int().positive('Reps must be a positive integer'),
  weight: weightStringSchema,
  unit: weightUnitSchema,
  subOrder: z.string().regex(/^[A-Z]$/).optional(),
  intensity: intensityStringSchema.optional(),
  intensityType: intensityTypeSchema.optional(),
  tempo: tempoStringSchema.optional(),
  restSeconds: z.number().int().min(0, 'Rest time must be non-negative').optional(),
  userComments: z.string().max(500, 'Comments must be less than 500 characters').optional(),
  coachFeedback: z.string().max(1000, 'Coach feedback must be less than 1000 characters').optional(),
});

/**
 * Create workout log entry schema
 */
export const createWorkoutLogEntrySchema = workoutLogEntryBaseSchema;

/**
 * Update workout log entry schema (all fields optional)
 */
export const updateWorkoutLogEntrySchema = workoutLogEntryBaseSchema.partial();

/**
 * Workout log entry with calculated fields
 */
export const workoutLogEntrySchema = workoutLogEntryBaseSchema.extend({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  coachId: z.string().cuid().optional(),
  order: z.string(),
  trainingVolume: z.number().nonnegative().optional(),
  duration: durationStringSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// EXERCISE SCHEMAS
// ============================================================================

/**
 * Create exercise schema
 */
export const createExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(100, 'Exercise name must be less than 100 characters'),
  category: z.string().min(1, 'Category is required'),
  muscleGroups: z.array(z.string()).min(1, 'At least one muscle group is required'),
  equipment: z.array(z.string()).min(1, 'At least one equipment type is required'),
  instructions: z.string().max(2000, 'Instructions must be less than 2000 characters').optional(),
  videoUrl: z.string().url('Must be a valid URL').optional(),
  imageUrl: z.string().url('Must be a valid URL').optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  safetyNotes: z.string().max(1000, 'Safety notes must be less than 1000 characters').optional(),
  // New taxonomy
  bodyPart: z.string().optional(),
  movementPattern: z.string().optional(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  aliasNames: z.array(z.string()).optional(),
  curated: z.boolean().optional(),
  source: z.string().optional(),
  sourceId: z.string().optional(),
});

/**
 * Update exercise schema
 */
export const updateExerciseSchema = createExerciseSchema.partial().extend({
  isActive: z.boolean().optional(),
});

/**
 * Exercise with all fields
 */
export const exerciseSchema = createExerciseSchema.extend({
  id: z.string().cuid(),
  isActive: z.boolean(),
  usageCount: z.number().int().nonnegative(),
  lastUsed: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// WORKOUT SESSION SCHEMAS
// ============================================================================

/**
 * Create workout session schema
 */
export const createWorkoutSessionSchema = z.object({
  date: dateStringSchema,
  title: z.string().max(100, 'Title must be less than 100 characters').optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  startTime: timeStringSchema,
  endTime: timeStringSchema.optional(),
  isTemplate: z.boolean().default(false),
});

/**
 * Update workout session schema
 */
export const updateWorkoutSessionSchema = createWorkoutSessionSchema.partial();

/**
 * Workout session with all fields
 */
export const workoutSessionSchema = createWorkoutSessionSchema.extend({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  coachId: z.string().cuid().optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().int().nonnegative().optional(),
  totalVolume: z.number().nonnegative().optional(),
  totalSets: z.number().int().nonnegative(),
  totalReps: z.number().int().nonnegative(),
  isComplete: z.boolean(),
  isTemplate: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// FILTER AND SORT SCHEMAS
// ============================================================================

/**
 * Date range filter schema
 */
export const dateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
}).refine(
  (data) => data.start <= data.end,
  {
    message: 'Start date must be before or equal to end date',
    path: ['end'],
  }
);

/**
 * Workout filter options schema
 */
export const workoutFilterOptionsSchema = z.object({
  dateRange: dateRangeSchema.optional(),
  exercises: z.array(z.string().cuid()).optional(),
  setTypes: z.array(setTypeSchema).optional(),
  coachId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
});

/**
 * Workout sort options schema
 */
export const workoutSortOptionsSchema = z.object({
  field: z.enum(['date', 'exerciseId', 'setNumber', 'setType', 'reps', 'weight', 'trainingVolume', 'createdAt']),
  direction: z.enum(['asc', 'desc']),
});

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
});

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

/**
 * Create multiple workout entries request
 */
export const createWorkoutEntriesRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  entries: z.array(createWorkoutLogEntrySchema).min(1, 'At least one entry is required'),
});

/**
 * Update workout entry request
 */
export const updateWorkoutEntryRequestSchema = z.object({
  id: z.string().cuid(),
  data: updateWorkoutLogEntrySchema,
});

/**
 * Delete workout entry request
 */
export const deleteWorkoutEntryRequestSchema = z.object({
  id: z.string().cuid(),
});

/**
 * Add coach feedback request
 */
export const addCoachFeedbackRequestSchema = z.object({
  entryId: z.string().cuid(),
  feedback: z.string().min(1, 'Feedback is required').max(1000, 'Feedback must be less than 1000 characters'),
});

// ============================================================================
// SEARCH AND FILTER SCHEMAS
// ============================================================================

/**
 * Exercise search options schema
 */
export const exerciseSearchOptionsSchema = z.object({
  category: z.string().optional(),
  muscleGroups: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  isActive: z.boolean().optional(),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  // New filters
  bodyPart: z.string().optional(),
  movementPattern: z.string().optional(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  curated: z.boolean().optional(),
  // Media filter
  hasMedia: z.boolean().optional(),
  // Sorting options
  sortBy: z.enum(['name', 'mediaCount', 'usageCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Workout session filter options schema
 */
export const workoutSessionFilterOptionsSchema = z.object({
  dateRange: dateRangeSchema.optional(),
  isComplete: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
});

// ============================================================================
// STATISTICS SCHEMAS
// ============================================================================

/**
 * Workout statistics request schema
 */
export const workoutStatsRequestSchema = z.object({
  dateRange: dateRangeSchema.optional(),
});

/**
 * Workout statistics response schema
 */
export const workoutStatsResponseSchema = z.object({
  totalWorkouts: z.number().int().nonnegative(),
  totalVolume: z.number().nonnegative(),
  totalSets: z.number().int().nonnegative(),
  totalReps: z.number().int().nonnegative(),
  averageWorkoutDuration: z.number().nonnegative(),
  mostUsedExercises: z.array(z.object({
    exerciseId: z.string().cuid(),
    count: z.number().int().positive(),
    name: z.string(),
  })),
  volumeByMuscleGroup: z.array(z.object({
    muscleGroup: z.string(),
    volume: z.number().nonnegative(),
  })),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate weight string and return parsed values
 */
export const validateWeightString = (weight: string): number[] => {
  const result = weightStringSchema.safeParse(weight);
  if (!result.success) {
    throw new Error(result.error.errors[0]?.message ?? 'Invalid weight');
  }
  
  return weight
    .split(',')
    .map(w => w.trim())
    .map(w => parseFloat(w))
    .filter(w => !isNaN(w));
};

/**
 * Validate intensity string and return parsed value
 */
export const validateIntensityString = (intensity: string): { value: number; type: 'percentage' | 'rpe' } => {
  const result = intensityStringSchema.safeParse(intensity);
  if (!result.success) {
    throw new Error(result.error.errors[0]?.message ?? 'Invalid intensity');
  }
  
  // Check if it's a percentage
  if (intensity.includes('%')) {
    const percentage = parseInt(intensity);
    return { value: percentage, type: 'percentage' };
  }
  
  // Must be RPE
  const rpe = parseFloat(intensity.replace('RPE', '').trim());
  return { value: rpe, type: 'rpe' };
};

/**
 * Validate tempo string and return parsed values
 */
export const validateTempoString = (tempo: string): { eccentric: number; pause1: number; concentric: number; pause2: number } => {
  const result = tempoStringSchema.safeParse(tempo);
  if (!result.success) {
    throw new Error(result.error.errors[0]?.message ?? 'Invalid tempo');
  }
  
  const [eccentric, pause1, concentric, pause2] = tempo.split('-').map(Number) as [number, number, number, number];
  return { eccentric, pause1, concentric, pause2 };
};

/**
 * Validate date string and return Date object
 */
export const validateDateString = (date: string): Date => {
  const result = dateStringSchema.safeParse(date);
  if (!result.success) {
    throw new Error(result.error.errors[0]?.message ?? 'Invalid date');
  }
  
  return new Date(date);
};

/**
 * Validate time string and return Date object
 */
export const validateTimeString = (time: string): Date => {
  const result = timeStringSchema.safeParse(time);
  if (!result.success) {
    throw new Error(result.error.errors[0]?.message ?? 'Invalid time');
  }
  
  return new Date(`2000-01-01T${time}`);
};

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type CreateWorkoutLogEntryInput = z.infer<typeof createWorkoutLogEntrySchema>;
export type UpdateWorkoutLogEntryInput = z.infer<typeof updateWorkoutLogEntrySchema>;
export type WorkoutLogEntryOutput = z.infer<typeof workoutLogEntrySchema>;

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type ExerciseOutput = z.infer<typeof exerciseSchema>;

export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionSchema>;
export type UpdateWorkoutSessionInput = z.infer<typeof updateWorkoutSessionSchema>;
export type WorkoutSessionOutput = z.infer<typeof workoutSessionSchema>;

export type WorkoutFilterOptionsInput = z.infer<typeof workoutFilterOptionsSchema>;
export type WorkoutSortOptionsInput = z.infer<typeof workoutSortOptionsSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

export type CreateWorkoutEntriesRequest = z.infer<typeof createWorkoutEntriesRequestSchema>;
export type UpdateWorkoutEntryRequest = z.infer<typeof updateWorkoutEntryRequestSchema>;
export type DeleteWorkoutEntryRequest = z.infer<typeof deleteWorkoutEntryRequestSchema>;
export type AddCoachFeedbackRequest = z.infer<typeof addCoachFeedbackRequestSchema>;

export type WorkoutStatsRequest = z.infer<typeof workoutStatsRequestSchema>;
export type WorkoutStatsResponse = z.infer<typeof workoutStatsResponseSchema>;

// ============================================================================
// WORKOUT TEMPLATE SCHEMAS (Phase 3)
// ============================================================================

/**
 * Workout template exercise schema
 */
export const workoutTemplateExerciseSchema = z.object({
  exerciseId: z.string().cuid('Invalid exercise ID'),
  order: z.number().int().positive('Order must be positive'),
  sets: z.number().int().positive('Sets must be positive'),
  reps: z.string().min(1, 'Reps is required'),
  weight: z.string().optional(),
  restTime: z.string().optional(),
  notes: z.string().max(200, 'Notes must be less than 200 characters').optional(),
  isSuperset: z.boolean().default(false),
  supersetGroup: z.string().optional()
});

/**
 * Create workout template schema
 */
export const createWorkoutTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  duration: z.string().max(50, 'Duration must be less than 50 characters').optional(),
  equipment: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  tags: z.array(z.string()).default([]),
  exercises: z.array(workoutTemplateExerciseSchema).min(1, 'At least one exercise is required')
});

/**
 * Update workout template schema
 */
export const updateWorkoutTemplateSchema = createWorkoutTemplateSchema.partial().omit({ exercises: true });

/**
 * Rate template schema
 */
export const rateTemplateSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  review: z.string().max(500, 'Review must be less than 500 characters').optional()
});

// ============================================================================
// TRAINING PROGRAM SCHEMAS (Phase 3)
// ============================================================================

/**
 * Program week schema
 */
export const programWeekSchema = z.object({
  weekNumber: z.number().int().positive('Week number must be positive'),
  title: z.string().max(100, 'Title must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  workouts: z.any() // JSON field for flexible workout structure
});

/**
 * Create training program schema
 */
export const createTrainingProgramSchema = z.object({
  name: z.string().min(1, 'Program name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  duration: z.string().min(1, 'Duration is required').max(50, 'Duration must be less than 50 characters'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  category: z.string().min(1, 'Category is required').optional(),
  isPublic: z.boolean().default(false),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  tags: z.array(z.string()).default([]),
  weeks: z.array(programWeekSchema).min(1, 'At least one week is required')
});

/**
 * Update training program schema
 */
export const updateTrainingProgramSchema = createTrainingProgramSchema.partial().omit({ weeks: true });

/**
 * Rate program schema
 */
export const rateProgramSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  review: z.string().max(500, 'Review must be less than 500 characters').optional()
});

/**
 * Update program progress schema
 */
export const updateProgramProgressSchema = z.object({
  currentWeek: z.number().int().positive('Week must be positive'),
  currentDay: z.number().int().positive('Day must be positive'),
  progressData: z.any().optional() // JSON field for flexible progress data
});

// ============================================================================
// EXERCISE VARIATION SCHEMAS (Phase 3)
// ============================================================================

/**
 * Create exercise variation schema
 */
export const createExerciseVariationSchema = z.object({
  name: z.string().min(1, 'Variation name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  videoUrl: z.string().url('Must be a valid URL').optional(),
  imageUrl: z.string().url('Must be a valid URL').optional(),
  instructions: z.string().max(1000, 'Instructions must be less than 1000 characters').optional()
});

/**
 * Update exercise variation schema
 */
export const updateExerciseVariationSchema = createExerciseVariationSchema.partial().extend({
  isActive: z.boolean().optional()
});

// ============================================================================
// ANALYTICS & PROGRESS SCHEMAS (Phase 3)
// ============================================================================

/**
 * Add progress metric schema
 */
export const addProgressMetricSchema = z.object({
  metricType: z.string().min(1, 'Metric type is required'),
  value: z.number({ invalid_type_error: 'Value must be a number' }),
  unit: z.string().max(20, 'Unit must be less than 20 characters').optional(),
  bodyPart: z.string().max(50, 'Body part must be less than 50 characters').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  imageUrl: z.string().url('Must be a valid URL').optional(),
  recordedAt: z.date().optional()
});

/**
 * Add personal record schema
 */
export const addPersonalRecordSchema = z.object({
  exerciseId: z.string().cuid('Invalid exercise ID'),
  recordType: z.string().min(1, 'Record type is required'),
  value: z.number({ invalid_type_error: 'Value must be a number' }),
  unit: z.string().min(1, 'Unit is required'),
  reps: z.number().int().positive('Reps must be positive').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  achievedAt: z.date().optional()
});

// ============================================================================
// ENHANCED EXERCISE SCHEMAS (Phase 3)
// ============================================================================

/**
 * Enhanced create exercise schema with Phase 3 features
 */
export const enhancedCreateExerciseSchema = createExerciseSchema.extend({
  formCues: z.array(z.string()).default([]),
  commonMistakes: z.array(z.string()).default([]),
  isCustom: z.boolean().default(false)
});

/**
 * Enhanced update exercise schema
 */
export const enhancedUpdateExerciseSchema = enhancedCreateExerciseSchema.partial().extend({
  isActive: z.boolean().optional()
});

// ============================================================================
// EXPORT NEW TYPES
// ============================================================================

export type CreateWorkoutTemplateInput = z.infer<typeof createWorkoutTemplateSchema>;
export type UpdateWorkoutTemplateInput = z.infer<typeof updateWorkoutTemplateSchema>;
export type RateTemplateInput = z.infer<typeof rateTemplateSchema>;

export type CreateTrainingProgramInput = z.infer<typeof createTrainingProgramSchema>;
export type UpdateTrainingProgramInput = z.infer<typeof updateTrainingProgramSchema>;
export type RateProgramInput = z.infer<typeof rateProgramSchema>;
export type UpdateProgramProgressInput = z.infer<typeof updateProgramProgressSchema>;

export type CreateExerciseVariationInput = z.infer<typeof createExerciseVariationSchema>;
export type UpdateExerciseVariationInput = z.infer<typeof updateExerciseVariationSchema>;

export type AddProgressMetricInput = z.infer<typeof addProgressMetricSchema>;
export type AddPersonalRecordInput = z.infer<typeof addPersonalRecordSchema>;

export type EnhancedCreateExerciseInput = z.infer<typeof enhancedCreateExerciseSchema>;
export type EnhancedUpdateExerciseInput = z.infer<typeof enhancedUpdateExerciseSchema>;
