/**
 * AI-powered exercise form analysis using OpenAI Vision API
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FormAnalysisRequest {
  exerciseId: string;
  exerciseName: string;
  exerciseInstructions?: string;
  formCues: string[];
  commonMistakes: string[];
  safetyNotes?: string;
  imageUrl?: string;
  videoUrl?: string;
  userNotes?: string;
}

export interface FormAnalysisResult {
  overallScore: number; // 1-10 scale
  feedback: {
    positive: string[];
    improvements: string[];
    safety: string[];
  };
  detailedAnalysis: {
    posture: {
      score: number;
      notes: string;
    };
    alignment: {
      score: number;
      notes: string;
    };
    rangeOfMotion: {
      score: number;
      notes: string;
    };
    technique: {
      score: number;
      notes: string;
    };
  };
  recommendations: string[];
  nextSteps: string[];
}

/**
 * Analyze exercise form using OpenAI Vision API
 */
export async function analyzeExerciseForm(request: FormAnalysisRequest): Promise<FormAnalysisResult> {
  try {
    // Build the system prompt with exercise-specific information
    const systemPrompt = `You are an expert fitness trainer and exercise physiologist. Analyze the user's exercise form for the "${request.exerciseName}" exercise.

Exercise Information:
- Name: ${request.exerciseName}
- Instructions: ${request.exerciseInstructions || 'Not provided'}
- Key Form Cues: ${request.formCues.join(', ') || 'None provided'}
- Common Mistakes: ${request.commonMistakes.join(', ') || 'None provided'}
- Safety Notes: ${request.safetyNotes || 'None provided'}

Please provide a comprehensive form analysis with:
1. Overall score (1-10)
2. Specific feedback on what's done well and what needs improvement
3. Safety considerations
4. Detailed analysis of posture, alignment, range of motion, and technique
5. Actionable recommendations
6. Next steps for improvement

Be encouraging but honest about areas for improvement. Focus on safety first, then technique optimization.`;

    const userPrompt = `Please analyze my form for the ${request.exerciseName} exercise. ${request.userNotes ? `Additional context: ${request.userNotes}` : ''}

Provide your analysis in the following JSON format:
{
  "overallScore": number,
  "feedback": {
    "positive": ["string"],
    "improvements": ["string"],
    "safety": ["string"]
  },
  "detailedAnalysis": {
    "posture": {"score": number, "notes": "string"},
    "alignment": {"score": number, "notes": "string"},
    "rangeOfMotion": {"score": number, "notes": "string"},
    "technique": {"score": number, "notes": "string"}
  },
  "recommendations": ["string"],
  "nextSteps": ["string"]
}`;

    // Prepare the messages array
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add user message with image or video
    const userMessage: any = {
      role: 'user',
      content: []
    };

    // Add text content
    userMessage.content.push({
      type: 'text',
      text: userPrompt
    });

    // Add image if provided
    if (request.imageUrl) {
      userMessage.content.push({
        type: 'image_url',
        image_url: {
          url: request.imageUrl,
          detail: 'high'
        }
      });
    }

    // Note: OpenAI Vision API doesn't support video directly yet
    // If video is provided, we could extract frames or use a different approach
    if (request.videoUrl && !request.imageUrl) {
      userMessage.content.push({
        type: 'text',
        text: 'Note: Video analysis is not yet supported. Please provide a still image from the video for analysis.'
      });
    }

    messages.push(userMessage);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages,
      max_tokens: 1500,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI API');
    }

    // Parse the JSON response
    try {
      const analysis = JSON.parse(content) as FormAnalysisResult;

      // Validate the response structure
      if (!analysis.overallScore || !analysis.feedback || !analysis.detailedAnalysis) {
        throw new Error('Invalid response structure from AI analysis');
      }

      // Ensure scores are within valid range
      analysis.overallScore = Math.max(1, Math.min(10, analysis.overallScore));

      Object.keys(analysis.detailedAnalysis).forEach(key => {
        const section = analysis.detailedAnalysis[key as keyof typeof analysis.detailedAnalysis];
        if (section && typeof section.score === 'number') {
          section.score = Math.max(1, Math.min(10, section.score));
        }
      });

      return analysis;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response:', content);

      // Return a fallback analysis if parsing fails
      return {
        overallScore: 5,
        feedback: {
          positive: ['Form analysis completed'],
          improvements: ['Unable to provide detailed analysis. Please try again with a clearer image.'],
          safety: ['Always prioritize proper form over weight or speed']
        },
        detailedAnalysis: {
          posture: { score: 5, notes: 'Analysis unavailable' },
          alignment: { score: 5, notes: 'Analysis unavailable' },
          rangeOfMotion: { score: 5, notes: 'Analysis unavailable' },
          technique: { score: 5, notes: 'Analysis unavailable' }
        },
        recommendations: ['Try again with a clearer image', 'Consider working with a qualified trainer'],
        nextSteps: ['Review exercise instructions', 'Practice with lighter weight']
      };
    }

  } catch (error) {
    console.error('Error in form analysis:', error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate_limit_exceeded')) {
        throw new Error('rate limit');
      }
      if (error.message.includes('insufficient_quota')) {
        throw new Error('OpenAI quota exceeded');
      }
    }

    throw new Error('Failed to analyze exercise form');
  }
}

/**
 * Get exercise-specific form tips
 */
export function getFormTips(exerciseName: string): string[] {
  const commonTips: Record<string, string[]> = {
    'squat': [
      'Keep your knees in line with your toes',
      'Maintain a neutral spine throughout the movement',
      'Go down until your thighs are parallel to the floor',
      'Drive through your heels to stand up'
    ],
    'deadlift': [
      'Keep the bar close to your body throughout the lift',
      'Maintain a neutral spine and engaged core',
      'Drive through your heels and hips',
      'Keep your shoulders back and chest up'
    ],
    'bench press': [
      'Retract your shoulder blades and keep them tight',
      'Maintain a slight arch in your lower back',
      'Control the descent and pause briefly at the bottom',
      'Drive through your feet while pressing up'
    ],
    'overhead press': [
      'Keep your core tight and glutes engaged',
      'Press the bar in a straight line over your head',
      'Keep your forearms vertical throughout the movement',
      'Finish with the bar over your shoulders and ears'
    ]
  };

  const exerciseKey = exerciseName.toLowerCase();

  // Find matching exercise or return general tips
  for (const [key, tips] of Object.entries(commonTips)) {
    if (exerciseKey.includes(key)) {
      return tips;
    }
  }

  return [
    'Focus on proper form over heavy weight',
    'Control the movement in both directions',
    'Breathe properly throughout the exercise',
    'Maintain good posture and alignment'
  ];
}