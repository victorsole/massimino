// Simpler script to create basic program templates for castell training
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const USER_ID = '9462f027-9916-41db-8d39-294c7858b516';

async function main() {
  try {
    console.log('🏰 Creating Castell Programs (Simple Version)');
    console.log('═════════════════════════════════════════════\n');

    // Load the castellers JSON
    const jsonPath = path.join(__dirname, '../src/templates/castellers.json');
    const castellData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log('📋 Creating Program Templates...\n');

    let programCount = 0;

    // Create a program template for each workout program
    for (const program of castellData.workout_programs) {
      console.log(`\n💪 ${program.name}`);
      console.log(`   Position: ${program.position}`);
      console.log(`   Duration: ${program.duration_minutes} minutes`);

      const programId = crypto.randomUUID();
      const now = new Date();

      // Create basic program template with templateData JSON
      const templateData = {
        name: program.name,
        position: program.position,
        difficulty: program.difficulty,
        duration_minutes: program.duration_minutes,
        training_type: program.training_type,
        equipment_needed: program.equipment_needed,
        warm_up: program.warm_up,
        main_workout: program.main_workout,
        cool_down: program.cool_down
      };

      await prisma.program_templates.create({
        data: {
          id: programId,
          users: {
            connect: { id: USER_ID }
          },
          name: program.name,
          description: `${program.description}\n\n**Position:** ${program.position}\n**Training Type:** ${program.training_type}\n**Difficulty:** ${program.difficulty}`,
          duration: `${Math.ceil(program.duration_minutes / 7)} weeks`, // Rough estimate
          difficulty: program.difficulty?.toUpperCase() || 'INTERMEDIATE',
          category: 'CASTELL_TRAINING',
          isPublic: true,
          programType: 'CUSTOM',
          tags: ['castells', 'team', 'mannekes', program.position.toLowerCase(), program.training_type.toLowerCase()],
          hasExerciseSlots: false,
          autoRegulation: false,
          templateData: templateData as any,
          createdAt: now,
          updatedAt: now
        }
      });

      console.log(`   ✅ Program template created`);
      programCount++;
    }

    console.log('\n\n');
    console.log('═════════════════════════════════════════════');
    console.log('🎉 SUCCESS! Programs Created');
    console.log('═════════════════════════════════════════════');
    console.log(`\n📊 Summary:`);
    console.log(`   Program Templates: ${programCount}`);
    console.log('\n💪 Programs created:');
    for (const program of castellData.workout_programs) {
      console.log(`   • ${program.name}`);
    }
    console.log('\n✨ Programs now visible in /workout-log?tab=programs!');
    console.log('   (Look for category: CASTELL_TRAINING)');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
