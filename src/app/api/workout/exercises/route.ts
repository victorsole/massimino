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
  searchExercises,
  getBodyParts,
  getMovementPatterns,
  getExerciseTypes,
  getTags,
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
    const includeParam = searchParams.get('include') || ''
    const includeMediaCount = includeParam.split(',').includes('mediaCount')
    const includeCover = includeParam.split(',').includes('cover')
    const categoriesParam = searchParams.get('categories');
    const muscleGroupsParam = searchParams.get('muscleGroups');
    const equipmentParam = searchParams.get('equipment');
    const metaParam = searchParams.get('meta'); // bodyParts|movementPatterns|types|equipment|tags

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

    // Return meta lists if requested
    if (metaParam) {
      try {
        if (metaParam === 'bodyParts') return NextResponse.json(await getBodyParts());
        if (metaParam === 'movementPatterns') return NextResponse.json(await getMovementPatterns());
        if (metaParam === 'types') return NextResponse.json(await getExerciseTypes());
        if (metaParam === 'equipment') return NextResponse.json(await getEquipmentTypes());
        if (metaParam === 'tags') return NextResponse.json(await getTags());
      } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch meta' }, { status: 500 })
      }
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
    // New filters
    const bodyPart = searchParams.get('bodyPart') || undefined;
    const movementPattern = searchParams.get('movementPattern') || undefined;
    const type = searchParams.get('type') || undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const curatedParam = searchParams.get('curated');

    // Build search options
    const searchOptions: any = {};
    
    if (category) searchOptions.category = category;
    if (muscleGroups && muscleGroups.length > 0) searchOptions.muscleGroups = muscleGroups;
    if (equipment && equipment.length > 0) searchOptions.equipment = equipment;
    if (difficulty) searchOptions.difficulty = difficulty;
    if (isActiveParam !== null) searchOptions.isActive = isActiveParam === 'true';
    // New filters
    if (bodyPart) searchOptions.bodyPart = bodyPart;
    if (movementPattern) searchOptions.movementPattern = movementPattern;
    if (type) searchOptions.type = type;
    if (tags && tags.length > 0) searchOptions.tags = tags;
    if (curatedParam !== null) {
      searchOptions.curated = curatedParam === 'true';
    } else {
      // default curated behaviour behind feature flag
      if (process.env.NEXT_PUBLIC_EXERCISES_CURATED_ENABLED === 'true') {
        searchOptions.curated = true;
      }
    }

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
    if (!includeMediaCount && !includeCover) return NextResponse.json(exercises)
    // Optionally augment with media count and cover without changing existing behavior
    const { prisma } = await import('@/core/database')
    const ids = exercises.map((e: any) => e.id)
    const [counts, covers] = await Promise.all([
      includeMediaCount
        ? prisma.exercise_media.groupBy({ by: ['globalExerciseId'], where: { globalExerciseId: { in: ids }, status: 'approved', visibility: 'public' }, _count: { globalExerciseId: true } })
        : Promise.resolve([] as any[]),
      includeCover
        ? prisma.exercise_media.findMany({
            where: { globalExerciseId: { in: ids }, visibility: 'public', status: 'approved' },
            orderBy: [
              { provider: 'asc' }, // prefer 'exercisedb' lexicographically comes before others if we enforce below
              { createdAt: 'desc' },
            ],
          })
        : Promise.resolve([] as any[]),
    ])
    const countMap = new Map(counts.map((c: any) => [c.globalExerciseId, c._count.globalExerciseId]))
    // pick first exercisedb provider if exists else first public
    const coverMap = new Map<string, string>()
    if (includeCover) {
      const grouped = new Map<string, any[]>()
      for (const m of covers as any[]) {
        const arr = grouped.get(m.globalExerciseId) || []
        arr.push(m)
        grouped.set(m.globalExerciseId, arr)
      }
      for (const [gid, arr] of grouped) {
        const preferred = arr.find(x => x.provider === 'exercisedb') || arr[0]
        if (preferred?.url) coverMap.set(gid, preferred.url)
      }
    }
    const augmented = exercises.map((e: any) => ({
      ...e,
      ...(includeMediaCount ? { mediaCount: countMap.get(e.id) || 0 } : {}),
      ...(includeCover ? { coverUrl: coverMap.get(e.id) || e.imageUrl || null } : {}),
    }))
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
