/**
 * Form Analysis API Route
 * Handles AI-powered form analysis for workout exercises
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { analyzeExerciseForm } from '@/services/ai/form-analysis';
import { moderateContent } from '@/services/moderation/openai';
import { getExercise } from '@/core/database';

// ============================================================================
// POST /api/workout/form-analysis
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { exerciseId, imageUrl, videoUrl, notes } = body;

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'Exercise ID is required' },
        { status: 400 }
      );
    }

    if (!imageUrl && !videoUrl) {
      return NextResponse.json(
        { error: 'Either image or video URL is required for form analysis' },
        { status: 400 }
      );
    }

    // Get exercise information
    const exercise = await getExercise(exerciseId);
    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
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
      imageUrl,
      videoUrl,
      userNotes: notes
    });

    return NextResponse.json({
      success: true,
      analysis,
      message: 'Form analysis completed successfully'
    });

  } catch (error) {
    console.error('Error analyzing exercise form:', error);

    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
