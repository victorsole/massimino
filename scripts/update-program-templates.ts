/**
 * Update Program Templates with Exercise Data
 *
 * This script updates program_templates entries with their templateData
 * from the JSON files in src/templates/
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'templates');

// Map of program IDs to their template filenames
const PROGRAM_TEMPLATE_MAP: Record<string, string> = {
  'mike-mentzer-heavy-duty': 'mike_mentzer_heavy_duty.json',
  'linear-periodization-12week': 'linear_periodization_12week.json',
  'arnold-golden-six': 'arnold_golden_six.json',
  'nasm-fat-loss-program': 'fat-loss.json',
  'nasm-muscle-gain-program': 'muscle-gain.json',
  'nasm-performance-program': 'performance.json',
  'cbum-classic-physique': 'cbum.json',
  'ronnie-coleman-volume': 'ronnie_coleman_volume.json',
  'colorado-experiment': 'colorado_experiment.json',
  'arnold-volume-training': 'arnold_volume.json',
  'aesthetics-hunter': 'aesthetics_hunter.json',
  'i-dont-have-much-time': 'i_dont_have_much_time.json',
  'wanna-lose-this-beer-belly': 'wanna_lose_this_beer_belly.json',
  'bye-stress-bye': 'bye_stress_bye.json',
  'i-just-became-a-dad': 'i_just_became_a_dad.json',
  'i-just-became-a-mum': 'i_just_became_a_mum.json',
};

// Force update flag - set true to overwrite existing templateData
const FORCE_UPDATE = process.argv.includes('--force');

async function main() {
  console.log('=== Updating Program Templates ===\n');

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const [programId, templateFile] of Object.entries(PROGRAM_TEMPLATE_MAP)) {
    const templatePath = path.join(TEMPLATES_DIR, templateFile);

    // Check if template file exists
    if (!fs.existsSync(templatePath)) {
      console.log(`❌ Template file not found: ${templateFile}`);
      notFound++;
      continue;
    }

    try {
      // Read template data
      const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

      // Find program in database
      const program = await prisma.program_templates.findUnique({
        where: { id: programId },
      });

      if (!program) {
        console.log(`⚠️ Program not found in database: ${programId}`);
        notFound++;
        continue;
      }

      // Check if templateData is already set and has exercises
      const hasExistingExercises = program.templateData &&
        typeof program.templateData === 'object' &&
        (
          (program.templateData as any).workout_sessions?.length > 0 ||
          (program.templateData as any).the_six_exercises?.length > 0 ||
          (program.templateData as any).workouts?.length > 0
        );

      if (hasExistingExercises && !FORCE_UPDATE) {
        console.log(`✓ ${programId}: Already has exercise data (use --force to override)`);
        continue;
      }

      // Update program with template data
      await prisma.program_templates.update({
        where: { id: programId },
        data: {
          templateData: templateData,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Updated: ${programId} with ${templateFile}`);
      updated++;

    } catch (error) {
      console.log(`❌ Error processing ${programId}:`, error);
      errors++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Errors: ${errors}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
