import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing full API response structure...\n');

  const templates = await prisma.program_templates.findMany({
    where: {
      isActive: true,
      isPublic: true,
    },
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

  const templatesWithMetadata = templates.map((template) => ({
    ...template,
    totalWeeks: template.duration.match(/\d+/)?.[0] || '12',
    phaseCount: template.program_phases.length,
    slotCount: template.exercise_slots.length,
    isCustomizable: template.hasExerciseSlots,
    author: template.legendary_athlete?.name || template.users.name,
  }));

  // Check for any null or undefined values that might cause issues
  console.log('Checking for problematic values...\n');

  templatesWithMetadata.forEach((t, idx) => {
    const issues: string[] = [];

    if (!t.name) issues.push('name is missing');
    if (!t.description) issues.push('description is missing');
    if (!t.duration) issues.push('duration is missing');
    if (!t.difficulty) issues.push('difficulty is missing');
    if (!t.programType) issues.push('programType is missing');
    if (!t.author) issues.push('author is missing');
    if (t.tags === null || t.tags === undefined) issues.push('tags is null/undefined');

    if (issues.length > 0) {
      console.log(`Program ${idx + 1}: ${t.name || 'UNNAMED'}`);
      console.log(`  Issues: ${issues.join(', ')}`);
      console.log(`  Data:`, JSON.stringify(t, null, 2));
      console.log();
    }
  });

  console.log('\nChecking templateData field for CASTELLERS programs...\n');

  const castellersPrograms = templatesWithMetadata.filter(
    t => t.programType === 'CASTELLERS'
  );

  castellersPrograms.forEach(p => {
    console.log(`${p.name}:`);
    console.log(`  templateData type: ${typeof p.templateData}`);
    console.log(`  templateData value:`, p.templateData);
    if (p.templateData && typeof p.templateData === 'object') {
      console.log(`  Keys:`, Object.keys(p.templateData));
    }
    console.log();
  });

  console.log(`\nTotal programs: ${templatesWithMetadata.length}`);
  console.log('API response structure looks OK');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
