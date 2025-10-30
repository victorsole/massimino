// src/components/training/session-view/add-exercise-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ExternalLink } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Exercise = {
  id: string;
  name: string;
  category: string | null;
  muscleGroups: string[];
  equipment: string[];
  difficulty: string | null;
  instructions: string | null;
};

type AddExerciseModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (exerciseId: string, targetSets: number, targetReps: number, targetWeight?: number, targetRest?: number) => void;
  sessionId: string;
};

export function AddExerciseModal({
  open,
  onClose,
  onAdd,
  sessionId,
}: AddExerciseModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [targetSets, setTargetSets] = useState('3');
  const [targetReps, setTargetReps] = useState('10');
  const [targetWeight, setTargetWeight] = useState('');
  const [targetRest, setTargetRest] = useState('60');

  // Fetch exercises from API
  useEffect(() => {
    if (open) {
      fetchExercises();
    }
  }, [open]);

  // Filter exercises based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredExercises(exercises);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = exercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.category?.toLowerCase().includes(query) ||
          ex.muscleGroups.some((mg) => mg.toLowerCase().includes(query))
      );
      setFilteredExercises(filtered);
    }
  }, [searchQuery, exercises]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workout/exercises');
      if (response.ok) {
        const data = await response.json();
        setExercises(data.exercises || []);
        setFilteredExercises(data.exercises || []);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!selectedExercise) return;

    onAdd(
      selectedExercise.id,
      parseInt(targetSets) || 3,
      parseInt(targetReps) || 10,
      targetWeight ? parseFloat(targetWeight) : undefined,
      parseInt(targetRest) || undefined
    );

    // Reset form
    setSelectedExercise(null);
    setSearchQuery('');
    setTargetSets('3');
    setTargetReps('10');
    setTargetWeight('');
    setTargetRest('60');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Exercise to Session</DialogTitle>
          <DialogDescription>
            Search and select an exercise from the Massimino library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search Exercises</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, category, or muscle group..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{filteredExercises.length} exercises found</span>
              <Button
                variant="link"
                size="sm"
                className="flex items-center space-x-1"
                onClick={() => window.open('/exercises', '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
                <span>Browse Full Library</span>
              </Button>
            </div>
          </div>

          {/* Exercise List */}
          {loading ? (
            <div className="text-center py-8">Loading exercises...</div>
          ) : (
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No exercises found
                </div>
              ) : (
                <div className="divide-y">
                  {filteredExercises.slice(0, 50).map((exercise) => (
                    <div
                      key={exercise.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedExercise?.id === exercise.id ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{exercise.name}</h4>
                          <div className="flex flex-wrap gap-2">
                            {exercise.category && (
                              <Badge variant="outline" className="text-xs">
                                {exercise.category}
                              </Badge>
                            )}
                            {exercise.difficulty && (
                              <Badge variant="secondary" className="text-xs">
                                {exercise.difficulty}
                              </Badge>
                            )}
                          </div>
                          {exercise.muscleGroups.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {exercise.muscleGroups.join(', ')}
                            </p>
                          )}
                        </div>
                        {selectedExercise?.id === exercise.id && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Target Values */}
          {selectedExercise && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-semibold">Set Target Values</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sets">Target Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    min="1"
                    value={targetSets}
                    onChange={(e) => setTargetSets(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reps">Target Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    min="1"
                    value={targetReps}
                    onChange={(e) => setTargetReps(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (optional)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.5"
                    placeholder="0"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rest">Rest (seconds)</Label>
                  <Input
                    id="rest"
                    type="number"
                    min="0"
                    value={targetRest}
                    onChange={(e) => setTargetRest(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedExercise}>
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
