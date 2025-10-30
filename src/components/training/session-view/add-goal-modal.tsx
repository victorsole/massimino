// src/components/training/session-view/add-goal-modal.tsx
'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, Trophy } from 'lucide-react';

type AddGoalModalProps = {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  onGoalAdded: () => void;
};

export function AddGoalModal({
  open,
  onClose,
  sessionId,
  onGoalAdded,
}: AddGoalModalProps) {
  const [type, setType] = useState<'challenge' | 'progress' | 'outcome'>('challenge');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert('Please enter a goal description');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/training/sessions/${sessionId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description: description.trim(),
          targetValue: targetValue ? parseFloat(targetValue) : null,
          targetDate: targetDate || null,
        }),
      });

      if (response.ok) {
        onGoalAdded();
        handleClose();
      } else {
        alert('Failed to create goal. Please try again.');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Error creating goal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setType('challenge');
    setDescription('');
    setTargetValue('');
    setTargetDate('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Goal</DialogTitle>
          <DialogDescription>
            Set a new goal or challenge for this training session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Goal Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Goal Type</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="challenge">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Challenge</div>
                      <div className="text-xs text-muted-foreground">
                        e.g., Complete all sets with perfect form
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="progress">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Progress Goal</div>
                      <div className="text-xs text-muted-foreground">
                        e.g., Increase squat weight by 10 lbs
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="outcome">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Outcome Goal</div>
                      <div className="text-xs text-muted-foreground">
                        e.g., Master pistol squat technique
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder={
                type === 'challenge'
                  ? 'e.g., Complete all sets with proper form'
                  : type === 'progress'
                  ? 'e.g., Increase bench press from 185 to 205 lbs'
                  : 'e.g., Perform 10 consecutive pull-ups'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Target Value (for progress goals) */}
          {type === 'progress' && (
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target Value (optional)</Label>
              <Input
                id="targetValue"
                type="number"
                step="0.5"
                placeholder="e.g., 205"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Target weight, reps, or other measurable value
              </p>
            </div>
          )}

          {/* Target Date */}
          {(type === 'progress' || type === 'outcome') && (
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date (optional)</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !description.trim()}>
            {submitting ? 'Creating...' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
