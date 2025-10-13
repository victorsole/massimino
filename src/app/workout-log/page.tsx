// src/app/workout-log/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SessionHistoryTable, WorkoutCalendar, CommentsPanel } from '@/components/workout-log/WorkoutLogTable';
import { startOfMonth, endOfMonth, format, subMonths, addMonths } from 'date-fns';
import { Plus, Calendar, Dumbbell, Clock, Weight, MessageCircle, Edit, Trash2, Search, Info, Target, Zap, ChevronLeft, ChevronRight, Sparkles, Trophy } from 'lucide-react';
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

type WorkoutEntry = {
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

export default function WorkoutLogPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as ('CLIENT'|'TRAINER'|'ADMIN'|undefined);
  const isTrainerOrAdmin = userRole === 'TRAINER' || userRole === 'ADMIN';
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [exercises, setExercises] = useState<ExerciseListItem[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseListItem[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseListItem | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);
  const [fetchingEntries, setFetchingEntries] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [coaching_cues, set_coaching_cues] = useState<string[]>([]);
  const [recommendations, set_recommendations] = useState<any>(null);
  const [celebrating_achievements, set_celebrating_achievements] = useState<any[]>([]);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
    category: '',
    difficulty: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    duration: '',
    isPublic: false
  });
  const [newEntry, setNewEntry] = useState({
    exercise: '',
    exerciseId: '',
    exerciseBId: '',
    exerciseBName: '',
    sets: '',
    reps: '',
    weight: '',
    weightB: '',
    setType: 'STRAIGHT',
    // Pyramid helpers
    pyramidDirection: 'ASC' as 'ASC' | 'DESC',
    pyramidReps: '', // e.g., "15,12,10,8"
    pyramidBase: '', // base weight in kg
    pyramidStep: '', // step per set in kg
    intensity: '',
    tempo: '',
    restSeconds: '',
    userComment: ''
  });
  const [rememberPyramidSettings, setRememberPyramidSettings] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    reps: '',
    weight: '',
    intensity: '',
    tempo: '',
    restSeconds: '',
    userComments: ''
  });

  // Session management state
  const [activeSession, setActiveSession] = useState<{
    id: string;
    startTime: Date;
    assessmentId?: string;
  } | null>(null);
  const [showSessionCreationModal, setShowSessionCreationModal] = useState(false);
  const [sessionAssessmentId, setSessionAssessmentId] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [availableAssessments, setAvailableAssessments] = useState<any[]>([]);
  // Trainer: create session for client
  const [showCreateForClient, setShowCreateForClient] = useState(false);
  const [clients, setClients] = useState<Array<{id:string; name:string; email?:string}>>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Advanced tracking fields
  const [actualRPE, setActualRPE] = useState<number>(5);
  const [formQuality, setFormQuality] = useState<number>(3);
  const [restDuration, setRestDuration] = useState<number>(90);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'entries' | 'sessions' | 'calendar'>('entries');
  const [, setSessions] = useState<any[]>([]);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [monthSessions, setMonthSessions] = useState<any[]>([]);

  // Fetch exercises and workout entries on component mount
  useEffect(() => {
    fetchExercises();
    fetchWorkoutEntries();
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

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

  // Load active session
  useEffect(() => {
    async function loadActiveSession() {
      try {
        const response = await fetch('/api/workout/sessions?status=active');
        const data = await response.json();

        if (data.activeSession) {
          setActiveSession({
            id: data.activeSession.id,
            startTime: new Date(data.activeSession.startTime),
            assessmentId: data.activeSession.assessmentId
          });
        }
      } catch (error) {
        console.error('Failed to load active session:', error);
      }
    }

    loadActiveSession();
  }, []);

  // Load available assessments
  useEffect(() => {
    async function loadAssessments() {
      try {
        const response = await fetch('/api/assessments');
        const data = await response.json();
        setAvailableAssessments(data.assessments || []);
      } catch (error) {
        console.error('Failed to load assessments:', error);
      }
    }

    loadAssessments();
  }, []);

  // Load sessions for calendar month
  useEffect(() => {
    if (activeTab === 'calendar') {
      loadMonthSessions();
    }
  }, [activeTab, calendarMonth]);

  async function loadMonthSessions() {
    const start_of_month = startOfMonth(calendarMonth);
    const end_of_month = endOfMonth(calendarMonth);

    try {
      const response = await fetch(
        `/api/workout/sessions?start=${start_of_month.toISOString()}&end=${end_of_month.toISOString()}`
      );
      const data = await response.json();
      setMonthSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load month sessions:', error);
    }
  }

  // Load coaching cues when exercise is selected
  useEffect(() => {
    if (newEntry.exerciseId) {
      load_coaching_cues();
    }
  }, [newEntry.exerciseId]);

  async function load_coaching_cues() {
    try {
      const response = await fetch(
        `/api/workout/coaching-cues?exercise_id=${newEntry.exerciseId}`
      );
      const data = await response.json();
      set_coaching_cues(data.coaching_cues || []);
    } catch (error) {
      console.error('Failed to load coaching cues:', error);
    }
  }

  // Load recommendations on mount
  useEffect(() => {
    load_recommendations();
  }, []);

  // Load saved pyramid settings (if opted-in)
  useEffect(() => {
    try {
      const remember = localStorage.getItem('massimino_pyramid_remember') === '1';
      setRememberPyramidSettings(remember);
      if (remember) {
        const raw = localStorage.getItem('massimino_pyramid_settings');
        if (raw) {
          const saved = JSON.parse(raw);
          setNewEntry((prev) => ({
            ...prev,
            pyramidDirection: saved.pyramidDirection || prev.pyramidDirection,
            pyramidStep: saved.pyramidStep || prev.pyramidStep
          }));
        }
      }
    } catch {}
  }, []);

  const persistPyramidSettings = (direction?: 'ASC'|'DESC', step?: string) => {
    try {
      if (!rememberPyramidSettings) return;
      const current = {
        pyramidDirection: direction ?? newEntry.pyramidDirection,
        pyramidStep: step ?? newEntry.pyramidStep
      };
      localStorage.setItem('massimino_pyramid_settings', JSON.stringify(current));
    } catch {}
  };

  const getRecommendedPyramidStep = (): string => {
    // Heuristics: compound -> 5kg, isolation -> 2.5kg, bodyweight -> 0, default 2.5
    const ex = selectedExercise;
    if (!ex) return '2.5';
    const name = ex.name.toLowerCase();
    const cat = (ex.category || '').toLowerCase();
    const equip = (ex.equipment || []).map(e => e.toLowerCase());
    const bodyweight = equip.includes('bodyweight') || name.includes('bodyweight');
    if (bodyweight) return '0';
    const compoundLike = ['compound', 'barbell', 'kettlebell'].some(k => cat.includes(k) || equip.includes(k));
    if (compoundLike) return '5';
    const dumbbellIsolation = equip.includes('dumbbell') || cat.includes('isolation');
    if (dumbbellIsolation) return '2.5';
    return '2.5';
  };

  async function load_recommendations() {
    try {
      const response = await fetch('/api/workout/recommendations');
      const data = await response.json();
      set_recommendations(data.recommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  }

  // Load trainer clients when opening modal
  useEffect(() => {
    if (showCreateForClient && isTrainerOrAdmin) {
      (async () => {
        try {
          const res = await fetch('/api/workout/sessions?action=clients');
          const data = await res.json();
          setClients(data.clients || []);
        } catch (e) {
          console.error('Failed to load clients', e);
        }
      })();
    }
  }, [showCreateForClient, isTrainerOrAdmin]);

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

  const fetchWorkoutEntries = async () => {
    try {
      setFetchingEntries(true);
      setError(null);
      const response = await fetch('/api/workout/entries');

      if (response.ok) {
        const data = await response.json();
        // Map the API response to our component's expected format
        const entries: WorkoutEntry[] = (data.entries || []).map((entry: any) => ({
          id: entry.id,
          date: entry.date,
          exerciseId: entry.exerciseId,
          setNumber: entry.setNumber,
          setType: entry.setType,
          reps: entry.reps,
          weight: entry.weight,
          unit: entry.unit,
          intensity: entry.intensity,
          tempo: entry.tempo,
          restSeconds: entry.restSeconds,
          coachFeedback: entry.coachFeedback,
          userComments: entry.userComments,
          exercise: {
            id: entry.exercises?.id || entry.exerciseId,
            name: entry.exercises?.name || 'Unknown Exercise',
            category: entry.exercises?.category || 'General',
            muscleGroups: entry.exercises?.muscleGroups || [],
            equipment: entry.exercises?.equipment || [],
            difficulty: entry.exercises?.difficulty
          }
        }));
        setWorkoutEntries(entries);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch workout entries');
        console.error('Error fetching workout entries:', errorData);
      }
    } catch (error) {
      console.error('Error fetching workout entries:', error);
      setError('Failed to load workout entries. Please try again.');
    } finally {
      setFetchingEntries(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/workout/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleExerciseSelect = (exercise: ExerciseListItem) => {
    setSelectedExercise(exercise);
    setNewEntry({
      ...newEntry,
      exercise: exercise.name,
      exerciseId: exercise.id,
      // Reset to default straight set when changing exercise
      setType: 'STRAIGHT',
      sets: '1'
    });
    setExerciseSearch('');
  };

  // Helper: parse comma-separated weight string into array of numbers
  const parseWeights = (s: string): number[] => (s || '')
    .split(',')
    .map(w => w.trim())
    .filter(Boolean)
    .map(w => parseFloat(w))
    .filter((n) => !isNaN(n) && n > 0);

  const generatePyramidWeights = (setsNum: number): number[] => {
    const base = parseFloat(newEntry.pyramidBase || '');
    const step = parseFloat(newEntry.pyramidStep || '');
    if (!base || isNaN(base) || !step || isNaN(step)) return [];
    const arr: number[] = [];
    for (let i = 0; i < setsNum; i++) {
      const delta = step * i;
      arr.push(newEntry.pyramidDirection === 'ASC' ? base + delta : Math.max(base - delta, 0));
    }
    return arr.map((n) => Math.round(n * 10) / 10).filter((n) => n > 0);
  };

  const parseRepsScheme = (s: string, setsNum: number): number[] => {
    const vals = (s || '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
      .map(v => parseInt(v, 10))
      .filter(n => !isNaN(n) && n > 0);
    if (vals.length === 0) return Array(setsNum).fill(parseInt(newEntry.reps || '0', 10) || 0);
    const out: number[] = [];
    for (let i = 0; i < setsNum; i++) out.push(vals[Math.min(i, vals.length - 1)] ?? 0);
    return out;
  };

  // Compute how many entries will be created with current form state
  const computePlannedEntriesCount = (): number => {
    const setsNum = parseInt(newEntry.sets || '1', 10) || 1;
    if (newEntry.setType === 'SUPERSET') {
      return setsNum * 2;
    }
    if (newEntry.setType === 'DROP_SET') {
      const drops = Math.max(parseWeights(newEntry.weight).length, 0);
      return drops > 0 ? drops * setsNum : setsNum;
    }
    // PYRAMID and default
    return setsNum;
  };

  // Session creation handler
  const handleCreateSession = async () => {
    try {
      // Build date and time strings expected by API
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const response = await fetch('/api/workout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sessionTitle || undefined,
          notes: undefined,
          date,
          startTime,
          assessmentId: sessionAssessmentId || undefined
        })
      });

      const data = await response.json();

      if (data.session) {
        setActiveSession({
          id: data.session.id,
          startTime: new Date(data.session.startTime),
          assessmentId: data.session.assessmentId
        });
        setShowSessionCreationModal(false);
        setSessionTitle('');
        alert('Workout session started!');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to start workout session');
    }
  };

  // Session completion handler
  const handleCompleteSession = async () => {
    if (!activeSession) return;

    try {
      const response = await fetch('/api/workout/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          endTime: new Date().toISOString(),
          isComplete: true
        })
      });

      const data = await response.json();

      if (data.session) {
        // If achievements were earned, show celebration
        if (data.gamification?.achievements_earned?.length > 0) {
          // Load achievement details
          try {
            const achievement_response = await fetch(
              `/api/achievements?ids=${data.gamification.achievements_earned.join(',')}`
            );
            const achievement_data = await achievement_response.json();
            set_celebrating_achievements(achievement_data.achievements || []);
          } catch (err) {
            console.error('Failed to load achievement details:', err);
          }
        }

        // Show XP alert
        const xpTotal = data.gamification?.experience_points?.total || 0;
        alert(`Session complete! Earned ${xpTotal} XP`);

        setActiveSession(null);
        fetchWorkoutEntries();
      }
    } catch (error) {
      console.error('Failed to complete session:', error);
      alert('Failed to complete workout session');
    }
  };

  const handleAddEntry = async () => {
    if (!selectedExercise || !newEntry.sets || !newEntry.reps) {
      return;
    }

    try {
      setLoading(true);

      // Create workout entries for all sets
      // Extract numeric value from weight input (e.g., "135 lbs" -> "135")
      const setsNum = parseInt(newEntry.sets || '1', 10) || 1;
      const repsNum = parseInt(newEntry.reps || '0', 10) || 0;
      const weightsA = parseWeights(newEntry.weight);
      const today = new Date().toISOString().split('T')[0];

      const entries: any[] = [];

      if (newEntry.setType === 'SUPERSET') {
        if (!newEntry.exerciseBId) {
          alert('Please select the second exercise for a Superset');
          setLoading(false);
          return;
        }
        const weightsB = parseWeights(newEntry.weightB);
        if (weightsA.length === 0 || weightsB.length === 0) {
          alert('Please enter weights for both exercises (kg)');
          setLoading(false);
          return;
        }
        for (let i = 0; i < setsNum; i++) {
          const wA = String(weightsA[Math.min(i, weightsA.length - 1)]);
          const wB = String(weightsB[Math.min(i, weightsB.length - 1)]);
          entries.push({
            date: today,
            exerciseId: newEntry.exerciseId,
            setNumber: i + 1,
            setType: newEntry.setType as any,
            reps: repsNum,
            weight: wA,
            unit: 'KG' as any,
            sessionId: activeSession?.id,
            subOrder: 'A',
            actualRPE: actualRPE || undefined,
            formQuality: formQuality || undefined,
            restSeconds: restDuration || (newEntry.restSeconds ? parseInt(newEntry.restSeconds) : undefined),
            intensity: newEntry.intensity || undefined,
            tempo: newEntry.tempo || undefined,
            userComments: newEntry.userComment || undefined
          });
          entries.push({
            date: today,
            exerciseId: newEntry.exerciseBId,
            setNumber: i + 1,
            setType: newEntry.setType as any,
            reps: repsNum,
            weight: wB,
            unit: 'KG' as any,
            sessionId: activeSession?.id,
            subOrder: 'B',
            actualRPE: actualRPE || undefined,
            formQuality: formQuality || undefined,
            restSeconds: restDuration || (newEntry.restSeconds ? parseInt(newEntry.restSeconds) : undefined),
            intensity: newEntry.intensity || undefined,
            tempo: newEntry.tempo || undefined,
            userComments: newEntry.userComment || undefined
          });
        }
      } else if (newEntry.setType === 'DROP_SET') {
        // Drop set: use comma weights to create multiple drops per set as A, B, C...
        if (weightsA.length < 2) {
          alert('Please enter at least two weights for a Drop Set (e.g., 60,50)');
          setLoading(false);
          return;
        }
        for (let i = 0; i < setsNum; i++) {
          for (let j = 0; j < weightsA.length; j++) {
            const w = String(weightsA[j]);
            const sub = String.fromCharCode('A'.charCodeAt(0) + j);
            entries.push({
              date: today,
              exerciseId: newEntry.exerciseId,
              setNumber: i + 1,
              setType: newEntry.setType as any,
              reps: repsNum,
              weight: w,
              unit: 'KG' as any,
              sessionId: activeSession?.id,
              subOrder: sub,
              actualRPE: actualRPE || undefined,
              formQuality: formQuality || undefined,
              restSeconds: restDuration || (newEntry.restSeconds ? parseInt(newEntry.restSeconds) : undefined),
              intensity: newEntry.intensity || undefined,
              tempo: newEntry.tempo || undefined,
              userComments: newEntry.userComment || undefined
            });
          }
        }
      } else if (newEntry.setType === 'PYRAMID') {
        // Pyramid: map per-set weights from comma list (fallback to nearest value)
        if (setsNum < 2) {
          alert('Pyramid requires at least 2 sets.');
          setLoading(false);
          return;
        }
        // Choose weights: either provided list or generated from base/step
        let weightsUse = weightsA;
        if (weightsUse.length < setsNum) {
          const gen = generatePyramidWeights(setsNum);
          if (gen.length >= 2) weightsUse = gen;
        }
        if (weightsUse.length < 2) {
          alert('For Pyramid, enter multiple weights (e.g., 40,45,50) or specify Base and Step.');
          setLoading(false);
          return;
        }
        const repsScheme = parseRepsScheme(newEntry.pyramidReps, setsNum);
        for (let i = 0; i < setsNum; i++) {
          const w = String(weightsUse[Math.min(i, weightsUse.length - 1)]);
          entries.push({
            date: today,
            exerciseId: newEntry.exerciseId,
            setNumber: i + 1,
            setType: newEntry.setType as any,
            reps: repsScheme[i] || repsNum,
            weight: w,
            unit: 'KG' as any,
            sessionId: activeSession?.id,
            subOrder: 'A',
            actualRPE: actualRPE || undefined,
            formQuality: formQuality || undefined,
            restSeconds: restDuration || (newEntry.restSeconds ? parseInt(newEntry.restSeconds) : undefined),
            intensity: newEntry.intensity || undefined,
            tempo: newEntry.tempo || undefined,
            userComments: newEntry.userComment || undefined
          });
        }
      } else {
        // Default: one entry per set
        if (weightsA.length === 0) {
          alert('Please enter a valid weight in kg (e.g., 60)');
          setLoading(false);
          return;
        }
        for (let i = 0; i < setsNum; i++) {
          const w = String(weightsA[Math.min(i, weightsA.length - 1)]);
          entries.push({
            date: today,
            exerciseId: newEntry.exerciseId,
            setNumber: i + 1,
            setType: newEntry.setType as any,
            reps: repsNum,
            weight: w,
            unit: 'KG' as any,
            sessionId: activeSession?.id,
            subOrder: 'A',
            actualRPE: actualRPE || undefined,
            formQuality: formQuality || undefined,
            restSeconds: restDuration || (newEntry.restSeconds ? parseInt(newEntry.restSeconds) : undefined),
            intensity: newEntry.intensity || undefined,
            tempo: newEntry.tempo || undefined,
            userComments: newEntry.userComment || undefined
          });
        }
      }

      const response = await fetch('/api/workout/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries })
      });

      if (response.ok) {
        // Refresh the workout entries list
        await fetchWorkoutEntries();

        // Reset form
        setIsAddingEntry(false);
        setSelectedExercise(null);
        setNewEntry((prev) => ({
          ...prev,
          exercise: '',
          exerciseId: '',
          exerciseBId: '',
          exerciseBName: '',
          sets: '',
          reps: '',
          weight: '',
          weightB: '',
          setType: 'STRAIGHT',
          pyramidDirection: 'ASC',
          pyramidReps: '',
          pyramidBase: '',
          pyramidStep: '',
          intensity: '',
          tempo: '',
          restSeconds: '',
          userComment: ''
        }));
      } else {
        let msg = 'Unknown error';
        try {
          const errorData = await response.json();
          msg = errorData.error || errorData.message || msg;
          if (!msg && Array.isArray(errorData.errors) && errorData.errors.length) {
            msg = errorData.errors[0].error || msg;
          }
        } catch {}
        alert(`Error adding workout entry: ${msg}`);
      }
    } catch (error) {
      console.error('Error adding workout entry:', error);
      alert('Failed to add workout entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = async (entryId: string) => {
    try {
      setLoading(true);

      const updateData: any = {};

      if (editFormData.reps) updateData.reps = parseInt(editFormData.reps);
      if (editFormData.weight) {
        // Extract numeric value from weight input
        const weightValue = editFormData.weight.replace(/[^\d.,]/g, '');
        updateData.weight = weightValue;
      }
      if (editFormData.intensity) updateData.intensity = editFormData.intensity;
      if (editFormData.tempo) updateData.tempo = editFormData.tempo;
      if (editFormData.restSeconds) updateData.restSeconds = parseInt(editFormData.restSeconds);
      if (editFormData.userComments) updateData.userComments = editFormData.userComments;

      const response = await fetch(`/api/workout/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchWorkoutEntries();
        setEditingEntry(null);
        setEditFormData({
          reps: '',
          weight: '',
          intensity: '',
          tempo: '',
          restSeconds: '',
          userComments: ''
        });
      } else {
        const errorData = await response.json();
        alert(`Error updating entry: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Failed to update entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this workout entry?')) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/workout/entries/${entryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchWorkoutEntries();
      } else {
        const errorData = await response.json();
        alert(`Error deleting entry: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (entry: WorkoutEntry) => {
    setEditingEntry(entry.id);
    setEditFormData({
      reps: entry.reps.toString(),
      weight: entry.weight,
      intensity: entry.intensity || '',
      tempo: entry.tempo || '',
      restSeconds: entry.restSeconds?.toString() || '',
      userComments: entry.userComments || ''
    });
  };

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const handleSaveAsTemplate = async () => {
    if (selectedEntries.size === 0) {
      alert('Please select at least one workout entry');
      return;
    }

    if (!templateFormData.name) {
      alert('Please enter a template name');
      return;
    }

    try {
      setLoading(true);

      // Get selected entries
      const selected = workoutEntries.filter(e => selectedEntries.has(e.id));

      // Group entries by exercise to determine sets
      const exerciseGroups = new Map<string, WorkoutEntry[]>();
      selected.forEach(entry => {
        const key = entry.exerciseId;
        if (!exerciseGroups.has(key)) {
          exerciseGroups.set(key, []);
        }
        exerciseGroups.get(key)!.push(entry);
      });

      // Convert to template exercise format
      const exercises = Array.from(exerciseGroups.entries()).map(([exerciseId, entries], index) => {
        // Use the first entry as reference for common data
        const firstEntry = entries[0];

        // Guard against empty entries array
        if (!firstEntry) {
          throw new Error('No entries found for exercise group. Please select valid workout entries.');
        }

        return {
          exerciseId,
          order: index + 1,
          sets: entries.length,
          reps: firstEntry.reps.toString(),
          weight: firstEntry.weight,
          restTime: firstEntry.restSeconds?.toString(),
          notes: firstEntry.userComments,
          isSuperset: false
        };
      });

      // Create template
      const templateData = {
        name: templateFormData.name,
        description: templateFormData.description || undefined,
        category: templateFormData.category || undefined,
        difficulty: templateFormData.difficulty,
        duration: templateFormData.duration || undefined,
        isPublic: templateFormData.isPublic,
        exercises
      };

      const response = await fetch('/api/workout/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        alert('Template saved successfully!');
        setShowSaveTemplateModal(false);
        setSelectedEntries(new Set());
        setTemplateFormData({
          name: '',
          description: '',
          category: '',
          difficulty: 'BEGINNER',
          duration: '',
          isPublic: false
        });
      } else {
        const errorData = await response.json();
        alert(`Error saving template: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <div className="flex space-x-2">
            {selectedEntries.size > 0 && (
              <Button onClick={() => setShowSaveTemplateModal(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Save as Template ({selectedEntries.size})
              </Button>
            )}
            {!activeSession && (
              <Button onClick={() => setShowSessionCreationModal(true)} variant="outline" className="bg-green-50 border-green-500 text-green-700 hover:bg-green-100">
                <Zap className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            )}
            {isTrainerOrAdmin && !activeSession ? (
              <Button disabled title="Start a session first" onClick={() => {}}>
                <Plus className="h-4 w-4 mr-2" />
                Add Workout Entry
              </Button>
            ) : (
              <Button onClick={() => setIsAddingEntry(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Workout Entry
              </Button>
            )}
            {isTrainerOrAdmin && (
              <Button variant="outline" onClick={() => setShowCreateForClient(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Create Session for Client
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('entries')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'entries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Dumbbell className="inline h-4 w-4 mr-2" />
              Workout Entries
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="inline h-4 w-4 mr-2" />
              Session History
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'calendar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="inline h-4 w-4 mr-2" />
              Calendar View
            </button>
          </nav>
        </div>

        {/* Active Session Banner */}
        {activeSession && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-4 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 animate-pulse" />
                <div>
                  <h3 className="font-semibold text-lg">Active Workout Session</h3>
                  <p className="text-sm text-green-50">
                    Started {new Date(activeSession.startTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleCompleteSession}
                className="bg-white text-green-600 hover:bg-green-50 font-semibold"
              >
                Complete Session
              </Button>
            </div>
          </div>
        )}

        {/* Workout Recommendations Panel */}
        {recommendations && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Your Personalised Recommendations
              </CardTitle>
              <CardDescription>
                Based on your {recommendations.fitness_level.toLowerCase()} fitness level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Recommended Volume
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {recommendations.recommended_volume} sets
                  </p>
                  <p className="text-xs text-gray-500">per session</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Training Frequency
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {recommendations.recommended_frequency}x
                  </p>
                  <p className="text-xs text-gray-500">per week</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Training Phase
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {recommendations.training_phase}
                  </p>
                  <p className="text-xs text-gray-500">training focus</p>
                </div>
              </div>

              {recommendations.coaching_cues?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="text-sm font-semibold mb-2">Focus Areas:</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.coaching_cues.map((cue: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {cue}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Conditional rendering based on active tab */}
        {activeTab === 'entries' && (
          <>
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

                  {/* Coaching Cues */}
                  {coaching_cues.length > 0 && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Exercise Tips
                      </h4>
                      <ul className="space-y-1">
                        {coaching_cues.map((cue, index) => (
                          <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            {cue}
                          </li>
                        ))}
                      </ul>
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
                    Weight (kg)
                  </label>
                  <Input
                    value={newEntry.weight}
                    onChange={(e) => setNewEntry({...newEntry, weight: e.target.value})}
                    placeholder="e.g. 60"
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
                      <SelectItem value="STRAIGHT">Straight</SelectItem>
                      <SelectItem value="SUPERSET">Superset</SelectItem>
                      <SelectItem value="PYRAMID">Pyramid</SelectItem>
                      <SelectItem value="DROP_SET">Drop Set</SelectItem>
                      <SelectItem value="REST_PAUSE">Rest Pause</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Contextual help for special set types */}
                {newEntry.setType === 'SUPERSET' && (
                  <div className="md:col-span-2 lg:col-span-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Superset:</strong> Perform two different exercises back‑to‑back with minimal rest to increase intensity and efficiency.
                    </p>
                  </div>
                )}
                {newEntry.setType === 'PYRAMID' && (
                  <div className="md:col-span-2 lg:col-span-3 bg-purple-50 border border-purple-200 rounded-md p-3">
                    <p className="text-sm text-purple-800">
                      <strong>Pyramid:</strong> Progressively increase (or decrease) weight across sets. Example ascending: 15 → 12 → 10 → 8 reps with heavier weight.
                    </p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-purple-900 mb-1">Direction</label>
                        <select
                          value={newEntry.pyramidDirection}
                          onChange={(e) => { const val = e.target.value as any; setNewEntry({ ...newEntry, pyramidDirection: val }); persistPyramidSettings(val, undefined); }}
                          className="w-full border rounded-md p-2 text-sm"
                        >
                          <option value="ASC">Ascending (heavier)</option>
                          <option value="DESC">Descending (lighter)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-purple-900 mb-1">Reps Scheme (optional)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newEntry.pyramidReps}
                            onChange={(e) => setNewEntry({ ...newEntry, pyramidReps: e.target.value })}
                            placeholder="e.g. 15,12,10,8"
                            className="flex-1 border rounded-md p-2 text-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setNewEntry({ ...newEntry, pyramidReps: '15,12,10,8', sets: '4' });
                            }}
                          >15-12-10-8</Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setNewEntry({ ...newEntry, pyramidReps: '12,10,8', sets: '3' });
                            }}
                          >12-10-8</Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setNewEntry({ ...newEntry, pyramidReps: '6,8,10,12', sets: '4', pyramidDirection: 'DESC' });
                            }}
                          >6-8-10-12</Button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-purple-900 mb-1">Weights Auto‑fill</label>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            placeholder="Base (kg)"
                            value={newEntry.pyramidBase}
                            onChange={(e) => setNewEntry({ ...newEntry, pyramidBase: e.target.value })}
                            className="border rounded-md p-2 text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Step (kg)"
                            value={newEntry.pyramidStep}
                            onChange={(e) => { setNewEntry({ ...newEntry, pyramidStep: e.target.value }); persistPyramidSettings(undefined, e.target.value); }}
                            className="border rounded-md p-2 text-sm"
                          />
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" className="text-xs" onClick={() => setNewEntry({ ...newEntry, pyramidStep: '2.5' })}>+2.5</Button>
                            <Button type="button" variant="outline" className="text-xs" onClick={() => setNewEntry({ ...newEntry, pyramidStep: '5' })}>+5</Button>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 items-center">
                          <div className="text-xs text-purple-900">Preset Step</div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                const step = getRecommendedPyramidStep();
                                setNewEntry({ ...newEntry, pyramidStep: step });
                                persistPyramidSettings(undefined, step);
                              }}
                            >Recommended ({getRecommendedPyramidStep()} kg)</Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="text-xs"
                              onClick={() => { setNewEntry({ ...newEntry, pyramidStep: '10' }); persistPyramidSettings(undefined, '10'); }}
                            >+10</Button>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            className="text-xs"
                            onClick={() => {
                              const setsNum = parseInt(newEntry.sets || '1', 10) || 1;
                              const gen = generatePyramidWeights(setsNum);
                              if (gen.length >= 2) {
                                setNewEntry({ ...newEntry, weight: gen.join(',') });
                              }
                            }}
                          >Apply to Weights</Button>
                          <span className="text-xs text-purple-800 self-center">Weights field will be filled automatically</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            id="remember-pyramid"
                            type="checkbox"
                            className="h-4 w-4"
                            checked={rememberPyramidSettings}
                            onChange={(e) => {
                              const on = e.target.checked;
                              setRememberPyramidSettings(on);
                              try { localStorage.setItem('massimino_pyramid_remember', on ? '1' : '0'); } catch {}
                              if (on) persistPyramidSettings();
                            }}
                          />
                          <label htmlFor="remember-pyramid" className="text-xs text-purple-900">Remember these Pyramid settings</label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {newEntry.setType === 'DROP_SET' && (
                  <div className="md:col-span-2 lg:col-span-3 bg-amber-50 border border-amber-200 rounded-md p-3">
                    <p className="text-sm text-amber-800">
                      <strong>Drop Set:</strong> Train close to failure, reduce the weight, and continue immediately. Enter weights as a comma list (e.g., 60,50,45).
                    </p>
                  </div>
                )}

                {/* Superset: Exercise B and Weight B */}
                {newEntry.setType === 'SUPERSET' && (
                  <>
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Superset Exercise (B)</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search exercises..."
                          value={exerciseSearch}
                          onChange={(e) => setExerciseSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {exerciseSearch && (
                        <div className="mt-2 max-h-60 overflow-y-auto border rounded-md bg-white shadow-lg z-10">
                          {loading ? (
                            <div className="p-4 text-center text-gray-500">Loading exercises...</div>
                          ) : filteredExercises.length > 0 ? (
                            filteredExercises.map((exercise) => (
                              <div
                                key={exercise.id}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                onClick={() => {
                                  setNewEntry({ ...newEntry, exerciseBId: exercise.id, exerciseBName: exercise.name });
                                  setExerciseSearch('');
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-900">{exercise.name}</div>
                                    <div className="text-sm text-gray-500">{exercise.category}</div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">No exercises found</div>
                          )}
                        </div>
                      )}
                      {newEntry.exerciseBName && (
                        <div className="mt-2 text-sm text-gray-700">Selected: <span className="font-medium">{newEntry.exerciseBName}</span></div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) – Exercise B</label>
                      <Input
                        value={newEntry.weightB}
                        onChange={(e) => setNewEntry({ ...newEntry, weightB: e.target.value })}
                        placeholder="e.g. 40"
                      />
                    </div>
                  </>
                )}

                {/* Creation count hint */}
                <div className="md:col-span-2 lg:col-span-3 text-sm text-gray-600">
                  Will create <span className="font-semibold">{computePlannedEntriesCount()}</span> entry{computePlannedEntriesCount() === 1 ? '' : 'ies'}
                </div>

                {/* Preview entries */}
                {(() => {
                  const setsNum = parseInt(newEntry.sets || '1', 10) || 1;
                  const repsNum = parseInt(newEntry.reps || '0', 10) || 0;
                  let weightsA = parseWeights(newEntry.weight);
                  if (newEntry.setType === 'PYRAMID' && weightsA.length < setsNum) {
                    const gen = generatePyramidWeights(setsNum);
                    if (gen.length >= 2) weightsA = gen;
                  }
                  const weightsB = parseWeights(newEntry.weightB);
                  const preview: Array<{exercise: string; set: number; sub: string; reps: number; weight: string}> = [];
                  if (newEntry.setType === 'SUPERSET' && newEntry.exercise && newEntry.exerciseBName) {
                    for (let i = 0; i < setsNum; i++) {
                      const wA = String(weightsA[Math.min(i, Math.max(weightsA.length - 1, 0))] || '');
                      const wB = String(weightsB[Math.min(i, Math.max(weightsB.length - 1, 0))] || '');
                      preview.push({ exercise: newEntry.exercise, set: i + 1, sub: 'A', reps: repsNum, weight: wA });
                      preview.push({ exercise: newEntry.exerciseBName, set: i + 1, sub: 'B', reps: repsNum, weight: wB });
                    }
                  } else if (newEntry.setType === 'DROP_SET') {
                    for (let i = 0; i < setsNum; i++) {
                      for (let j = 0; j < Math.max(weightsA.length, 0); j++) {
                        const sub = String.fromCharCode('A'.charCodeAt(0) + j);
                        preview.push({ exercise: newEntry.exercise || 'Exercise', set: i + 1, sub, reps: repsNum, weight: String(weightsA[j] || '') });
                      }
                    }
                  } else if (newEntry.setType === 'PYRAMID') {
                    const repsScheme = parseRepsScheme(newEntry.pyramidReps, setsNum);
                    for (let i = 0; i < setsNum; i++) {
                      const w = String(weightsA[Math.min(i, Math.max(weightsA.length - 1, 0))] || '');
                      preview.push({ exercise: newEntry.exercise || 'Exercise', set: i + 1, sub: 'A', reps: repsScheme[i] || repsNum, weight: w });
                    }
                  } else if (newEntry.exercise) {
                    for (let i = 0; i < setsNum; i++) {
                      const w = String(weightsA[Math.min(i, Math.max(weightsA.length - 1, 0))] || '');
                      preview.push({ exercise: newEntry.exercise, set: i + 1, sub: 'A', reps: repsNum, weight: w });
                    }
                  }
                  return preview.length > 0 ? (
                    <div className="md:col-span-2 lg:col-span-3">
                      <div className="mt-2 border rounded-md overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">Preview</div>
                        <div className="max-h-48 overflow-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-600 border-b">
                                <th className="px-3 py-2">Exercise</th>
                                <th className="px-3 py-2">Set</th>
                                <th className="px-3 py-2">Sub</th>
                                <th className="px-3 py-2">Reps</th>
                                <th className="px-3 py-2">Weight (kg)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {preview.map((p, idx) => (
                                <tr key={idx} className="border-b last:border-0">
                                  <td className="px-3 py-2">{p.exercise}</td>
                                  <td className="px-3 py-2">{p.set}</td>
                                  <td className="px-3 py-2">{p.sub}</td>
                                  <td className="px-3 py-2">{p.reps}</td>
                                  <td className="px-3 py-2">{p.weight}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

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

                {/* Advanced Tracking Fields */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RPE (Rate of Perceived Exertion) 1-10
                    <span className="text-gray-500 ml-2 font-normal text-xs">Optional</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={actualRPE}
                    onChange={(e) => setActualRPE(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Very Easy (1)</span>
                    <span className="font-semibold text-gray-900">{actualRPE}</span>
                    <span>Maximum Effort (10)</span>
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Form Quality (1-5)
                    <span className="text-gray-500 ml-2 font-normal text-xs">Optional</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFormQuality(rating)}
                        className={`flex-1 py-2 px-3 rounded-md border-2 transition-all ${
                          formQuality === rating
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    1 = Poor form, 5 = Perfect technique
                  </p>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rest Duration (seconds)
                    <span className="text-gray-500 ml-2 font-normal text-xs">Optional</span>
                  </label>
                  <select
                    value={restDuration}
                    onChange={(e) => setRestDuration(parseInt(e.target.value))}
                    className="w-full border rounded-md p-2"
                  >
                    <option value={30}>30s - Active recovery</option>
                    <option value={60}>60s - Endurance/hypertrophy</option>
                    <option value={90}>90s - Moderate rest</option>
                    <option value={120}>120s - Strength training</option>
                    <option value={180}>180s - Power/heavy lifting</option>
                    <option value={240}>240s - Maximum strength</option>
                  </select>
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

        {fetchingEntries && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      <div className="h-5 w-32 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-16 w-full bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && !fetchingEntries && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6">
              <p className="text-red-800 text-center">{error}</p>
              <div className="text-center mt-4">
                <Button onClick={fetchWorkoutEntries} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!fetchingEntries && !error && workoutEntries.length > 0 && (
          <div className="space-y-6">
            {workoutEntries.map((entry: WorkoutEntry) => (
              <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.id)}
                      onChange={() => toggleEntrySelection(entry.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      title="Select for template"
                    />
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                    <Badge variant="outline">{entry.setType}</Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(entry)}
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 mr-2" />
                    {entry.exercise.name}
                    {entry.personalRecord && (
                      <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 border-yellow-600">
                        <Trophy className="h-3 w-3 mr-1" />
                        PR!
                      </Badge>
                    )}
                  </div>
                  {entry.exercise && (
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {entry.exercise.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {entry.exercise.difficulty}
                      </Badge>
                    </div>
                  )}
                </CardTitle>

                {/* Exercise Details */}
                {entry.exercise && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      <span>{entry.exercise.muscleGroups.slice(0, 2).join(', ')}</span>
                    </div>
                    <div className="flex items-center">
                      <Dumbbell className="h-4 w-4 mr-1" />
                      <span>{entry.exercise.equipment.join(', ')}</span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {editingEntry === entry.id && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-4">Edit Entry</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reps
                        </label>
                        <Input
                          type="number"
                          value={editFormData.reps}
                          onChange={(e) => setEditFormData({...editFormData, reps: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight
                        </label>
                        <Input
                          value={editFormData.weight}
                          onChange={(e) => setEditFormData({...editFormData, weight: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Intensity
                        </label>
                        <Input
                          value={editFormData.intensity}
                          onChange={(e) => setEditFormData({...editFormData, intensity: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tempo
                        </label>
                        <Input
                          value={editFormData.tempo}
                          onChange={(e) => setEditFormData({...editFormData, tempo: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rest (seconds)
                        </label>
                        <Input
                          type="number"
                          value={editFormData.restSeconds}
                          onChange={(e) => setEditFormData({...editFormData, restSeconds: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Personal Notes
                        </label>
                        <Textarea
                          value={editFormData.userComments}
                          onChange={(e) => setEditFormData({...editFormData, userComments: e.target.value})}
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingEntry(null)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditEntry(entry.id)}
                        disabled={loading}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center text-sm">
                    <Weight className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium">Weight:</span>
                    <span className="ml-1">{entry.weight}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium">Set #:</span>
                    <span className="ml-1">{entry.setNumber}</span>
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


                {/* Comments */}
                <div className="space-y-4">
                  {entry.coachFeedback && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <MessageCircle className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Coach Feedback</span>
                      </div>
                      <p className="text-sm text-blue-700">{entry.coachFeedback}</p>
                    </div>
                  )}

                  {entry.userComments && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <MessageCircle className="h-4 w-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">Your Notes</span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.userComments}</p>
                    </div>
                  )}

                  {/* Comments Section */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Comments
                    </h4>
                    <CommentsPanel
                      commentable_type="ENTRY"
                      commentable_id={entry.id}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        {!fetchingEntries && !error && workoutEntries.length === 0 && (
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
          </>
        )}

        {activeTab === 'sessions' && (
          <SessionHistoryTable />
        )}

        {activeTab === 'calendar' && (
          <div>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h2 className="text-xl font-semibold">
                {format(calendarMonth, 'MMMM yyyy')}
              </h2>

              <Button
                variant="outline"
                onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar grid */}
            <WorkoutCalendar
              month={calendarMonth}
              sessions={monthSessions}
            />
          </div>
        )}
      </div>

      {/* Save as Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Save as Workout Template</CardTitle>
              <CardDescription>
                Create a reusable template from your selected workout entries ({selectedEntries.size} selected)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <Input
                    value={templateFormData.name}
                    onChange={(e) => setTemplateFormData({...templateFormData, name: e.target.value})}
                    placeholder="e.g., Upper Body Strength A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={templateFormData.description}
                    onChange={(e) => setTemplateFormData({...templateFormData, description: e.target.value})}
                    placeholder="Describe this workout template..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <Input
                      value={templateFormData.category}
                      onChange={(e) => setTemplateFormData({...templateFormData, category: e.target.value})}
                      placeholder="e.g., Strength, Hypertrophy"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <Select
                      value={templateFormData.difficulty}
                      onValueChange={(value: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') =>
                        setTemplateFormData({...templateFormData, difficulty: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <Input
                      type="number"
                      value={templateFormData.duration}
                      onChange={(e) => setTemplateFormData({...templateFormData, duration: e.target.value})}
                      placeholder="60"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={templateFormData.isPublic}
                      onChange={(e) => setTemplateFormData({...templateFormData, isPublic: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                      Make template public
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Exercises</h4>
                  <div className="space-y-2">
                    {Array.from(selectedEntries).map(entryId => {
                      const entry = workoutEntries.find(e => e.id === entryId);
                      return entry ? (
                        <div key={entryId} className="text-sm text-blue-700">
                          • {entry.exercise.name} - {entry.setNumber} sets
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveTemplateModal(false);
                    setTemplateFormData({
                      name: '',
                      description: '',
                      category: '',
                      difficulty: 'BEGINNER',
                      duration: '',
                      isPublic: false
                    });
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveAsTemplate} disabled={loading || !templateFormData.name}>
                  {loading ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session Creation Modal */}
      {showSessionCreationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Start New Workout Session</CardTitle>
              <CardDescription>
                Begin logging your workout. Optionally link to an assessment for personalised recommendations.
              </CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Session Title (Optional)
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Push Day – Chest/Triceps"
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Link to Assessment (Optional)
                </label>
                <select
                  value={sessionAssessmentId}
                  onChange={(e) => setSessionAssessmentId(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">No assessment</option>
                  {availableAssessments.map(assessment => (
                    <option key={assessment.id} value={assessment.id}>
                      {new Date(assessment.createdAt).toLocaleDateString()} - {assessment.primaryGoal}
                    </option>
                  ))}
                </select>
              </div>

              {sessionAssessmentId && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <Info className="inline h-4 w-4 mr-1" />
                    This workout will be optimised based on your assessment results
                  </p>
                </div>
              )}
            </CardContent>
            <div className="flex gap-2 p-6 pt-0">
              <Button
                variant="outline"
                onClick={() => setShowSessionCreationModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Zap className="mr-2 h-4 w-4" />
                Start Session
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Achievement Celebration Modal */}
      {celebrating_achievements.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="max-w-md w-full">
            {celebrating_achievements.map((achievement, index) => (
              <div
                key={achievement.id}
                className="mb-4 animate-bounceIn"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <Card className="border-4 border-yellow-400 shadow-2xl">
                  <CardHeader className="text-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    <div className="text-6xl mb-2">🏆</div>
                    <CardTitle className="text-2xl">Achievement Unlocked!</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pt-6">
                    <h3 className="text-xl font-bold mb-2">{achievement.name}</h3>
                    <p className="text-gray-600 mb-4">{achievement.description}</p>
                    <Badge
                      variant="secondary"
                      className="text-lg px-4 py-2"
                      style={{ backgroundColor: achievement.iconColour }}
                    >
                      {achievement.tier}
                    </Badge>
                    <p className="mt-4 text-sm text-gray-500">
                      +{achievement.experiencePoints} XP
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}

            <Button
              onClick={() => set_celebrating_achievements([])}
              className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3"
              size="lg"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Trainer/Admin: Create Session for Client Modal */}
      {showCreateForClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Create Session for Client</CardTitle>
              <CardDescription>Select a client and optional title to start a session on their behalf.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Client</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name || c.email || c.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Session Title (Optional)</label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Upper Body Strength"
                  className="w-full border rounded-md p-2"
                />
              </div>
            </CardContent>
            <div className="flex gap-2 p-6 pt-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForClient(false);
                  setSelectedClientId('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedClientId) return;
                  try {
                    const now = new Date();
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
                    const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
                    const res = await fetch('/api/workout/sessions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: selectedClientId, title: sessionTitle || undefined, date, startTime })
                    });
                    const data = await res.json();
                    if (data.session) {
                      alert('Client session started');
                      setShowCreateForClient(false);
                      setSelectedClientId('');
                      setSessionTitle('');
                    } else {
                      alert(data.error || 'Failed to create client session');
                    }
                  } catch (e) {
                    console.error(e);
                    alert('Failed to create client session');
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!selectedClientId}
              >
                Create Session
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
