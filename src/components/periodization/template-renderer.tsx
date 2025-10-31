'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type TemplateData = any; // Full template JSON structure

type Props = {
  templateData: TemplateData;
};

export function TemplateRenderer({ templateData }: Props) {
  if (!templateData) {
    return null;
  }

  // Detect template type
  const hasPhaseStructure = templateData.phase_structure && Array.isArray(templateData.phase_structure);
  const hasExercises = templateData.exercises && Array.isArray(templateData.exercises);
  const hasWeeklySchedule = templateData.weekly_schedule && Array.isArray(templateData.weekly_schedule);
  const hasTrainingSplit = templateData.training_split;

  // Type B: Simple repeated workout (Arnold Golden Six style)
  if (hasExercises && !hasPhaseStructure && !hasWeeklySchedule) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Workout Routine</h2>
        <Card>
          <CardHeader>
            <CardTitle>Exercises</CardTitle>
            <CardDescription>
              Perform this workout {templateData.frequency || '3x per week'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {templateData.exercises.map((exercise: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-lg">
                      {exercise.order}. {exercise.exercise_name}
                    </h4>
                    <Badge variant="outline">{exercise.primary_muscle_groups?.join(', ')}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Sets:</span> {exercise.sets}
                    </div>
                    <div>
                      <span className="font-medium">Reps:</span> {exercise.reps}
                    </div>
                    <div>
                      <span className="font-medium">Rest:</span> {exercise.rest_seconds}s
                    </div>
                    <div>
                      <span className="font-medium">Tempo:</span> {exercise.tempo || 'N/A'}
                    </div>
                  </div>
                  {exercise.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">{exercise.notes}</p>
                  )}
                  {exercise.load_guidance && (
                    <p className="text-sm text-blue-600 mt-1">💡 {exercise.load_guidance}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {templateData.progression_strategy && (
          <Card>
            <CardHeader>
              <CardTitle>Progression Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{templateData.progression_strategy.method}</p>
              <p className="text-gray-700 mt-2">{templateData.progression_strategy.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Type C: Day-by-day split (CBum style)
  if (hasWeeklySchedule) {
    const dayKeys = Object.keys(templateData).filter(key => key.startsWith('day_'));

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Training Schedule</h2>

        {/* Weekly Overview */}
        <Card>
          <CardHeader>
            <CardTitle>{templateData.program_structure?.split_type || 'Training Split'}</CardTitle>
            <CardDescription>
              {templateData.program_structure?.training_days} training days, {templateData.program_structure?.rest_days} rest days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {templateData.weekly_schedule.map((day: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="font-bold text-sm">Day {day.day}</div>
                  <div className="text-sm text-gray-700">{day.focus}</div>
                  {day.muscle_groups && day.muscle_groups.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {day.muscle_groups.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day-by-Day Workouts */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Daily Workouts</h3>
          {dayKeys.map((dayKey: string) => {
            const dayData = templateData[dayKey];
            return (
              <Card key={dayKey}>
                <CardHeader>
                  <CardTitle>{dayData.goal}</CardTitle>
                  <CardDescription>{dayData.client_name} - {dayData.phase}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dayData.sections?.map((section: any, sIndex: number) => (
                    <div key={sIndex}>
                      <h4 className="font-semibold text-lg mb-3 capitalize">
                        {section.section.replace('_', ' ')}
                      </h4>
                      {section.description && (
                        <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                      )}
                      <div className="space-y-3">
                        {section.exercises?.map((exercise: any, eIndex: number) => (
                          <div key={eIndex} className="border-l-4 border-green-500 pl-4 py-2">
                            <h5 className="font-medium">{exercise.exercise}</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-1">
                              <div><span className="font-medium">Sets:</span> {exercise.sets}</div>
                              <div><span className="font-medium">Reps:</span> {exercise.reps}</div>
                              <div><span className="font-medium">Rest:</span> {exercise.rest}</div>
                              <div><span className="font-medium">Tempo:</span> {exercise.tempo}</div>
                            </div>
                            {exercise.notes && (
                              <p className="text-sm text-gray-600 mt-1 italic">{exercise.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Type A: Educational/Conceptual (Aesthetics Hunter style)
  if (hasPhaseStructure) {
    return (
      <div className="space-y-6">
        {/* Training Phases */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Training Phases</h2>
          {templateData.phase_structure.map((phase: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Phase {index + 1}: {phase.phase}
                    </CardTitle>
                    <CardDescription>
                      Weeks {phase.weeks[0]}-{phase.weeks[phase.weeks.length - 1]} • {phase.focus}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Rep Range</div>
                    <div className="text-gray-600">{phase.rep_range}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Sets</div>
                    <div className="text-gray-600">{phase.sets}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Rest</div>
                    <div className="text-gray-600">{phase.rest_seconds}s</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Focus</div>
                    <div className="text-gray-600">{phase.weight_approach || phase.key_principle}</div>
                  </div>
                </div>
                {phase.key_changes && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Key Changes:</p>
                    <p className="text-sm text-blue-700">{phase.key_changes}</p>
                  </div>
                )}
                {phase.techniques && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">Techniques:</p>
                    <p className="text-sm text-purple-700">{phase.techniques}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Training Split */}
        {hasTrainingSplit && (
          <Card>
            <CardHeader>
              <CardTitle>Weekly Training Split</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(templateData.training_split).map(([day, workout]: [string, any]) => (
                  <div key={day} className="flex items-center p-3 border rounded-lg">
                    <div className="font-bold capitalize text-sm w-24">{day}:</div>
                    <div className="text-sm text-gray-700">{workout}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise Focus by Body Part */}
        {templateData.exercise_focus_by_bodypart && (
          <Card>
            <CardHeader>
              <CardTitle>Exercise Focus by Body Part</CardTitle>
              <CardDescription>Recommended exercises for each muscle group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(templateData.exercise_focus_by_bodypart).map(([bodypart, exercises]: [string, any]) => (
                  <div key={bodypart} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold capitalize mb-2">
                      {bodypart.replace('_', ' ')}
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {exercises.map((exercise: string, idx: number) => (
                        <li key={idx}>• {exercise}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Fallback: No specific structure detected
  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Details</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          This program contains detailed guidance. Please join the program to access the full training plan.
        </p>
      </CardContent>
    </Card>
  );
}
