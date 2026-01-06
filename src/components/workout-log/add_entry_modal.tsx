'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/core/utils/common';
import { X, Search, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface ExerciseOption {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
}

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddEntryData) => Promise<void>;
  exercises: ExerciseOption[];
  recentExercises?: ExerciseOption[];
  initialExercise?: ExerciseOption | null;
  currentSet?: number;
  totalSets?: number;
  lastEntry?: {
    weight: number;
    reps: number;
  } | null;
}

export interface AddEntryData {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  setType: 'STRAIGHT' | 'DROP_SET' | 'PYRAMID' | 'SUPERSET' | 'REST_PAUSE';
  rpe?: number;
  restSeconds?: number;
  notes?: string;
}

type SetType = 'STRAIGHT' | 'DROP_SET' | 'PYRAMID' | 'SUPERSET' | 'REST_PAUSE';

const SET_TYPES: { value: SetType; label: string }[] = [
  { value: 'STRAIGHT', label: 'Straight' },
  { value: 'DROP_SET', label: 'Drop' },
  { value: 'PYRAMID', label: 'Pyramid' },
];

const REST_OPTIONS = [60, 90, 120, 180];

export function AddEntryModal({
  isOpen,
  onClose,
  onSubmit,
  exercises,
  recentExercises = [],
  initialExercise = null,
  currentSet = 1,
  totalSets = 3,
  lastEntry = null
}: AddEntryModalProps) {
  // Form state
  const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(initialExercise);
  const [weight, setWeight] = useState<number>(lastEntry?.weight || 0);
  const [reps, setReps] = useState<number>(lastEntry?.reps || 8);
  const [setType, setSetType] = useState<SetType>('STRAIGHT');
  const [rpe, setRpe] = useState<number>(7);
  const [restSeconds, setRestSeconds] = useState<number>(90);
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter exercises based on search
  const filteredExercises = exerciseSearch
    ? exercises.filter(ex =>
        ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        ex.category.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        ex.muscleGroups.some(mg => mg.toLowerCase().includes(exerciseSearch.toLowerCase()))
      ).slice(0, 10)
    : exercises.slice(0, 10);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedExercise(initialExercise);
      setWeight(lastEntry?.weight || 0);
      setReps(lastEntry?.reps || 8);
      setShowExerciseSearch(false);
      setExerciseSearch('');
      setShowMoreOptions(false);
      setNotes('');
    }
  }, [isOpen, initialExercise, lastEntry]);

  const handleSubmit = async () => {
    if (!selectedExercise || weight <= 0 || reps <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        weight,
        reps,
        setType,
        rpe: showMoreOptions ? rpe : undefined,
        restSeconds: showMoreOptions ? restSeconds : undefined,
        notes: notes.trim() || undefined
      });
      // Don't close - parent will handle closing or keeping open for next set
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustWeight = (delta: number) => {
    setWeight(prev => Math.max(0, prev + delta));
  };

  const adjustReps = (delta: number) => {
    setReps(prev => Math.max(1, prev + delta));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center -ml-2 touch-manipulation"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Log Set</h2>
        <div className="w-11" /> {/* Spacer for centering */}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Selected Exercise */}
        {selectedExercise && !showExerciseSearch ? (
          <section className="bg-brand-secondary rounded-xl p-4 border-2 border-brand-primary">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-brand-primary text-lg">
                  {selectedExercise.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedExercise.muscleGroups.slice(0, 2).join(' • ')} • {selectedExercise.equipment?.[0] || selectedExercise.category}
                </p>
              </div>
              <button
                onClick={() => setShowExerciseSearch(true)}
                className="text-brand-primary text-sm font-medium touch-manipulation px-3 py-2"
              >
                Change
              </button>
            </div>
          </section>
        ) : (
          /* Exercise Search */
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exercise
            </label>

            {/* Quick Select - Recent Exercises */}
            {recentExercises.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Recent</p>
                <div className="flex flex-wrap gap-2">
                  {recentExercises.slice(0, 4).map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => {
                        setSelectedExercise(ex);
                        setShowExerciseSearch(false);
                      }}
                      className={cn(
                        'px-4 py-2 bg-white border-2 rounded-full text-sm font-medium',
                        'touch-manipulation transition-colors',
                        selectedExercise?.id === ex.id
                          ? 'border-brand-primary bg-brand-secondary text-brand-primary'
                          : 'border-gray-200 text-gray-700'
                      )}
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Search exercises..."
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Search Results */}
            {(exerciseSearch || !selectedExercise) && (
              <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl bg-white">
                {filteredExercises.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setSelectedExercise(ex);
                      setShowExerciseSearch(false);
                      setExerciseSearch('');
                    }}
                    className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 touch-manipulation"
                  >
                    <p className="font-medium text-gray-900">{ex.name}</p>
                    <p className="text-sm text-gray-500">
                      {ex.category} • {ex.muscleGroups.slice(0, 2).join(', ')}
                    </p>
                  </button>
                ))}
                {filteredExercises.length === 0 && (
                  <p className="px-4 py-6 text-center text-gray-500">
                    No exercises found
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Weight Input */}
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg)
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustWeight(-2.5)}
              className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center active:bg-gray-200 touch-manipulation"
              aria-label="Decrease weight"
            >
              <Minus className="w-6 h-6 text-gray-600" />
            </button>
            <input
              type="number"
              inputMode="decimal"
              value={weight || ''}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className={cn(
                'flex-1 h-16 text-center text-3xl font-bold text-brand-primary',
                'bg-white border-2 border-gray-200 rounded-xl',
                'focus:border-brand-primary focus:outline-none focus:ring-0'
              )}
            />
            <button
              onClick={() => adjustWeight(2.5)}
              className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center active:bg-gray-200 touch-manipulation"
              aria-label="Increase weight"
            >
              <Plus className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Quick Weight Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => adjustWeight(2.5)}
              className="flex-1 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 touch-manipulation"
            >
              +2.5
            </button>
            <button
              onClick={() => adjustWeight(5)}
              className="flex-1 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 touch-manipulation"
            >
              +5
            </button>
            <button
              onClick={() => adjustWeight(10)}
              className="flex-1 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 touch-manipulation"
            >
              +10
            </button>
            {lastEntry && (
              <button
                onClick={() => setWeight(lastEntry.weight)}
                className="flex-1 py-2.5 bg-brand-secondary border border-brand-primary rounded-lg text-sm font-semibold text-brand-primary touch-manipulation"
              >
                Same
              </button>
            )}
          </div>
        </section>

        {/* Reps Input */}
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reps
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustReps(-1)}
              className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center active:bg-gray-200 touch-manipulation"
              aria-label="Decrease reps"
            >
              <Minus className="w-6 h-6 text-gray-600" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={reps || ''}
              onChange={(e) => setReps(parseInt(e.target.value) || 0)}
              className={cn(
                'flex-1 h-16 text-center text-3xl font-bold text-gray-900',
                'bg-white border-2 border-gray-200 rounded-xl',
                'focus:border-brand-primary focus:outline-none focus:ring-0'
              )}
            />
            <button
              onClick={() => adjustReps(1)}
              className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center active:bg-gray-200 touch-manipulation"
              aria-label="Increase reps"
            >
              <Plus className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </section>

        {/* More Options Toggle */}
        <button
          onClick={() => setShowMoreOptions(!showMoreOptions)}
          className="w-full py-4 flex items-center justify-center gap-2 text-brand-primary font-medium touch-manipulation"
        >
          <span>More Options</span>
          {showMoreOptions ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {/* More Options Panel */}
        {showMoreOptions && (
          <div className="space-y-5 p-4 bg-gray-50 rounded-xl animate-in fade-in duration-200">
            {/* Set Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Set Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SET_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setSetType(type.value)}
                    className={cn(
                      'py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation',
                      setType === type.value
                        ? 'bg-brand-primary text-white'
                        : 'bg-white border border-gray-200 text-gray-700'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* RPE Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RPE (Effort)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Easy</span>
                <span className="font-semibold text-brand-primary text-base">{rpe}</span>
                <span>Max</span>
              </div>
            </div>

            {/* Rest Timer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rest Timer (sec)
              </label>
              <div className="flex gap-2">
                {REST_OPTIONS.map(seconds => (
                  <button
                    key={seconds}
                    onClick={() => setRestSeconds(seconds)}
                    className={cn(
                      'flex-1 py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation',
                      restSeconds === seconds
                        ? 'bg-brand-secondary border border-brand-primary text-brand-primary'
                        : 'bg-white border border-gray-200 text-gray-700'
                    )}
                  >
                    {seconds}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did this set feel?"
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action */}
      <div className="p-4 bg-white border-t border-gray-100 safe-area-inset-bottom">
        <Button
          onClick={handleSubmit}
          disabled={!selectedExercise || weight <= 0 || reps <= 0 || isSubmitting}
          className={cn(
            'w-full py-6 text-lg font-bold rounded-xl',
            'bg-brand-primary hover:bg-brand-primary-dark text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'touch-manipulation'
          )}
        >
          {isSubmitting ? 'Logging...' : `LOG SET ${currentSet}/${totalSets}`}
        </Button>
      </div>
    </div>
  );
}
