/**
 * Training Programs API Route
 * Handles CRUD operations for training programs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { UserRole } from '@prisma/client';
import {
  getTrainingPrograms,
  createTrainingProgram,
  searchTrainingPrograms,
  getMyPrograms,
  getUserProgramSubscriptions
} from '@/core/database';
import { createTrainingProgramSchema } from '@/core/utils/workout-validation';

// ============================================================================
// GET /api/workout/programs
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check for specific query types
    const searchQuery = searchParams.get('search');
    const myPrograms = searchParams.get('my');
    const subscriptions = searchParams.get('subscriptions');
    const publicOnly = searchParams.get('public') === 'true';

    // Handle my programs request (requires auth)
    if (myPrograms === 'true') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const programs = await getMyPrograms(session.user.id);
      return NextResponse.json(programs);
    }

    // Handle subscriptions request (requires auth)
    if (subscriptions === 'true') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userSubscriptions = await getUserProgramSubscriptions(session.user.id);
      return NextResponse.json(userSubscriptions);
    }

    // Handle search query
    if (searchQuery) {
      const limit = parseInt(searchParams.get('limit') || '20');
      const programs = await searchTrainingPrograms(searchQuery, { limit, publicOnly });
      return NextResponse.json(programs);
    }

    // Parse filter options
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const duration = searchParams.get('duration');
    const priceRange = searchParams.get('priceRange');
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;

    const filters: any = { publicOnly };
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    if (duration) filters.duration = duration;
    if (priceRange) filters.priceRange = priceRange;
    if (minRating) filters.minRating = minRating;

    // Get programs
    const programs = await getTrainingPrograms(filters);
    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error fetching training programs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/workout/programs
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

    // Check if user is a trainer or admin
    if (session.user.role !== UserRole.TRAINER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only trainers and admins can create programs' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request
    const validatedData = createTrainingProgramSchema.parse(body);

    // Create program
    const program = await createTrainingProgram({
      ...validatedData,
      createdBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      program,
      message: 'Training program created successfully',
    });
  } catch (error) {
    console.error('Error creating training program:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}