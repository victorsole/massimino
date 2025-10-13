// src/services/ai/workout-suggestions.ts

import OpenAI from 'openai';
import { prisma } from '@/core/database';
import fs from 'fs';
import path from 'path';

// Initialize OpenAI using existing configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface WorkoutSuggestionRequest {
  userId: string;
  fitnessGoals: string[];
  experienceLevel: string;
  preferredWorkoutTypes: string[];
  availableWorkoutDays: string[];
  preferredWorkoutDuration: string;
  recentExercises?: string[];
}

interface WorkoutSuggestion {
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    restTime: string;
    notes?: string;
  }[];
  tips: string[];
}

// Training Knowledge Base Interfaces
interface TrainingPrinciple {
  name: string;
  description: string;
  application: string;
  category: 'TRAINING' | 'NUTRITION' | 'ASSESSMENT';
  source_section: string;
}

interface ExerciseRecommendation {
  movement_pattern: string;
  training_principle: string;
  progression_level: string;
  coaching_cues: string[];
}

interface NutritionGuidelines {
  protein: string;
  carbohydrates: string;
  fats: string;
  food_choices: string;
}

export async function generateWorkoutSuggestions(
  request: WorkoutSuggestionRequest
): Promise<WorkoutSuggestion[]> {
  try {
    // Get user's recent workout history for context
    const recentWorkouts = await prisma.workout_log_entries.findMany({
      where: { userId: request.userId },
      include: { exercises: true },
      orderBy: { date: 'desc' },
      take: 10
    });

    // Get available exercises from database
    const availableExercises = await prisma.exercises.findMany({
      where: { isActive: true },
      select: { name: true, category: true, muscleGroups: true, difficulty: true },
      take: 50 // Limit to avoid token limits
    });

    // Create the AI prompt
    const prompt = createWorkoutPrompt(request, recentWorkouts, availableExercises);

    // Generate suggestions using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert personal trainer with extensive knowledge of fitness, exercise science, and workout programming. Provide practical, safe, and effective workout suggestions based on the user\'s preferences and goals.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const aiResponse = response.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI service');
    }

    // Parse the AI response into structured suggestions
    const suggestions = parseAIResponse(aiResponse);

    return suggestions;

  } catch (error) {
    console.error('Error generating AI workout suggestions:', error);

    // Fallback to rule-based suggestions if AI fails
    return generateFallbackSuggestions(request);
  }
}

function createWorkoutPrompt(
  request: WorkoutSuggestionRequest,
  recentWorkouts: any[],
  availableExercises: any[]
): string {
  const recentExerciseNames = recentWorkouts.map(w => w.exercises.name).slice(0, 5);

  return `
Create 2-3 personalized workout suggestions for a user with the following profile:

**User Profile:**
- Fitness Goals: ${request.fitnessGoals.join(', ')}
- Experience Level: ${request.experienceLevel}
- Preferred Workout Types: ${request.preferredWorkoutTypes.join(', ')}
- Available Days: ${request.availableWorkoutDays.join(', ')}
- Preferred Duration: ${request.preferredWorkoutDuration} minutes
- Recent Exercises: ${recentExerciseNames.join(', ') || 'None'}

**Available Exercises (use these):**
${availableExercises.slice(0, 20).map(ex => `- ${ex.name} (${ex.category}, ${ex.difficulty})`).join('\n')}

**Requirements:**
1. Each workout should be appropriate for their experience level
2. Align with their fitness goals and preferred workout types
3. Fit within their preferred duration
4. Include 4-6 exercises with specific sets, reps, and rest times
5. Avoid exercises they've done recently (for variety)
6. Include practical tips for execution

**Format your response as JSON:**
\`\`\`json
[
  {
    "title": "Workout Name",
    "description": "Brief description of the workout focus",
    "duration": "30-45 minutes",
    "difficulty": "Beginner/Intermediate/Advanced",
    "exercises": [
      {
        "name": "Exercise Name",
        "sets": 3,
        "reps": "8-12",
        "restTime": "60-90 seconds",
        "notes": "Form tip or modification"
      }
    ],
    "tips": ["Training tip 1", "Training tip 2"]
  }
]
\`\`\`
`;
}

