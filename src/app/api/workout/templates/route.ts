/**
 * Workout Templates API Route
 * Handles CRUD operations for workout templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { UserRole } from '@prisma/client';
import {
  getWorkoutTemplates,
  createWorkoutTemplate,
  searchWorkoutTemplates,
  getMyTemplates
} from '@/core/database';
import { createWorkoutTemplateSchema } from '@/core/utils/workout-validation';

// ============================================================================
// GET /api/workout/templates
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check for specific query types
    const searchQuery = searchParams.get('search');
    const myTemplates = searchParams.get('my');
    const publicOnly = searchParams.get('public') === 'true';

    // Handle my templates request (requires auth)
    if (myTemplates === 'true') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const templates = await getMyTemplates(session.user.id);
      return NextResponse.json(templates);
    }

    // Handle search query
    if (searchQuery) {
      const limit = parseInt(searchParams.get('limit') || '20');
      const templates = await searchWorkoutTemplates(searchQuery, { limit, publicOnly });
      return NextResponse.json(templates);
    }

    // Parse filter options
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const priceRange = searchParams.get('priceRange');
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;

    const filters: any = { publicOnly };
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    if (priceRange) filters.priceRange = priceRange;
    if (minRating) filters.minRating = minRating;

    // Get templates
    const templates = await getWorkoutTemplates(filters);
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching workout templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/workout/templates
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
        { error: 'Only trainers and admins can create templates' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request
    const validatedData = createWorkoutTemplateSchema.parse(body);

    // Create template
    const template = await createWorkoutTemplate({
      ...validatedData,
      createdBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      template,
      message: 'Workout template created successfully',
    });
  } catch (error) {
    console.error('Error creating workout template:', error);

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