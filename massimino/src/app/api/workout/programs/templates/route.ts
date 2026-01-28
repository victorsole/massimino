/**
 * Program Templates API
 * GET: Browse program templates (athlete programs + periodization templates)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Map program IDs to their JSON template files
const TEMPLATE_FILE_MAP: Record<string, string> = {
  'cbum-classic-physique': 'cbum.json',
  'arnold-golden-six': 'arnold_golden_six.json',
  'arnold-volume-workout': 'arnold_volume.json',
  'ronnie-coleman-mass-builder': 'ronnie_coleman_volume.json',
  'colorado-experiment-hit': 'colorado_experiment.json',
  'nasm-fat-loss-program': 'fat-loss.json',
  'nasm-muscle-gain-program': 'muscle-gain.json',
  'nasm-performance-program': 'performance.json',
  'aesthetics-hunter': 'aesthetics_hunter.json',
  'bye-stress-bye': 'bye_stress_bye.json',
  'i-just-became-a-dad': 'i_just_became_a_dad.json',
  'i-just-became-a-mum': 'i_just_became_a_mum.json',
  'i-dont-have-much-time': 'i_dont_have_much_time.json',
  'wanna-lose-beer-belly': 'wanna_lose_this_beer_belly.json',
  'flexibility-workout': 'flexibility_workout.json',
  'plyometric-workout': 'plyometric_workout.json',
  'balance-workout': 'balance_workout.json',
  'cardio-workout': 'cardio_workout.json',
  'castellers': 'castellers.json',
  'medical-conditions': 'medical_conditions.json',
  'ifbb-classic-physique': 'ifbb_classic_physique.json',
  'superday-workout': 'superday_workout.json',
  // Periodization templates
  'linear-periodization-12week': 'micro_mesocycles.json',
  'standard-programming': 'programming.json',
};

// Load JSON template from file
function loadTemplateFromFile(programId: string): any | null {
  const filename = TEMPLATE_FILE_MAP[programId];
  if (!filename) return null;

  try {
    const templatePath = path.join(process.cwd(), 'src', 'templates', filename);
    if (fs.existsSync(templatePath)) {
      const content = fs.readFileSync(templatePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Failed to load template for ${programId}:`, err);
  }
  return null;
}

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
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        difficulty: true,
        category: true,
        isPublic: true,
        price: true,
        currency: true,
        purchaseCount: true,
        rating: true,
        ratingCount: true,
        isActive: true,
        tags: true,
        programType: true,
        athleteId: true,
        hasExerciseSlots: true,
        progressionStrategy: true,
        autoRegulation: true,
        templateData: true, // Include the full template JSON
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

    // Add computed fields and load JSON templates
    const templatesWithMetadata = templates.map((template) => {
      // Load JSON template if available and templateData is null
      const jsonTemplate = !template.templateData ? loadTemplateFromFile(template.id) : null;

      return {
        ...template,
        // Use JSON template data if available
        templateData: template.templateData || jsonTemplate,
        totalWeeks: template.duration.match(/\d+/)?.[0] || '12',
        phaseCount: template.program_phases.length,
        slotCount: template.exercise_slots.length,
        isCustomizable: template.hasExerciseSlots,
        author: template.legendary_athlete?.name || template.users?.name,
      };
    });

    return NextResponse.json({
      templates: templatesWithMetadata,
      total: templatesWithMetadata.length,
    });
  } catch (error) {
    console.error('Templates GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