function parseAIResponse(response: string): WorkoutSuggestion[] {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/```json\n(.*?)\n```/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]!);
    }

    // Try to parse the entire response as JSON
    return JSON.parse(response);
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to parse AI response');
  }
}

function generateFallbackSuggestions(request: WorkoutSuggestionRequest): WorkoutSuggestion[] {
  // Rule-based fallback suggestions based on user preferences
  const suggestions: WorkoutSuggestion[] = [];

  if (request.preferredWorkoutTypes.includes('Strength Training')) {
    suggestions.push({
      title: 'Upper Body Strength',
      description: 'Focus on building upper body strength and muscle',
      duration: request.preferredWorkoutDuration + ' minutes',
      difficulty: request.experienceLevel,
      exercises: [
        {
          name: 'Push-ups',
          sets: request.experienceLevel === 'BEGINNER' ? 2 : 3,
          reps: request.experienceLevel === 'BEGINNER' ? '5-8' : '8-12',
          restTime: '60 seconds',
          notes: 'Start on knees if needed'
        },
        {
          name: 'Dumbbell Rows',
          sets: 3,
          reps: '8-12',
          restTime: '60-90 seconds',
          notes: 'Keep back straight'
        },
        {
          name: 'Shoulder Press',
          sets: 3,
          reps: '8-10',
          restTime: '60-90 seconds',
          notes: 'Control the movement'
        }
      ],
      tips: [
        'Focus on proper form over heavy weight',
        'Progressive overload is key for strength gains',
        'Rest adequately between sets'
      ]
    });
  }

  if (request.preferredWorkoutTypes.includes('Cardio')) {
    suggestions.push({
      title: 'Cardio Conditioning',
      description: 'Improve cardiovascular fitness and endurance',
      duration: request.preferredWorkoutDuration + ' minutes',
      difficulty: request.experienceLevel,
      exercises: [
        {
          name: 'Jumping Jacks',
          sets: 3,
          reps: request.experienceLevel === 'BEGINNER' ? '30 seconds' : '45 seconds',
          restTime: '30 seconds',
          notes: 'Maintain steady rhythm'
        },
        {
          name: 'High Knees',
          sets: 3,
          reps: '30 seconds',
          restTime: '30 seconds',
          notes: 'Drive knees up high'
        },
        {
          name: 'Burpees',
          sets: request.experienceLevel === 'BEGINNER' ? 2 : 3,
          reps: request.experienceLevel === 'BEGINNER' ? '5' : '8-10',
          restTime: '60 seconds',
          notes: 'Modify by stepping back instead of jumping'
        }
      ],
      tips: [
        'Start at a comfortable pace and build intensity',
        'Focus on breathing throughout the workout',
        'Stay hydrated during cardio sessions'
      ]
    });
  }

  // Default to at least one suggestion
  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Full Body Workout',
      description: 'Complete workout targeting all major muscle groups',
      duration: request.preferredWorkoutDuration + ' minutes',
      difficulty: request.experienceLevel,
      exercises: [
        {
          name: 'Bodyweight Squats',
          sets: 3,
          reps: '10-15',
          restTime: '60 seconds',
          notes: 'Keep chest up and knees aligned'
        },
        {
          name: 'Push-ups',
          sets: 3,
          reps: '5-10',
          restTime: '60 seconds',
          notes: 'Modify on knees if needed'
        },
        {
          name: 'Plank',
          sets: 3,
          reps: '20-30 seconds',
          restTime: '45 seconds',
          notes: 'Keep body straight'
        }
      ],
      tips: [
        'Listen to your body and rest when needed',
        'Consistency is more important than intensity',
        'Progress gradually over time'
      ]
    });
  }

  return suggestions.slice(0, 2); // Return max 2 suggestions
}

// ===================================
// Training Knowledge Base Functions
// ===================================

