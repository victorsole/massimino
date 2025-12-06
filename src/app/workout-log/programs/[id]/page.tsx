'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ProgramHero,
  ProgramGoals,
  ProgramSchedule,
  ProgramSidebar,
  ShareBar,
} from '@/components/programs';
import {
  ProgramTemplate,
  ProgramMetadata,
  ProgramGoals as ProgramGoalsType,
  ProgramPrerequisites,
  WorkoutSession,
  AthleteInfo,
  ProgramCategory,
  getProgramCategory,
  ProgramExercise,
} from '@/types/program';

// Type for enriched exercise data from the API
type EnrichedExercise = {
  id: string;
  name: string;
  coverUrl: string | null;
  hasMedia: boolean;
  mediaCount: number;
  hasVideo: boolean;
} | null;

// Extract all unique exercise names from workout sessions
function extractExerciseNames(sessions: WorkoutSession[]): string[] {
  const names = new Set<string>();
  for (const session of sessions) {
    for (const section of session.sections || []) {
      for (const exercise of section.exercises || []) {
        if (exercise.exercise_name) {
          names.add(exercise.exercise_name);
        }
      }
    }
  }
  return Array.from(names);
}

// Enrich workout sessions with exercise media data
function enrichSessionsWithMedia(
  sessions: WorkoutSession[],
  exerciseMediaMap: Record<string, EnrichedExercise>
): WorkoutSession[] {
  return sessions.map(session => ({
    ...session,
    sections: (session.sections || []).map(section => ({
      ...section,
      exercises: (section.exercises || []).map(exercise => {
        const enriched = exerciseMediaMap[exercise.exercise_name];
        if (enriched) {
          return {
            ...exercise,
            massimino_exercise_id: enriched.id,
            hasMedia: enriched.hasMedia,
            mediaCount: enriched.mediaCount,
            media: {
              thumbnail_url: enriched.coverUrl || undefined,
              image_url: enriched.coverUrl || undefined,
              video_url: enriched.hasVideo ? 'has-video' : undefined,
            },
          };
        }
        return exercise;
      }),
    })),
  }));
}

