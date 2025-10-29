import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
  project: process.env.OPENAI_PROJECT,
});

async function embedDocument(content: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured. Embedding requires an OpenAI API key.');
  }
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: content,
  });
  const vec = res.data?.[0]?.embedding;
  if (!vec) throw new Error('Failed to compute embedding');
  return vec as unknown as number[];
}

interface KnowledgeDocument {
  name: string;
  content: string;
  metadata: any;
}

/**
 * Populate fitness_knowledge_base with embeddings for:
 * - All program structures (CBum, Fat Loss, Muscle Gain, Performance)
 * - All templates from src/templates/
 * - All exercises with properties
 * - Assessment types and guidelines
 */
async function main() {
  console.log('🚀 Starting knowledge base population...\n');

  // Clear existing knowledge base
  console.log('🗑️  Clearing existing knowledge base...');
  await prisma.fitness_knowledge_base.deleteMany({});
  console.log('✅ Cleared\n');

  const documents: KnowledgeDocument[] = [];

  // 1. Embed all program templates from database
  console.log('📚 Processing program templates from database...');
  const programs = await prisma.program_templates.findMany({
    include: {
      program_phases: {
        include: {
          microcycles: {
            include: {
              workouts: {
                include: {
                  workout_exercises: {
                    include: {
                      exercises: true,
                      exercise_slots: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  for (const program of programs) {
    const programDoc = formatProgramDocument(program);
    documents.push(programDoc);
    console.log(`  ✓ Embedded: ${program.name}`);

    // Embed each phase separately for better retrieval
    for (const phase of program.program_phases) {
      const phaseDoc = formatPhaseDocument(program, phase);
      documents.push(phaseDoc);
    }
  }
  console.log(`✅ Processed ${programs.length} programs\n`);

  // 2. Embed all JSON templates from src/templates/
  console.log('📝 Processing JSON templates...');
  const templatesDir = path.join(process.cwd(), 'src/templates');
  const templateFiles = await fs.readdir(templatesDir);
  const jsonFiles = templateFiles.filter(f => f.endsWith('.json'));

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(templatesDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const template = JSON.parse(content);
      const templateDoc = formatTemplateDocument(file, template);
      documents.push(templateDoc);
      console.log(`  ✓ Embedded: ${file}`);
    } catch (error) {
      console.log(`  ✗ Failed to process ${file}:`, error);
    }
  }
  console.log(`✅ Processed ${jsonFiles.length} templates\n`);

  // 3. Embed all exercises
  console.log('💪 Processing exercises...');
  const exercises = await prisma.exercises.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      muscleGroups: true,
      equipment: true,
      difficulty: true,
      instructions: true,
      isActive: true,
      imageUrl: true,
      videoUrl: true,
      createdBy: true,
    },
  });

  // Group exercises by category for better organization
  const exercisesByCategory = exercises.reduce((acc, ex) => {
    const cat = ex.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ex);
    return acc;
  }, {} as Record<string, typeof exercises>);

  for (const [category, exList] of Object.entries(exercisesByCategory)) {
    // Create category overview document
    const categoryDoc = formatExerciseCategoryDocument(category, exList);
    documents.push(categoryDoc);

    // Create individual exercise documents for detailed exercises
    for (const ex of exList.slice(0, 50)) { // Limit to avoid excessive docs
      if (ex.instructions) {
        const exDoc = formatExerciseDocument(ex);
        documents.push(exDoc);
      }
    }
  }
  console.log(`✅ Processed ${exercises.length} exercises in ${Object.keys(exercisesByCategory).length} categories\n`);

  // 4. Embed assessment guidelines
  console.log('📋 Processing assessment guidelines...');
  const assessmentDocs = createAssessmentDocuments();
  documents.push(...assessmentDocs);
  console.log(`✅ Created ${assessmentDocs.length} assessment documents\n`);

  // Now embed and store all documents
  console.log('🔄 Generating embeddings and storing...');
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    try {
      const embedding = await embedDocument(doc.content);
      await prisma.fitness_knowledge_base.create({
        data: {
          documentName: doc.name,
          content: doc.content,
          embedding: embedding as any,
          metadata: doc.metadata,
        },
      });
      successCount++;
      if ((i + 1) % 10 === 0) {
        console.log(`  Progress: ${i + 1}/${documents.length} documents`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to embed ${doc.name}:`, error);
      failCount++;
    }
  }

  console.log(`\n✅ Knowledge base populated successfully!`);
  console.log(`   Success: ${successCount} documents`);
  console.log(`   Failed: ${failCount} documents`);
  console.log(`   Total: ${documents.length} documents\n`);
}

function formatProgramDocument(program: any): KnowledgeDocument {
  const phases = program.program_phases || [];
  const totalWeeks = phases.reduce((sum: number, p: any) => sum + (p.endWeek - p.startWeek + 1 || 0), 0);

  let content = `Program: ${program.name}\n`;
  content += `Description: ${program.description || 'N/A'}\n`;
  content += `Category: ${program.category || 'N/A'}\n`;
  content += `Difficulty: ${program.difficulty || 'N/A'}\n`;
  content += `Duration: ${totalWeeks} weeks\n`;
  content += `Phases: ${phases.length}\n\n`;

  content += `Program Structure:\n`;
  for (const phase of phases) {
    content += `\n- Phase ${phase.phaseNumber}: ${phase.phaseName}\n`;
    content += `  Duration: ${phase.endWeek - phase.startWeek + 1} weeks\n`;
    content += `  Focus: ${phase.trainingFocus || 'N/A'}\n`;

    const microcycles = phase.microcycles || [];
    content += `  Microcycles: ${microcycles.length}\n`;

    for (const micro of microcycles.slice(0, 2)) { // First 2 microcycles as sample
      content += `    - Week ${micro.weekNumber}: ${micro.title}\n`;
      const workouts = micro.workouts || [];
      content += `      Workouts: ${workouts.map((w: any) => `Day ${w.dayNumber} - ${w.dayLabel}`).join(', ')}\n`;
    }
  }

  return {
    name: `program_${program.id}`,
    content,
    metadata: {
      type: 'program',
      programId: program.id,
      programName: program.name,
      difficulty: program.difficulty,
      category: program.category,
    },
  };
}

function formatPhaseDocument(program: any, phase: any): KnowledgeDocument {
  let content = `Program: ${program.name} - Phase ${phase.phaseNumber}: ${phase.phaseName}\n`;
  content += `Duration: ${phase.endWeek - phase.startWeek + 1} weeks\n`;
  content += `Focus: ${phase.trainingFocus || 'N/A'}\n\n`;

  const microcycles = phase.microcycles || [];
  content += `Detailed Weekly Structure:\n`;

  for (const micro of microcycles) {
    content += `\nWeek ${micro.weekNumber}: ${micro.title}\n`;
    if (micro.description) content += `Description: ${micro.description}\n`;

    const workouts = micro.workouts || [];
    for (const workout of workouts) {
      content += `\n  Day ${workout.dayNumber}: ${workout.dayLabel}\n`;
      if (workout.description) content += `  ${workout.description}\n`;

      const exercises = workout.workout_exercises || [];
      content += `  Exercises (${exercises.length}):\n`;

      for (const ex of exercises) {
        const exercise = ex.exercises;
        const slot = ex.exercise_slots;
        content += `    ${ex.exerciseOrder}. ${exercise?.name || slot?.slotLabel || 'Exercise'}\n`;
        content += `       Sets: ${ex.sets}, Reps: ${ex.targetReps}, Rest: ${ex.restSeconds}s\n`;
        if (ex.targetIntensity) content += `       Intensity: ${ex.targetIntensity}%\n`;
        if (ex.notes) content += `       Notes: ${ex.notes}\n`;
      }
    }
  }

  return {
    name: `program_${program.id}_phase_${phase.phaseNumber}`,
    content,
    metadata: {
      type: 'program_phase',
      programId: program.id,
      programName: program.name,
      phaseNumber: phase.phaseNumber,
      phaseName: phase.phaseName,
      focus: phase.trainingFocus,
    },
  };
}

function formatTemplateDocument(filename: string, template: any): KnowledgeDocument {
  let content = `Template: ${template.program_name || filename}\n`;
  content += `ID: ${template.program_id || filename.replace('.json', '')}\n`;
  if (template.description) content += `Description: ${template.description}\n`;
  if (template.level) content += `Level: ${template.level}\n`;
  if (template.goal) content += `Goal: ${template.goal}\n`;
  if (template.frequency) content += `Frequency: ${template.frequency}\n`;
  if (template.duration) content += `Duration: ${template.duration}\n\n`;

  const exercises = template.exercises || [];
  if (exercises.length > 0) {
    content += `Exercises (${exercises.length}):\n`;
    for (const ex of exercises) {
      content += `\n${ex.order}. ${ex.exercise_name}\n`;
      content += `   Sets: ${ex.sets}, Reps: ${ex.reps}, Rest: ${ex.rest_seconds}s\n`;
      if (ex.tempo) content += `   Tempo: ${ex.tempo} - ${ex.tempo_description}\n`;
      if (ex.load_guidance) content += `   Load: ${ex.load_guidance}\n`;
      if (ex.notes) content += `   Notes: ${ex.notes}\n`;
      if (ex.primary_muscle_groups) content += `   Muscles: ${ex.primary_muscle_groups.join(', ')}\n`;
    }
  }

  if (template.progression_strategy) {
    content += `\nProgression: ${template.progression_strategy.method}\n`;
    content += `${template.progression_strategy.description}\n`;
  }

  return {
    name: `template_${filename}`,
    content,
    metadata: {
      type: 'template',
      filename,
      program_id: template.program_id,
      level: template.level,
      goal: template.goal,
    },
  };
}

function formatExerciseCategoryDocument(category: string, exercises: any[]): KnowledgeDocument {
  let content = `Exercise Category: ${category}\n`;
  content += `Total exercises: ${exercises.length}\n\n`;

  // Group by muscle groups
  const byMuscle = exercises.reduce((acc, ex) => {
    const muscles = ex.muscleGroups || [];
    for (const muscle of muscles) {
      if (!acc[muscle]) acc[muscle] = [];
      acc[muscle].push(ex.name);
    }
    return acc;
  }, {} as Record<string, string[]>);

  content += `Exercises by muscle group:\n`;
  for (const [muscle, exNames] of Object.entries(byMuscle)) {
    const names = exNames as string[];
    content += `\n${muscle} (${names.length} exercises):\n`;
    content += names.slice(0, 20).map(name => `- ${name}`).join('\n');
    if (names.length > 20) content += `\n... and ${names.length - 20} more`;
    content += `\n`;
  }

  // List all exercise names for searchability
  content += `\n\nAll exercises in ${category}:\n`;
  content += exercises.map(ex => ex.name).join(', ');

  return {
    name: `exercises_category_${category}`,
    content,
    metadata: {
      type: 'exercise_category',
      category,
      exerciseCount: exercises.length,
    },
  };
}

function formatExerciseDocument(exercise: any): KnowledgeDocument {
  let content = `Exercise: ${exercise.name}\n`;
  content += `Category: ${exercise.category || 'N/A'}\n`;
  if (exercise.muscleGroups?.length) content += `Muscle Groups: ${exercise.muscleGroups.join(', ')}\n`;
  if (exercise.equipment?.length) content += `Equipment: ${exercise.equipment.join(', ')}\n`;
  if (exercise.difficulty) content += `Difficulty: ${exercise.difficulty}\n`;
  if (exercise.instructions) content += `\nInstructions:\n${exercise.instructions}\n`;
  if (exercise.imageUrl) content += `\nImage available: Yes\n`;
  if (exercise.videoUrl) content += `Video available: Yes\n`;

  return {
    name: `exercise_${exercise.id}`,
    content,
    metadata: {
      type: 'exercise',
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.muscleGroups,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      hasMedia: !!(exercise.imageUrl || exercise.videoUrl),
    },
  };
}

function createAssessmentDocuments(): KnowledgeDocument[] {
  const docs: KnowledgeDocument[] = [];

  // OVERHEAD SQUAT ASSESSMENT
  docs.push({
    name: 'assessment_overhead_squat',
    content: `Assessment: Overhead Squat Assessment

Purpose: Evaluate movement quality, flexibility, stability, and identify muscle imbalances

How to perform:
1. Stand with feet shoulder-width apart
2. Raise arms overhead with elbows extended
3. Perform 5 squats with arms overhead
4. Observe from front and side views

Common compensations and corrections:

FEET TURN OUT (>15°):
- Overactive: Soleus, lateral gastrocnemius, biceps femoris (short head)
- Underactive: Medial gastrocnemius, medial hamstrings, gracilis, sartorius, popliteus
- Corrective exercises: SMR calves, static stretch soleus/gastrocnemius, strengthen medial hamstrings

HEELS RISE:
- Overactive: Soleus, gastrocnemius, hip flexors, abdominals
- Underactive: Anterior tibialis, gluteus maximus, erector spinae
- Corrective exercises: SMR calves, static stretch calves/hip flexors, strengthen tibialis anterior

KNEES MOVE INWARD:
- Overactive: Adductors, biceps femoris (short head), TFL, vastus lateralis
- Underactive: Gluteus medius/maximus, vastus medialis
- Corrective exercises: SMR adductors/TFL/IT band, strengthen glute med/max

LOW BACK ARCHES:
- Overactive: Hip flexors, erector spinae, latissimus dorsi
- Underactive: Hamstrings, intrinsic core stabilizers
- Corrective exercises: SMR hip flexors/lats, static stretch hip flexors, strengthen core

ARMS FALL FORWARD:
- Overactive: Latissimus dorsi, teres major, pectorals
- Underactive: Mid/lower trapezius, rhomboids, rotator cuff
- Corrective exercises: SMR lats/pecs, static stretch lats/pecs, strengthen mid-back`,
    metadata: { type: 'assessment', assessmentType: 'OVERHEAD_SQUAT' },
  });

  // PUSH ASSESSMENT
  docs.push({
    name: 'assessment_push',
    content: `Assessment: Push Assessment (Push-Up Test)

Purpose: Evaluate upper body pushing movement, shoulder stability, and core control

How to perform:
1. Start in standard push-up position (hands shoulder-width)
2. Perform 5 controlled push-ups
3. Observe from front and side views

Common compensations:

SHOULDERS ELEVATE:
- Overactive: Upper trapezius, levator scapulae
- Underactive: Lower trapezius, serratus anterior
- Corrective exercises: SMR upper traps, static stretch upper traps/levator, strengthen lower traps

HEAD PROTRUDES FORWARD:
- Overactive: Levator scapulae, upper trapezius, sternocleidomastoid
- Underactive: Deep cervical flexors
- Corrective exercises: SMR upper traps, static stretch upper traps, chin tucks

LOW BACK ARCHES:
- Overactive: Hip flexors, erector spinae
- Underactive: Intrinsic core stabilizers, gluteus maximus
- Corrective exercises: SMR hip flexors, static stretch hip flexors, planks/dead bugs`,
    metadata: { type: 'assessment', assessmentType: 'PUSH' },
  });

  // BODY COMPOSITION
  docs.push({
    name: 'assessment_body_composition',
    content: `Assessment: Body Composition Analysis

Key Metrics:

BMI (Body Mass Index):
- Formula: weight(kg) / height(m)²
- Underweight: < 18.5
- Normal: 18.5-24.9
- Overweight: 25-29.9
- Obese: ≥ 30

Body Fat Percentage (general guidelines):
Men:
- Essential fat: 2-5%
- Athletes: 6-13%
- Fitness: 14-17%
- Average: 18-24%
- Obese: > 25%

Women:
- Essential fat: 10-13%
- Athletes: 14-20%
- Fitness: 21-24%
- Average: 25-31%
- Obese: > 32%

Waist-to-Hip Ratio:
- Men: < 0.90 (low risk), 0.90-0.99 (moderate), ≥ 1.0 (high)
- Women: < 0.80 (low risk), 0.80-0.89 (moderate), ≥ 0.90 (high)

Measurement methods:
- Skinfold calipers (7-site protocol)
- Bioelectrical impedance
- DEXA scan
- Hydrostatic weighing`,
    metadata: { type: 'assessment', assessmentType: 'BODY_COMPOSITION' },
  });

  // CARDIO ASSESSMENT
  docs.push({
    name: 'assessment_cardio',
    content: `Assessment: Cardiovascular Fitness

VO2 Max Estimation (Rockport Walk Test):
1. Walk 1 mile as fast as possible
2. Record time and heart rate immediately after
3. Calculate using formula or tables

VO2 Max Classifications (ml/kg/min):

Men (20-29 years):
- Excellent: > 51
- Good: 45-51
- Average: 39-44
- Below Average: 33-38
- Poor: < 33

Women (20-29 years):
- Excellent: > 45
- Good: 39-45
- Average: 34-38
- Below Average: 28-33
- Poor: < 28

Resting Heart Rate:
- Excellent: < 60 bpm
- Good: 60-69 bpm
- Average: 70-79 bpm
- Below Average: 80-89 bpm
- Poor: > 90 bpm

Training Heart Rate Zones:
- Zone 1 (Recovery): 50-60% max HR
- Zone 2 (Aerobic): 60-70% max HR
- Zone 3 (Tempo): 70-80% max HR
- Zone 4 (Threshold): 80-90% max HR
- Zone 5 (VO2 Max): 90-100% max HR`,
    metadata: { type: 'assessment', assessmentType: 'CARDIO' },
  });

  return docs;
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('❌ Script failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
