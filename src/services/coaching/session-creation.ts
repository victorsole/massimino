import { prisma } from '@/core/database';
import { nanoid } from 'nanoid';

export interface ExerciseData {
  exerciseId: string;
  sets: number;
  reps?: string;
  repsMin?: number;
  repsMax?: number;
  weight?: number;
  notes?: string;
  order: number;
}

export interface WorkoutSessionData {
  programId?: string;
  customExercises?: ExerciseData[];
  scheduledDate?: Date;
  notes?: string;
  title?: string;
  description?: string;
}

/**
 * Create a workout session for an athlete
 */
export async function createSessionForAthlete(
  trainerId: string,
  athleteId: string,
  workoutData: WorkoutSessionData
): Promise<any> {
  // Verify trainer-client relationship
  const trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: trainerId },
  });

  if (!trainerProfile) {
    throw new Error('Trainer profile not found');
  }

  const relationship = await prisma.trainer_clients.findFirst({
    where: {
      trainerId: trainerProfile.id,
      clientId: athleteId,
    },
  });

  if (!relationship) {
    throw new Error('Not authorized to create sessions for this athlete');
  }

  // If using a program as blueprint
  if (workoutData.programId) {
    return await createSessionFromProgram(
      trainerId,
      athleteId,
      workoutData.programId,
      workoutData.scheduledDate,
      workoutData.notes
    );
  }

  // Create custom session
  return await createCustomSession(
    trainerId,
    athleteId,
    workoutData.customExercises || [],
    workoutData.scheduledDate,
    workoutData.notes,
    workoutData.title,
    workoutData.description
  );
}

/**
 * Create a session from a program template
 */
