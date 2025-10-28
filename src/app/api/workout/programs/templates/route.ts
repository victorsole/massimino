/**
 * Program Templates API
 * GET: Browse program templates (athlete programs + periodization templates)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // ATHLETE, PERIODIZATION, HYBRID, CUSTOM
    const discipline = searchParams.get('discipline'); // BODYBUILDING, POWERLIFTING, etc.
    const difficulty = searchParams.get('difficulty');
    const athleteSlug = searchParams.get('athlete');

    const where: any = {
      isActive: true,
      isPublic: true,
    };

    if (type) {
      where.programType = type.toUpperCase();
    }

    if (difficulty) {
      where.difficulty = difficulty.toUpperCase();
    }

    if (athleteSlug) {
      const athlete = await prisma.legendary_athletes.findUnique({
        where: { slug: athleteSlug },
        select: { id: true },
      });
      if (athlete) {
        where.athleteId = athlete.id;
      }
    }

    // Get templates with their structure
    const templates = await prisma.program_templates.findMany({
      where,
      include: {
        legendary_athlete: {
          select: {
            id: true,
            name: true,
            slug: true,
            eraLabel: true,
            imageUrl: true,
            discipline: true,
          },
        },
        program_phases: {
          orderBy: {
            phaseNumber: 'asc',
          },
          select: {
            id: true,
            phaseNumber: true,
            phaseName: true,
            phaseType: true,
            startWeek: true,
            endWeek: true,
            description: true,
            targetIntensity: true,
            targetVolume: true,
            repRangeLow: true,
            repRangeHigh: true,
            setsPerExercise: true,
          },
        },
        exercise_slots: {
          orderBy: {
            slotNumber: 'asc',
          },
          select: {
            id: true,
            slotNumber: true,
            slotLabel: true,
            exerciseType: true,
            movementPattern: true,
            muscleTargets: true,
            equipmentOptions: true,
            description: true,
            isRequired: true,
          },
        },
        users: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { programType: 'asc' },
        { rating: 'desc' },
      ],
    });

    // Add computed fields
    const templatesWithMetadata = templates.map((template) => ({
      ...template,
      totalWeeks: template.duration.match(/\d+/)?.[0] || '12',
      phaseCount: template.program_phases.length,
      slotCount: template.exercise_slots.length,
      isCustomizable: template.hasExerciseSlots,
      author: template.legendary_athlete?.name || template.users.name,
    }));

    return NextResponse.json(templatesWithMetadata);
  } catch (error) {
    console.error('Templates GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
