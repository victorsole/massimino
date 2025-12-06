/**
 * Program Types for Massimino
 * Based on the standard program implementation (docs/programs_implementation.md)
 */

// Program Categories
export type ProgramCategory =
  | 'celebrity'
  | 'goal'
  | 'lifestyle'
  | 'sport'
  | 'modality';

// Program difficulty levels
export type ProgramDifficulty =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Sport-Specific';

// Program settings
export type ProgramSetting =
  | 'Home'
  | 'Gym'
  | 'Outdoor'
  | 'Minimal Equipment';

// SEO Metadata for social sharing
export interface ProgramSEO {
  title: string;
  description: string;
  keywords: string[];
  og: {
    title: string;
    description: string;
    image: string;
    image_alt: string;
    type: string;
  };
  twitter: {
    card: 'summary_large_image' | 'summary';
    title: string;
    description: string;
    image: string;
  };
  schema: {
    type: string;
    provider: string;
    duration: string;
    difficulty: string;
  };
  canonical_url: string;
  hashtags: string[];
  share_text: {
    instagram: string;
    tiktok: string;
    twitter: string;
  };
}

// Program Metadata
export interface ProgramMetadata {
  program_name: string;
  program_id: string;
  author: string;
  version: string;
  creation_date: string;
  last_updated: string;
  description: string;
  goal: string;
  methodology: string;
  target_audience: string;
  level: ProgramDifficulty;
  settings: ProgramSetting[];
  duration_weeks: number;
  total_workouts: number;
  frequency_per_week: number;
  session_duration_minutes: {
    min: number;
    max: number;
    includes?: string;
  };
  equipment: {
    required: string[];
    recommended?: string[];
    optional?: string[];
  };
  tags: string[];
}

// Athlete Info (for celebrity programs)
export interface AthleteInfo {
  name: string;
  nickname?: string;
  achievements: string;
  era?: string;
  training_philosophy: string;
  image_url?: string;
}

// Program Philosophy
export interface ProgramPhilosophy {
  origin: string;
  core_principles: string[];
  training_approach: string;
  differentiator: string;
  quote?: string;
  athlete_info?: AthleteInfo;
}

// Prerequisites
export interface ProgramPrerequisites {
  required: string[];
  recommended?: string[];
  do_not_start_if?: string[];
  consult_doctor_if?: string[];
}

// Goals
export interface ProgramGoals {
  primary_goal: string;
  outcome_goals: string[];
  what_program_can_do: string[];
  what_program_cannot_do: string[];
  realistic_outcomes?: {
    week_4?: string[];
    week_8?: string[];
    week_12?: string[];
  };
  safety_goal?: string;
}

// Exercise in a workout
export interface ProgramExercise {
  exercise_name: string;
  exercise_id?: string;
  massimino_exercise_id?: string;
  sets: number;
  reps?: number | string;
  duration_seconds?: number;
  tempo?: string;
  rest_seconds: number;
  intensity?: string;
  notes?: string;
  modification?: string;
  progression?: string;
  // Media enrichment from exercise database
  media?: {
    thumbnail_url?: string;
    video_url?: string;
    image_url?: string;
  };
  hasMedia?: boolean;
  mediaCount?: number;
}

// Workout Section
export interface WorkoutSection {
  section_name: string;
  duration_minutes?: number;
  description?: string;
  exercises: ProgramExercise[];
}

// Workout Session
export interface WorkoutSession {
  workout_id: string;
  name: string;
  week?: number;
  day: number;
  focus: string;
  duration_minutes: number;
  sections: WorkoutSection[];
}

// Weekly Schedule Day
export interface WeeklyScheduleDay {
  day: number;
  name: string;
  focus: string;
  duration_minutes?: number;
}

// Weekly Structure Entry
export interface WeeklyStructureEntry {
  week: number;
  phase?: string;
  theme?: string;
  focus: string;
  volume_intensity?: string;
  key_adaptations?: string[];
  workouts: WeeklyScheduleDay[];
}

