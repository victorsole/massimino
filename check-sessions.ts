import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.users.findUnique({
    where: { email: 'vsoleferioli@gmail.com' },
    select: { id: true }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  // Get all workout sessions
  const sessions = await prisma.workout_sessions.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('Sessions:', sessions.length);
  sessions.forEach(s => {
    console.log(`- ${s.title || 'Untitled'}: status=${s.status}, date=${s.date}, startTime=${s.startTime}`);
  });

  // Get workout entries
  const entries = await prisma.workout_log_entries.findMany({
    where: { userId: user.id },
    take: 5
  });
  console.log('\nEntries:', entries.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
