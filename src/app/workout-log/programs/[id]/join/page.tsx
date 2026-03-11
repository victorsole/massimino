'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExerciseSelectionWizard } from '@/components/periodization/exercise_selection_wizard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type ExerciseSlot = {
  id: string;
  slotNumber: number;
  slotLabel: string;
  exerciseType: string;
  movementPattern: string;
  muscleTargets: string[];
  equipmentOptions: string[];
  description: string;
  isRequired: boolean;
};

type ProgramData = {
  id: string;
  name: string;
  description: string;
  hasExerciseSlots: boolean;
  exercise_slots: ExerciseSlot[];
};

type Props = {
  params: {
    id: string;
  };
};

export default function JoinProgramPage({ params }: Props) {
  const router = useRouter();
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [joinStep, setJoinStep] = useState<string>('Checking enrollment status...');

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Step 1: Check if already joined
        setJoinStep('Checking enrollment status...');
        let hasJoined = false;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(`/api/workout/programs/join?programId=${params.id}`, {
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            if (data.hasJoined) {
              hasJoined = true;
              if (!cancelled) {
                setAlreadyJoined(true);
                setSubscriptionId(data.subscription?.id || null);
                setLoading(false);
              }
              return;
            }
          }
        } catch (err) {
          console.error('Enrollment check failed, proceeding:', err);
        }

        if (cancelled || hasJoined) return;

        // Step 2: Fetch the program
        setJoinStep('Loading program...');
        const res = await fetch(`/api/workout/programs/${params.id}`);
        if (!res.ok) {
          if (!cancelled) setError(res.status === 404 ? 'Program not found' : 'Failed to load program');
          return;
        }
        const found = await res.json();
        if (!found || !found.id) {
          if (!cancelled) setError('Program not found');
          return;
        }

        if (cancelled) return;

        // Step 3: If program has exercise slots, show wizard
        if (found.hasExerciseSlots && found.exercise_slots?.length) {
          if (!cancelled) setProgram(found);
          return;
        }

        // Step 4: No customization needed - join directly
        setJoinStep('Joining program...');
        const joinRes = await fetch('/api/workout/programs/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ programId: found.id }),
        });

        if (cancelled) return;

        if (joinRes.ok) {
          const data = await joinRes.json();
          alert(data.message || 'Successfully joined program!');
          router.push('/workout-log?tab=today');
        } else {
          const errorData = await joinRes.json();
          setError(errorData.error || 'Failed to join program');
        }
      } catch (err) {
        console.error('Join flow error:', err);
        if (!cancelled) setError('Something went wrong. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [params.id, router]);

  const activateAndGoToToday = async () => {
    if (!subscriptionId) {
      router.push('/workout-log?tab=today');
      return;
    }

    setActivating(true);
    try {
      const res = await fetch(`/api/workout/sessions/${subscriptionId}/set-active`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        console.error('Failed to activate subscription');
      }
    } catch (err) {
      console.error('Failed to activate subscription:', err);
    } finally {
      router.push('/workout-log?tab=today');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center p-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">{joinStep}</p>
          <Link href={`/workout-log/programs/${params.id}`}>
            <Button variant="ghost" size="sm" className="text-gray-400">Cancel</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (alreadyJoined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Enrolled</h2>
          <p className="text-gray-600 mb-6">
            You are already enrolled in this program. Check your Today tab to see your workouts.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={activateAndGoToToday} disabled={activating}>
              {activating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Activating...
                </>
              ) : (
                'Go to Today'
              )}
            </Button>
            <Link href={`/workout-log/programs/${params.id}`}>
              <Button variant="outline">View Program Details</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/workout-log?tab=programs">
            <Button variant="outline">Back to Programs</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Program not found</h2>
          <Link href="/workout-log?tab=programs">
            <Button variant="outline">Back to Programs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ExerciseSelectionWizard
        programId={program.id}
        programName={program.name}
        slots={program.exercise_slots}
      />
    </div>
  );
}
