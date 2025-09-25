'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Calendar,
  Dumbbell,
  Clock,
  Weight,
  MessageCircle,
  Video,
  Image as ImageIcon,
  Edit,
  Trash2,
  Search,
  Info,
  Target,
  Zap,
  User
} from 'lucide-react';
// Use a relaxed exercise type matching what the UI actually uses
type ExerciseListItem = {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty?: string;
  instructions?: string;
};

const mockWorkoutEntries = [
  {
    id: '1',
    date: '2024-01-15',
    exercise: 'Barbell Bench Press',
    exerciseId: 'mock-1',
    sets: 3,
    reps: 8,
    weight: '135 lbs',
    setType: 'Straight',
    intensity: '75%',
    tempo: '3-1-1-0',
    restSeconds: 120,
    coachComment: 'Great form! Keep your core tight throughout the movement.',
    userComment: 'Felt strong today, could probably go heavier next time.',
    videoUrl: 'https://example.com/video1',
    imageUrl: null,
    exerciseDetails: {
      category: 'Bodybuilding',
      muscleGroups: ['Pectoralis Major', 'Anterior Deltoids', 'Triceps Brachii'],
      equipment: ['Barbell', 'Bench'],
      difficulty: 'INTERMEDIATE'
    }
  },
  {
    id: '2',
    date: '2024-01-15',
    exercise: 'Pull-ups',
    exerciseId: 'mock-2',
    sets: 3,
    reps: 5,
    weight: 'Bodyweight',
    setType: 'Straight',
    intensity: 'RPE 8',
    tempo: '2-1-2-0',
    restSeconds: 90,
    coachComment: 'Excellent range of motion. Try to pause at the top.',
    userComment: 'These were challenging but I felt good control.',
    videoUrl: null,
    imageUrl: 'https://example.com/image1.jpg',
    exerciseDetails: {
      category: 'Calisthenics',
      muscleGroups: ['Latissimus Dorsi', 'Rhomboids', 'Biceps Brachii'],
      equipment: ['Pull-up Bar'],
      difficulty: 'INTERMEDIATE'
    }
  }
];

