// src/components/training/session-view/goals-section.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, RefreshCw, Trash2, Target, TrendingUp, Trophy } from 'lucide-react';
import { format } from 'date-fns';

type Goal = {
  id: string;
  type: string;
  description: string;
  targetValue: number | null;
  targetDate: Date | null;
  completed: boolean;
  completedAt: Date | null;
};

type GoalsSectionProps = {
  sessionId: string;
  onAddGoal: () => void;
  readOnly?: boolean;
};

export function GoalsSection({ sessionId, onAddGoal, readOnly = false }: GoalsSectionProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [sessionId]);

  const fetchGoals = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/training/sessions/${sessionId}/goals`);
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleComplete = async (goalId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        fetchGoals();
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const response = await fetch(`/api/training/sessions/${sessionId}/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchGoals();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'challenge':
        return <Target className="h-4 w-4" />;
      case 'progress':
        return <TrendingUp className="h-4 w-4" />;
      case 'outcome':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const goalsByType = {
    challenge: goals.filter((g) => g.type === 'challenge'),
    progress: goals.filter((g) => g.type === 'progress'),
    outcome: goals.filter((g) => g.type === 'outcome'),
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">Loading goals...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Goals & Challenges</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={fetchGoals}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            {!readOnly && (
              <Button onClick={onAddGoal} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Goal
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No goals set for this session yet.</p>
            {!readOnly && (
              <Button onClick={onAddGoal} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add First Goal
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Challenges */}
            {goalsByType.challenge.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Challenges</span>
                </h3>
                <div className="space-y-2">
                  {goalsByType.challenge.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg"
                    >
                      <Checkbox
                        checked={goal.completed}
                        onCheckedChange={(checked) =>
                          handleToggleComplete(goal.id, checked as boolean)
                        }
                        disabled={readOnly}
                      />
                      <div className="flex-1">
                        <p className={goal.completed ? 'line-through text-muted-foreground' : ''}>
                          {goal.description}
                        </p>
                        {goal.completedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed: {format(new Date(goal.completedAt), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      {!readOnly && (
                        <Button
                          onClick={() => handleDeleteGoal(goal.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Goals */}
            {goalsByType.progress.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Progress Goals</span>
                </h3>
                <div className="space-y-2">
                  {goalsByType.progress.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg"
                    >
                      <Checkbox
                        checked={goal.completed}
                        onCheckedChange={(checked) =>
                          handleToggleComplete(goal.id, checked as boolean)
                        }
                        disabled={readOnly}
                      />
                      <div className="flex-1">
                        <p className={goal.completed ? 'line-through text-muted-foreground' : ''}>
                          {goal.description}
                        </p>
                        {goal.targetValue && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Target: {goal.targetValue}
                          </p>
                        )}
                        {goal.targetDate && (
                          <p className="text-xs text-muted-foreground">
                            By: {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                          </p>
                        )}
                        {goal.completedAt && (
                          <Badge variant="secondary" className="mt-1">
                            Completed {format(new Date(goal.completedAt), 'MMM d')}
                          </Badge>
                        )}
                      </div>
                      {!readOnly && (
                        <Button
                          onClick={() => handleDeleteGoal(goal.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outcome Goals */}
            {goalsByType.outcome.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center space-x-2">
                  <Trophy className="h-4 w-4" />
                  <span>Outcome Goals</span>
                </h3>
                <div className="space-y-2">
                  {goalsByType.outcome.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg"
                    >
                      <Checkbox
                        checked={goal.completed}
                        onCheckedChange={(checked) =>
                          handleToggleComplete(goal.id, checked as boolean)
                        }
                        disabled={readOnly}
                      />
                      <div className="flex-1">
                        <p className={goal.completed ? 'line-through text-muted-foreground' : ''}>
                          {goal.description}
                        </p>
                        {goal.targetDate && (
                          <p className="text-xs text-muted-foreground">
                            By: {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                          </p>
                        )}
                        {goal.completedAt && (
                          <Badge variant="secondary" className="mt-1">
                            Achieved {format(new Date(goal.completedAt), 'MMM d')}
                          </Badge>
                        )}
                      </div>
                      {!readOnly && (
                        <Button
                          onClick={() => handleDeleteGoal(goal.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