// Progression Strategy
export interface ProgressionStrategy {
  primary_method: string;
  when_to_progress: string;
  how_to_progress: string[];
  weekly_progression?: Record<string, string>;
  autoregulation?: string;
  deload_protocol?: {
    frequency: string;
    method: string;
    duration: string;
  };
  stalling_protocol?: string;
}

// Progress Tracking
export interface ProgressTracking {
  tracking_metrics: string[];
  baseline_assessment?: {
    before_starting: string[];
  };
  check_in_frequency: string;
  milestone_goals?: {
    week_4?: string[];
    week_8?: string[];
    program_end?: string[];
  };
  success_criteria: string;
}

// Sport Demands (for sport-specific programs)
export interface SportDemands {
  sport: string;
  key_physical_qualities: string[];
  common_injuries: string[];
  energy_systems: {
    primary: string;
    work_rest_ratios?: string;
  };
  positional_demands?: Record<string, {
    focus: string;
    modifications: string;
  }>;
}

// Implementation for Massimino
export interface MassiminoImplementation {
  usage: string;
  customization_points: string[];
  exercise_mappings?: Record<string, string>;
  ai_trainer_guidelines?: string;
  template_data_requirements?: {
    required_for_display: string[];
    optional_enhancements: string[];
  };
}

// Hero configuration for UI
export interface ProgramHeroConfig {
  background_image: string;
  overlay_color: 'celebrity' | 'goal' | 'lifestyle' | 'sport' | 'modality';
  badge_icon: string;
  badge_text: string;
}

// Complete Program Template
export interface ProgramTemplate {
  seo?: ProgramSEO;
  metadata: ProgramMetadata;
  program_philosophy: ProgramPhilosophy;
  prerequisites: ProgramPrerequisites;
  red_flags_to_stop: string[];
  goals: ProgramGoals;
  weekly_structure?: WeeklyStructureEntry[];
  weekly_schedule?: Record<string, string>;
  workout_sessions: WorkoutSession[];
  progression_strategy: ProgressionStrategy;
  exercise_modifications?: Record<string, Record<string, string>>;
  nutrition_guidelines?: Record<string, unknown>;
  recovery_protocols?: Record<string, unknown>;
  progress_tracking: ProgressTracking;
  implementation_for_massimino: MassiminoImplementation;
  // Sport-specific additions
  sport_demands?: SportDemands;
  performance_testing?: unknown;
  in_season_modifications?: unknown;
  // Hero UI config (derived from category)
  hero_config?: ProgramHeroConfig;
}

// Program Subscription (user following a program)
export interface ProgramSubscription {
  id: string;
  user_id: string;
  program_id: string;
  started_at: string;
  current_week: number;
  current_day: number;
  progress_percentage: number;
  is_active: boolean;
  completed_workouts: number;
  total_workouts: number;
}

// User's followed programs
export interface UserProgram {
  subscription: ProgramSubscription;
  program: ProgramTemplate;
  next_workout: WorkoutSession | null;
}

// Program category color mapping
export const PROGRAM_CATEGORY_COLORS: Record<ProgramCategory, {
  gradient_start: string;
  gradient_end: string;
  badge_bg: string;
}> = {
  celebrity: {
    gradient_start: 'rgba(37, 73, 103, 0.82)',
    gradient_end: 'rgba(26, 42, 62, 0.82)',
    badge_bg: 'rgba(255, 255, 255, 0.2)',
  },
  goal: {
    gradient_start: 'rgba(20, 83, 75, 0.82)',
    gradient_end: 'rgba(17, 52, 50, 0.82)',
    badge_bg: 'rgba(255, 255, 255, 0.2)',
  },
  lifestyle: {
    gradient_start: 'rgba(120, 70, 90, 0.82)',
    gradient_end: 'rgba(70, 45, 55, 0.82)',
    badge_bg: 'rgba(255, 255, 255, 0.2)',
  },
  sport: {
    gradient_start: 'rgba(30, 64, 95, 0.82)',
    gradient_end: 'rgba(20, 45, 70, 0.82)',
    badge_bg: 'rgba(255, 255, 255, 0.2)',
  },
  modality: {
    gradient_start: 'rgba(37, 73, 103, 0.82)',
    gradient_end: 'rgba(26, 58, 82, 0.82)',
    badge_bg: 'rgba(255, 255, 255, 0.2)',
  },
};

