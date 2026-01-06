'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleSection } from './collapsible_section';
import { CommentsPanel } from './WorkoutLogTable';
import {
  Calendar,
  Dumbbell,
  Clock,
  Weight,
  MessageCircle,
  Edit,
  Trash2,
  Target,
  Trophy,
  ChevronDown,
  ChevronUp,
  Video,
  Play
} from 'lucide-react';
import { cn } from '@/core/utils/common';
import { FormGuideModal } from './form_guide_modal';

// Types
export type WorkoutEntry = {
  id: string;
  date: string | Date;
  exerciseId: string;
  setNumber: number;
  setType: string;
  reps: number;
  weight: string;
  unit: string;
  intensity?: string;
  tempo?: string;
  restSeconds?: number;
  coachFeedback?: string;
  userComments?: string;
  personalRecord?: boolean;
  volumeRecord?: boolean;
  exercise: {
    id: string;
    name: string;
    category: string;
    muscleGroups: string[];
    equipment: string[];
    difficulty?: string;
  };
};

export type EditFormData = {
  reps: string;
  weight: string;
  intensity: string;
  tempo: string;
  restSeconds: string;
  userComments: string;
};

interface WorkoutCardProps {
  entry: WorkoutEntry;
  isSelected: boolean;
  isEditing: boolean;
  editFormData: EditFormData;
  loading?: boolean;
  onSelect: (entryId: string) => void;
  onStartEdit: (entry: WorkoutEntry) => void;
  onDelete: (entryId: string) => void;
  onSaveEdit: (entryId: string) => void;
  onCancelEdit: () => void;
  onEditFormChange: (data: Partial<EditFormData>) => void;
  isTrainer?: boolean;
  athleteName?: string;
}

// Badge color mappings
const categoryColors: Record<string, string> = {
  PUSH: 'bg-red-100 text-red-800 border-red-200',
  PULL: 'bg-green-100 text-green-800 border-green-200',
  LEGS: 'bg-purple-100 text-purple-800 border-purple-200',
  CORE: 'bg-blue-100 text-blue-800 border-blue-200',
  CARDIO: 'bg-orange-100 text-orange-800 border-orange-200'
};

const difficultyColors: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-800 border-green-200',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ADVANCED: 'bg-red-100 text-red-800 border-red-200'
};

const setTypeColors: Record<string, string> = {
  STRAIGHT: 'bg-gray-100 text-gray-800 border-gray-200',
  DROP: 'bg-purple-100 text-purple-800 border-purple-200',
  SUPER: 'bg-blue-100 text-blue-800 border-blue-200',
  PYRAMID: 'bg-orange-100 text-orange-800 border-orange-200'
};

// Helper component for metrics
function MetricItem({
  icon: Icon,
  label,
  value,
  className
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number | undefined;
  className?: string;
}) {
  if (value === undefined || value === null || value === '') return null;

  return (
    <div className={cn('flex items-center text-sm', className)}>
      {Icon && <Icon className="h-4 w-4 mr-2 text-gray-500" />}
      <span className="font-medium text-gray-700">{label}:</span>
      <span className="ml-1 text-gray-900">{value}</span>
    </div>
  );
}