async function createSessionFromProgram(
  trainerId: string,
  athleteId: string,
  programId: string,
  scheduledDate?: Date,
  notes?: string
): Promise<any> {
  // Get the program template
  const program = await prisma.program_templates.findUnique({
    where: { id: programId },
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

  if (!program) {
    throw new Error('Program not found');
  }

  // Get the first workout from the program
  const firstPhase = program.program_phases[0];
  if (!firstPhase) {
    throw new Error('Program has no phases');
  }

  const firstMicrocycle = firstPhase.microcycles[0];
  if (!firstMicrocycle) {
    throw new Error('Program has no microcycles');
  }

  const firstWorkout = firstMicrocycle.workouts[0];
  if (!firstWorkout) {
    throw new Error('Program has no workouts');
  }

  // Create workout session
  const session = await prisma.workout_sessions.create({
    data: {
      id: nanoid(),
      userId: athleteId,
      coachId: trainerId,
      date: scheduledDate || new Date(),
      startTime: scheduledDate || new Date(),
      title: `${program.name} - ${firstWorkout.dayLabel}`,
      notes: notes || firstWorkout.description || null,
      updatedAt: new Date(),
    },
  });

  // Note: Individual workout log entries will be added when the athlete performs the workout
  // The session is created as a template/plan for the athlete

  // Update trainer-client last session date
  const trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: trainerId },
  });

  if (trainerProfile) {
    await prisma.trainer_clients.updateMany({
      where: {
        trainerId: trainerProfile.id,
        clientId: athleteId,
      },
      data: {
        lastSessionDate: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  return session;
}

/**
 * Create a custom workout session
 */
async function createCustomSession(
  trainerId: string,
  athleteId: string,
  exercises: ExerciseData[],
  scheduledDate?: Date,
  notes?: string,
  title?: string,
  description?: string
): Promise<any> {
  // Create workout session
  const session = await prisma.workout_sessions.create({
    data: {
      id: nanoid(),
      userId: athleteId,
      coachId: trainerId,
      date: scheduledDate || new Date(),
      startTime: scheduledDate || new Date(),
      title: title || 'Custom Workout',
      notes: description || notes || null,
      updatedAt: new Date(),
    },
  });

  // Note: Individual workout log entries will be added when the athlete performs the workout
  // The session is created as a template/plan for the athlete
  // Custom exercises list can be stored in session notes or a separate table if needed

  // Update trainer-client last session date
  const trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: trainerId },
  });

  if (trainerProfile) {
    await prisma.trainer_clients.updateMany({
      where: {
        trainerId: trainerProfile.id,
        clientId: athleteId,
      },
      data: {
        lastSessionDate: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  return session;
}

/**
 * Clone a program for a specific athlete (with customizations)
 */
export async function cloneProgramForAthlete(
  trainerId: string,
  athleteId: string,
  programId: string,
  customizations?: {
    name?: string;
    exerciseSwaps?: { [key: string]: string }; // oldExerciseId -> newExerciseId
    volumeAdjustments?: { [key: string]: number }; // exerciseId -> multiplier (0.8 = 80%)
  }
): Promise<string> {
  // Verify trainer-client relationship
  const trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: trainerId },
  });

  if (!trainerProfile) {
    throw new Error('Trainer profile not found');
  }

  const relationship = await prisma.trainer_clients.findFirst({
    where: {
      trainerId: trainerProfile.id,
      clientId: athleteId,
    },
  });

  if (!relationship) {
    throw new Error('Not authorized to create programs for this athlete');
  }

  // Get the original program
  const originalProgram = await prisma.program_templates.findUnique({
    where: { id: programId },
    include: {
      program_phases: {
        include: {
          microcycles: {
            include: {
              workouts: {
                include: {
                  workout_exercises: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!originalProgram) {
    throw new Error('Program not found');
  }

  // Create new program template
  const newProgram = await prisma.program_templates.create({
    data: {
      id: nanoid(),
      name: customizations?.name || `${originalProgram.name} (for ${athleteId})`,
      description: originalProgram.description,
      createdBy: trainerId,
      duration: originalProgram.duration,
      difficulty: originalProgram.difficulty,
      category: originalProgram.category,
      isPublic: false, // Personal programs are private
      programType: 'CUSTOM',
      progressionStrategy: originalProgram.progressionStrategy,
      updatedAt: new Date(),
    },
  });

  // Clone phases, microcycles, workouts, and exercises
  for (const phase of originalProgram.program_phases) {
    const newPhase = await prisma.program_phases.create({
      data: {
        id: nanoid(),
        programId: newProgram.id,
        phaseNumber: phase.phaseNumber,
        phaseName: phase.phaseName,
        phaseType: phase.phaseType,
        startWeek: phase.startWeek,
        endWeek: phase.endWeek,
        description: phase.description,
        trainingFocus: phase.trainingFocus,
        targetIntensity: phase.targetIntensity,
        targetVolume: phase.targetVolume,
        targetRPE: phase.targetRPE,
        repRangeLow: phase.repRangeLow,
        repRangeHigh: phase.repRangeHigh,
        setsPerExercise: phase.setsPerExercise,
        restSecondsMin: phase.restSecondsMin,
        restSecondsMax: phase.restSecondsMax,
      },
    });

    for (const microcycle of phase.microcycles) {
      const newMicrocycle = await prisma.program_microcycles.create({
        data: {
          id: nanoid(),
          phaseId: newPhase.id,
          weekNumber: microcycle.weekNumber,
          weekInPhase: microcycle.weekInPhase,
          title: microcycle.title,
          description: microcycle.description,
          volumeModifier: microcycle.volumeModifier,
          intensityModifier: microcycle.intensityModifier,
        },
      });

      for (const workout of microcycle.workouts) {
        const newWorkout = await prisma.program_workouts.create({
          data: {
            id: nanoid(),
            microcycleId: newMicrocycle.id,
            dayNumber: workout.dayNumber,
            dayLabel: workout.dayLabel,
            workoutType: workout.workoutType,
            description: workout.description,
            estimatedDuration: workout.estimatedDuration,
          },
        });

        for (const exercise of workout.workout_exercises) {
          let exerciseId = exercise.fixedExerciseId;
          let sets = exercise.sets;

          // Apply exercise swaps if specified
          if (customizations?.exerciseSwaps && exerciseId) {
            exerciseId = customizations.exerciseSwaps[exerciseId] || exerciseId;
          }

          // Apply volume adjustments if specified
          if (customizations?.volumeAdjustments && exerciseId) {
            const multiplier = customizations.volumeAdjustments[exerciseId];
            if (multiplier) {
              sets = Math.round(sets * multiplier);
            }
          }

          await prisma.program_workout_exercises.create({
            data: {
              id: nanoid(),
              workoutId: newWorkout.id,
              fixedExerciseId: exerciseId,
              exerciseOrder: exercise.exerciseOrder,
              sets,
              repsMin: exercise.repsMin,
              repsMax: exercise.repsMax,
              targetRPE: exercise.targetRPE,
              targetIntensity: exercise.targetIntensity,
              restSeconds: exercise.restSeconds,
              tempo: exercise.tempo,
              notes: exercise.notes,
            },
          });
        }
      }
    }
  }

  // Subscribe athlete to the new program
  await prisma.program_subscriptions.create({
    data: {
      id: nanoid(),
      userId: athleteId,
      programId: newProgram.id,
      currentWeek: 1,
      currentDay: 1,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  return newProgram.id;
}

/**
 * Get available program templates for use as blueprints
 */
export async function getAvailablePrograms(trainerId: string): Promise<any[]> {
  // Get public programs + trainer's own programs
  const programs = await prisma.program_templates.findMany({
    where: {
      OR: [
        { isPublic: true },
        { createdBy: trainerId },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      difficulty: true,
      duration: true,
      category: true,
      programType: true,
      athleteId: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return programs;
}