export default function WorkoutLogPage() {
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [exercises, setExercises] = useState<ExerciseListItem[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseListItem[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseListItem | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [newEntry, setNewEntry] = useState({
    exercise: '',
    exerciseId: '',
    sets: '',
    reps: '',
    weight: '',
    setType: 'Straight',
    intensity: '',
    tempo: '',
    restSeconds: '',
    userComment: ''
  });

  // Fetch exercises on component mount
  useEffect(() => {
    fetchExercises();
  }, []);

  // Filter exercises based on search
  useEffect(() => {
    if (exerciseSearch) {
      const filtered = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.category.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.muscleGroups.some(mg => mg.toLowerCase().includes(exerciseSearch.toLowerCase()))
      );
      setFilteredExercises(filtered.slice(0, 20)); // Limit to 20 for performance
    } else {
      setFilteredExercises(exercises.slice(0, 20));
    }
  }, [exerciseSearch, exercises]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workout/exercises');
      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          const normalized: ExerciseListItem[] = Array.isArray(data)
            ? data.map((e: any) => ({
                id: String(e.id),
                name: String(e.name || e.title || 'Exercise'),
                category: String(e.category || 'General'),
                muscleGroups: Array.isArray(e.muscleGroups) ? e.muscleGroups.map(String) : [],
                equipment: Array.isArray(e.equipment) ? e.equipment.map(String) : [],
                ...(e.difficulty ? { difficulty: String(e.difficulty) } : {}),
                ...(e.instructions ? { instructions: String(e.instructions) } : {}),
              }))
            : [];
          setExercises(normalized);
          setFilteredExercises(normalized.slice(0, 20));
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          console.error('Response text:', text);
          // Fallback to basic exercises if JSON parsing fails
          const fallbackExercises: ExerciseListItem[] = [
            { id: 'fallback-1', name: 'Barbell Bench Press', category: 'Compound', muscleGroups: ['chest', 'triceps'], equipment: ['barbell', 'bench'] },
            { id: 'fallback-2', name: 'Squats', category: 'Compound', muscleGroups: ['quadriceps', 'glutes'], equipment: ['barbell'] },
            { id: 'fallback-3', name: 'Deadlift', category: 'Compound', muscleGroups: ['hamstrings', 'glutes', 'back'], equipment: ['barbell'] }
          ];
          setExercises(fallbackExercises);
          setFilteredExercises(fallbackExercises);
        }
      } else {
        console.error('API response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      // Fallback to basic exercises on error
      const fallbackExercises: ExerciseListItem[] = [
        { id: 'fallback-1', name: 'Barbell Bench Press', category: 'Compound', muscleGroups: ['chest', 'triceps'], equipment: ['barbell', 'bench'] },
        { id: 'fallback-2', name: 'Squats', category: 'Compound', muscleGroups: ['quadriceps', 'glutes'], equipment: ['barbell'] },
        { id: 'fallback-3', name: 'Deadlift', category: 'Compound', muscleGroups: ['hamstrings', 'glutes', 'back'], equipment: ['barbell'] }
      ];
      setExercises(fallbackExercises);
      setFilteredExercises(fallbackExercises);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseSelect = (exercise: ExerciseListItem) => {
    setSelectedExercise(exercise);
    setNewEntry({
      ...newEntry,
      exercise: exercise.name,
      exerciseId: exercise.id
    });
    setExerciseSearch('');
  };

  const handleAddEntry = () => {
    // Handle adding new workout entry
    console.log('Adding entry:', newEntry);
    setIsAddingEntry(false);
    setSelectedExercise(null);
    setNewEntry({
      exercise: '',
      exerciseId: '',
      sets: '',
      reps: '',
      weight: '',
      setType: 'Straight',
      intensity: '',
      tempo: '',
      restSeconds: '',
      userComment: ''
    });
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workout Log</h1>
            <p className="text-gray-600 mt-2">Track your workouts and see coach feedback</p>
          </div>
          <Button onClick={() => setIsAddingEntry(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Workout Entry
          </Button>
        </div>

        {/* Add New Entry Form */}
        {isAddingEntry && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Workout Entry</CardTitle>
              <CardDescription>
                Log your workout details and add personal notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exercise
                  </label>
                  
                  {/* Exercise Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search exercises..."
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Browse All Exercises Link */}
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/exercises', '_blank')}
                    >
                      <Dumbbell className="h-4 w-4 mr-2" />
                      Browse All Exercises ({exercises.length})
                    </Button>
                  </div>

                  {/* Exercise Selection */}
                  {exerciseSearch && (
                    <div className="mt-2 max-h-60 overflow-y-auto border rounded-md bg-white shadow-lg z-10">
                      {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading exercises...</div>
                      ) : filteredExercises.length > 0 ? (
                        filteredExercises.map((exercise) => (
                          <div
                            key={exercise.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => handleExerciseSelect(exercise)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{exercise.name}</div>
                                <div className="text-sm text-gray-500">
                                  {exercise.category} • {exercise.muscleGroups.slice(0, 2).join(', ')}
                                  {exercise.muscleGroups.length > 2 && ` +${exercise.muscleGroups.length - 2} more`}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {exercise.difficulty}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">No exercises found</div>
                      )}
                    </div>
                  )}

                  {/* Selected Exercise Display */}
                  {selectedExercise && (
                    <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900">{selectedExercise.name}</h4>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center">
                              <Target className="h-4 w-4 mr-1 text-blue-600" />
                              <span className="text-blue-700">
                                {selectedExercise.muscleGroups.slice(0, 3).join(', ')}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Zap className="h-4 w-4 mr-1 text-blue-600" />
                              <span className="text-blue-700">{selectedExercise.difficulty}</span>
                            </div>
                            <div className="flex items-center">
                              <Dumbbell className="h-4 w-4 mr-1 text-blue-600" />
                              <span className="text-blue-700">
                                {selectedExercise.equipment.slice(0, 2).join(', ')}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Info className="h-4 w-4 mr-1 text-blue-600" />
                              <span className="text-blue-700">{selectedExercise.category}</span>
                            </div>
                          </div>
                          {selectedExercise.instructions && (
                            <div className="mt-2 text-sm text-blue-700">
                              <strong>Instructions:</strong> {selectedExercise.instructions.substring(0, 100)}
                              {selectedExercise.instructions.length > 100 && '...'}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedExercise(null);
                            setNewEntry({...newEntry, exercise: '', exerciseId: ''});
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sets
                  </label>
                  <Input
                    type="number"
                    value={newEntry.sets}
                    onChange={(e) => setNewEntry({...newEntry, sets: e.target.value})}
                    placeholder="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reps
                  </label>
                  <Input
                    type="number"
                    value={newEntry.reps}
                    onChange={(e) => setNewEntry({...newEntry, reps: e.target.value})}
                    placeholder="8"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight
                  </label>
                  <Input
                    value={newEntry.weight}
                    onChange={(e) => setNewEntry({...newEntry, weight: e.target.value})}
                    placeholder="135 lbs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Set Type
                  </label>
                  <Select value={newEntry.setType} onValueChange={(value) => setNewEntry({...newEntry, setType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Straight">Straight</SelectItem>
                      <SelectItem value="Superset">Superset</SelectItem>
                      <SelectItem value="Pyramid">Pyramid</SelectItem>
                      <SelectItem value="Drop Set">Drop Set</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intensity
                  </label>
                  <Input
                    value={newEntry.intensity}
                    onChange={(e) => setNewEntry({...newEntry, intensity: e.target.value})}
                    placeholder="75% or RPE 8"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempo
                  </label>
                  <Input
                    value={newEntry.tempo}
                    onChange={(e) => setNewEntry({...newEntry, tempo: e.target.value})}
                    placeholder="3-1-1-0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rest (seconds)
                  </label>
                  <Input
                    type="number"
                    value={newEntry.restSeconds}
                    onChange={(e) => setNewEntry({...newEntry, restSeconds: e.target.value})}
                    placeholder="120"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Notes
                  </label>
                  <Textarea
                    value={newEntry.userComment}
                    onChange={(e) => setNewEntry({...newEntry, userComment: e.target.value})}
                    placeholder="How did this exercise feel? Any notes for your coach?"
                    rows={3}
                  />
                </div>
              </div>

              {/* Allow Comments Toggle */}
              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="allowComments"
                  name="allowComments"
                  defaultChecked={true}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="allowComments" className="text-sm font-medium text-blue-900">
                  Allow others to comment on this workout entry
                </label>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsAddingEntry(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEntry}
                  disabled={!selectedExercise || !newEntry.sets || !newEntry.reps}
                >
                  Add Entry
                </Button>
              </div>
              
              {/* Form Validation Messages */}
              {!selectedExercise && (
                <div className="mt-2 text-sm text-red-600">
                  Please select an exercise from the database
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Workout Entries */}
        <div className="space-y-6">
          {mockWorkoutEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                    <Badge variant="outline">{entry.setType}</Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Dumbbell className="h-5 w-5 mr-2" />
                    {entry.exercise}
                  </div>
                  {entry.exerciseDetails && (
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {entry.exerciseDetails.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {entry.exerciseDetails.difficulty}
                      </Badge>
                    </div>
                  )}
                </CardTitle>
                
                {/* Exercise Details */}
                {entry.exerciseDetails && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      <span>{entry.exerciseDetails.muscleGroups.slice(0, 2).join(', ')}</span>
                    </div>
                    <div className="flex items-center">
                      <Dumbbell className="h-4 w-4 mr-1" />
                      <span>{entry.exerciseDetails.equipment.join(', ')}</span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center text-sm">
                    <Weight className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium">Weight:</span>
                    <span className="ml-1">{entry.weight}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium">Sets:</span>
                    <span className="ml-1">{entry.sets}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium">Reps:</span>
                    <span className="ml-1">{entry.reps}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium">Rest:</span>
                    <span className="ml-1">{entry.restSeconds}s</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Intensity:</span>
                    <span className="ml-2 text-sm">{entry.intensity}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Tempo:</span>
                    <span className="ml-2 text-sm">{entry.tempo}</span>
                  </div>
                </div>

                {/* Media Links */}
                {(entry.videoUrl || entry.imageUrl) && (
                  <div className="flex space-x-2 mb-6">
                    {entry.videoUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={entry.videoUrl} target="_blank" rel="noopener noreferrer">
                          <Video className="h-4 w-4 mr-2" />
                          Watch Video
                        </a>
                      </Button>
                    )}
                    {entry.imageUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={entry.imageUrl} target="_blank" rel="noopener noreferrer">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          View Image
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {/* Comments */}
                <div className="space-y-4">
                  {entry.coachComment && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <MessageCircle className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Coach Feedback</span>
                      </div>
                      <p className="text-sm text-blue-700">{entry.coachComment}</p>
                    </div>
                  )}

                  {entry.userComment && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <MessageCircle className="h-4 w-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">Your Notes</span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.userComment}</p>
                    </div>
                  )}

                  {/* Comments Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Comments
                      </h4>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Comment
                      </Button>
                    </div>

                    {/* Example Comments (will be dynamic) */}
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">Trainer Name</span>
                              <Badge variant="outline" className="text-xs">Trainer</Badge>
                              <span className="text-xs text-gray-500">2 hours ago</span>
                            </div>
                            <p className="text-sm text-gray-700">
                              Great form on this exercise! Consider increasing the weight next time if it felt too easy.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">Workout Buddy</span>
                              <span className="text-xs text-gray-500">1 day ago</span>
                            </div>
                            <p className="text-sm text-gray-700">
                              Nice work! I did the same exercise yesterday. How did the tempo feel?
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comments disabled message removed since flag not present in type */}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {mockWorkoutEntries.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workout entries yet</h3>
              <p className="text-gray-600 mb-6">
                Start tracking your workouts and see your progress over time
              </p>
              <Button onClick={() => setIsAddingEntry(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Workout
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