// Program image mapping
export const PROGRAM_IMAGES: Record<string, string> = {
  // Celebrity
  'cbum': '/images/programs/cbum.jpg',
  'arnold-volume': '/images/programs/arnoldvolume.jpg',
  'arnold-golden-six': '/images/programs/arnoldgoldensix.jpg',
  'ronnie-coleman-volume': '/images/programs/ronniecolemanvolume.jpg',
  'colorado-experiment': '/images/programs/coloradoexperiment.jpg',
  'ifbb-classic-physique': '/images/programs/ifbbclassicphysique.jpg',
  // Goal-Based
  'fat-loss': '/images/programs/fatloss.jpg',
  'muscle-gain': '/images/programs/musclegain.jpg',
  'performance': '/images/programs/performance.jpg',
  'aesthetics-hunter': '/images/programs/aestheticshunter.jpg',
  'wanna-lose-this-beer-belly': '/images/programs/wannalosethisbeerbelly.jpg',
  // Lifestyle
  'i-just-became-a-mum': '/images/programs/ijustbecameamum.jpg',
  'i-just-became-a-dad': '/images/programs/ijustbecameadad.jpg',
  'bye-stress-bye': '/images/programs/byebyestress.jpg',
  'i-dont-have-much-time': '/images/programs/idonthavemuchtime.jpg',
  'medical-conditions': '/images/programs/medicalconditions.jpg',
  // Training Modality
  'flexibility-workout': '/images/programs/flexibility.jpg',
  'balance-workout': '/images/programs/balance.jpg',
  'cardio-workout': '/images/programs/cardio.jpg',
  'superday-workout': '/images/programs/superdayworkout.jpg',
  // Sport-Specific
  'basketball-conditioning': '/images/programs/basketball.jpg',
  'football-conditioning': '/images/programs/football.jpg',
  'handball-conditioning': '/images/programs/handball.jpg',
  'rugby-conditioning': '/images/programs/rugby.jpg',
  'tennis-conditioning': '/images/programs/tennis.jpg',
  'volleyball-conditioning': '/images/programs/volleyball.jpg',
  'pingpong-conditioning': '/images/programs/pingpong.jpg',
  'castellers': '/images/programs/castellers.jpg',
};

// Helper to get program category from template
export function getProgramCategory(template: ProgramTemplate): ProgramCategory {
  const goal = template.metadata?.goal?.toLowerCase() || '';
  const methodology = template.metadata?.methodology?.toLowerCase() || '';
  const targetAudience = template.metadata?.target_audience?.toLowerCase() || '';

  // Check for athlete/celebrity
  if (template.program_philosophy?.athlete_info) {
    return 'celebrity';
  }

  // Check for sport-specific
  if (template.sport_demands || goal.includes('sport') || methodology.includes('conditioning')) {
    return 'sport';
  }

  // Check for lifestyle
  if (targetAudience.includes('postpartum') ||
      targetAudience.includes('stress') ||
      targetAudience.includes('busy') ||
      targetAudience.includes('medical')) {
    return 'lifestyle';
  }

  // Check for training modality
  if (goal.includes('flexibility') ||
      goal.includes('balance') ||
      goal.includes('cardio') ||
      goal.includes('plyometric')) {
    return 'modality';
  }

  // Default to goal-based
  return 'goal';
}

// Helper to get hero image for a program
export function getProgramHeroImage(programId: string): string | null {
  return PROGRAM_IMAGES[programId] || null;
}
