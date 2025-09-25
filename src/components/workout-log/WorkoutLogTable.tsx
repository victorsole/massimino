/**
 * Workout Log Table Component
 * Interactive table for viewing and editing workout log entries
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Edit, Trash2, Filter, SortAsc, SortDesc } from 'lucide-react';
import { cn } from '@/core/utils';
import { 
  WorkoutLogEntry, 
  WorkoutFilterOptions,
  WorkoutSortOptions,
  WorkoutPagination,
  SET_TYPE_CONFIGS
} from '@/types/workout';
import { UserRole } from '@prisma/client';

type ExerciseRef = { id: string; name: string };

interface WorkoutLogTableProps {
  entries: (WorkoutLogEntry & {
    exercise: ExerciseRef;
    user: { id: string; name: string; role: string };
    coach?: { id: string; name: string; role: string };
  })[];
  pagination: WorkoutPagination;
  onRefresh: () => void;
  onFiltersChange: (filters: WorkoutFilterOptions) => void;
  onSortChange: (sort: WorkoutSortOptions) => void;
  onPaginationChange: (pagination: WorkoutPagination) => void;
}

export function WorkoutLogTable({
  entries,
  pagination,
  onRefresh,
  onFiltersChange,
  onSortChange,
  onPaginationChange,
}: WorkoutLogTableProps) {
  const { data: session } = useSession();
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [exercises, setExercises] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<WorkoutFilterOptions>({});
  const [sort, setSort] = useState<WorkoutSortOptions>({ field: 'date', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);

  const isTrainer = session?.user?.role === UserRole.TRAINER;

  // Load exercises on component mount
  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/workout/exercises');
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data)
          ? data.map((e: any) => ({ id: String(e.id), name: String(e.name || e.title || 'Exercise') }))
          : [];
        setExercises(items);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  // Handle inline editing
  const handleEdit = (entry: WorkoutLogEntry) => {
    setEditingEntry(entry.id);
    setEditForm({
      date: format(typeof entry.date === 'string' ? new Date(entry.date) : entry.date, 'yyyy-MM-dd'),
      exerciseId: entry.exerciseId,
      setNumber: entry.setNumber,
      setType: entry.setType,
      reps: entry.reps,
      weight: entry.weight,
      unit: entry.unit,
      intensity: entry.intensity,
      intensityType: entry.intensityType,
      tempo: entry.tempo,
      restSeconds: entry.restSeconds,
      userComments: entry.userComments,
    });
  };

  const handleSave = async () => {
    if (!editingEntry) return;

    try {
      const response = await fetch(`/api/workout/entries/${editingEntry}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setEditingEntry(null);
        setEditForm({});
        onRefresh();
      } else {
        const error = await response.json();
        alert(`Error updating entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Error updating entry');
    }
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setEditForm({});
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const response = await fetch(`/api/workout/entries/${entryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(`Error deleting entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry');
    }
  };

  const handleCoachFeedback = async (entryId: string, feedback: string) => {
    try {
      const response = await fetch(`/api/workout/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(`Error adding feedback: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding feedback:', error);
      alert('Error adding feedback');
    }
  };

  const handleSort = (field: keyof WorkoutLogEntry) => {
    const newSort: WorkoutSortOptions = {
      field,
      direction: sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc',
    };
    setSort(newSort);
    onSortChange(newSort);
  };

  const handleFilterChange = (newFilters: Partial<WorkoutFilterOptions>) => {
    const cleaned: any = { ...newFilters };
    Object.keys(cleaned).forEach((k) => {
      if (cleaned[k] === undefined) delete cleaned[k];
    });
    const updatedFilters = { ...filters, ...cleaned } as WorkoutFilterOptions;
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const renderSortIcon = (field: keyof WorkoutLogEntry) => {
    if (sort.field !== field) return null;
    return sort.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  const formatWeight = (weight: string, unit: string) => {
    return `${weight} ${unit}`;
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'MMM dd, yyyy');
  };

  // const formatTime = (time: string) => time || '--';

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Workout Log
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Workout Entry</DialogTitle>
                  </DialogHeader>
                  <WorkoutEntryForm
                    _exercises={exercises}
                    onSave={() => {
                      onRefresh();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Exercise</label>
                  <Select
                    value={filters.exercises?.[0] || ''}
                    onValueChange={(value) => 
                    handleFilterChange(value ? { exercises: [value] } : {})
                    }
                  >
                  <SelectTrigger>
                    <SelectValue placeholder="All exercises" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All exercises</SelectItem>
                    {exercises.map((exercise) => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Set Type</label>
                  <Select
                    value={filters.setTypes?.[0] || ''}
                    onValueChange={(value) => 
                    handleFilterChange(value ? { setTypes: [value as any] } : {})
                    }
                  >
                  <SelectTrigger>
                    <SelectValue placeholder="All set types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All set types</SelectItem>
                    {(Object.keys(SET_TYPE_CONFIGS) as Array<keyof typeof SET_TYPE_CONFIGS>).map((setType) => (
                      <SelectItem key={String(setType)} value={String(setType)}>
                        {SET_TYPE_CONFIGS[setType].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filters.dateRange && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange ? (
                        `${format(filters.dateRange.start, 'MMM dd')} - ${format(filters.dateRange.end, 'MMM dd')}`
                      ) : (
                        'Select date range'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: filters.dateRange?.start,
                        to: filters.dateRange?.end,
                      }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          handleFilterChange({
                            dateRange: { start: range.from, end: range.to },
                          });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {renderSortIcon('date')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('exerciseId')}
                >
                  <div className="flex items-center gap-1">
                    Exercise
                    {renderSortIcon('exerciseId')}
                  </div>
                </TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Set #</TableHead>
                <TableHead>Set Type</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('reps')}
                >
                  <div className="flex items-center gap-1">
                    Reps
                    {renderSortIcon('reps')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('weight')}
                >
                  <div className="flex items-center gap-1">
                    Weight
                    {renderSortIcon('weight')}
                  </div>
                </TableHead>
                <TableHead>Intensity</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Rest</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('trainingVolume')}
                >
                  <div className="flex items-center gap-1">
                    Volume
                    {renderSortIcon('trainingVolume')}
                  </div>
                </TableHead>
                <TableHead>Comments</TableHead>
                {isTrainer && <TableHead>Coach Feedback</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {editingEntry === entry.id ? (
                      <Input
                        type="date"
                        value={editForm.date || ''}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      />
                    ) : (
                      formatDate(entry.date)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingEntry === entry.id ? (
                      <Select
                        value={editForm.exerciseId || ''}
                        onValueChange={(value) => setEditForm({ ...editForm, exerciseId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {exercises.map((exercise) => (
                            <SelectItem key={exercise.id} value={exercise.id}>
                              {exercise.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      entry.exercise.name
                    )}
                  </TableCell>
                  <TableCell>{entry.order}</TableCell>
                  <TableCell>
                    {editingEntry === entry.id ? (
                      <Input
                        type="number"
                        value={editForm.setNumber || ''}
                        onChange={(e) => setEditForm({ ...editForm, setNumber: parseInt(e.target.value) })}
                      />
                    ) : (
                      entry.setNumber
                    )}
                  </TableCell>
                  <TableCell>
                    {editingEntry === entry.id ? (
                      <Select
                        value={editForm.setType || ''}
                        onValueChange={(value) => setEditForm({ ...editForm, setType: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(SET_TYPE_CONFIGS) as Array<keyof typeof SET_TYPE_CONFIGS>).map((setType) => (
                            <SelectItem key={String(setType)} value={String(setType)}>
                              {SET_TYPE_CONFIGS[setType].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">
                        {SET_TYPE_CONFIGS[entry.setType].label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingEntry === entry.id ? (
                      <Input
                        type="number"
                        value={editForm.reps || ''}
                        onChange={(e) => setEditForm({ ...editForm, reps: parseInt(e.target.value) })}
                      />
                    ) : (
                      entry.reps
                    )}
                  </TableCell>
                  <TableCell>
                    {editingEntry === entry.id ? (
                      <div className="flex gap-1">
                        <Input
                          value={editForm.weight || ''}
                          onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                          placeholder="40,45,50"
                        />
                        <Select
                          value={editForm.unit || ''}
                          onValueChange={(value) => setEditForm({ ...editForm, unit: value as any })}
                        >
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(['KG','LB'] as const).map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      formatWeight(entry.weight, entry.unit)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingEntry === entry.id ? (
                      <Input
                        value={editForm.intensity || ''}
                        onChange={(e) => setEditForm({ ...editForm, intensity: e.target.value })}
                        placeholder="85% or RPE 8"
                      />
                    ) : (
                      entry.intensity || '--'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingEntry === entry.id ? (
                      <Input
                        value={editForm.tempo || ''}
                        onChange={(e) => setEditForm({ ...editForm, tempo: e.target.value })}
                        placeholder="3-1-1-0"
                      />
                    ) : (
                      entry.tempo || '--'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingEntry === entry.id ? (
                      <Input
                        type="number"
                        value={editForm.restSeconds || ''}
                        onChange={(e) => setEditForm({ ...editForm, restSeconds: parseInt(e.target.value) })}
                        placeholder="60"
                      />
                    ) : (
                      entry.restSeconds ? `${entry.restSeconds}s` : '--'
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.trainingVolume ? `${entry.trainingVolume.toFixed(1)} kg` : '--'}
                  </TableCell>
                  <TableCell>
                    {editingEntry === entry.id ? (
                      <Textarea
                        value={editForm.userComments || ''}
                        onChange={(e) => setEditForm({ ...editForm, userComments: e.target.value })}
                        placeholder="Comments..."
                        className="min-h-[60px]"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {entry.userComments || '--'}
                      </span>
                    )}
                  </TableCell>
                  {isTrainer && (
                    <TableCell>
                      <CoachFeedbackCell
                        entry={entry}
                        onFeedback={handleCoachFeedback}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    {editingEntry === entry.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={handleSave}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => onPaginationChange({ ...pagination, page: pagination.page - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => onPaginationChange({ ...pagination, page: pagination.page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

// Coach Feedback Cell Component
function CoachFeedbackCell({ 
  entry, 
  onFeedback 
}: { 
  entry: WorkoutLogEntry; 
  onFeedback: (entryId: string, feedback: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState(entry.coachFeedback || '');

  const handleSave = () => {
    onFeedback(entry.id, feedback);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Add coach feedback..."
          className="min-h-[60px]"
        />
        <div className="flex gap-1">
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className="text-sm text-muted-foreground">
        {entry.coachFeedback || '--'}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="ml-2"
      >
        <Edit className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Workout Entry Form Component (simplified for now)
function WorkoutEntryForm({ 
  _exercises, 
  onSave 
}: { 
  _exercises: ExerciseRef[]; 
  onSave: () => void;
}) {
  void _exercises;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Workout entry form will be implemented here.
      </p>
      <Button onClick={onSave}>
        Save Entry
      </Button>
    </div>
  );
}