// Parse training knowledge base from converted markdown files
export function parse_training_knowledge(): TrainingPrinciple[] {
  const cpt_dir = path.join(process.cwd(), 'public/databases/NASM_CPT/converted');
  const principles: TrainingPrinciple[] = [];

  // Parse OPT Model (section_07)
  const opt_content = read_section_file(cpt_dir, 'section_07_integrated_training_and_the_opt_model.md');
  if (opt_content) {
    // Extract OPT Model principles: Stabilisation, Strength, Power
    const opt_principles = extract_opt_model_principles(opt_content);
    principles.push(...opt_principles);
  }

  // Parse Assessment protocols (section_06)
  const assessment_content = read_section_file(cpt_dir, 'section_06_assessments.md');
  if (assessment_content) {
    const assessment_principles = extract_assessment_principles(assessment_content);
    principles.push(...assessment_principles);
  }

  // Parse Resistance Training (section_13)
  const resistance_content = read_section_file(cpt_dir, 'section_13_resistance_training.md');
  if (resistance_content) {
    const resistance_principles = extract_resistance_training_principles(resistance_content);
    principles.push(...resistance_principles);
  }

  // Parse Flexibility Training (section_08)
  const flexibility_content = read_section_file(cpt_dir, 'section_08_flexibility_training.md');
  if (flexibility_content) {
    const flexibility_principles = extract_flexibility_principles(flexibility_content);
    principles.push(...flexibility_principles);
  }

  return principles;
}

// Parse nutrition knowledge base from converted markdown files
export function parse_nutrition_knowledge(): NutritionGuidelines {
  const cnc_dir = path.join(process.cwd(), 'public/databases/NASM_CNC/converted');

  return {
    protein: read_section_file(cnc_dir, 'section_02_protein.md') || '',
    carbohydrates: read_section_file(cnc_dir, 'section_03_carbohydrates.md') || '',
    fats: read_section_file(cnc_dir, 'section_04_fats.md') || '',
    food_choices: read_section_file(cnc_dir, 'section_01_food_choices.md') || ''
  };
}

