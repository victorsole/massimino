// src/components/exercises/exercise-search-modal.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Dumbbell } from 'lucide-react';

type Exercise = {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  muscleGroups: string[];
  bodyPart?: string;
};

type ExerciseSearchModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
};

export function ExerciseSearchModal({
  open,
  onClose,
  onSelectExercise,
}: ExerciseSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Fetch exercises when modal opens
  useEffect(() => {
    if (open && !initialLoaded) {
      setLoading(true);
      fetch('/api/workout/exercises?limit=500', { cache: 'no-store' })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setExercises(Array.isArray(data) ? data : []);
          setInitialLoaded(true);
        })
        .finally(() => setLoading(false));
    }
  }, [open, initialLoaded]);

  // Filter exercises based on search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return exercises.slice(0, 20); // Show first 20 when no search
    }
    const query = searchQuery.toLowerCase();
    return exercises
      .filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.category?.toLowerCase().includes(query) ||
        ex.bodyPart?.toLowerCase().includes(query) ||
        ex.muscleGroups?.some(mg => mg.toLowerCase().includes(query))
      )
      .slice(0, 30); // Limit to 30 results
  }, [exercises, searchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleSelect = (exercise: Exercise) => {
    onSelectExercise(exercise);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>What would you like to contribute?</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search exercises (e.g., Bench Press, Squat, Deadlift...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto min-h-[300px] mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p>Loading exercises...</p>
              </div>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No exercises found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredExercises.map(exercise => (
                <div
                  key={exercise.id}
                  className="border rounded-lg p-3 hover:border-primary hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-tight truncate">
                        {exercise.name}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.category && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {exercise.category}
                          </span>
                        )}
                        {exercise.bodyPart && (
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                            {exercise.bodyPart}
                          </span>
                        )}
                        {exercise.difficulty && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {exercise.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelect(exercise)}
                      className="shrink-0"
                    >
                      Contribute
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {!loading && filteredExercises.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {searchQuery ? `Showing ${filteredExercises.length} results` : 'Type to search for more exercises'}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
