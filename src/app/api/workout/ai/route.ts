/**
 * Consolidated Workout AI & Analytics API
 * Handles analytics, form analysis, workout suggestions, and progress tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import {
  getWorkoutAnalytics,
  getProgressMetrics,
  getPersonalRecords,
  addProgressMetric,
  addPersonalRecord,
  generateWorkoutAnalytics,
  getExercise
} from '@/core/database';
import {
  addProgressMetricSchema,
  addPersonalRecordSchema
} from '@/core/utils/workout-validation';
import { analyzeExerciseForm } from '@/services/ai/form-analysis';
import { generateWorkoutSuggestions } from '@/services/ai/workout-suggestions';
import { moderateContent } from '@/services/moderation/openai';
import { z } from 'zod';

// Validation schemas
const formAnalysisSchema = z.object({
  action: z.literal('form-analysis'),
  exerciseId: z.string(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  notes: z.string().optional(),
});

const workoutSuggestionsSchema = z.object({
  action: z.literal('workout-suggestions'),
  preferences: z.object({
    fitnessGoals: z.array(z.string()).optional(),
    experienceLevel: z.string().optional(),
    preferredWorkoutTypes: z.array(z.string()).optional(),
    availableWorkoutDays: z.array(z.string()).optional(),
    preferredWorkoutDuration: z.string().optional(),
  }).optional(),
});

const progressMetricActionSchema = z.object({
  action: z.literal('progress-metric'),
  metricType: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  bodyPart: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  recordedAt: z.string().optional(),
});

const personalRecordActionSchema = z.object({
  action: z.literal('personal-record'),
  exerciseId: z.string(),
  recordType: z.string(),
  value: z.number(),
  unit: z.string(),
  reps: z.number().optional(),
  notes: z.string().optional(),
  achievedAt: z.string().optional(),
});

const generateAnalyticsSchema = z.object({
  action: z.literal('generate-analytics'),
});

// ============================================================================
// GET - Fetch analytics and AI data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const metricType = searchParams.get('metricType');
    const exerciseId = searchParams.get('exerciseId');

    switch (type) {
      case 'analytics':
        return handleGetAnalytics(session.user.id, startDate, endDate);

      case 'progress-metrics':
        return handleGetProgressMetrics(session.user.id, metricType, startDate, endDate);

      case 'personal-records':
        return handleGetPersonalRecords(session.user.id, exerciseId);

      case 'workout-suggestions':
        return handleGetWorkoutSuggestions(session.user.id);

      case 'overview':
      default:
        return handleGetOverview(session.user.id, startDate, endDate);
    }
  } catch (error) {
    console.error('Workout AI GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST - Handle AI actions and analytics operations
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'form-analysis':
        return handleFormAnalysis(session.user.id, body);

      case 'workout-suggestions':
        return handleGenerateWorkoutSuggestions(session.user.id, body);

      case 'progress-metric':
        return handleAddProgressMetric(session.user.id, body);

      case 'personal-record':
        return handleAddPersonalRecord(session.user.id, body);

      case 'generate-analytics':
        return handleGenerateAnalytics(session.user.id);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: form-analysis, workout-suggestions, progress-metric, personal-record, generate-analytics' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Workout AI POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

/**
 * Handle workout analytics retrieval
 */
async function handleGetAnalytics(userId: string, startDate?: string | null, endDate?: string | null) {
  const params: any = {};
  if (startDate) params.startDate = new Date(startDate);
  if (endDate) params.endDate = new Date(endDate);

  const analytics = await getWorkoutAnalytics(userId, params);
  return NextResponse.json(analytics);
}

/**
 * Handle progress metrics retrieval
 */
async function handleGetProgressMetrics(userId: string, metricType?: string | null, startDate?: string | null, endDate?: string | null) {
  const params: any = {};
  if (metricType) params.metricType = metricType;
  if (startDate) params.startDate = new Date(startDate);
  if (endDate) params.endDate = new Date(endDate);

  const metrics = await getProgressMetrics(userId, params);
  return NextResponse.json(metrics);
}

/**
 * Handle personal records retrieval
 */
async function handleGetPersonalRecords(userId: string, exerciseId?: string | null) {
  const params: any = {};
  if (exerciseId) params.exerciseId = exerciseId;

  const records = await getPersonalRecords(userId, params);
  return NextResponse.json(records);
}

/**
 * Handle workout suggestions retrieval
 */
async function handleGetWorkoutSuggestions(userId: string) {
  // Get user's fitness preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fitnessGoals: true,
      experienceLevel: true,
      preferredWorkoutTypes: true,
      availableWorkoutDays: true,
      preferredWorkoutDuration: true
    }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if user has set up fitness preferences
  if (!user.fitnessGoals.length && !user.preferredWorkoutTypes.length) {
    return NextResponse.json({
      suggestions: [],
      message: 'Please set up your fitness preferences in your profile to get personalized workout suggestions.'
    });
  }

  // Generate AI workout suggestions
  const suggestions = await generateWorkoutSuggestions({
    userId,
    fitnessGoals: user.fitnessGoals,
    experienceLevel: user.experienceLevel,
    preferredWorkoutTypes: user.preferredWorkoutTypes,
    availableWorkoutDays: user.availableWorkoutDays,
    preferredWorkoutDuration: user.preferredWorkoutDuration || '30-60'
  });

  return NextResponse.json({ suggestions });
}

/**
 * Handle comprehensive overview
 */
