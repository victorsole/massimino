import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing program templates query...\n');

  const where = {
    isActive: true,
    isPublic: true,
  };

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
      templateData: true,
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

  console.log(`Found ${templates.length} programs\n`);

  // Group by program type
  const byType: Record<string, any[]> = {};
  templates.forEach(t => {
    const type = t.programType || 'UNKNOWN';
    if (!byType[type]) {
      byType[type] = [];
    }
    byType[type].push(t);
  });

  console.log('Programs by type:');
  Object.entries(byType).forEach(([type, programs]) => {
    console.log(`\n${type}: ${programs.length}`);
    programs.forEach(p => {
      console.log(`  - ${p.name} (${p.program_phases.length} phases)`);
    });
  });

  // Check for any programs without phases
  const withoutPhases = templates.filter(t => t.program_phases.length === 0);
  if (withoutPhases.length > 0) {
    console.log(`\n⚠️  ${withoutPhases.length} programs without phases:`);
    withoutPhases.forEach(p => {
      console.log(`  - ${p.name} (${p.programType})`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
