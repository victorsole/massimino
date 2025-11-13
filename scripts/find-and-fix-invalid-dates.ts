import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding and fixing all invalid dates...\n');

  // Check workout_sessions
  console.log('Checking workout_sessions...');
  const sessions = await prisma.workout_sessions.findMany({
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
    },
  });

  let fixed = 0;
  for (const session of sessions) {
    const updates: any = {};

    if (!session.date || isNaN(new Date(session.date).getTime())) {
      updates.date = new Date();
      console.log(`  Fixing session ${session.id} - invalid date`);
    }

    if (!session.startTime || isNaN(new Date(session.startTime).getTime())) {
      updates.startTime = new Date();
      console.log(`  Fixing session ${session.id} - invalid startTime`);
    }

    if (session.endTime && isNaN(new Date(session.endTime).getTime())) {
      updates.endTime = null;
      console.log(`  Fixing session ${session.id} - invalid endTime`);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.workout_sessions.update({
        where: { id: session.id },
        data: updates,
      });
      fixed++;
    }
  }

  console.log(`Fixed ${fixed} workout_sessions\n`);

  // Check workout_log_entries
  console.log('Checking workout_log_entries...');
  const entries = await prisma.workout_log_entries.findMany({
    select: {
      id: true,
      date: true,
    },
  });

  let entriesFixed = 0;
  for (const entry of entries) {
    if (!entry.date || isNaN(new Date(entry.date).getTime())) {
      await prisma.workout_log_entries.update({
        where: { id: entry.id },
        data: { date: new Date() },
      });
      console.log(`  Fixed entry ${entry.id}`);
      entriesFixed++;
    }
  }

  console.log(`Fixed ${entriesFixed} workout_log_entries\n`);

  // Check assessments
  console.log('Checking assessments...');
  const assessments = await prisma.assessments.findMany({
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  let assessmentsFixed = 0;
  for (const assessment of assessments) {
    const updates: any = {};

    if (!assessment.createdAt || isNaN(new Date(assessment.createdAt).getTime())) {
      updates.createdAt = new Date();
      console.log(`  Fixing assessment ${assessment.id} - invalid createdAt`);
    }

    if (!assessment.updatedAt || isNaN(new Date(assessment.updatedAt).getTime())) {
      updates.updatedAt = new Date();
      console.log(`  Fixing assessment ${assessment.id} - invalid updatedAt`);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.assessments.update({
        where: { id: assessment.id },
        data: updates,
      });
      assessmentsFixed++;
    }
  }

  console.log(`Fixed ${assessmentsFixed} assessments\n`);

  console.log('✅ All dates fixed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
