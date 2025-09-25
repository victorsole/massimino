import OpenAI from 'openai';
import { prisma } from '@/core/database';

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

export async function generateWorkoutSuggestions(
  request: WorkoutSuggestionRequest
): Promise<WorkoutSuggestion[]> {
  try {
    // Get user's recent workout history for context
    const recentWorkouts = await prisma.workoutLogEntry.findMany({
      where: { userId: request.userId },
      include: { exercise: true },
      orderBy: { date: 'desc' },
      take: 10
    });

    // Get available exercises from database
    const availableExercises = await prisma.exercise.findMany({
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
  const recentExerciseNames = recentWorkouts.map(w => w.exercise.name).slice(0, 5);

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
