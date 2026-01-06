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
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    const init = async () => {
      await checkJoinStatus();
    };
    init();
  }, [params.id]);

  const checkJoinStatus = async () => {
    try {
      const res = await fetch(`/api/workout/programs/join?programId=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        // API returns hasJoined field
        if (data.hasJoined) {
          setAlreadyJoined(true);
          setSubscriptionId(data.subscription?.id || null);
          setCheckingStatus(false);
          return; // Don't fetch program if already joined
        }
      }
      // Only fetch program if not already joined
      await fetchProgram();
    } catch (err) {
      console.error('Failed to check join status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const fetchProgram = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workout/programs/templates');
      if (res.ok) {
        const data = await res.json();
        // API returns { templates: [...], total: ... }
        const programs = Array.isArray(data) ? data : (data.templates || []);
        const found = programs.find((p: ProgramData) => p.id === params.id);

        if (!found) {
          setError('Program not found');
          return;
        }

        if (!found.hasExerciseSlots || found.exercise_slots.length === 0) {
          // No customization needed - join directly
          await joinProgramDirectly(found.id);
          return;
        }

        setProgram(found);
      } else {
        setError('Failed to load program');
      }
    } catch (err) {
      console.error('Failed to fetch program:', err);
      setError('Failed to load program');
    } finally {
      setLoading(false);
    }
  };

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

  const joinProgramDirectly = async (programId: string) => {
    try {
      const res = await fetch('/api/workout/programs/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Successfully joined program!');
        router.push('/workout-log?tab=today');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to join program');
      }
    } catch (err) {
      console.error('Failed to join program:', err);
      setError('Failed to join program');
    }
  };

  if (checkingStatus || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
