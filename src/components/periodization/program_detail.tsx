'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, Dumbbell, TrendingUp, User, ArrowLeft, Play } from 'lucide-react';

type ProgramDetail = {
  id: string;
  name: string;
  description: string;
  duration: string;
  difficulty: string;
  category: string;
  rating: number;
  ratingCount: number;
  tags: string[];
  programType: string;
  hasExerciseSlots: boolean;
  progressionStrategy: string;
  autoRegulation: boolean;
  legendary_athlete: {
    name: string;
    slug: string;
    eraLabel: string;
    imageUrl: string | null;
  } | null;
  program_phases: Array<{
    id: string;
    phaseNumber: number;
    phaseName: string;
    phaseType: string;
    startWeek: number;
    endWeek: number;
    description: string;
    targetIntensity: string;
    targetVolume: string;
    repRangeLow: number;
    repRangeHigh: number;
    setsPerExercise: number;
  }>;
  exercise_slots: Array<{
    id: string;
    slotNumber: number;
    slotLabel: string;
    exerciseType: string;
    movementPattern: string;
    muscleTargets: string[];
    equipmentOptions: string[];
    description: string;
    isRequired: boolean;
  }>;
  users: {
    name: string;
    image: string | null;
  };
};

type Props = {
  programId: string;
};

export function ProgramDetail({ programId }: Props) {
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgram();
  }, [programId]);

  const fetchProgram = async () => {
    try {
      const res = await fetch(`/api/workout/programs/templates`);
      if (res.ok) {
        const data = await res.json();
        const found = data.templates?.find((p: any) => p.id === programId);
        if (found) {
          setProgram(found);
        }
      }
    } catch (error) {
      console.error('Failed to fetch program:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="border-2 border-blue-100 rounded-lg p-6 animate-pulse">
          <div className="h-7 w-2/3 bg-gray-200 rounded" />
          <div className="h-4 w-1/3 bg-gray-100 rounded mt-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 4 }).map((_,i) => (
              <div key={i} className="h-20 bg-gray-50 rounded" />
            ))}
          </div>
        </div>
        <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_,i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-5 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-1/3 bg-gray-100 rounded mt-2" />
              <div className="h-20 bg-gray-50 rounded mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Program not found</h2>
        <Link href="/workout-log?tab=programs">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/workout-log?tab=programs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="text-sm text-gray-500">
          <Link href="/workout-log" className="hover:underline">Workout Log</Link>
          <span className="mx-1">/</span>
          <Link href="/workout-log?tab=programs" className="hover:underline">Programs</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-700">{program.name}</span>
        </div>
      </div>

      {/* Hero Card */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl">{program.name}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {program.legendary_athlete ? (
                  <Link
                    href={`/workout-log/athletes/${program.legendary_athlete.slug}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    By {program.legendary_athlete.name} • {program.legendary_athlete.eraLabel}
                  </Link>
                ) : (
                  <span>By {program.users.name}</span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 text-2xl">★</span>
              <span className="text-2xl font-bold">{program.rating?.toFixed(1) || 'New'}</span>
              {program.ratingCount > 0 && (
                <span className="text-gray-500">({program.ratingCount})</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <p className="text-gray-700 text-lg leading-relaxed">{program.description}</p>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 mb-2" />
              <div className="text-sm text-gray-600">Duration</div>
              <div className="font-bold">{program.duration}</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <Target className="h-6 w-6 text-blue-600 mb-2" />
              <div className="text-sm text-gray-600">Difficulty</div>
              <div className="font-bold">{program.difficulty}</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <Dumbbell className="h-6 w-6 text-blue-600 mb-2" />
              <div className="text-sm text-gray-600">Phases</div>
              <div className="font-bold">{program.program_phases.length}</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600 mb-2" />
              <div className="text-sm text-gray-600">Progression</div>
              <div className="font-bold text-center text-xs">{program.progressionStrategy || 'Custom'}</div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-sm">{program.programType}</Badge>
            <Badge variant="secondary" className="text-sm">{program.category}</Badge>
            {program.hasExerciseSlots && (
              <Badge variant="outline" className="text-sm">Customizable</Badge>
            )}
            {program.autoRegulation && (
              <Badge variant="outline" className="text-sm">Auto-Regulated</Badge>
            )}
            {program.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-sm">{tag}</Badge>
            ))}
          </div>

          {/* CTA */}
          <div className="flex gap-4 pt-4">
            <Link href={`/workout-log/programs/${program.id}/join`} className="flex-1">
              <Button size="lg" className="w-full">
                <Play className="h-5 w-5 mr-2" />
                Start This Program
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Training Phases */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Training Phases</h2>
        <div className="space-y-4">
          {program.program_phases.map((phase) => (
            <Card key={phase.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Phase {phase.phaseNumber}: {phase.phaseName}
                    </CardTitle>
                    <CardDescription>
                      Weeks {phase.startWeek}-{phase.endWeek} • {phase.phaseType}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{phase.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Target Intensity</div>
                    <div className="text-gray-600">{phase.targetIntensity}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Volume</div>
                    <div className="text-gray-600">{phase.targetVolume}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Rep Range</div>
                    <div className="text-gray-600">{phase.repRangeLow}-{phase.repRangeHigh} reps</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Sets</div>
                    <div className="text-gray-600">{phase.setsPerExercise} sets/exercise</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Exercise Slots */}
      {program.hasExerciseSlots && program.exercise_slots.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Exercise Slots</h2>
          <p className="text-gray-600">You'll choose your own exercises for these slots based on your gym equipment</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {program.exercise_slots.map((slot) => (
              <Card key={slot.id} className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">{slot.slotLabel}</CardTitle>
                  <CardDescription>{slot.exerciseType}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Targets: </span>
                    <span className="text-gray-600">{slot.muscleTargets.join(', ')}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Equipment: </span>
                    <span className="text-gray-600">{slot.equipmentOptions.join(', ')}</span>
                  </div>
                  {slot.description && (
                    <p className="text-sm text-gray-600 italic">{slot.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
