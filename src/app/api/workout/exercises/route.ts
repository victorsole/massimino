/**
 * Exercises API Route
 * Handles CRUD operations for exercises
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getExercises,
  createExercise,
  getExerciseCategories,
  getMuscleGroups,
  getEquipmentTypes,
  searchExercises
} from '@/core/database';
import { 
  createExerciseSchema,
  exerciseSearchOptionsSchema
} from '@/core/utils/workout-validation';

// ============================================================================
// GET /api/workout/exercises
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Exercises database is public - no authentication required for viewing
    // Only creation/modification requires authentication

    const { searchParams } = new URL(request.url);
    
    // Check for specific query types
    const searchQuery = searchParams.get('search');
    const includeMediaCount = searchParams.get('include') === 'mediaCount'
    const categoriesParam = searchParams.get('categories');
    const muscleGroupsParam = searchParams.get('muscleGroups');
    const equipmentParam = searchParams.get('equipment');

    // Return categories if requested
    if (categoriesParam === 'true') {
      const categories = await getExerciseCategories();
      return NextResponse.json(categories);
    }

    // Return muscle groups if requested
    if (muscleGroupsParam === 'true') {
      const muscleGroups = await getMuscleGroups();
      return NextResponse.json(muscleGroups);
    }

    // Return equipment types if requested
    if (equipmentParam === 'true') {
      const equipment = await getEquipmentTypes();
      return NextResponse.json(equipment);
    }

    // Handle search query
    if (searchQuery) {
      const limit = parseInt(searchParams.get('limit') || '10');
      const exercises = await searchExercises(searchQuery, limit);
      return NextResponse.json(exercises);
    }

    // Parse search options
    const category = searchParams.get('category');
    const muscleGroups = searchParams.get('muscleGroups')?.split(',');
    const equipment = searchParams.get('equipment')?.split(',');
    const difficulty = searchParams.get('difficulty');
    const isActiveParam = searchParams.get('isActive');

    // Build search options
    const searchOptions: any = {};
    
    if (category) searchOptions.category = category;
    if (muscleGroups && muscleGroups.length > 0) searchOptions.muscleGroups = muscleGroups;
    if (equipment && equipment.length > 0) searchOptions.equipment = equipment;
    if (difficulty) searchOptions.difficulty = difficulty;
    if (isActiveParam !== null) searchOptions.isActive = isActiveParam === 'true';

    // Validate search options
    try {
      exerciseSearchOptionsSchema.parse(searchOptions);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid search parameters' },
        { status: 400 }
      );
    }

    // Get exercises
    const exercises = await getExercises(searchOptions);
    if (!includeMediaCount) return NextResponse.json(exercises)
    // Optionally augment with media count without changing existing behavior
    const { prisma } = await import('@/core/database')
    const ids = exercises.map((e: any) => e.id)
    const counts = await prisma.exercise_media.groupBy({ by: ['globalExerciseId'], where: { globalExerciseId: { in: ids } }, _count: { globalExerciseId: true } })
    const map = new Map(counts.map(c => [c.globalExerciseId, c._count.globalExerciseId]))
    const augmented = exercises.map((e: any) => ({ ...e, mediaCount: map.get(e.id) || 0 }))
    return NextResponse.json(augmented)
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/workout/exercises
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // For POST operations, we need authentication
    // Import auth dynamically to avoid issues with missing env vars for GET
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/core/auth/config');
    const { UserRole } = await import('@prisma/client');
    
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
        { error: 'Only trainers and admins can create exercises' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate request
    const validatedData = createExerciseSchema.parse(body);
    const data: any = Object.fromEntries(Object.entries(validatedData).filter(([,v]) => v !== undefined));

    // Create exercise
    const exercise = await createExercise(data);

    return NextResponse.json({
      success: true,
      exercise,
      message: 'Exercise created successfully',
    });
  } catch (error) {
    console.error('Error creating exercise:', error);
    
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
