/**
 * Exercise Enrichment API
 * POST: Enrich exercise names with database info including media/covers
 *
 * Takes an array of exercise names and returns matching exercises with their
 * cover images and media counts from the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database';

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

    // Normalize names for matching
    const normalizedNames = exerciseNames.map((name: string) =>
      name.toLowerCase().trim()
    );

    // Find matching exercises by name (case-insensitive)
    const exercises = await prisma.exercises.findMany({
      where: {
        isActive: true,
        OR: normalizedNames.map((name: string) => ({
          name: {
            contains: name,
            mode: 'insensitive' as const,
          },
        })),
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        hasMedia: true,
        mediaCount: true,
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

    // Build a lookup map by normalized exercise name
    const exerciseLookup = new Map<string, {
      id: string;
      name: string;
      imageUrl: string | null;
      hasMedia: boolean;
      mediaCount: number;
      coverUrl: string | null;
      hasVideo: boolean;
    }>();

    for (const exercise of exercises) {
      const normalizedName = exercise.name.toLowerCase().trim();
      const cover = coverMap.get(exercise.id);
      // Use computed values from media query instead of potentially stale database columns
      const computedMediaCount = cover?.mediaCount ?? 0;
      const coverUrl = cover?.url || exercise.imageUrl || null;
      // hasMedia is true if we have media in exercise_media OR if the exercise has a default imageUrl
      const computedHasMedia = computedMediaCount > 0 || !!coverUrl;
      // Check if the coverUrl itself is a video/gif (for cases where imageUrl is the only source)
      const isVideoFromUrl = coverUrl ? (coverUrl.includes('.gif') || coverUrl.includes('.mp4')) : false;

      exerciseLookup.set(normalizedName, {
        id: exercise.id,
        name: exercise.name,
        imageUrl: exercise.imageUrl,
        hasMedia: computedHasMedia,
        mediaCount: computedMediaCount > 0 ? computedMediaCount : (coverUrl ? 1 : 0),
        coverUrl,
        hasVideo: cover?.hasVideo ?? isVideoFromUrl,
      });
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
      const normalized = originalName.toLowerCase().trim();

      // Try exact match first
      let match = exerciseLookup.get(normalized);

      // Try partial match if no exact match
      if (!match) {
        for (const [key, value] of exerciseLookup.entries()) {
          if (key.includes(normalized) || normalized.includes(key)) {
            match = value;
            break;
          }
        }
      }

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
