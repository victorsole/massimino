import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const programs = await prisma.program_templates.findMany({
    where: {
      isActive: true,
      isPublic: true,
    },
    select: {
      id: true,
      name: true,
      programType: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log(`Checking dates for ${programs.length} programs...\n`);

  const problems: any[] = [];

  programs.forEach(p => {
    const issues: string[] = [];

    if (!p.createdAt) {
      issues.push('createdAt is null');
    } else if (isNaN(new Date(p.createdAt).getTime())) {
      issues.push('createdAt is invalid');
    }

    if (!p.updatedAt) {
      issues.push('updatedAt is null');
    } else if (isNaN(new Date(p.updatedAt).getTime())) {
      issues.push('updatedAt is invalid');
    }

    if (issues.length > 0) {
      problems.push({
        id: p.id,
        name: p.name,
        programType: p.programType,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        issues,
      });
    }
  });

  if (problems.length === 0) {
    console.log('✅ All programs have valid dates');
  } else {
    console.log(`❌ Found ${problems.length} programs with date issues:\n`);
    problems.forEach(p => {
      console.log(`Program: ${p.name} (${p.programType})`);
      console.log(`  ID: ${p.id}`);
      console.log(`  createdAt: ${p.createdAt}`);
      console.log(`  updatedAt: ${p.updatedAt}`);
      console.log(`  Issues: ${p.issues.join(', ')}`);
      console.log();
    });
  }

  // Also check for any programs with very old or future dates
  console.log('\nProgram date ranges:');
  const dates = programs
    .filter(p => p.createdAt)
    .map(p => new Date(p.createdAt).getTime())
    .sort((a, b) => a - b);

  if (dates.length > 0) {
    const oldest = new Date(dates[0]);
    const newest = new Date(dates[dates.length - 1]);
    console.log(`  Oldest: ${oldest.toISOString()}`);
    console.log(`  Newest: ${newest.toISOString()}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
