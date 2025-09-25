/**
 * Workout Log Type Definitions for Massimino
 * Comprehensive type system for workout tracking and management
 */

// ============================================================================
// ENUMS
// ============================================================================

export type SetType = 'STRAIGHT' | 'SUPERSET' | 'TRISET' | 'GIANT_SET' | 'PYRAMID' | 'REVERSE_PYRAMID' | 'DROP_SET' | 'REST_PAUSE' | 'CLUSTER' | 'EMOM' | 'AMRAP';
export type WeightUnit = 'KG' | 'LB';
export type IntensityType = 'PERCENTAGE_1RM' | 'RPE' | 'RIR';

// Type alias for User to avoid circular imports
type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
};

// ============================================================================
// CORE WORKOUT TYPES
// ============================================================================

/**
 * Workout log entry with all fields
 */
export interface WorkoutLogEntry {
  id: string;
  userId: string;
  coachId?: string;
  
  // Basic workout info
  date: Date;
  exerciseId: string;
  order: string;
  setNumber: number;
  setType: SetType;
  
  // Performance data
  reps: number;
  weight: string;
  unit: WeightUnit;
  intensity?: string;
  intensityType?: IntensityType;
  tempo?: string;
  restSeconds?: number;
  
  // Calculated fields
  trainingVolume?: number;
  duration?: string;
  
  // Feedback and notes
  coachFeedback?: string;
  userComments?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Relationships
  user?: User;
  coach?: User;
  exercise?: Exercise;
}

/**
 * Exercise definition
 */
export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  safetyNotes?: string;
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workout session container
 */
export interface WorkoutSession {
  id: string;
  userId: string;
  coachId?: string;
  
  // Session info
  date: Date;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  
  // Session metadata
  title?: string;
  notes?: string;
  location?: string;
  
  // Performance tracking
  totalVolume?: number;
  totalSets: number;
  totalReps: number;
  
  // Status
  isComplete: boolean;
  isTemplate: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relationships
  user?: User;
  coach?: User;
  entries?: WorkoutLogEntry[];
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data for creating/editing workout entries
 */
export interface WorkoutLogEntryFormData {
  date: string; // YYYY-MM-DD format
  exerciseId: string;
  setNumber: number;
  setType: SetType;
  reps: number;
  weight: string;
  unit: WeightUnit;
  intensity?: string;
  intensityType?: IntensityType;
  tempo?: string;
  restSeconds?: number;
  userComments?: string;
  coachFeedback?: string;
}

/**
 * Form data for workout sessions
 */
export interface WorkoutSessionFormData {
  date: string; // YYYY-MM-DD format
  title?: string;
  notes?: string;
  location?: string;
  startTime: string; // HH:MM format
  endTime?: string; // HH:MM format
  isTemplate: boolean;
}

/**
 * Form validation errors
 */
export interface WorkoutFormErrors {
  [key: string]: string;
}

// ============================================================================
// CALCULATION TYPES
// ============================================================================

/**
 * Weight calculation result
 */
export interface WeightCalculation {
  averageWeight: number;
  weights: number[];
  totalWeight: number;
  weightCount: number;
}

/**
 * Training volume calculation
 */
export interface VolumeCalculation {
  volume: number;
  volumeKg: number;
  totalSets: number;
  totalReps: number;
  averageWeight: number;
}

/**
 * Order generation context
 */
export interface OrderGenerationContext {
  currentSetType: SetType;
  previousSetType?: SetType;
  currentGroupNumber: number;
  currentSubOrder: string; // 'A', 'B', 'C', etc.
  totalEntries: number;
}

// ============================================================================
// UI TYPES
// ============================================================================

/**
 * Table column configuration
 */
export interface WorkoutTableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'time' | 'textarea';
  required?: boolean;
  editable?: boolean;
  width?: string;
  options?: { value: string; label: string }[];
}

/**
 * Filter options for workout logs
 */
export interface WorkoutFilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  exercises?: string[];
  setTypes?: SetType[];
  coachId?: string;
  userId?: string;
}

/**
 * Sort options for workout logs
 */
export interface WorkoutSortOptions {
  field: keyof WorkoutLogEntry;
  direction: 'asc' | 'desc';
}

/**
 * Pagination for workout logs
 */
export interface WorkoutPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * API response for workout logs
 */
export interface WorkoutLogResponse {
  entries: WorkoutLogEntry[];
  pagination: WorkoutPagination;
  filters: WorkoutFilterOptions;
  sort: WorkoutSortOptions;
}

/**
 * API response for workout sessions
 */
export interface WorkoutSessionResponse {
  sessions: WorkoutSession[];
  pagination: WorkoutPagination;
}