// Helper function to read section files
function read_section_file(directory: string, filename: string): string | null {
  try {
    const file_path = path.join(directory, filename);
    return fs.readFileSync(file_path, 'utf-8');
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

// Extract OPT Model principles from section_07
function extract_opt_model_principles(content: string): TrainingPrinciple[] {
  const principles: TrainingPrinciple[] = [];

  // Parse for Stabilisation, Strength, and Power phases
  const phases = ['Stabilisation', 'Strength', 'Power'];

  phases.forEach(phase => {
    const phase_section = extract_section(content, phase);
    if (phase_section) {
      principles.push({
        name: `OPT Model - ${phase} Phase`,
        description: `${phase} training phase of the OPT Model`,
        application: phase_section.substring(0, 200), // First 200 chars as summary
        category: 'TRAINING',
        source_section: 'section_07'
      });
    }
  });

  return principles;
}

// Extract assessment principles from section_06
function extract_assessment_principles(content: string): TrainingPrinciple[] {
  const principles: TrainingPrinciple[] = [];

  // Look for key assessment types
  const assessments = [
    'Overhead Squat Assessment',
    'Postural Assessment',
    'Movement Assessment',
    'Performance Assessment'
  ];

  assessments.forEach(assessment => {
    const assessment_section = extract_section(content, assessment);
    if (assessment_section) {
      principles.push({
        name: assessment,
        description: `${assessment} protocol`,
        application: assessment_section.substring(0, 200),
        category: 'ASSESSMENT',
        source_section: 'section_06'
      });
    }
  });

  return principles;
}

// Extract resistance training principles from section_13
function extract_resistance_training_principles(content: string): TrainingPrinciple[] {
  const principles: TrainingPrinciple[] = [];

  // Extract key resistance training concepts
  const concepts = [
    'Progressive Overload',
    'Training Variables',
    'Exercise Selection',
    'Movement Patterns'
  ];

  concepts.forEach(concept => {
    const concept_section = extract_section(content, concept);
    if (concept_section) {
      principles.push({
        name: concept,
        description: `Resistance training principle: ${concept}`,
        application: concept_section.substring(0, 200),
        category: 'TRAINING',
        source_section: 'section_13'
      });
    }
  });

  return principles;
}

// Extract flexibility training principles from section_08
function extract_flexibility_principles(content: string): TrainingPrinciple[] {
  const principles: TrainingPrinciple[] = [];

  const flexibility_types = [
    'Static Stretching',
    'Dynamic Stretching',
    'Active Stretching',
    'Myofascial Release'
  ];

  flexibility_types.forEach(type => {
    const type_section = extract_section(content, type);
    if (type_section) {
      principles.push({
        name: type,
        description: `Flexibility modality: ${type}`,
        application: type_section.substring(0, 200),
        category: 'TRAINING',
        source_section: 'section_08'
      });
    }
  });

  return principles;
}

// Get exercise recommendations based on training principles
export function get_exercise_recommendations(
  fitness_level: string,
  _primary_goal: string,
  movement_pattern: string
): ExerciseRecommendation {
  // const training_principles = parse_training_knowledge();

  const progression_map = {
    BEGINNER: 'Stabilisation',
    INTERMEDIATE: 'Strength',
    ADVANCED: 'Power'
  };

  return {
    movement_pattern,
    training_principle: 'PROGRESSIVE_OVERLOAD',
    progression_level: progression_map[fitness_level as keyof typeof progression_map],
    coaching_cues: get_coaching_cues(movement_pattern, fitness_level)
  };
}

// Extract section by heading
function extract_section(content: string, heading: string): string | null {
  const lines = content.split('\n');
  let capturing = false;
  let section_content = '';

  for (const line of lines) {
    // Match heading with various markdown formats (##, ###, etc.)
    if (line.toLowerCase().includes(heading.toLowerCase()) && line.match(/^#{1,6}\s/)) {
      capturing = true;
      continue;
    }
    // Stop at next heading of same or higher level
    if (capturing && line.match(/^#{1,6}\s/)) {
      break;
    }
    if (capturing) {
      section_content += line + '\n';
    }
  }

  return section_content || null;
}

// Coaching cues database (to be enhanced with training knowledge)
function get_coaching_cues(movement_pattern: string, fitness_level: string): string[] {
  const cues_database = {
    SQUAT: {
      BEGINNER: ['Chest up', 'Knees track over toes', 'Weight in heels'],
      INTERMEDIATE: ['Brace core', 'Hip hinge first', 'Drive through heels'],
      ADVANCED: ['Maintain tension', 'Explosive concentric', 'Controlled eccentric']
    },
    HINGE: {
      BEGINNER: ['Neutral spine', 'Slight knee bend', 'Push hips back'],
      INTERMEDIATE: ['Load hamstrings', 'Lat engagement', 'Hip drive'],
      ADVANCED: ['Triple extension', 'Posterior chain activation', 'Power generation']
    },
    PUSH: {
      BEGINNER: ['Shoulders packed', 'Elbows 45 degrees', 'Full range of motion'],
      INTERMEDIATE: ['Scapular retraction', 'Core tight', 'Controlled tempo'],
      ADVANCED: ['Maximum tension', 'Peak contraction', 'Mind-muscle connection']
    },
    PULL: {
      BEGINNER: ['Lead with elbows', 'Shoulders down', 'Squeeze shoulder blades'],
      INTERMEDIATE: ['Full scapular retraction', 'Chest to bar', 'Lat focus'],
      ADVANCED: ['Dead hang start', 'Explosive pull', 'Control eccentric']
    },
    CARRY: {
      BEGINNER: ['Neutral spine', 'Shoulders stable', 'Short distances'],
      INTERMEDIATE: ['Core braced', 'Even weight distribution', 'Controlled breathing'],
      ADVANCED: ['Maximum load', 'Extended duration', 'Anti-rotation focus']
    }
  };

  return cues_database[movement_pattern as keyof typeof cues_database]?.[fitness_level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'] || [];
}
