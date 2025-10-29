'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AssignProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  athleteId: string;
  athleteName: string;
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
  duration: number;
  category: string | null;
}

export function AssignProgramModal({
  isOpen,
  onClose,
  onSuccess,
  athleteId,
  athleteName,
}: AssignProgramModalProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchPrograms();
    }
  }, [isOpen]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workout/programs/templates');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProgram = async () => {
    if (!selectedProgramId) {
      alert('Please select a program');
      return;
    }

    try {
      setAssigning(true);
      const response = await fetch('/api/coaching/assign-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId,
          programId: selectedProgramId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Program assigned successfully');
        setSelectedProgramId('');
        onSuccess?.();
        onClose();
      } else {
        alert(data.error || 'Failed to assign program');
      }
    } catch (error) {
      console.error('Error assigning program:', error);
      alert('Failed to assign program');
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assign Program to {athleteName}</CardTitle>
              <CardDescription>Select a program template to assign</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No program templates available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((program) => (
                <div
                  key={program.id}
                  onClick={() => setSelectedProgramId(program.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedProgramId === program.id
                      ? 'border-brand-primary bg-blue-50'
                      : 'border-gray-200 hover:border-brand-primary hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{program.name}</h3>
                      {program.description && (
                        <p className="text-sm text-gray-600 mt-1">{program.description}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {program.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {program.duration} weeks
                        </Badge>
                        {program.category && (
                          <Badge variant="outline" className="text-xs">
                            {program.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedProgramId === program.id && (
                      <div className="ml-4">
                        <div className="h-6 w-6 rounded-full bg-brand-primary flex items-center justify-center">
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <div className="flex gap-2 p-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              setSelectedProgramId('');
            }}
            className="flex-1"
            disabled={assigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignProgram}
            className="flex-1 bg-brand-primary hover:bg-brand-primary-dark"
            disabled={!selectedProgramId || assigning}
          >
            {assigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Assigning...
              </>
            ) : (
              'Assign Program'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
