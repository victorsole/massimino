import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== CHECKING EXISTING PROGRAMS ===\n');

  const programs = await prisma.program_templates.findMany({
    select: {
      id: true,
      name: true,
      programType: true,
      category: true,
      difficulty: true,
      isActive: true,
      isPublic: true,
      legendary_athlete: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      programType: 'asc',
    },
  });

  console.log(`Found ${programs.length} programs:\n`);

  programs.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   Type: ${p.programType} | Category: ${p.category} | Difficulty: ${p.difficulty}`);
    console.log(`   Active: ${p.isActive} | Public: ${p.isPublic}`);
    if (p.legendary_athlete) {
      console.log(`   Athlete: ${p.legendary_athlete.name}`);
    }
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
