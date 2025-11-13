import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const programs = await prisma.program_templates.findMany({
    select: {
      id: true,
      name: true,
      programType: true,
      isActive: true,
      isPublic: true
    }
  });

  console.log('Total programs:', programs.length);
  console.log('\nPrograms by status:');

  const active = programs.filter(p => p.isActive);
  const publicPrograms = programs.filter(p => p.isPublic);
  const both = programs.filter(p => p.isActive && p.isPublic);

  console.log('Active:', active.length);
  console.log('Public:', publicPrograms.length);
  console.log('Both active AND public:', both.length);

  console.log('\nPrograms that are NOT active or NOT public:');
  const problem = programs.filter(p => !p.isActive || !p.isPublic);

  if (problem.length === 0) {
    console.log('  (None - all programs are active and public)');
  } else {
    problem.forEach(p => {
      console.log(`  - ${p.name} (${p.programType}) - isActive: ${p.isActive}, isPublic: ${p.isPublic}`);
    });
  }

  console.log('\nPrograms by type (active & public only):');
  const types: Record<string, number> = {};
  both.forEach(p => {
    const type = p.programType || 'UNKNOWN';
    types[type] = (types[type] || 0) + 1;
  });

  Object.entries(types).sort().forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
