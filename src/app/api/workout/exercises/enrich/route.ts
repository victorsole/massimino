/**
 * Exercise Enrichment API
 * POST: Enrich exercise names with database info including media/covers
 *
 * Takes an array of exercise names and returns matching exercises with their
 * cover images and media counts from the database.
 *
 * Matching priority:
 * 1. Exact name match
 * 2. Exact alias match
 * 3. Cleaned name match (without parentheses, "or X" patterns)
 * 4. Partial match (preferring shorter/more specific matches)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database';

// Clean exercise name for better matching
function cleanExerciseName(name: string): string[] {
  const normalized = name.toLowerCase().trim();
  const variants: string[] = [normalized];

  // Remove parenthetical content: "Chin-Ups (or Barbell Pullover)" -> "Chin-Ups"
  const withoutParens = normalized.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  if (withoutParens !== normalized) {
    variants.push(withoutParens);
  }

  // Handle "X or Y" patterns: take X and Y separately
  const orMatch = normalized.match(/^(.+?)\s+or\s+(.+)$/i);
  if (orMatch) {
    variants.push(orMatch[1].trim());
    variants.push(orMatch[2].trim());
  }

  // Handle "X (Y)" patterns: add Y as variant
  const parenMatch = normalized.match(/^(.+?)\s*\((.+?)\)\s*$/);
  if (parenMatch) {
    variants.push(parenMatch[1].trim());
    // If content in parens looks like an alternative (starts with "or ")
    const parenContent = parenMatch[2].trim();
    if (parenContent.toLowerCase().startsWith('or ')) {
      variants.push(parenContent.substring(3).trim());
    } else {
      variants.push(parenContent);
    }
  }

  // Remove common prefixes that might vary
  const withoutPrefix = normalized
    .replace(/^(wide grip|close grip|narrow grip|standing|seated|lying|incline|decline|flat)\s+/i, '')
    .trim();
  if (withoutPrefix !== normalized) {
    variants.push(withoutPrefix);
  }

  // Remove duplicates and empty strings
  return [...new Set(variants)].filter(v => v.length > 0);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exerciseNames } = body;

    if (!Array.isArray(exerciseNames) || exerciseNames.length === 0) {
      return NextResponse.json(
        { error: 'exerciseNames must be a non-empty array' },
        { status: 400 }
      );
    }

    // Limit to prevent abuse
    if (exerciseNames.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 exercise names per request' },
        { status: 400 }
      );
    }

    // Build search variants for all exercise names
    const searchVariants = new Set<string>();
    for (const name of exerciseNames) {
      for (const variant of cleanExerciseName(name)) {
        searchVariants.add(variant);
      }
    }

    // Find matching exercises by name or alias (case-insensitive)
    const exercises = await prisma.exercises.findMany({
      where: {
        isActive: true,
        OR: [
          // Try name matches
          ...Array.from(searchVariants).map((variant: string) => ({
            name: {
              equals: variant,
              mode: 'insensitive' as const,
            },
          })),
          // Try alias matches
          ...Array.from(searchVariants).map((variant: string) => ({
            aliasNames: {
              has: variant,
            },
          })),
          // Fallback: partial name matches
          ...Array.from(searchVariants).map((variant: string) => ({
            name: {
              contains: variant,
              mode: 'insensitive' as const,
            },
          })),
        ],
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        hasMedia: true,
        mediaCount: true,
        aliasNames: true,
      },
    });

    // Get cover images for exercises with media
    const exerciseIds = exercises.map(e => e.id);
    const mediaCovers = await prisma.exercise_media.findMany({
      where: {
        globalExerciseId: { in: exerciseIds },
        visibility: 'public',
        status: 'approved',
      },
      orderBy: [
        { provider: 'asc' }, // prefer exercisedb
        { createdAt: 'desc' },
      ],
      select: {
        globalExerciseId: true,
        url: true,
        thumbnailUrl: true,
        durationSec: true,
        provider: true,
      },
    });

    // Group media by exercise, preferring exercisedb provider
    // Also count media per exercise for accurate hasMedia/mediaCount values
    const coverMap = new Map<string, { url: string; thumbnailUrl?: string | null; hasVideo: boolean; mediaCount: number }>();
    const mediaCountMap = new Map<string, number>();

    for (const media of mediaCovers) {
      if (!media.globalExerciseId) continue;

      // Count all media for this exercise
      mediaCountMap.set(media.globalExerciseId, (mediaCountMap.get(media.globalExerciseId) || 0) + 1);

      const existing = coverMap.get(media.globalExerciseId);
      const isPreferred = media.provider === 'exercisedb';
      // Infer video from: has duration, is from video providers, or url contains video indicators
      const isVideo = (media.durationSec && media.durationSec > 0) ||
        ['youtube', 'tiktok', 'instagram'].includes(media.provider) ||
        media.url.includes('.mp4') ||
        media.url.includes('.gif');

      if (!existing || isPreferred) {
        coverMap.set(media.globalExerciseId, {
          url: media.thumbnailUrl || media.url,
          thumbnailUrl: media.thumbnailUrl,
          hasVideo: isVideo,
          mediaCount: 0, // Will be updated below
        });
      }
    }

    // Update media counts in coverMap
    for (const [exerciseId, count] of mediaCountMap.entries()) {
      const cover = coverMap.get(exerciseId);
      if (cover) {
        cover.mediaCount = count;
      }
    }

    // Build exercise data structure
    type ExerciseData = {
      id: string;
      name: string;
      imageUrl: string | null;
      hasMedia: boolean;
      mediaCount: number;
      coverUrl: string | null;
      hasVideo: boolean;
      aliasNames: string[];
    };

    const exerciseDataList: ExerciseData[] = [];

    for (const exercise of exercises) {
      const cover = coverMap.get(exercise.id);
      const computedMediaCount = cover?.mediaCount ?? 0;
      const coverUrl = cover?.url || exercise.imageUrl || null;
      const computedHasMedia = computedMediaCount > 0 || !!coverUrl;
      const isVideoFromUrl = coverUrl ? (coverUrl.includes('.gif') || coverUrl.includes('.mp4')) : false;

      exerciseDataList.push({
        id: exercise.id,
        name: exercise.name,
        imageUrl: exercise.imageUrl,
        hasMedia: computedHasMedia,
        mediaCount: computedMediaCount > 0 ? computedMediaCount : (coverUrl ? 1 : 0),
        coverUrl,
        hasVideo: cover?.hasVideo ?? isVideoFromUrl,
        aliasNames: exercise.aliasNames || [],
      });
    }

    // Helper: find best match for a name with priority scoring
    function findBestMatch(searchName: string, variants: string[]): ExerciseData | null {
      let bestMatch: ExerciseData | null = null;
      let bestScore = 0;

      for (const exercise of exerciseDataList) {
        const exNameLower = exercise.name.toLowerCase();
        const aliasesLower = exercise.aliasNames.map(a => a.toLowerCase());

        for (const variant of variants) {
          let score = 0;

          // Exact name match = highest priority (100)
          if (exNameLower === variant) {
            score = 100;
          }
          // Exact alias match = high priority (90)
          else if (aliasesLower.includes(variant)) {
            score = 90;
          }
          // Name starts with variant (80)
          else if (exNameLower.startsWith(variant + ' ') || exNameLower.startsWith(variant + '-')) {
            score = 80;
          }
          // Name contains variant as word (70) - but penalize longer names
          else if (exNameLower.includes(variant)) {
            // Prefer shorter exercise names (more specific matches)
            score = 70 - Math.min(20, (exNameLower.length - variant.length) / 2);
          }
          // Variant contains exercise name (60) - e.g., "barbell bench press" contains "bench press"
          else if (variant.includes(exNameLower)) {
            score = 60;
          }

          // Update best match if this is better
          if (score > bestScore) {
            bestScore = score;
            bestMatch = exercise;
          }
        }
      }

      return bestMatch;
    }

    // Match original exercise names to database exercises
    const enrichedExercises: Record<string, {
      id: string;
      name: string;
      coverUrl: string | null;
      hasMedia: boolean;
      mediaCount: number;
      hasVideo: boolean;
    } | null> = {};

    for (const originalName of exerciseNames) {
      const variants = cleanExerciseName(originalName);
      const match = findBestMatch(originalName, variants);

      enrichedExercises[originalName] = match ? {
        id: match.id,
        name: match.name,
        coverUrl: match.coverUrl,
        hasMedia: match.hasMedia,
        mediaCount: match.mediaCount,
        hasVideo: match.hasVideo,
      } : null;
    }

    return NextResponse.json({
      exercises: enrichedExercises,
      matchedCount: Object.values(enrichedExercises).filter(Boolean).length,
      totalCount: exerciseNames.length,
    });
  } catch (error) {
    console.error('Exercise enrichment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
