// src/components/workout-log/WorkoutLogTable.tsx
/**
 * Workout Log Table Component
 * Interactive table for viewing and editing workout log entries
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format, formatDuration, intervalToDuration, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isSameDay, formatDistanceToNow } from 'date-fns';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Edit, Trash2, Filter, SortAsc, SortDesc, Activity, Star, Eye, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/core/utils/common';
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
  const [attachTarget, setAttachTarget] = useState<{ entryId: string; exerciseId: string } | null>(null);
  const [attachForm, setAttachForm] = useState<{ provider: string; url: string }>({ provider: 'youtube', url: '' });

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
    // Convert to KG in edit form if the stored unit is LB
    const parts = String(entry.weight)
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    const nums = parts.map((p) => parseFloat(p)).filter((n) => !isNaN(n));
    const toKg = (n: number, unit: string) => (unit === 'LB' ? n * 0.453592 : n);
    const kgWeights = nums.map((n) => toKg(n, entry.unit));
    const kgWeightString = kgWeights
      .map((n) => {
        const v = Math.round(n * 10) / 10;
        return Number.isInteger(v) ? `${v.toFixed(0)}` : `${v.toFixed(1)}`;
      })
      .join(',');

    setEditForm({
      date: entry.date ? format(typeof entry.date === 'string' ? new Date(entry.date) : entry.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      exerciseId: entry.exerciseId,
      setNumber: entry.setNumber,
      setType: entry.setType,
      reps: entry.reps,
      weight: kgWeightString,
      unit: 'KG',
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
    // Always display in kg for European platform policy
    const parts = String(weight)
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    const nums = parts.map((p) => parseFloat(p)).filter((n) => !isNaN(n));
    if (nums.length === 0) return '--';
    const toKg = (n: number) => (unit === 'LB' ? n * 0.453592 : n);
    const converted = nums.map((n) => toKg(n));
    const formatted = converted.map((n) => {
      // Show up to 1 decimal place for readability
      const v = Math.round(n * 10) / 10;
      return Number.isInteger(v) ? `${v.toFixed(0)}` : `${v.toFixed(1)}`;
    });
    return `${formatted.join(', ')} KG`;
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'No date';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid date';
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
              <Dialog open={!!attachTarget} onOpenChange={(open) => { if (!open) setAttachTarget(null) }}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Attach Media</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm">Provider</label>
                      <Select value={attachForm.provider} onValueChange={(v) => setAttachForm(prev => ({ ...prev, provider: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm">URL</label>
                      <Input placeholder="https://..." value={attachForm.url} onChange={(e) => setAttachForm(prev => ({ ...prev, url: e.target.value }))} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setAttachTarget(null)}>Cancel</Button>
                      <Button onClick={async () => {
                        if (!attachTarget) return;
                        const mediaRes = await fetch(`/api/workout/exercises/${attachTarget.exerciseId}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(attachForm) });
                        if (mediaRes.ok) {
                          const data = await mediaRes.json();
                          const mediaId = data.media?.id;
                          if (mediaId) {
                            await fetch(`/api/workout/entries/${attachTarget.entryId}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mediaId }) });
                          }
                          setAttachTarget(null);
                          onRefresh();
                        }
                      }}>Save</Button>
                    </div>
                  </div>
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
                          value={editForm.unit || 'KG'}
                          onValueChange={(value) => setEditForm({ ...editForm, unit: value as any })}
                        >
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KG">KG</SelectItem>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAttachTarget({ entryId: entry.id, exerciseId: entry.exerciseId })}
                        >
                          <LinkIcon className="h-4 w-4" />
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

// Session History Table Component
export function SessionHistoryTable() {
  const [sessions, set_sessions] = useState<any[]>([]);
  const [loading, set_loading] = useState(true);
  const [selected_session, set_selected_session] = useState<string | null>(null);
  const [visible_sessions, set_visible_sessions] = useState<Set<string>>(new Set());
  const [detail_session, set_detail_session] = useState<any | null>(null);
  const [detail_entries, set_detail_entries] = useState<any[]>([]);
  const [loading_details, set_loading_details] = useState(false);

  useEffect(() => {
    load_sessions();
  }, []);

  // Stagger animation for sessions
  useEffect(() => {
    if (sessions.length > 0) {
      sessions.forEach((session, index) => {
        setTimeout(() => {
          set_visible_sessions(prev => new Set([...prev, session.id]));
        }, index * 100); // 100ms stagger between each card
      });
    }
  }, [sessions]);

  async function load_sessions() {
    try {
      const response = await fetch('/api/workout/sessions');
      const data = await response.json();
      set_sessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      set_loading(false);
    }
  }

  async function load_session_details(session: any) {
    set_loading_details(true);
    set_detail_session(session);
    try {
      // Fetch entries for this session
      const response = await fetch(`/api/workout/entries?sessionId=${session.id}`);
      if (response.ok) {
        const data = await response.json();
        set_detail_entries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to load session details:', error);
    } finally {
      set_loading_details(false);
    }
  }

  async function handle_delete_session(session_id: string) {
    if (!confirm('Are you sure you want to delete this workout session?')) {
      return;
    }

    try {
      const response = await fetch(`/api/workout/sessions?id=${session_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Animate out before removing
        set_visible_sessions(prev => {
          const next = new Set(prev);
          next.delete(session_id);
          return next;
        });
        setTimeout(() => {
          load_sessions();
          alert('Session deleted successfully');
        }, 300);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session');
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8 animate-pulse">
        <div className="flex justify-center items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-gray-500 mt-2">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg animate-fadeIn">
          <Activity className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start a new workout session to begin tracking your progress
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session, index) => (
            <Card
              key={session.id}
              className={`hover:shadow-lg transition-all duration-300 cursor-pointer transform ${
                visible_sessions.has(session.id)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
              onClick={() => set_selected_session(session.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {session.date ? format(new Date(session.date), 'EEEE, d MMMM yyyy') : 'No date'}
                    </CardTitle>
                    <CardDescription>
                      {session.startTime ? format(new Date(session.startTime), 'HH:mm') : '--:--'}
                      {session.endTime && session.endTime && ` - ${format(new Date(session.endTime), 'HH:mm')}`}
                      {session.endTime && session.startTime && (
                        <span className="ml-2 text-gray-500">
                          ({formatDuration(
                            intervalToDuration({
                              start: new Date(session.startTime),
                              end: new Date(session.endTime)
                            })
                          )})
                        </span>
                      )}
                    </CardDescription>
                  </div>

                  {session.isComplete && (
                    <Badge variant="default">Complete</Badge>
                  )}
                  {!session.isComplete && (
                    <Badge variant="secondary">In Progress</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Sets</p>
                    <p className="text-2xl font-bold">{session.totalSets}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Total Volume</p>
                    <p className="text-2xl font-bold">
                      {session.totalVolume?.toFixed(0) || 0}
                      <span className="text-sm text-gray-500 ml-1">kg</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">XP Earned</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {session.experiencePoints || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Performance</p>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (session.performanceRating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {session.achievementsEarned?.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">🏆 Achievements Unlocked</p>
                    <div className="flex flex-wrap gap-2">
                      {session.achievementsEarned.map((achievement_id: string) => (
                        <Badge key={achievement_id} variant="secondary">
                          Achievement
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {session.sessionNotes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-700">{session.sessionNotes}</p>
                  </div>
                )}

                {/* Comments section in session card */}
                {selected_session === session.id && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Session Comments
                    </h4>
                    <CommentsPanel
                      commentable_type="SESSION"
                      commentable_id={session.id}
                    />
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    load_session_details(session);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handle_delete_session(session.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Session Detail Modal */}
      <Dialog open={!!detail_session} onOpenChange={(open) => { if (!open) { set_detail_session(null); set_detail_entries([]); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Session Details
            </DialogTitle>
          </DialogHeader>

          {detail_session && (
            <div className="space-y-4 mt-4">
              {/* Session Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg">
                  {detail_session.date ? format(new Date(detail_session.date), 'EEEE, d MMMM yyyy') : 'No date'}
                </h3>
                <p className="text-sm text-gray-600">
                  {detail_session.startTime ? format(new Date(detail_session.startTime), 'HH:mm') : '--:--'}
                  {detail_session.endTime && ` - ${format(new Date(detail_session.endTime), 'HH:mm')}`}
                  {detail_session.endTime && detail_session.startTime && (
                    <span className="ml-2">
                      ({formatDuration(
                        intervalToDuration({
                          start: new Date(detail_session.startTime),
                          end: new Date(detail_session.endTime)
                        })
                      )})
                    </span>
                  )}
                </p>
              </div>

              {/* Session Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{detail_session.totalSets || 0}</p>
                  <p className="text-xs text-gray-500">Sets</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{detail_session.totalVolume?.toFixed(0) || 0}</p>
                  <p className="text-xs text-gray-500">Volume (kg)</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{detail_session.experiencePoints || 0}</p>
                  <p className="text-xs text-gray-500">XP</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (detail_session.performanceRating || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Rating</p>
                </div>
              </div>

              {/* Exercises Performed */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Exercises Performed
                </h4>
                {loading_details ? (
                  <div className="text-center py-4 text-gray-500">Loading exercises...</div>
                ) : detail_entries.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm">No exercises logged for this session</div>
                ) : (
                  <div className="space-y-3">
                    {/* Group entries by exercise */}
                    {(() => {
                      const grouped = new Map<string, any[]>();
                      detail_entries.forEach(entry => {
                        const exerciseName = entry.exercise?.name || entry.exercises?.name || 'Unknown';
                        if (!grouped.has(exerciseName)) {
                          grouped.set(exerciseName, []);
                        }
                        grouped.get(exerciseName)!.push(entry);
                      });
                      return Array.from(grouped.entries()).map(([exerciseName, entries]) => (
                        <div key={exerciseName} className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-sm mb-2">{exerciseName}</p>
                          <div className="flex flex-wrap gap-2">
                            {entries.sort((a, b) => (a.setNumber || 0) - (b.setNumber || 0)).map((entry, idx) => (
                              <Badge key={entry.id || idx} variant="secondary" className="text-xs">
                                Set {entry.setNumber || idx + 1}: {entry.reps} reps × {entry.weight} {entry.unit || 'KG'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* Session Notes */}
              {detail_session.sessionNotes && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{detail_session.sessionNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Workout Calendar Component
interface WorkoutCalendarProps {
  month: Date;
  sessions: any[];
}

export function WorkoutCalendar({ month, sessions }: WorkoutCalendarProps) {
  const [animated, set_animated] = useState(false);
  const [hovered_day, set_hovered_day] = useState<string | null>(null);
  const [selected_day, set_selected_day] = useState<string | null>(null);
  const [selected_day_sessions, set_selected_day_sessions] = useState<any[]>([]);

  const days_in_month = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month)
  });

  const start_day = getDay(startOfMonth(month));
  const empty_days = Array(start_day).fill(null);

  // Group sessions by date
  const sessions_by_date = new Map<string, any[]>();
  sessions.forEach(session => {
    if (!session.date) return;
    const date_key = format(new Date(session.date), 'yyyy-MM-dd');
    if (!sessions_by_date.has(date_key)) {
      sessions_by_date.set(date_key, []);
    }
    sessions_by_date.get(date_key)!.push(session);
  });

  // Trigger animation on mount/month change
  useEffect(() => {
    set_animated(false);
    const timer = setTimeout(() => set_animated(true), 50);
    return () => clearTimeout(timer);
  }, [month]);

  const handle_day_click = (date_key: string, day_sessions: any[]) => {
    if (day_sessions.length > 0) {
      set_selected_day(date_key);
      set_selected_day_sessions(day_sessions);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden transition-all duration-500 ${
      animated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
    }`}>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
          <div
            key={day}
            className="bg-gray-50 py-2 text-center text-sm font-semibold text-gray-700 transition-all duration-300"
            style={{
              opacity: animated ? 1 : 0,
              transform: animated ? 'translateY(0)' : 'translateY(-10px)',
              transitionDelay: `${idx * 30}ms`
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Empty days before month starts */}
        {empty_days.map((_, index) => (
          <div key={`empty-${index}`} className="bg-gray-50 h-24" />
        ))}

        {/* Days of the month */}
        {days_in_month.map((day, dayIndex) => {
          const date_key = format(day, 'yyyy-MM-dd');
          const day_sessions = sessions_by_date.get(date_key) || [];
          const is_today = isSameDay(day, new Date());
          const is_hovered = hovered_day === date_key;
          const has_sessions = day_sessions.length > 0;

          // Calculate totals for the day
          const totalSets = day_sessions.reduce((sum, s) => sum + (s.totalSets || 0), 0);
          const totalVolume = day_sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);

          return (
            <div
              key={date_key}
              className={`relative bg-white h-20 p-1.5 transition-all duration-200 cursor-pointer ${
                is_today ? 'ring-2 ring-blue-500 ring-inset' : ''
              } ${is_hovered ? 'bg-blue-50 scale-105 z-10 shadow-lg' : ''} ${
                has_sessions ? 'hover:bg-green-50 bg-gradient-to-br from-green-50/50 to-blue-50/50' : 'hover:bg-gray-50'
              }`}
              style={{
                opacity: animated ? 1 : 0,
                transform: animated ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: `${(dayIndex + start_day) * 15}ms`
              }}
              onMouseEnter={() => set_hovered_day(date_key)}
              onMouseLeave={() => set_hovered_day(null)}
              onClick={() => handle_day_click(date_key, day_sessions)}
            >
              {/* Day number */}
              <div className={`text-sm font-medium mb-1 ${
                is_today ? 'text-blue-600 font-bold' : has_sessions ? 'text-green-700' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>

              {/* Workout indicator - cleaner design */}
              {has_sessions && (
                <div className="flex flex-col items-center justify-center flex-1">
                  {/* Workout icon with pulse effect */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                    is_hovered
                      ? 'bg-green-500 text-white scale-110'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    <Activity className="h-4 w-4" />
                  </div>

                  {/* Summary text - only show on hover */}
                  {is_hovered && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-green-700 whitespace-nowrap bg-white/80 px-1 rounded">
                      {totalSets} sets • {Math.round(totalVolume)}kg
                    </div>
                  )}
                </div>
              )}

              {/* Session count badge - top right corner */}
              {day_sessions.length > 1 && (
                <div className={`absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded-full transition-all duration-200 ${
                  is_hovered ? 'bg-green-600 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {day_sessions.length}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day Sessions Modal */}
      <Dialog open={!!selected_day} onOpenChange={(open) => { if (!open) { set_selected_day(null); set_selected_day_sessions([]); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              {selected_day && format(new Date(selected_day), 'EEEE, d MMMM yyyy')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selected_day_sessions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No workouts on this day</p>
            ) : (
              selected_day_sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-100 transition-all duration-200 hover:shadow-md"
                >
                  {/* Session Time */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Activity className="h-4 w-4" />
                      {session.startTime ? format(new Date(session.startTime), 'HH:mm') : '--:--'}
                      {session.endTime && ` - ${format(new Date(session.endTime), 'HH:mm')}`}
                    </div>
                    <Badge variant={session.isComplete ? 'default' : 'secondary'}>
                      {session.isComplete ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>

                  {/* Session Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-600">{session.totalSets || 0}</p>
                      <p className="text-xs text-gray-500">Sets</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">{session.totalVolume?.toFixed(0) || 0}</p>
                      <p className="text-xs text-gray-500">Volume (kg)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-purple-600">{session.experiencePoints || 0}</p>
                      <p className="text-xs text-gray-500">XP</p>
                    </div>
                  </div>

                  {/* Performance Rating */}
                  {session.performanceRating > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= session.performanceRating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Session Notes */}
                  {session.sessionNotes && (
                    <div className="mt-3 pt-3 border-t border-blue-100">
                      <p className="text-sm text-gray-600 italic">{session.sessionNotes}</p>
                    </div>
                  )}

                  {/* Duration */}
                  {session.endTime && session.startTime && (
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Duration: {formatDuration(
                        intervalToDuration({
                          start: new Date(session.startTime),
                          end: new Date(session.endTime)
                        })
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// CommentsPanel Component
interface CommentsPanelProps {
  commentable_type: 'ENTRY' | 'SESSION';
  commentable_id: string;
}

export function CommentsPanel({ commentable_type, commentable_id }: CommentsPanelProps) {
  const [comments, set_comments] = useState<any[]>([]);
  const [new_comment, set_new_comment] = useState('');
  const [loading, set_loading] = useState(true);
  const [submitting, set_submitting] = useState(false);

  useEffect(() => {
    load_comments();
  }, [commentable_type, commentable_id]);

  async function load_comments() {
    try {
      const response = await fetch(
        `/api/workout/comments?type=${commentable_type}&id=${commentable_id}`
      );
      const data = await response.json();
      set_comments(data.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      set_loading(false);
    }
  }

  async function handle_submit_comment() {
    if (!new_comment.trim()) return;

    set_submitting(true);
    try {
      const response = await fetch('/api/workout/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentable_type,
          commentable_id,
          content: new_comment
        })
      });

      if (response.ok) {
        set_new_comment('');
        load_comments();
        alert('Comment added');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    } finally {
      set_submitting(false);
    }
  }

  async function handle_delete_comment(comment_id: string) {
    if (!confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`/api/workout/comments?id=${comment_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        load_comments();
        alert('Comment deleted');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment');
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Comment input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={new_comment}
          onChange={(e) => set_new_comment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 border rounded-md px-3 py-2 text-sm"
          onKeyPress={(e) => {
            if (e.key === 'Enter') handle_submit_comment();
          }}
        />
        <Button
          onClick={handle_submit_comment}
          disabled={submitting || !new_comment.trim()}
          size="sm"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Post
        </Button>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No comments yet</p>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div
              key={comment.id}
              className="bg-gray-50 rounded-md p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {comment.users.image && (
                      <img
                        src={comment.users.image}
                        alt={comment.users.name}
                        className="h-6 w-6 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {comment.users.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true
                      }) : 'recently'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handle_delete_comment(comment.id)}
                  className="ml-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