export function WorkoutCard({
  entry,
  isSelected,
  isEditing,
  editFormData,
  loading = false,
  onSelect,
  onStartEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  onEditFormChange,
  isTrainer = false,
  athleteName
}: WorkoutCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [exerciseMedia, setExerciseMedia] = useState<{ thumbnailUrl?: string; url?: string } | null>(null);
  const [showFormGuide, setShowFormGuide] = useState(false);
  const [hasMediaAvailable, setHasMediaAvailable] = useState(false);

  // Fetch exercise media on mount
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch(`/api/workout/exercises/${entry.exercise.id}/media`);
        if (response.ok) {
          const data = await response.json();
          if (data.media && data.media.length > 0) {
            setHasMediaAvailable(true);
            // Get the featured one or first one
            const featured = data.media.find((m: any) => m.featured) || data.media[0];
            setExerciseMedia(featured);
          } else {
            setHasMediaAvailable(false);
          }
        }
      } catch (error) {
        // Silently fail - media is optional
        setHasMediaAvailable(false);
      }
    };

    if (entry.exercise?.id) {
      fetchMedia();
    }
  }, [entry.exercise?.id]);

  const formattedDate = entry.date
    ? new Date(entry.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    : 'No date';

  const hasSecondaryMetrics = entry.intensity || entry.tempo;
  const hasCoachFeedback = entry.coachFeedback && entry.coachFeedback.trim().length > 0;
  const hasUserNotes = entry.userComments && entry.userComments.trim().length > 0;

  return (
    <article className="workout-card">
      <Card className="hover:shadow-md transition-shadow duration-300 border-gray-100">
        <CardHeader className="pb-3">
          {/* Header Row */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(entry.id)}
                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary h-5 w-5 cursor-pointer"
                title="Select for template"
                aria-label={`Select ${entry.exercise.name} entry`}
              />

              {/* Date Badge */}
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-1.5" />
                <span>{formattedDate}</span>
              </div>

              {/* Set Type Badge */}
              <Badge
                variant="outline"
                className={cn('text-xs', setTypeColors[entry.setType] || setTypeColors.STRAIGHT)}
              >
                {entry.setType}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStartEdit(entry)}
                disabled={loading}
                className="h-9 w-9 hover:bg-gray-100"
                aria-label="Edit entry"
              >
                <Edit className="h-4 w-4 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(entry.id)}
                disabled={loading}
                className="h-9 w-9 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete entry"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Exercise Info Section */}
          <section className="mt-3">
            <div className="flex items-start justify-between gap-3">
              {/* Exercise Name + PR Badge */}
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Dumbbell className="h-5 w-5 text-brand-primary" />
                <span>{entry.exercise.name}</span>
                {entry.personalRecord && (
                  <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 border-yellow-500 text-xs">
                    <Trophy className="h-3 w-3 mr-1" />
                    PR!
                  </Badge>
                )}
              </h3>

              {/* Category & Difficulty Badges */}
              <div className="flex gap-1.5 flex-shrink-0">
                <Badge
                  variant="outline"
                  className={cn('text-xs', categoryColors[entry.exercise.category] || 'bg-gray-100')}
                >
                  {entry.exercise.category}
                </Badge>
                {entry.exercise.difficulty && (
                  <Badge
                    variant="outline"
                    className={cn('text-xs', difficultyColors[entry.exercise.difficulty] || 'bg-gray-100')}
                  >
                    {entry.exercise.difficulty}
                  </Badge>
                )}
              </div>
            </div>

            {/* Exercise Metadata */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              {entry.exercise.muscleGroups && entry.exercise.muscleGroups.length > 0 && (
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-1.5 text-gray-400" />
                  <span>{entry.exercise.muscleGroups.slice(0, 3).join(', ')}</span>
                </div>
              )}
              {entry.exercise.equipment && entry.exercise.equipment.length > 0 && (
                <div className="flex items-center">
                  <Dumbbell className="h-4 w-4 mr-1.5 text-gray-400" />
                  <span>{entry.exercise.equipment.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Exercise Media Thumbnail with Form Guide Button */}
            <div className="mt-3">
              {exerciseMedia?.thumbnailUrl ? (
                <div className="relative group">
                  <img
                    src={exerciseMedia.thumbnailUrl}
                    alt={`${entry.exercise.name} demonstration`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    loading="lazy"
                  />
                  {/* Form Guide overlay button */}
                  <button
                    onClick={() => setShowFormGuide(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    aria-label="View form guide"
                  >
                    <div className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-full shadow-lg">
                      <Play className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-800">Form Guide</span>
                    </div>
                  </button>
                </div>
              ) : hasMediaAvailable ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFormGuide(true)}
                  className="w-full flex items-center justify-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
                >
                  <Video className="h-4 w-4" />
                  View Form Guide
                </Button>
              ) : null}
            </div>

            {/* Trainer Badge (if viewing athlete's workout) */}
            {isTrainer && athleteName && (
              <div className="mt-2">
                <Badge className="bg-blue-600 text-white text-xs">
                  Athlete: {athleteName}
                </Badge>
              </div>
            )}
          </section>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Edit Form (inline) */}
          {isEditing && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-4">Edit Entry</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reps
                  </label>
                  <Input
                    type="number"
                    value={editFormData.reps}
                    onChange={(e) => onEditFormChange({ reps: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight
                  </label>
                  <Input
                    value={editFormData.weight}
                    onChange={(e) => onEditFormChange({ weight: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intensity
                  </label>
                  <Input
                    value={editFormData.intensity}
                    onChange={(e) => onEditFormChange({ intensity: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempo
                  </label>
                  <Input
                    value={editFormData.tempo}
                    onChange={(e) => onEditFormChange({ tempo: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rest (sec)
                  </label>
                  <Input
                    type="number"
                    value={editFormData.restSeconds}
                    onChange={(e) => onEditFormChange({ restSeconds: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Notes
                  </label>
                  <Textarea
                    value={editFormData.userComments}
                    onChange={(e) => onEditFormChange({ userComments: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancelEdit}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSaveEdit(entry.id)}
                  disabled={loading}
                  className="bg-brand-primary hover:bg-brand-primary-dark"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Primary Metrics Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-b border-gray-100">
            <MetricItem icon={Weight} label="Weight" value={entry.weight} />
            <MetricItem label="Set" value={`#${entry.setNumber}`} />
            <MetricItem label="Reps" value={entry.reps} />
            {entry.restSeconds && entry.restSeconds > 0 && (
              <MetricItem icon={Clock} label="Rest" value={`${entry.restSeconds}s`} />
            )}
          </section>

          {/* Secondary Metrics (conditional) */}
          {hasSecondaryMetrics && (
            <section className="grid grid-cols-2 gap-3 py-3 border-b border-gray-100">
              {entry.intensity && (
                <MetricItem label="Intensity" value={entry.intensity} />
              )}
              {entry.tempo && (
                <MetricItem label="Tempo" value={entry.tempo} />
              )}
            </section>
          )}

          {/* Coach Feedback (collapsible) */}
          {hasCoachFeedback && (
            <div className="mt-3">
              <CollapsibleSection
                title="Coach Feedback"
                icon={MessageCircle}
                variant="blue"
                defaultCollapsed={entry.coachFeedback!.length > 100}
              >
                {entry.coachFeedback}
              </CollapsibleSection>
            </div>
          )}

          {/* User Notes (collapsible) */}
          {hasUserNotes && (
            <div className="mt-3">
              <CollapsibleSection
                title="Your Notes"
                icon={MessageCircle}
                variant="gray"
                defaultCollapsed={false}
              >
                {entry.userComments}
              </CollapsibleSection>
            </div>
          )}

          {/* Comments Section (collapsible) */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className="w-full flex items-center justify-between p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              aria-expanded={showComments}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>Comments</span>
              </div>
              {showComments ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showComments && (
              <div className="mt-2 animate-fade-in">
                <CommentsPanel
                  commentable_type="ENTRY"
                  commentable_id={entry.id}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Guide Modal */}
      <FormGuideModal
        exerciseId={entry.exercise.id}
        exerciseName={entry.exercise.name}
        isOpen={showFormGuide}
        onClose={() => setShowFormGuide(false)}
      />
    </article>
  );
}