async function handleGetOverview(userId: string, startDate?: string | null, endDate?: string | null) {
  const params: any = {};
  if (startDate) params.startDate = new Date(startDate);
  if (endDate) params.endDate = new Date(endDate);

  const [workoutAnalytics, progressMetrics, personalRecords] = await Promise.all([
    getWorkoutAnalytics(userId, params),
    getProgressMetrics(userId, params),
    getPersonalRecords(userId)
  ]);

  return NextResponse.json({
    workoutAnalytics,
    progressMetrics,
    personalRecords
  });
}

/**
 * Handle form analysis
 */
async function handleFormAnalysis(userId: string, body: any) {
  const { exerciseId, imageUrl, videoUrl, notes } = formAnalysisSchema.parse(body);

  if (!imageUrl && !videoUrl) {
    return NextResponse.json(
      { error: 'Either image or video URL is required for form analysis' },
      { status: 400 }
    );
  }

  // Get exercise information
  const exercise = await getExercise(exerciseId);
  if (!exercise) {
    return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
  }

  // Moderate content if there are notes
  if (notes) {
    const moderationResult = await moderateContent(notes);
    if (moderationResult.flagged) {
      return NextResponse.json(
        { error: 'Content flagged by moderation system' },
        { status: 400 }
      );
    }
  }

  // Analyze form using AI
  const analysis = await analyzeExerciseForm({
    exerciseId,
    exerciseName: exercise.name,
    exerciseInstructions: exercise.instructions || '',
    formCues: exercise.formCues,
    commonMistakes: exercise.commonMistakes,
    safetyNotes: exercise.safetyNotes || '',
    imageUrl: imageUrl || '',
    videoUrl: videoUrl || '',
    userNotes: notes || ''
  });

  return NextResponse.json({
    success: true,
    analysis,
    message: 'Form analysis completed successfully'
  });
}

/**
 * Handle workout suggestions generation
 */
async function handleGenerateWorkoutSuggestions(userId: string, body: any) {
  const { preferences } = workoutSuggestionsSchema.parse(body);

  let userPreferences;

  if (preferences) {
    // Use provided preferences
    userPreferences = {
      userId,
      fitnessGoals: preferences.fitnessGoals || [],
      experienceLevel: preferences.experienceLevel || 'BEGINNER',
      preferredWorkoutTypes: preferences.preferredWorkoutTypes || [],
      availableWorkoutDays: preferences.availableWorkoutDays || [],
      preferredWorkoutDuration: preferences.preferredWorkoutDuration || '30-60'
    };
  } else {
    // Get user's stored preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        fitnessGoals: true,
        experienceLevel: true,
        preferredWorkoutTypes: true,
        availableWorkoutDays: true,
        preferredWorkoutDuration: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    userPreferences = {
      userId,
      fitnessGoals: user.fitnessGoals,
      experienceLevel: user.experienceLevel,
      preferredWorkoutTypes: user.preferredWorkoutTypes,
      availableWorkoutDays: user.availableWorkoutDays,
      preferredWorkoutDuration: user.preferredWorkoutDuration || '30-60'
    };
  }

  // Check if user has set up fitness preferences
  if (!userPreferences.fitnessGoals.length && !userPreferences.preferredWorkoutTypes.length) {
    return NextResponse.json({
      suggestions: [],
      message: 'Please provide fitness preferences to get personalized workout suggestions.'
    });
  }

  const suggestions = await generateWorkoutSuggestions(userPreferences);

  return NextResponse.json({
    success: true,
    suggestions,
    message: 'Workout suggestions generated successfully'
  });
}

/**
 * Handle adding progress metric
 */
async function handleAddProgressMetric(userId: string, body: any) {
  const validatedMetric = progressMetricActionSchema.parse(body);

  const metric = await addProgressMetric({
    userId,
    metricType: validatedMetric.metricType,
    value: validatedMetric.value,
    ...(validatedMetric.unit ? { unit: validatedMetric.unit } : {}),
    ...(validatedMetric.bodyPart ? { bodyPart: validatedMetric.bodyPart } : {}),
    ...(validatedMetric.notes ? { notes: validatedMetric.notes } : {}),
    ...(validatedMetric.imageUrl ? { imageUrl: validatedMetric.imageUrl } : {}),
    ...(validatedMetric.recordedAt ? { recordedAt: new Date(validatedMetric.recordedAt) } : {}),
  });

  return NextResponse.json({
    success: true,
    metric,
    message: 'Progress metric added successfully'
  });
}

/**
 * Handle adding personal record
 */
async function handleAddPersonalRecord(userId: string, body: any) {
  const validatedRecord = personalRecordActionSchema.parse(body);

  const record = await addPersonalRecord({
    userId,
    exerciseId: validatedRecord.exerciseId,
    recordType: validatedRecord.recordType,
    value: validatedRecord.value,
    unit: validatedRecord.unit,
    ...(validatedRecord.reps !== undefined ? { reps: validatedRecord.reps } : {}),
    ...(validatedRecord.notes ? { notes: validatedRecord.notes } : {}),
    ...(validatedRecord.achievedAt ? { achievedAt: new Date(validatedRecord.achievedAt) } : {}),
  });

  return NextResponse.json({
    success: true,
    record,
    message: 'Personal record added successfully'
  });
}

/**
 * Handle analytics generation
 */
async function handleGenerateAnalytics(userId: string) {
  const analytics = await generateWorkoutAnalytics(userId);

  return NextResponse.json({
    success: true,
    analytics,
    message: 'Analytics generated successfully'
  });
}