/**
 * API response for exercises
 */
export interface ExerciseResponse {
  exercises: Exercise[];
  categories: string[];
  muscleGroups: string[];
  equipment: string[];
}

/**
 * Create workout entry request
 */
export interface CreateWorkoutEntryRequest {
  sessionId?: string;
  entries: WorkoutLogEntryFormData[];
}

/**
 * Update workout entry request
 */
export interface UpdateWorkoutEntryRequest {
  id: string;
  data: Partial<WorkoutLogEntryFormData>;
}

/**
 * Delete workout entry request
 */
export interface DeleteWorkoutEntryRequest {
  id: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Set type configuration
 */
export interface SetTypeConfig {
  type: SetType;
  label: string;
  description: string;
  orderPattern: 'numeric' | 'grouped';
  maxGroupSize?: number;
  weightHandling: 'single' | 'multiple' | 'progressive';
}

/**
 * Exercise category
 */
export interface ExerciseCategory {
  name: string;
  description: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

/**
 * Muscle group definition
 */
export interface MuscleGroup {
  name: string;
  description: string;
  primaryExercises: string[];
  secondaryExercises: string[];
}

/**
 * Equipment definition
 */
export interface Equipment {
  name: string;
  category: 'free_weights' | 'machines' | 'cardio' | 'bodyweight' | 'other';
  description: string;
  exercises: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Set type configurations
 */
export const SET_TYPE_CONFIGS: Record<SetType, SetTypeConfig> = {
  STRAIGHT: {
    type: 'STRAIGHT',
    label: 'Straight Sets',
    description: 'Regular sets with consistent weight',
    orderPattern: 'numeric',
    weightHandling: 'single',
  },
  SUPERSET: {
    type: 'SUPERSET',
    label: 'Superset',
    description: 'Two exercises performed back-to-back',
    orderPattern: 'grouped',
    maxGroupSize: 2,
    weightHandling: 'single',
  },
  TRISET: {
    type: 'TRISET',
    label: 'Triset',
    description: 'Three exercises performed back-to-back',
    orderPattern: 'grouped',
    maxGroupSize: 3,
    weightHandling: 'single',
  },
  GIANT_SET: {
    type: 'GIANT_SET',
    label: 'Giant Set',
    description: 'Four or more exercises performed back-to-back',
    orderPattern: 'grouped',
    maxGroupSize: 4,
    weightHandling: 'single',
  },
  PYRAMID: {
    type: 'PYRAMID',
    label: 'Pyramid',
    description: 'Increasing weight with each set',
    orderPattern: 'numeric',
    weightHandling: 'progressive',
  },
  REVERSE_PYRAMID: {
    type: 'REVERSE_PYRAMID',
    label: 'Reverse Pyramid',
    description: 'Decreasing weight with each set',
    orderPattern: 'numeric',
    weightHandling: 'progressive',
  },
  DROP_SET: {
    type: 'DROP_SET',
    label: 'Drop Set',
    description: 'Decreasing weight within the same set',
    orderPattern: 'numeric',
    weightHandling: 'multiple',
  },
  REST_PAUSE: {
    type: 'REST_PAUSE',
    label: 'Rest-Pause',
    description: 'Short rest periods within a set',
    orderPattern: 'numeric',
    weightHandling: 'single',
  },
  CLUSTER: {
    type: 'CLUSTER',
    label: 'Cluster',
    description: 'Short rest periods between reps',
    orderPattern: 'numeric',
    weightHandling: 'single',
  },
  EMOM: {
    type: 'EMOM',
    label: 'EMOM',
    description: 'Every Minute on the Minute',
    orderPattern: 'numeric',
    weightHandling: 'single',
  },
  AMRAP: {
    type: 'AMRAP',
    label: 'AMRAP',
    description: 'As Many Rounds As Possible',
    orderPattern: 'numeric',
    weightHandling: 'single',
  },
};

/**
 * Exercise categories
 */
export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  {
    name: 'Compound',
    description: 'Multi-joint movements that work multiple muscle groups',
    muscleGroups: ['chest', 'back', 'shoulders', 'legs'],
    equipment: ['barbell', 'dumbbell', 'kettlebell'],
    difficulty: 'INTERMEDIATE',
  },
  {
    name: 'Isolation',
    description: 'Single-joint movements that target specific muscles',
    muscleGroups: ['biceps', 'triceps', 'calves', 'abs'],
    equipment: ['dumbbell', 'cable', 'machine'],
    difficulty: 'BEGINNER',
  },
  {
    name: 'Cardio',
    description: 'Cardiovascular exercises for endurance and conditioning',
    muscleGroups: ['heart', 'lungs'],
    equipment: ['treadmill', 'bike', 'rower', 'elliptical'],
    difficulty: 'BEGINNER',
  },
  {
    name: 'Mobility',
    description: 'Flexibility and mobility exercises',
    muscleGroups: ['joints', 'connective tissue'],
    equipment: ['bodyweight', 'foam_roller', 'band'],
    difficulty: 'BEGINNER',
  },
];

/**
 * Muscle groups
 */
export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    name: 'Chest',
    description: 'Pectoralis major and minor',
    primaryExercises: ['bench_press', 'push_ups', 'dumbbell_press'],
    secondaryExercises: ['dips', 'flyes', 'cable_crossovers'],
  },
  {
    name: 'Back',
    description: 'Latissimus dorsi, rhomboids, trapezius',
    primaryExercises: ['pull_ups', 'rows', 'deadlift'],
    secondaryExercises: ['lat_pulldowns', 'face_pulls', 'shrugs'],
  },
  {
    name: 'Shoulders',
    description: 'Deltoids (anterior, lateral, posterior)',
    primaryExercises: ['overhead_press', 'lateral_raises', 'rear_delt_flyes'],
    secondaryExercises: ['arnold_press', 'upright_rows', 'face_pulls'],
  },
  {
    name: 'Arms',
    description: 'Biceps and triceps',
    primaryExercises: ['bicep_curls', 'tricep_dips', 'hammer_curls'],
    secondaryExercises: ['preacher_curls', 'skull_crushers', 'concentration_curls'],
  },
  {
    name: 'Legs',
    description: 'Quadriceps, hamstrings, glutes, calves',
    primaryExercises: ['squats', 'deadlifts', 'lunges'],
    secondaryExercises: ['leg_press', 'leg_curls', 'calf_raises'],
  },
  {
    name: 'Core',
    description: 'Abdominals, obliques, lower back',
    primaryExercises: ['planks', 'crunches', 'dead_bugs'],
    secondaryExercises: ['russian_twists', 'leg_raises', 'mountain_climbers'],
  },
];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for workout log entry
 */
