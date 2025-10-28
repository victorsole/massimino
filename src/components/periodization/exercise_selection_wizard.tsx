'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

type ExerciseSlot = {
  id: string;
  slotNumber: number;
  slotLabel: string;
  exerciseType: string;
  movementPattern: string;
  muscleTargets: string[];
  equipmentOptions: string[];
  description: string;
  isRequired: boolean;
};

type Exercise = {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: string;
};

type Props = {
  programId: string;
  programName: string;
  slots: ExerciseSlot[];
};

export function ExerciseSelectionWizard({ programId, programName, slots }: Props) {
  const router = useRouter();
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentSlot = slots[currentSlotIndex];

  // Restore saved state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`periodization_wizard_${programId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.selections) setSelections(parsed.selections);
          if (typeof parsed.currentSlotIndex === 'number') setCurrentSlotIndex(Math.min(parsed.currentSlotIndex, Math.max(0, slots.length - 1)));
        }
      }
    } catch {}
    fetchExercises();
  }, [programId]);

  useEffect(() => {
    if (currentSlot && exercises.length > 0) {
      filterExercisesForSlot();
    }
  }, [currentSlot, exercises, searchQuery]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workout/exercises?active=true');
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExercisesForSlot = () => {
    if (!currentSlot) return;

    let filtered = exercises;

    // Filter by muscle targets
    if (currentSlot.muscleTargets.length > 0) {
      filtered = filtered.filter(ex =>
        ex.muscleGroups.some(mg =>
          currentSlot.muscleTargets.some(target =>
            mg.toLowerCase().includes(target.toLowerCase())
          )
        )
      );
    }

    // Filter by equipment
    if (currentSlot.equipmentOptions.length > 0) {
      filtered = filtered.filter(ex =>
        ex.equipment.some(eq =>
          currentSlot.equipmentOptions.some(option =>
            eq.toLowerCase().includes(option.toLowerCase())
          )
        )
      );
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredExercises(filtered);
  };

  // Autosave progress
  useEffect(() => {
    try {
      const payload = { selections, currentSlotIndex };
      localStorage.setItem(`periodization_wizard_${programId}`, JSON.stringify(payload));
      setSaving(true);
      const t = setTimeout(() => setSaving(false), 600);
      return () => clearTimeout(t);
    } catch {}
  }, [selections, currentSlotIndex, programId]);

  const selectExercise = (exerciseId: string) => {
    setSelections({
      ...selections,
      [currentSlot.id]: exerciseId,
    });

    // Auto-advance to next slot
    if (currentSlotIndex < slots.length - 1) {
      setTimeout(() => {
        setCurrentSlotIndex(currentSlotIndex + 1);
        setSearchQuery('');
      }, 300);
    }
  };

  const goToSlot = (index: number) => {
    setCurrentSlotIndex(index);
    setSearchQuery('');
  };

  const canJoin = () => {
    const requiredSlots = slots.filter(s => s.isRequired);
    return requiredSlots.every(s => selections[s.id]);
  };

  const handleJoin = async () => {
    if (!canJoin()) return;

    setJoining(true);
    try {
      const res = await fetch('/api/workout/programs/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          exerciseSelections: selections,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Successfully joined program!');
        router.push('/workout-log?tab=today');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to join program');
      }
    } catch (error) {
      console.error('Failed to join program:', error);
      alert('Failed to join program');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/workout-log/programs/${programId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Customize Your Program</h1>
          <p className="text-gray-600">{programName}</p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Exercise Selection Progress</CardTitle>
              <CardDescription>
                {Object.keys(selections).length} of {slots.length} exercises selected
              </CardDescription>
            </div>
            <div className="text-xs text-gray-500">{saving ? 'Saved' : ' '} </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Exercise slots">
            {slots.map((slot, idx) => {
              const isSelected = !!selections[slot.id];
              const isCurrent = idx === currentSlotIndex;

              return (
                <button
                  key={slot.id}
                  onClick={() => goToSlot(idx)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isSelected
                      ? 'bg-green-100 text-green-800 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                  }`}
                  role="tab"
                  aria-selected={isCurrent}
                >
                  {isSelected && <CheckCircle2 className="inline h-4 w-4 mr-1" />}
                  {slot.slotLabel ? slot.slotLabel : `Slot ${slot.slotNumber}`}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Slot */}
      {currentSlot && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Slot {currentSlot.slotNumber}: {currentSlot.slotLabel}</CardTitle>
                <CardDescription className="mt-1">
                  {currentSlot.exerciseType} • {currentSlot.muscleTargets.join(', ')}
                </CardDescription>
              </div>
              {currentSlot.isRequired && (
                <Badge variant="destructive">Required</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{currentSlot.description}</p>

            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Equipment Options:</span>
              <span className="text-gray-600">{currentSlot.equipmentOptions.join(', ')}</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Exercise List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredExercises.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  No exercises found. Try adjusting your search.
                </div>
              )}

              {filteredExercises.map((exercise) => {
                const isSelected = selections[currentSlot.id] === exercise.id;

                return (
                  <button
                    key={exercise.id}
                    onClick={() => selectExercise(exercise.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{exercise.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {exercise.muscleGroups.join(', ')}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {exercise.difficulty}
                          </Badge>
                          {exercise.equipment.map((eq) => (
                            <Badge key={eq} variant="outline" className="text-xs">
                              {eq}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions - sticky footer */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t pt-3 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => goToSlot(Math.max(0, currentSlotIndex - 1))}
            disabled={currentSlotIndex === 0}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {!currentSlot?.isRequired && currentSlotIndex < slots.length - 1 && (
              <Button variant="ghost" onClick={() => goToSlot(currentSlotIndex + 1)}>
                Skip this slot
              </Button>
            )}
            {currentSlotIndex < slots.length - 1 ? (
              <div className="flex flex-col items-end">
                <Button
                  onClick={() => goToSlot(currentSlotIndex + 1)}
                  disabled={currentSlot?.isRequired && !selections[currentSlot.id]}
                >
                  Next
                </Button>
                {currentSlot?.isRequired && !selections[currentSlot.id] && (
                  <span className="text-xs text-gray-500 mt-1">Select an exercise to continue</span>
                )}
              </div>
            ) : (
              <Button
                onClick={handleJoin}
                disabled={!canJoin() || joining}
                size="lg"
              >
                {joining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Complete & Join Program'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
