"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, Info, Pencil } from 'lucide-react';

interface RestTimerBarProps {
  visible: boolean;
  remaining: number; // seconds
  onAdd15: () => void;
  onSkip: () => void;
  onDone: () => void;
  exerciseId?: string;
  sessionId?: string;
}

export function RestTimerBar({ visible, remaining, onAdd15, onSkip, onDone, exerciseId, sessionId }: RestTimerBarProps) {
  if (!visible) return null;

  const restRemaining = Math.max(0, Math.floor(remaining));
  const mm = Math.floor(restRemaining / 60).toString().padStart(2, '0');
  const ss = Math.floor(restRemaining % 60).toString().padStart(2, '0');

  const tipsHref = exerciseId
    ? `/exercises?exerciseId=${encodeURIComponent(exerciseId)}&openMedia=1&from=workout-log${sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ''}&restRemaining=${restRemaining}`
    : `/exercises?from=workout-log${sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ''}`;
  const contributeHref = exerciseId
    ? `/exercises/contribute?exerciseId=${encodeURIComponent(exerciseId)}&from=workout-log${sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ''}`
    : `/exercises/contribute?from=workout-log${sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ''}`;

  return (
    <Card className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-5xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Rest</span>
          <span className="tabular-nums">{mm}:{ss}</span>
          <Button size="sm" variant="ghost" onClick={onAdd15} className="ml-1">+15s</Button>
          <Button size="sm" variant="ghost" onClick={onSkip}>Skip</Button>
          <Button size="sm" onClick={onDone}>Done</Button>
        </div>
        <div className="flex items-center gap-2">
          <Link href={tipsHref} className="inline-flex">
            <Button size="sm" variant="secondary"><Info className="h-4 w-4 mr-1"/>Form tips</Button>
          </Link>
          <Link href={contributeHref} className="inline-flex">
            <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-1"/>Improve exercise</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