export const isWorkoutLogEntry = (obj: any): obj is WorkoutLogEntry => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    obj.date instanceof Date &&
    typeof obj.exerciseId === 'string' &&
    typeof obj.order === 'string' &&
    typeof obj.setNumber === 'number' &&
    typeof obj.reps === 'number' &&
    typeof obj.weight === 'string' &&
    typeof obj.unit === 'string'
  );
};

/**
 * Type guard for exercise
 */
export const isExercise = (obj: any): obj is Exercise => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.category === 'string' &&
    Array.isArray(obj.muscleGroups) &&
    Array.isArray(obj.equipment)
  );
};

/**
 * Type guard for workout session
 */
export const isWorkoutSession = (obj: any): obj is WorkoutSession => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    obj.date instanceof Date &&
    obj.startTime instanceof Date
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert weight from lb to kg
 */
export const convertLbToKg = (weight: number): number => {
  return weight * 0.453592;
};

/**
 * Convert weight from kg to lb
 */
export const convertKgToLb = (weight: number): number => {
  return weight / 0.453592;
};

/**
 * Parse weight string to numbers
 */
export const parseWeightString = (weight: string): number[] => {
  return weight
    .split(',')
    .map(w => w.trim())
    .filter(w => w.length > 0)
    .map(w => parseFloat(w))
    .filter(w => !isNaN(w));
};

/**
 * Calculate average weight from weight string
 */
export const calculateAverageWeight = (weight: string): number => {
  const weights = parseWeightString(weight);
  if (weights.length === 0) return 0;
  return weights.reduce((sum, w) => sum + w, 0) / weights.length;
};

/**
 * Calculate training volume
 */
export const calculateTrainingVolume = (
  sets: number,
  reps: number,
  averageWeight: number,
  unit: WeightUnit
): number => {
  const weightKg = unit === 'LB' ? convertLbToKg(averageWeight) : averageWeight;
  return sets * reps * weightKg;
};

/**
 * Generate order string based on set type and context
 */
export const generateOrder = (
  setType: SetType,
  context: OrderGenerationContext
): string => {
  const config = SET_TYPE_CONFIGS[setType];
  
  if (config && config.orderPattern === 'numeric') {
    return context.currentGroupNumber.toString();
  } else {
    // Grouped pattern (A, B, C, etc.)
    return `${context.currentGroupNumber}${context.currentSubOrder}`;
  }
};

/**
 * Format duration string
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Parse duration string
 */
export const parseDuration = (duration: string): number => {
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return 0;
};