// Transform API response to our types
function transformApiResponse(apiData: any): {
  programId: string;
  metadata: ProgramMetadata;
  goals: ProgramGoalsType;
  prerequisites?: ProgramPrerequisites;
  redFlagsToStop?: string[];
  athleteInfo?: AthleteInfo | null;
  workoutSessions: WorkoutSession[];
  category: ProgramCategory;
  templateData?: any;
} {
  const templateData = apiData.templateData || {};

  // Build metadata from API + template data
  const metadata: ProgramMetadata = {
    program_name: apiData.name || templateData.metadata?.program_name || 'Unknown Program',
    program_id: apiData.id,
    author: apiData.users?.name || templateData.metadata?.author || 'Massimino',
    version: templateData.metadata?.version || '1.0',
    creation_date: templateData.metadata?.creation_date || '',
    last_updated: templateData.metadata?.last_updated || '',
    description: apiData.description || templateData.metadata?.description || '',
    goal: apiData.category || templateData.metadata?.goal || 'General Fitness',
    methodology: templateData.metadata?.methodology || apiData.programType || '',
    target_audience: templateData.metadata?.target_audience || '',
    level: apiData.difficulty || templateData.metadata?.level || 'Intermediate',
    settings: templateData.metadata?.settings || ['Gym'],
    duration_weeks: parseInt(apiData.duration) || templateData.metadata?.duration_weeks || 8,
    total_workouts: templateData.metadata?.total_workouts || apiData.program_phases?.length * 4 || 24,
    frequency_per_week: templateData.metadata?.frequency_per_week || 4,
    session_duration_minutes: templateData.metadata?.session_duration_minutes || {
      min: 45,
      max: 60,
    },
    equipment: templateData.metadata?.equipment || {
      required: apiData.tags?.filter((t: string) => ['dumbbell', 'barbell', 'machine', 'cable'].includes(t.toLowerCase())) || ['Gym Equipment'],
      recommended: [],
      optional: [],
    },
    tags: apiData.tags || [],
  };

  // Build goals
  const goals: ProgramGoalsType = templateData.goals || {
    primary_goal: apiData.category || 'Improve fitness',
    outcome_goals: [
      `Complete ${metadata.duration_weeks}-week ${metadata.goal} program`,
      'Build strength and conditioning',
      'Improve overall fitness',
    ],
    what_program_can_do: [],
    what_program_cannot_do: [],
  };

  // Get prerequisites
  const prerequisites: ProgramPrerequisites | undefined = templateData.prerequisites;
  const redFlagsToStop: string[] | undefined = templateData.red_flags_to_stop;

  // Get athlete info
  const athleteInfo: AthleteInfo | null = apiData.legendary_athlete
    ? {
        name: apiData.legendary_athlete.name,
        achievements: apiData.legendary_athlete.eraLabel || '',
        training_philosophy: templateData.program_philosophy?.athlete_info?.training_philosophy || '',
        image_url: apiData.legendary_athlete.imageUrl,
      }
    : templateData.program_philosophy?.athlete_info || null;

  // Build workout sessions from template or phases
  let workoutSessions: WorkoutSession[] = [];

  if (templateData.workout_sessions) {
    workoutSessions = templateData.workout_sessions;
  } else if (Array.isArray(templateData.training_days)) {
    // Handle standardized training_days format (i_dont_have_much_time, flexibility, balance, plyometric, cardio workouts)
    workoutSessions = templateData.training_days.map((day: any, index: number) => {
      // Build a single section from the exercises array
      const sections: any[] = [];

      if (day.exercises && day.exercises.length > 0) {
        sections.push({
          section_name: day.focus || day.day_name || 'Workout',
          description: day.format || '',
          exercises: day.exercises.map((ex: any) => ({
            exercise_name: ex.exercise_name,
            exercise_id: ex.exercise_id,
            sets: ex.sets || 3,
            reps: ex.reps,
            tempo: ex.tempo,
            rest_seconds: ex.rest_seconds || 60,
            work_seconds: ex.work_seconds,
            notes: ex.notes || '',
            primary_muscle_groups: ex.primary_muscle_groups,
            equipment: ex.equipment,
          })),
        });
      }

      return {
        workout_id: `day-${day.day || index + 1}`,
        name: day.day_name || `Day ${day.day || index + 1}`,
        day: day.day || index + 1,
        focus: day.focus || '',
        duration_minutes: typeof day.duration_minutes === 'string'
          ? parseInt(day.duration_minutes.split('-')[1] || day.duration_minutes)
          : day.duration_minutes || metadata.session_duration_minutes?.max || 30,
        sections,
      };
    });
  } else if (Array.isArray(templateData.workout_programs)) {
    // Handle Castellers-style format with workout_programs array
    workoutSessions = templateData.workout_programs.map((workout: any, index: number) => {
      const sections: any[] = [];

      // Add warm-up section if exists
      if (workout.warm_up?.exercises) {
        sections.push({
          section_name: 'Warm Up',
          description: `${workout.warm_up.duration_minutes || 10} minutes`,
          exercises: workout.warm_up.exercises.map((ex: any) => ({
            exercise_name: ex.name,
            sets: ex.sets || 1,
            reps: ex.reps || ex.duration_seconds ? `${ex.duration_seconds}s` : undefined,
            notes: ex.notes || (ex.per_side ? 'Per side' : undefined),
          })),
        });
      }

      // Add main workout section
      if (workout.main_workout?.exercises) {
        sections.push({
          section_name: 'Main Workout',
          description: '',
          exercises: workout.main_workout.exercises.map((ex: any) => ({
            exercise_name: ex.name,
            sets: ex.sets || 3,
            reps: ex.reps || (ex.duration_seconds ? `${ex.duration_seconds}s` : undefined),
            tempo: ex.tempo,
            rest_seconds: ex.rest_seconds || 90,
            notes: ex.notes,
          })),
        });
      }

      // Add cool-down section if exists
      if (workout.cool_down?.exercises) {
        sections.push({
          section_name: 'Cool Down',
          description: `${workout.cool_down.duration_minutes || 10} minutes`,
          exercises: workout.cool_down.exercises.map((ex: any) => ({
            exercise_name: ex.name,
            sets: ex.sets || 1,
            reps: ex.duration_seconds ? `${ex.duration_seconds}s` : undefined,
            notes: ex.per_side ? 'Per side' : undefined,
          })),
        });
      }

      return {
        workout_id: workout.id || `workout-${index + 1}`,
        name: workout.name,
        day: index + 1,
        focus: workout.position || workout.description || '',
        duration_minutes: workout.duration_minutes || 60,
        sections,
      };
    });
  } else if (Array.isArray(templateData.weekly_schedule)) {
    // Handle JSON templates with day_X_xxx format
    // First, find all day_X_ keys in the template data
    const dayKeyMap: Record<number, string> = {};
    for (const key of Object.keys(templateData)) {
      const match = key.match(/^day_(\d+)_/);
      if (match) {
        dayKeyMap[parseInt(match[1])] = key;
      }
    }

    workoutSessions = templateData.weekly_schedule.map((dayInfo: any, index: number) => {
      // Use the pre-built day key map to find the matching key
      const dayNumber = dayInfo.day;
      const dayKey = dayKeyMap[dayNumber];
      const dayData = dayKey ? templateData[dayKey] : templateData[`day_${dayNumber}`];

      // Build sections from the day data if it exists
      let sections: any[] = [];
      if (dayData?.sections) {
        sections = dayData.sections.map((section: any) => ({
          section_name: section.section || section.section_name || 'Workout',
          description: section.description || '',
          exercises: (section.exercises || []).map((ex: any) => ({
            exercise_name: ex.exercise || ex.exercise_name,
            sets: typeof ex.sets === 'string' ? parseInt(ex.sets.split('-')[0]) : ex.sets || 3,
            reps: ex.reps,
            tempo: ex.tempo,
            rest_seconds: parseInt(String(ex.rest || '90').replace(/[^\d]/g, '')) || 90,
            notes: ex.notes,
          })),
        }));
      }

      return {
        workout_id: `day-${dayInfo.day}`,
        name: dayInfo.focus,
        day: dayInfo.day,
        focus: dayInfo.focus,
        duration_minutes: metadata.session_duration_minutes.max,
        sections,
      };
    });
  } else if (typeof templateData.weekly_schedule === 'object' && templateData.weekly_schedule !== null) {
    // Object format weekly_schedule
    const days = Object.entries(templateData.weekly_schedule);
    workoutSessions = days.map(([day, focus], index) => ({
      workout_id: `day-${index + 1}`,
      name: `Day ${index + 1}: ${focus}`,
      day: index + 1,
      focus: focus as string,
      duration_minutes: metadata.session_duration_minutes.max,
      sections: [],
    }));
  } else if (Array.isArray(templateData.variations)) {
    // Handle Arnold Volume format - variations with workouts containing muscle groups
    const firstVariation = templateData.variations[0];
    if (firstVariation?.workouts) {
      workoutSessions = firstVariation.workouts.map((workout: any, index: number) => {
        const sections: any[] = [];

        // Each muscle_group becomes a section
        if (workout.muscle_groups) {
          for (const group of workout.muscle_groups) {
            if (group.exercises && group.exercises.length > 0) {
              sections.push({
                section_name: group.muscle_group,
                description: '',
                exercises: group.exercises.map((ex: any) => ({
                  exercise_name: ex.exercise_name,
                  sets: typeof ex.sets === 'string' ? parseInt(ex.sets.split('-')[0]) : ex.sets || 3,
                  reps: ex.reps,
                  rest_seconds: 90,
                  notes: ex.notes || '',
                })),
              });
            }
          }
        }

        return {
          workout_id: `workout-${index + 1}`,
          name: workout.workout_name || `Day ${workout.days?.[0] || index + 1}`,
          day: workout.days?.[0] || index + 1,
          focus: workout.workout_name || '',
          duration_minutes: parseInt(templateData.program?.time_per_workout) || 60,
          sections,
        };
      });
    }
  } else if (Array.isArray(templateData.the_six_exercises)) {
    // Handle Arnold Golden Six format - same exercises repeated each workout
    const exercises = templateData.the_six_exercises.map((ex: any) => ({
      exercise_name: ex.exercise_name,
      sets: ex.sets || 3,
      reps: ex.reps,
      tempo: ex.tempo,
      rest_seconds: ex.rest_seconds || 90,
      notes: ex.form_cues?.join('. ') || ex.progression_notes || '',
    }));

    // Create 3 sessions per week based on training_schedule
    const schedule = templateData.training_schedule;
    const workoutDays = schedule
      ? Object.entries(schedule)
          .filter(([_, value]) => typeof value === 'string' && (value as string).includes('Golden Six'))
          .map(([day]) => day)
      : ['Monday', 'Wednesday', 'Friday'];

    workoutSessions = workoutDays.map((day, index) => ({
      workout_id: `golden-six-${index + 1}`,
      name: `Full Body - Golden Six`,
      day: index + 1,
      focus: `${day} - Full Body Training`,
      duration_minutes: metadata.session_duration_minutes?.max || 60,
      sections: [{
        section_name: 'The Golden Six',
        description: 'Arnold\'s foundational full-body workout',
        exercises,
      }],
    }));
  } else if (Array.isArray(templateData.workout_phases)) {
    // Handle Colorado Experiment format - phases with workouts
    workoutSessions = templateData.workout_phases.map((phase: any, index: number) => {
      const sections: any[] = [];

      if (phase.workout?.exercises) {
        sections.push({
          section_name: phase.phase_name || `Phase ${phase.phase_number}`,
          description: phase.description || '',
          exercises: phase.workout.exercises.map((ex: any) => ({
            exercise_name: ex.exercise_name,
            sets: ex.sets || 1,
            reps: ex.reps,
            tempo: ex.tempo,
            rest_seconds: ex.rest_seconds || 45,
            notes: ex.instructions || ex.failure_protocol || '',
          })),
        });
      }

      return {
        workout_id: `phase-${phase.phase_number || index + 1}`,
        name: phase.workout?.workout_name || phase.phase_name || `Phase ${phase.phase_number}`,
        day: index + 1,
        focus: phase.description || phase.focus || '',
        duration_minutes: parseInt(templateData.schedule?.workout_duration_minutes) || 45,
        sections,
      };
    });
  } else if (Array.isArray(templateData.workouts)) {
    // Handle NASM format - workouts array with workout_structure
    workoutSessions = templateData.workouts.map((workout: any, index: number) => {
      const sections: any[] = [];
      const structure = workout.workout_structure || workout;

      // Add warm-up section
      if (structure.warm_up?.exercises) {
        sections.push({
          section_name: 'Warm Up',
          description: '',
          exercises: structure.warm_up.exercises.map((ex: any) => ({
            exercise_name: ex.exercise_name,
            sets: ex.sets || 1,
            reps: ex.reps || ex.tempo,
            rest_seconds: ex.rest_seconds || 0,
            notes: ex.notes || '',
          })),
        });
      }

      // Add activation section
      if (structure.activation?.exercises) {
        sections.push({
          section_name: 'Activation',
          description: structure.activation.category || '',
          exercises: structure.activation.exercises.map((ex: any) => ({
            exercise_name: ex.exercise_name,
            sets: ex.sets || 1,
            reps: ex.reps,
            tempo: ex.tempo,
            rest_seconds: ex.rest_seconds || 60,
            notes: ex.notes || '',
          })),
        });
      }

      // Add skill development section
      if (structure.skill_development?.exercises) {
        sections.push({
          section_name: 'Skill Development',
          description: structure.skill_development.category || '',
          exercises: structure.skill_development.exercises.map((ex: any) => ({
            exercise_name: ex.exercise_name,
            sets: ex.sets || 1,
            reps: ex.reps,
            tempo: ex.tempo,
            rest_seconds: ex.rest_seconds || 60,
            notes: ex.notes || '',
          })),
        });
      }

      // Add resistance training section
      if (structure.resistance?.exercises) {
        sections.push({
          section_name: 'Resistance Training',
          description: structure.resistance.category || '',
          exercises: structure.resistance.exercises.map((ex: any) => ({
            exercise_name: ex.exercise_name,
            sets: ex.sets || 3,
            reps: ex.reps,
            tempo: ex.tempo,
            rest_seconds: ex.rest_seconds || 90,
            notes: ex.notes || '',
          })),
        });
      }

      // Add cool-down section
      if (structure.cool_down?.exercises) {
        sections.push({
          section_name: 'Cool Down',
          description: '',
          exercises: structure.cool_down.exercises.map((ex: any) => ({
            exercise_name: ex.exercise_name,
            sets: ex.sets || 1,
            reps: ex.reps || ex.tempo,
            rest_seconds: ex.rest_seconds || 0,
            notes: ex.notes || '',
          })),
        });
      }

      return {
        workout_id: workout.workout_id || `workout-${workout.workout_number || index + 1}`,
        name: `Workout ${workout.workout_number || index + 1}`,
        day: workout.workout_number || index + 1,
        focus: `${workout.phase_name || ''} - ${workout.coaching_tips || ''}`.trim(),
        duration_minutes: metadata.session_duration_minutes?.max || 60,
        sections,
      };
    });
  } else if (Array.isArray(templateData.medical_condition_workouts)) {
    // Handle medical conditions format - each condition has workouts with exercises
    // Find the first condition that has workouts
    const condition = templateData.medical_condition_workouts[0];
    if (condition?.workouts) {
      workoutSessions = condition.workouts.map((workout: any, index: number) => {
        const sections: any[] = [];

        if (workout.exercises && workout.exercises.length > 0) {
          sections.push({
            section_name: workout.focus || workout.day || 'Workout',
            description: '',
            exercises: workout.exercises.map((ex: any) => ({
              exercise_name: ex.exercise_name,
              exercise_id: ex.exercise_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              sets: ex.sets || 3,
              reps: ex.reps,
              tempo: ex.tempo,
              rest_seconds: ex.rest_seconds || 60,
              notes: ex.notes || '',
            })),
          });
        }

        return {
          workout_id: `day-${index + 1}`,
          name: workout.day || `Day ${index + 1}`,
          day: index + 1,
          focus: workout.focus || '',
          duration_minutes: parseInt(condition.session_duration?.replace(/[^\d]/g, '')) || 45,
          sections,
        };
      });
    }
  } else if (templateData.warm_up?.exercises || templateData.main_workout?.exercises || templateData.cool_down?.exercises) {
    // Handle flat structure with warm_up, main_workout, cool_down directly on templateData
    // This is used by database programs created from castellers template
    const sections: any[] = [];

    // Add warm-up section if exists
    if (templateData.warm_up?.exercises) {
      sections.push({
        section_name: 'Warm Up',
        description: `${templateData.warm_up.duration_minutes || 10} minutes`,
        exercises: templateData.warm_up.exercises.map((ex: any) => ({
          exercise_name: ex.name || ex.exercise_name,
          exercise_id: ex.exercise_id || ex.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          sets: ex.sets || 1,
          reps: ex.reps || (ex.duration_seconds ? `${ex.duration_seconds}s` : undefined),
          notes: ex.notes || (ex.per_side ? 'Per side' : undefined),
        })),
      });
    }

    // Add main workout section
    if (templateData.main_workout?.exercises) {
      sections.push({
        section_name: 'Main Workout',
        description: '',
        exercises: templateData.main_workout.exercises.map((ex: any) => ({
          exercise_name: ex.name || ex.exercise_name,
          exercise_id: ex.exercise_id || ex.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          sets: ex.sets || 3,
          reps: ex.reps || (ex.duration_seconds ? `${ex.duration_seconds}s` : (ex.distance_meters ? `${ex.distance_meters}m` : undefined)),
          tempo: ex.tempo,
          rest_seconds: ex.rest_seconds || 90,
          notes: ex.notes || (ex.per_side ? 'Per side' : undefined),
        })),
      });
    }

    // Add cool-down section if exists
    if (templateData.cool_down?.exercises) {
      sections.push({
        section_name: 'Cool Down',
        description: `${templateData.cool_down.duration_minutes || 10} minutes`,
        exercises: templateData.cool_down.exercises.map((ex: any) => ({
          exercise_name: ex.name || ex.exercise_name,
          exercise_id: ex.exercise_id || ex.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          sets: ex.sets || 1,
          reps: ex.duration_seconds ? `${ex.duration_seconds}s` : undefined,
          notes: ex.per_side ? 'Per side' : undefined,
        })),
      });
    }

    // Create a single workout session with all sections
    workoutSessions = [{
      workout_id: apiData.id || 'workout-1',
      name: templateData.name || apiData.name || 'Workout',
      day: 1,
      focus: templateData.position || templateData.difficulty || '',
      duration_minutes: metadata.session_duration_minutes?.max || 60,
      sections,
    }];
  } else if (apiData.program_phases?.length > 0) {
    // Create basic sessions from phases
    workoutSessions = apiData.program_phases.map((phase: any, index: number) => ({
      workout_id: phase.id,
      name: phase.phaseName,
      week: phase.startWeek,
      day: index + 1,
      focus: phase.description || phase.phaseType,
      duration_minutes: metadata.session_duration_minutes.max,
      sections: [],
    }));
  }

  // Determine category
  let category: ProgramCategory = 'goal';
  if (athleteInfo) {
    category = 'celebrity';
  } else if (templateData.sport_demands) {
    category = 'sport';
  } else if (
    metadata.target_audience?.toLowerCase().includes('postpartum') ||
    metadata.target_audience?.toLowerCase().includes('stress') ||
    metadata.target_audience?.toLowerCase().includes('medical')
  ) {
    category = 'lifestyle';
  }

  return {
    programId: apiData.id,
    metadata,
    goals,
    prerequisites,
    redFlagsToStop,
    athleteInfo,
    workoutSessions,
    category,
    templateData,
  };
}

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programData, setProgramData] = useState<ReturnType<typeof transformApiResponse> | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [enrichedSessions, setEnrichedSessions] = useState<WorkoutSession[] | null>(null);

  // Fetch exercise media for all exercises in the program
  const fetchExerciseMedia = useCallback(async (sessions: WorkoutSession[]) => {
    try {
      const exerciseNames = extractExerciseNames(sessions);
      if (exerciseNames.length === 0) return sessions;

      const res = await fetch('/api/workout/exercises/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseNames }),
      });

      if (res.ok) {
        const data = await res.json();
        return enrichSessionsWithMedia(sessions, data.exercises || {});
      }
    } catch (err) {
      console.error('Failed to fetch exercise media:', err);
    }
    return sessions;
  }, []);

  useEffect(() => {
    if (programId) {
      fetchProgram();
      checkFollowingStatus();
    }
  }, [programId]);

  // Enrich sessions with media when program data is loaded
  useEffect(() => {
    if (programData?.workoutSessions && programData.workoutSessions.length > 0) {
      fetchExerciseMedia(programData.workoutSessions).then(setEnrichedSessions);
    }
  }, [programData, fetchExerciseMedia]);

  const fetchProgram = async () => {
    try {
      const res = await fetch(`/api/workout/programs/templates`);
      if (res.ok) {
        const data = await res.json();
        const found = data.templates?.find((p: any) => p.id === programId);
        if (found) {
          setProgramData(transformApiResponse(found));
        } else {
          setError('Program not found');
        }
      } else {
        setError('Failed to fetch program');
      }
    } catch (err) {
      console.error('Failed to fetch program:', err);
      setError('Failed to load program');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowingStatus = async () => {
    try {
      const res = await fetch(`/api/workout/programs/join?programId=${programId}`);
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isJoined || false);
      }
    } catch (err) {
      console.error('Failed to check following status:', err);
    }
  };

  const handleFollow = () => {
    router.push(`/workout-log/programs/${programId}/join`);
  };

  const handleSaveForLater = () => {
    // TODO: Implement save for later functionality
    alert('Save for later coming soon!');
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !programData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="mdi mdi-alert-circle text-5xl text-gray-400 mb-4 block" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error || 'Program not found'}
          </h2>
          <Link
            href="/workout-log?tab=programs"
            className="text-[#254967] hover:underline"
          >
            Browse all programs
          </Link>
        </div>
      </div>
    );
  }

  const {
    metadata,
    goals,
    prerequisites,
    redFlagsToStop,
    athleteInfo,
    workoutSessions: rawWorkoutSessions,
    category,
  } = programData;

  // Use enriched sessions if available, otherwise fall back to raw sessions
  const workoutSessions = enrichedSessions || rawWorkoutSessions;

  const programUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://massimino.fitness/workout-log/programs/${programId}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-[1200px] mx-auto">
          <Link
            href="/workout-log?tab=programs"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#254967]"
          >
            <span className="mdi mdi-arrow-left" />
            Back to Programs
          </Link>
        </div>
      </div>

      {/* Hero */}
      <ProgramHero
        programId={metadata.program_id}
        metadata={metadata}
        category={category}
        athleteInfo={athleteInfo}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onSaveForLater={handleSaveForLater}
      />

      {/* Share Bar */}
      <ShareBar
        programName={metadata.program_name}
        programUrl={programUrl}
      />

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          {/* Left Column */}
          <div>
            {/* Goals */}
            <ProgramGoals goals={goals} />

            {/* Schedule */}
            {workoutSessions.length > 0 && (
              <ProgramSchedule
                workoutSessions={workoutSessions}
                cycleDays={workoutSessions.length}
              />
            )}
          </div>

          {/* Right Column - Sidebar */}
          <ProgramSidebar
            metadata={metadata}
            prerequisites={prerequisites}
            redFlagsToStop={redFlagsToStop}
            athleteInfo={athleteInfo}
            category={category}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero skeleton */}
      <div className="bg-[#254967] h-64 animate-pulse" />

      {/* Share bar skeleton */}
      <div className="bg-white border-b border-gray-200 h-14" />

      {/* Content skeleton */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl h-64 animate-pulse" />
            <div className="bg-white rounded-xl h-96 animate-pulse" />
          </div>
          <div className="space-y-5">
            <div className="bg-white rounded-xl h-40 animate-pulse" />
            <div className="bg-white rounded-xl h-48 animate-pulse" />
            <div className="bg-white rounded-xl h-32 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
