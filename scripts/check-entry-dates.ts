import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking workout_log_entries for invalid dates...\n');

  const entries = await prisma.workout_log_entries.findMany({
    select: {
      id: true,
      date: true,
      userId: true,
      sessionId: true,
    },
    take: 100, // Check first 100
  });

  console.log(`Checking ${entries.length} entries...\n`);

  const problems: any[] = [];

  entries.forEach(e => {
    if (!e.date) {
      problems.push({
        id: e.id,
        date: e.date,
        issue: 'date is null/undefined',
      });
    } else if (isNaN(new Date(e.date).getTime())) {
      problems.push({
        id: e.id,
        date: e.date,
        issue: 'date is invalid',
      });
    }
  });

  if (problems.length === 0) {
    console.log('✅ All entries have valid dates');
  } else {
    console.log(`❌ Found ${problems.length} entries with date issues:\n`);
    problems.forEach(p => {
      console.log(`Entry ID: ${p.id}`);
      console.log(`  Date: ${p.date}`);
      console.log(`  Issue: ${p.issue}`);
      console.log();
    });

    console.log('Fixing invalid dates...\n');

    for (const problem of problems) {
      await prisma.workout_log_entries.update({
        where: { id: problem.id },
        data: { date: new Date() },
      });
      console.log(`✓ Fixed entry ${problem.id}`);
    }
  }

  // Also check assessments
  console.log('\nChecking assessments for invalid dates...\n');

  const assessments = await prisma.assessments.findMany({
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
    take: 100,
  });

  const assessmentProblems: any[] = [];

  assessments.forEach(a => {
    if (!a.createdAt || isNaN(new Date(a.createdAt).getTime())) {
      assessmentProblems.push({
        id: a.id,
        createdAt: a.createdAt,
        issue: 'createdAt is invalid',
      });
    }
  });

  if (assessmentProblems.length === 0) {
    console.log('✅ All assessments have valid dates');
  } else {
    console.log(`❌ Found ${assessmentProblems.length} assessments with date issues`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
