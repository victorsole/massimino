// src/app/workout-log/page.tsx
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SessionHistoryTable, WorkoutCalendar, CommentsPanel } from '@/components/workout-log/WorkoutLogTable';
import { WorkoutSummaryTable } from '@/components/workout-log/workout_summary_table';
import { WorkoutDetailsModal } from '@/components/workout-log/workout_details_modal';
import { WorkoutCard, type WorkoutEntry as WorkoutCardEntry, type EditFormData } from '@/components/workout-log/workout_card';
// New mobile-optimized components
import { ResponsiveTabNav, type WorkoutTab } from '@/components/workout-log/mobile_tab_nav';
import { WorkoutEntryCardV2 } from '@/components/workout-log/workout_entry_card_v2';
import { AddEntryModal, type AddEntryData, type ExerciseOption } from '@/components/workout-log/add_entry_modal';
import { RestTimerOverlay } from '@/components/workout-log/rest_timer_overlay';
import { WorkoutEmptyState } from '@/components/workout-log/workout_empty_state';
import { FloatingActionButton } from '@/components/workout-log/floating_action_button';
import { SessionStatusBar, SessionTimerBadge } from '@/components/workout-log/session_status_bar';
import { startOfMonth, endOfMonth, format, subMonths, addMonths } from 'date-fns';
import { Plus, Calendar, Dumbbell, Clock, Weight, MessageCircle, Edit, Trash2, Search, Info, Target, Zap, ChevronLeft, ChevronRight, ChevronDown, Sparkles, Trophy, ListChecks, LineChart, Users, LayoutGrid, TableIcon, Moon, Play, Eye, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RestTimerBar } from '@/components/workout-log/rest_timer_bar';
import { BodyMetricsTab } from '@/components/workout-log/body_metrics_tab';
import { ProgressTab } from '@/components/workout-log/progress_tab';
import { HabitsTab } from '@/components/workout-log/habits_tab';
import { ProgramsTab } from '@/components/workout-log/programs_tab';
import { FormGuideModal } from '@/components/workout-log/form_guide_modal';
import { MyPrograms } from '@/components/programs/my_programs';
import { UserProgram } from '@/types/program';
import { AthleteGallery } from '@/components/periodization/athlete_gallery';
// Use a relaxed exercise type matching what the UI actually uses
type ExerciseListItem = {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty?: string;
  instructions?: string;
  imageUrl?: string; // For exercise thumbnail/media
  videoUrl?: string; // For exercise video
  _userExerciseId?: string; // present if this originated from My Library custom (no baseExerciseId)
};

type WorkoutEntry = {
  id: string;
  date: string | Date;
  exerciseId: string;
  sessionId?: string;
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
    imageUrl?: string;
    videoUrl?: string;
  };
};

function WorkoutLogPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const userRole = session?.user?.role as ('CLIENT'|'TRAINER'|'ADMIN'|undefined);
  const isTrainerOrAdmin = userRole === 'TRAINER' || userRole === 'ADMIN';
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [exercises, setExercises] = useState<ExerciseListItem[]>([]);
  const [curatedExerciseCount, setCuratedExerciseCount] = useState<number>(0);
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
  const [linkMyExercise, setLinkMyExercise] = useState<{ id: string; name: string } | null>(null);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkResults, setLinkResults] = useState<ExerciseListItem[]>([]);
  const [showExerciseExample, setShowExerciseExample] = useState(false);
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
  const [sessionCompletedToday, setSessionCompletedToday] = useState(false); // Hide today's entries after session ends
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

  // Tab navigation (using WorkoutTab type for consistency)
  const [activeTab, setActiveTab] = useState<WorkoutTab>('today');
  const [, setSessions] = useState<any[]>([]);

  // Read tab from URL query parameter - watch the actual tab value, not the searchParams object
  const urlTabParam = searchParams.get('tab');
  useEffect(() => {
    const validTabs: WorkoutTab[] = ['today', 'my-programs', 'programs', 'athletes', 'history', 'metrics', 'progress', 'habits'];
    if (urlTabParam && validTabs.includes(urlTabParam as WorkoutTab)) {
      setActiveTab(urlTabParam as WorkoutTab);
    }
  }, [urlTabParam]);

  // New mobile UI state
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [showRestTimerOverlay, setShowRestTimerOverlay] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [totalSetsCount, setTotalSetsCount] = useState(3);
  const [lastLoggedEntry, setLastLoggedEntry] = useState<{ weight: number; reps: number } | null>(null);

  // Form guide modal state
  const [showFormGuideModal, setShowFormGuideModal] = useState(false);

  // My Programs state
  const [myProgramsData, setMyProgramsData] = useState<UserProgram[]>([]);
  const [loadingMyPrograms, setLoadingMyPrograms] = useState(false);

  // Recommendations collapsed state (collapsed by default on mobile)
  const [recommendationsExpanded, setRecommendationsExpanded] = useState(false);

  // Recent exercises collapsed state (collapsed by default)
  const [recentExercisesExpanded, setRecentExercisesExpanded] = useState(false);

  // Session history collapsed state (expanded by default)
  const [sessionHistoryExpanded, setSessionHistoryExpanded] = useState(true);

  // Dismissed today's workout (hides the card for that day)
  const [dismissedTodayWorkout, setDismissedTodayWorkout] = useState(false);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [monthSessions, setMonthSessions] = useState<any[]>([]);

  // Rest timer state
  const [restVisible, setRestVisible] = useState(false);
  const [restRemaining, setRestRemaining] = useState<number>(0);
  useEffect(() => {
    if (!restVisible || restRemaining <= 0) return;
    const id = setInterval(() => setRestRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [restVisible, restRemaining]);

  // View mode state (cards or table)
  const [view_mode, set_view_mode] = useState<'cards' | 'table'>('cards');
  const [workout_details_modal, set_workout_details_modal] = useState<{
    is_open: boolean;
    date: string;
    entries: WorkoutEntry[];
  }>({
    is_open: false,
    date: '',
    entries: []
  });

  // Load view preference from localStorage
  useEffect(() => {
    try {
      const saved_view = localStorage.getItem('massimino_workout_view_mode');
      if (saved_view === 'cards' || saved_view === 'table') {
        set_view_mode(saved_view);
      }
    } catch (error) {
      console.error('Failed to load view preference:', error);
    }
  }, []);

  // Save view preference to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('massimino_workout_view_mode', view_mode);
    } catch (error) {
      console.error('Failed to save view preference:', error);
    }
  }, [view_mode]);

  // Program subscription + prefill state
  const [programSubscriptions, setProgramSubscriptions] = useState<any[]>([]);
  const [showPrefillModal, setShowPrefillModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [plannedExercises, setPlannedExercises] = useState<Array<{ id: string; name: string; sets: number; reps: string }>>([]);

  // UI improvements state
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [exerciseMedia, setExerciseMedia] = useState<any[]>([]);
  const [recentExercises, setRecentExercises] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch exercises and workout entries on component mount
  useEffect(() => {
    fetchExercises();
    fetchWorkoutEntries();
    if (activeTab === 'history') {
      fetchSessions();
    }
    if (activeTab === 'today') {
      // Load active subscriptions for prefill
      (async () => {
        try {
          console.log('[Today Tab] Loading program subscriptions...');
          const r = await fetch('/api/workout/programs?subscriptions=true');
          if (r.ok) {
            const subs = await r.json();
            console.log('[Today Tab] Loaded subscriptions:', subs?.length || 0, 'subscriptions');
            console.log('[Today Tab] Subscription data:', JSON.stringify(subs?.[0]?.program_templates?.name || 'No program', null, 2));
            setProgramSubscriptions(Array.isArray(subs) ? subs : []);
          } else {
            console.error('[Today Tab] Failed to load subscriptions:', r.status);
          }
        } catch (e) {
          console.error('[Today Tab] Error loading subscriptions:', e);
        }
      })();
    }
    if (activeTab === 'my-programs') {
      // Load user's program subscriptions
      (async () => {
        setLoadingMyPrograms(true);
        try {
          const r = await fetch('/api/workout/programs?subscriptions=true');
          if (r.ok) {
            const rawSubs = await r.json();
            // Transform raw Prisma data to UserProgram format
            const transformed: UserProgram[] = (Array.isArray(rawSubs) ? rawSubs : [])
              .filter((sub: any) => sub && sub.program_templates)
              .map((sub: any) => {
                const template = sub.program_templates;
                // FIXED: Use templateData (correct field name per schema), not programData
                const templateData = template.templateData || {};

                // Extract duration_weeks from various sources
                const getDurationWeeks = (): number => {
                  // 1. From templateData metadata
                  if (templateData.metadata?.duration_weeks) return templateData.metadata.duration_weeks;
                  // 2. From program_structure
                  if (templateData.program_structure?.duration_weeks) return templateData.program_structure.duration_weeks;
                  // 3. Parse from template.duration string (e.g., "12 Weeks", "8 weeks")
                  if (template.duration) {
                    const match = template.duration.match(/(\d+)\s*week/i);
                    if (match) return parseInt(match[1]);
                  }
                  // 4. Count program phases as weeks fallback
                  if (template.program_phases?.length) return template.program_phases.length;
                  // 5. For programs with day_X structure, estimate weeks from days
                  const dayKeys = Object.keys(templateData).filter(k => k.startsWith('day_'));
                  if (dayKeys.length > 0 && templateData.program_structure?.cycle_length) {
                    // Assume indefinite/ongoing program - show 12 weeks as default
                    return 12;
                  }
                  return 0;
                };

                // Extract frequency (training days per week)
                const getFrequencyPerWeek = (): number => {
                  // 1. From templateData metadata
                  if (templateData.metadata?.frequency_per_week) return templateData.metadata.frequency_per_week;
                  // 2. From program_structure.training_days
                  if (templateData.program_structure?.training_days) return templateData.program_structure.training_days;
                  // 3. Count non-rest days in weekly_schedule
                  if (templateData.weekly_schedule?.length) {
                    return templateData.weekly_schedule.filter((d: any) =>
                      d.focus?.toLowerCase() !== 'rest' && d.muscle_groups?.length > 0
                    ).length;
                  }
                  // 4. Count day_X keys in templateData
                  const dayKeys = Object.keys(templateData).filter(k => k.startsWith('day_'));
                  if (dayKeys.length > 0) {
                    // Count non-rest days
                    let trainingDays = 0;
                    for (const key of dayKeys) {
                      const day = templateData[key];
                      if (day && !key.toLowerCase().includes('rest') && day.sections?.length > 0) {
                        trainingDays++;
                      }
                    }
                    return trainingDays || dayKeys.length;
                  }
                  return 0;
                };

                const durationWeeks = getDurationWeeks();
                const frequencyPerWeek = getFrequencyPerWeek();
                const totalWorkouts = templateData.metadata?.total_workouts || (durationWeeks * frequencyPerWeek) || 0;

                return {
                  subscription: {
                    id: sub.id,
                    user_id: sub.userId,
                    program_id: sub.programId,
                    started_at: sub.startedAt || sub.createdAt,
                    current_week: sub.currentWeek || 1,
                    current_day: sub.currentDay || 1,
                    progress_percentage: sub.progressPercentage || 0,
                    is_active: sub.isActive,
                    completed_workouts: sub.completedWorkouts || 0,
                    total_workouts: totalWorkouts,
                  },
                  program: {
                    metadata: {
                      program_name: template.name || templateData.metadata?.program_name || templateData.template_name || 'Unknown Program',
                      program_id: template.id || sub.programId,
                      author: templateData.metadata?.author || templateData.athlete_info?.name || 'Massimino',
                      version: templateData.metadata?.version || '1.0',
                      creation_date: template.createdAt,
                      last_updated: template.updatedAt,
                      description: template.description || templateData.metadata?.description || '',
                      goal: templateData.metadata?.goal || template.category || '',
                      methodology: templateData.metadata?.methodology || templateData.program_structure?.split_type || '',
                      target_audience: templateData.metadata?.target_audience || '',
                      level: templateData.metadata?.level || template.difficulty || 'Intermediate',
                      settings: templateData.metadata?.settings || [],
                      duration_weeks: durationWeeks,
                      total_workouts: totalWorkouts,
                      frequency_per_week: frequencyPerWeek,
                      session_duration_minutes: templateData.metadata?.session_duration_minutes || { min: 45, max: 60 },
                      equipment: templateData.metadata?.equipment || { required: [] },
                      tags: templateData.metadata?.tags || [],
                    },
                    program_philosophy: templateData.program_philosophy || {
                      origin: templateData.athlete_info?.name ? `${templateData.athlete_info.name}'s training methodology` : '',
                      core_principles: templateData.training_principles ? Object.values(templateData.training_principles) : [],
                      training_approach: templateData.athlete_info?.training_philosophy || '',
                      differentiator: ''
                    },
                    prerequisites: templateData.prerequisites || { required: [] },
                    red_flags_to_stop: templateData.red_flags_to_stop || [],
                    goals: templateData.goals || { primary_goal: '', outcome_goals: [], what_program_can_do: [], what_program_cannot_do: [] },
                    workout_sessions: templateData.workout_sessions || templateData.weekly_schedule || [],
                    progression_strategy: templateData.progression_strategy || { primary_method: '', when_to_progress: '', how_to_progress: [] },
                    progress_tracking: templateData.progress_tracking || { tracking_metrics: [], check_in_frequency: '', success_criteria: '' },
                    implementation_for_massimino: templateData.implementation_for_massimino || { usage: '', customization_points: [] },
                    sport_demands: templateData.sport_demands,
                  },
                  next_workout: null, // Could be computed from program phases
                };
              });
            console.log('Raw subs from API:', rawSubs);
            console.log('Transformed programs:', transformed);
            setMyProgramsData(transformed);
          }
        } catch (err) {
          console.error('Failed to load my programs:', err);
        } finally {
          setLoadingMyPrograms(false);
        }
      })();
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
            startTime: data.activeSession.startTime ? new Date(data.activeSession.startTime) : new Date(),
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
    if (activeTab === 'history') {
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
      load_exercise_media();
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

  async function load_exercise_media() {
    try {
      const response = await fetch(
        `/api/workout/exercises/${newEntry.exerciseId}/media`
      );
      if (response.ok) {
        const data = await response.json();
        setExerciseMedia(Array.isArray(data) ? data : []);
      } else {
        setExerciseMedia([]);
      }
    } catch (error) {
      console.error('Failed to load exercise media:', error);
      setExerciseMedia([]);
    }
  }

  // Load recommendations on mount
  useEffect(() => {
    load_recommendations();
  }, []);

  // Update recent exercises when workout entries change
  useEffect(() => {
    if (workoutEntries.length > 0) {
      // Get unique exercises from today's entries
      const uniqueExercises = new Map<string, { id: string; name: string }>();
      for (const entry of workoutEntries) {
        if (entry.exercise && entry.exerciseId) {
          uniqueExercises.set(entry.exerciseId, {
            id: entry.exerciseId,
            name: entry.exercise.name
          });
        }
      }
      setRecentExercises(Array.from(uniqueExercises.values()).slice(0, 5));
    }
  }, [workoutEntries]);

  // Group workout entries by exercise and date for card view
  // This allows showing 1 card per exercise with all sets inside
  // On "Today" tab, only show today's entries (unless session was completed)
  const groupedWorkoutEntries = useMemo(() => {
    // If session was completed today on "Today" tab, show empty (workout is done)
    if (activeTab === 'today' && sessionCompletedToday) {
      return [];
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const groups = new Map<string, WorkoutEntry[]>();

    for (const entry of workoutEntries) {
      // Create key from exerciseId + date (YYYY-MM-DD format)
      const dateStr = entry.date instanceof Date
        ? entry.date.toISOString().split('T')[0]
        : typeof entry.date === 'string'
          ? entry.date.split('T')[0]
          : '';

      // On "Today" tab, only include entries from today
      if (activeTab === 'today' && dateStr !== today) {
        continue;
      }

      const key = `${entry.exerciseId}_${dateStr}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    }
    // Sort entries within each group by setNumber
    for (const entries of groups.values()) {
      entries.sort((a, b) => a.setNumber - b.setNumber);
    }
    return Array.from(groups.values());
  }, [workoutEntries, activeTab, sessionCompletedToday]);

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

  // Helper: Parse exercises from templateData for a given day
  const getExercisesFromTemplateData = (templateData: any, dayNumber: number): any[] => {
    if (!templateData) return [];

    // Format 1: day_X_name structure (CBum and similar programs)
    const dayKey = Object.keys(templateData).find(k => {
      const match = k.match(/^day_(\d+)_/);
      return match && parseInt(match[1]) === dayNumber;
    });

    if (dayKey && templateData[dayKey]) {
      const dayData = templateData[dayKey];
      const exercises: any[] = [];

      // Parse sections and exercises
      if (dayData.sections && Array.isArray(dayData.sections)) {
        for (const section of dayData.sections) {
          if (section.exercises && Array.isArray(section.exercises)) {
            for (const ex of section.exercises) {
              exercises.push({
                exerciseName: ex.exercise || ex.exercise_name || ex.name,
                sets: ex.sets,
                repsMin: ex.reps_min || ex.reps,
                repsMax: ex.reps_max || ex.reps,
                rest: ex.rest,
                tempo: ex.tempo,
                notes: ex.notes,
                section: section.section_name || section.name
              });
            }
          }
        }
      }
      return exercises;
    }

    // Format 2: workout_sessions array
    if (templateData.workout_sessions && Array.isArray(templateData.workout_sessions)) {
      const session = templateData.workout_sessions.find((s: any) => s.day === dayNumber || s.day_number === dayNumber);
      if (session) {
        const exercises: any[] = [];
        for (const section of session.sections || []) {
          for (const ex of section.exercises || []) {
            exercises.push({
              exerciseName: ex.exercise_name || ex.name,
              sets: ex.sets,
              repsMin: ex.reps,
              repsMax: ex.reps,
              rest: ex.rest_seconds,
              tempo: ex.tempo,
              notes: ex.notes,
              section: section.section_name
            });
          }
        }
        return exercises;
      }
    }

    // Format 3: weekly_schedule
    if (templateData.weekly_schedule && Array.isArray(templateData.weekly_schedule)) {
      const day = templateData.weekly_schedule.find((d: any) => d.day === dayNumber);
      if (day && day.workout_key) {
        const workoutData = templateData[day.workout_key];
        if (workoutData?.sections) {
          const exercises: any[] = [];
          for (const section of workoutData.sections) {
            for (const ex of section.exercises || []) {
              exercises.push({
                exerciseName: ex.exercise || ex.exercise_name,
                sets: ex.sets,
                repsMin: ex.reps_min || ex.reps,
                repsMax: ex.reps_max || ex.reps,
                rest: ex.rest,
                tempo: ex.tempo,
                notes: ex.notes,
                section: section.section_name
              });
            }
          }
          return exercises;
        }
      }
    }

    return [];
  };

  // Get current workout from active program subscription
  const getCurrentProgramWorkout = () => {
    console.log('[getCurrentProgramWorkout] programSubscriptions count:', programSubscriptions?.length || 0);
    if (!programSubscriptions || programSubscriptions.length === 0) return null;

    // Prioritize the currently active subscription, fall back to first
    const activeSub = programSubscriptions.find((sub: any) => sub.isCurrentlyActive) || programSubscriptions[0];
    const currentWeek = activeSub.currentWeek || 1;
    const currentDay = activeSub.currentDay || 1;
    console.log('[getCurrentProgramWorkout] activeSub:', activeSub?.id, 'Week:', currentWeek, 'Day:', currentDay);

    const program = activeSub.program_templates;
    console.log('[getCurrentProgramWorkout] program:', program?.name, 'phases:', program?.program_phases?.length || 0);
    if (!program || !program.program_phases || program.program_phases.length === 0) {
      console.log('[getCurrentProgramWorkout] No program or phases found');
      return null;
    }

    // Find the phase that contains the current week
    // First, try to find by microcycle weekNumber
    let currentPhase = program.program_phases.find((phase: any) => {
      return phase.microcycles && phase.microcycles.some((micro: any) => micro.weekNumber === currentWeek);
    });

    // Fallback: if no phase found and there's only one phase, use it
    if (!currentPhase && program.program_phases.length === 1) {
      currentPhase = program.program_phases[0];
      console.log('[getCurrentProgramWorkout] Using single phase fallback');
    }

    console.log('[getCurrentProgramWorkout] currentPhase:', currentPhase?.title || currentPhase?.phaseName || 'Not found');

    if (!currentPhase) {
      console.log('[getCurrentProgramWorkout] Phase not found for week', currentWeek);
      return null;
    }

    // Find the microcycle for current week
    const currentMicrocycle = currentPhase.microcycles.find((micro: any) => micro.weekNumber === currentWeek);
    console.log('[getCurrentProgramWorkout] currentMicrocycle:', currentMicrocycle?.weekNumber, 'workouts:', currentMicrocycle?.workouts?.length || 0);

    if (!currentMicrocycle || !currentMicrocycle.workouts) {
      console.log('[getCurrentProgramWorkout] Microcycle not found or no workouts');
      return null;
    }

    // Find the workout for current day
    const currentWorkout = currentMicrocycle.workouts.find((workout: any) => workout.dayNumber === currentDay);
    console.log('[getCurrentProgramWorkout] currentWorkout:', currentWorkout?.dayLabel || 'Not found', 'exercises:', currentWorkout?.workout_exercises?.length || 0);

    if (!currentWorkout) {
      console.log('[getCurrentProgramWorkout] Workout not found for day', currentDay, '- likely a rest day');
      // Return rest day info so UI can show appropriate message
      return {
        subscription: activeSub,
        program,
        phase: currentPhase,
        microcycle: currentMicrocycle,
        workout: null,
        exercises: [],
        templateExercises: [],
        isRestDay: true,
        currentDay,
        // Find next workout day
        nextWorkoutDay: currentMicrocycle.workouts
          .filter((w: any) => w.dayNumber > currentDay)
          .sort((a: any, b: any) => a.dayNumber - b.dayNumber)[0] || currentMicrocycle.workouts[0]
      };
    }

    // Get exercises from templateData (source of truth for exercise names)
    const templateExercises = getExercisesFromTemplateData(program.templateData, currentDay);
    console.log('[getCurrentProgramWorkout] templateExercises:', templateExercises.length, templateExercises.map((e: any) => e.exerciseName));

    return {
      subscription: activeSub,
      program,
      phase: currentPhase,
      microcycle: currentMicrocycle,
      workout: currentWorkout,
      exercises: currentWorkout.workout_exercises || [],
      templateExercises, // Exercises from templateData
      isRestDay: false
    };
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
      const [resGlobal, resMine, resCurated] = await Promise.all([
        fetch('/api/workout/exercises'),
        fetch('/api/workout/my_exercises'),
        fetch('/api/workout/exercises?curated=true')
      ]);
      // Set curated count for the "Browse All" button
      if (resCurated.ok) {
        try {
          const curatedData = await resCurated.json();
          setCuratedExerciseCount(Array.isArray(curatedData) ? curatedData.length : 0);
        } catch {
          setCuratedExerciseCount(0);
        }
      }
      // Global list
      let globalList: ExerciseListItem[] = [];
      if (resGlobal.ok) {
        const text = await resGlobal.text();
        try {
          const data = JSON.parse(text);
          globalList = Array.isArray(data)
            ? data.map((e: any) => ({
                id: String(e.id),
                name: String(e.name || e.title || 'Exercise'),
                category: String(e.category || 'General'),
                muscleGroups: Array.isArray(e.muscleGroups) ? e.muscleGroups.map(String) : [],
                equipment: Array.isArray(e.equipment) ? e.equipment.map(String) : [],
                ...(e.difficulty ? { difficulty: String(e.difficulty) } : {}),
                ...(e.instructions ? { instructions: String(e.instructions) } : {}),
                ...(e.imageUrl ? { imageUrl: String(e.imageUrl) } : {}),
                ...(e.videoUrl ? { videoUrl: String(e.videoUrl) } : {}),
              }))
            : [];
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
        }
      }
      // My Library (forked only)
      let minePreferred: ExerciseListItem[] = [];
      let mineCustom: ExerciseListItem[] = [];
      if (resMine.ok) {
        try {
          const my = await resMine.json();
          const list = Array.isArray(my) ? my : [];
          const forked = list.filter((m: any) => !!m.baseExerciseId);
          const custom = list.filter((m: any) => !m.baseExerciseId);
          minePreferred = forked.map((m: any) => ({
            id: String(m.baseExerciseId),
            name: String(m.name || 'Exercise'),
            category: String(m.category || 'General'),
            muscleGroups: Array.isArray(m.muscleGroups) ? m.muscleGroups.map(String) : [],
            equipment: Array.isArray(m.equipment) ? m.equipment.map(String) : [],
            ...(m.difficulty ? { difficulty: String(m.difficulty) } : {}),
            ...(m.instructions ? { instructions: String(m.instructions) } : {}),
            ...(m.imageUrl ? { imageUrl: String(m.imageUrl) } : {}),
          }));
          mineCustom = custom.map((m: any) => ({
            id: `user:${m.id}`,
            name: String(m.name || 'Exercise'),
            category: String(m.category || 'General'),
            muscleGroups: Array.isArray(m.muscleGroups) ? m.muscleGroups.map(String) : [],
            equipment: Array.isArray(m.equipment) ? m.equipment.map(String) : [],
            ...(m.difficulty ? { difficulty: String(m.difficulty) } : {}),
            ...(m.instructions ? { instructions: String(m.instructions) } : {}),
            ...(m.imageUrl ? { imageUrl: String(m.imageUrl) } : {}),
            _userExerciseId: String(m.id),
          }));
        } catch {}
      }
      // Merge unique by id, prioritize mine
      const seen = new Set<string>();
      const merged: ExerciseListItem[] = [];
      for (const ex of [...minePreferred, ...mineCustom, ...globalList]) {
        if (!seen.has(ex.id)) { seen.add(ex.id); merged.push(ex); }
      }
      const list = merged.length ? merged : globalList;
      if (!list.length) {
        const fallbackExercises: ExerciseListItem[] = [
          { id: 'fallback-1', name: 'Barbell Bench Press', category: 'Compound', muscleGroups: ['chest', 'triceps'], equipment: ['barbell', 'bench'] },
          { id: 'fallback-2', name: 'Squats', category: 'Compound', muscleGroups: ['quadriceps', 'glutes'], equipment: ['barbell'] },
          { id: 'fallback-3', name: 'Deadlift', category: 'Compound', muscleGroups: ['hamstrings', 'glutes', 'back'], equipment: ['barbell'] }
        ];
        setExercises(fallbackExercises);
        setFilteredExercises(fallbackExercises);
      } else {
        setExercises(list);
        setFilteredExercises(list.slice(0, 20));
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
        const entries: WorkoutEntry[] = (data.entries || []).map((entry: any) => {
          // Debug: Log entry exercise data
          console.log('[Entry Exercise Data]', {
            entryId: entry.id,
            exerciseId: entry.exerciseId,
            exerciseName: entry.exercises?.name,
            exerciseCategory: entry.exercises?.category,
            exerciseMuscleGroups: entry.exercises?.muscleGroups,
            exerciseImageUrl: entry.exercises?.imageUrl
          });
          return {
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
              difficulty: entry.exercises?.difficulty,
              imageUrl: entry.exercises?.imageUrl,
              videoUrl: entry.exercises?.videoUrl
            }
          };
        });
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
    if (exercise.id.startsWith('user:') && exercise._userExerciseId) {
      // Prompt user to link this custom exercise to a global one
      setLinkMyExercise({ id: exercise._userExerciseId, name: exercise.name });
      setLinkSearch(exercise.name);
      setLinkResults([]);
      return;
    }
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

  // Prefill helpers
  const openPrefill = async () => {
    try {
      if (!programSubscriptions.length) { alert('No active program'); return; }
      const sub = programSubscriptions[0];
      const pid = sub.programId || sub.program?.id || sub.id;
      if (!pid) { alert('No program id found'); return; }
      const res = await fetch(`/api/workout/programs/${pid}`);
      if (!res.ok) { alert('Failed to load program'); return; }
      const program = await res.json();
      setSelectedProgram(program);
      setShowPrefillModal(true);
    } catch (e) {
      console.error(e);
      alert('Failed to load program');
    }
  };

  const useTemplate = (tpl: any) => {
    const list = (tpl?.workout_template_exercises || []).map((wte: any) => ({
      id: String(wte.exercises?.id || wte.exerciseId),
      name: String(wte.exercises?.name || 'Exercise'),
      sets: Number(wte.sets) || 3,
      reps: String(wte.reps || ''),
    }));
    setPlannedExercises(list);
    setShowPrefillModal(false);
  };

  const loadPlannedIntoForm = (item: { id: string; name: string; sets: number; reps: string }) => {
    const ex = exercises.find((e) => e.id === item.id) || { id: item.id, name: item.name, category: 'General', muscleGroups: [], equipment: [] } as any;
    setSelectedExercise(ex as any);
    // If reps is a single number, prefill; otherwise leave blank for user to follow target range
    const singleRep = /^\d+$/.test(item.reps.trim()) ? item.reps.trim() : '';
    setNewEntry((prev) => ({
      ...prev,
      exercise: ex.name,
      exerciseId: ex.id,
      setType: 'STRAIGHT',
      sets: String(item.sets || '3'),
      reps: singleRep,
    }));
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
          startTime: data.session.startTime ? new Date(data.session.startTime) : new Date(),
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

      // Auto-create session if none exists
      let currentSessionId = activeSession?.id;
      if (!currentSessionId) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const sessionResponse = await fetch('/api/workout/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Quick Workout',
            date,
            startTime,
          })
        });

        const sessionData = await sessionResponse.json();
        if (sessionData.session) {
          currentSessionId = sessionData.session.id;
          setActiveSession({
            id: sessionData.session.id,
            startTime: sessionData.session.startTime ? new Date(sessionData.session.startTime) : new Date(),
            assessmentId: sessionData.session.assessmentId
          });
        }
      }

      // Create workout entries for all sets
      // Extract numeric value from weight input (e.g., "135 lbs" -> "135")
      const setsNum = parseInt(newEntry.sets || '1', 10) || 1;
      const repsNum = parseInt(newEntry.reps || '0', 10) || 0;
      const weightsA = parseWeights(newEntry.weight);
      const today = new Date().toISOString().split('T')[0];

      const entries: any[] = [];

      // Debug: Log what exercise data is being used to create entry
      console.log('[Creating Entry]', {
        selectedExerciseId: selectedExercise?.id,
        selectedExerciseName: selectedExercise?.name,
        newEntryExerciseId: newEntry.exerciseId,
        selectedCategory: selectedExercise?.category,
        selectedMuscleGroups: selectedExercise?.muscleGroups
      });

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
            sessionId: currentSessionId,
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
            sessionId: currentSessionId,
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
              sessionId: currentSessionId,
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
            sessionId: currentSessionId,
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
            sessionId: currentSessionId,
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

        // Start rest timer (use per-exercise or default restDuration)
        const baseRest = restDuration || (newEntry.restSeconds ? parseInt(newEntry.restSeconds) : 90) || 90;
        setRestRemaining(baseRest);
        setRestVisible(true);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workout Log</h1>
            <p className="text-gray-600 mt-2">Track your workouts and see coach feedback</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedEntries.size > 0 && (
              <Button onClick={() => setShowSaveTemplateModal(true)} variant="outline" size="sm" className="text-xs sm:text-sm">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Save as Template</span>
                <span className="sm:hidden">Template</span>
                <span className="ml-1">({selectedEntries.size})</span>
              </Button>
            )}
            {!activeSession && (
              <Button onClick={() => setShowSessionCreationModal(true)} variant="outline" size="sm" className="bg-green-50 border-green-500 text-green-700 hover:bg-green-100 text-xs sm:text-sm">
                <Zap className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Start Session</span>
                <span className="sm:hidden">Session</span>
              </Button>
            )}
            {isTrainerOrAdmin && !activeSession ? (
              <Button disabled title="Start a session first" onClick={() => {}} size="sm" className="text-xs sm:text-sm">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Workout Entry</span>
                <span className="sm:hidden">Add</span>
              </Button>
            ) : (
              <Button onClick={() => setIsAddingEntry(true)} size="sm" className="text-xs sm:text-sm">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Workout Entry</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
            {isTrainerOrAdmin && (
              <Button variant="outline" onClick={() => setShowCreateForClient(true)} size="sm" className="text-xs sm:text-sm">
                <Zap className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Create Session for Athlete</span>
                <span className="sm:hidden">For Athlete</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation - Responsive (mobile-optimized icons, desktop full labels) */}
        <div className="mb-6">
          <ResponsiveTabNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
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
                    Started {activeSession.startTime ? new Date(activeSession.startTime).toLocaleTimeString() : 'recently'}
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

        {/* Workout Recommendations Panel - Collapsible on mobile */}
        {recommendations && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => setRecommendationsExpanded(!recommendationsExpanded)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Your Personalised Recommendations
                </CardTitle>
                <ChevronDown
                  className={`h-5 w-5 text-purple-600 transition-transform duration-200 ${
                    recommendationsExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
              <CardDescription>
                Based on your {recommendations.fitness_level.toLowerCase()} fitness level
                {!recommendationsExpanded && (
                  <span className="ml-2 text-purple-600 font-medium">(tap to expand)</span>
                )}
              </CardDescription>
            </CardHeader>
            {recommendationsExpanded && (
              <CardContent className="pt-0">
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
            )}
          </Card>
        )}

        {/* Conditional rendering based on active tab */}
        {activeTab === 'today' && (
          <>
            {/* Active Program Workout */}
            {(() => {
              const currentWorkout = getCurrentProgramWorkout();
              if (!currentWorkout || dismissedTodayWorkout) return null;

              const { subscription, program, phase, workout, exercises: workoutExercises, templateExercises, isRestDay, nextWorkoutDay } = currentWorkout;
              // Use templateExercises if available (correct exercise names), fallback to workout_exercises
              const displayExercises = templateExercises && templateExercises.length > 0 ? templateExercises : workoutExercises;
              const athleteName = program.legendary_athlete?.name || 'Program';

              // Handle rest day
              if (isRestDay) {
                const skipToNextWorkout = async () => {
                  if (!nextWorkoutDay) return;
                  try {
                    // Update subscription to next workout day
                    const res = await fetch(`/api/workout/programs/subscriptions/${subscription.id}/advance`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ targetDay: nextWorkoutDay.dayNumber }),
                    });
                    if (res.ok) {
                      // Navigate to today tab to load new workout
                      window.location.href = '/workout-log?tab=today';
                    }
                  } catch (err) {
                    console.error('Failed to skip to next workout:', err);
                  }
                };

                return (
                  <Card className="mb-6 border-blue-200 bg-blue-50/50">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Moon className="h-5 w-5 text-blue-500" />
                        Rest Day - {program.name}
                      </CardTitle>
                      <CardDescription>
                        {athleteName} • Week {subscription.currentWeek}, Day {subscription.currentDay}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Today is a scheduled rest day. Take time to recover and prepare for your next workout.
                        </p>
                        {nextWorkoutDay && (
                          <button
                            onClick={skipToNextWorkout}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            <Play className="h-4 w-4" />
                            <span className="font-medium">Next workout:</span>{' '}
                            {nextWorkoutDay.dayLabel || `Day ${nextWorkoutDay.dayNumber}`}
                          </button>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveTab('my-programs')}
                          >
                            View Program
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => setDismissedTodayWorkout(true)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-base">Today's Workout - {program.name}</CardTitle>
                    <CardDescription>
                      {athleteName} • Week {subscription.currentWeek}, Day {subscription.currentDay}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Workout Info */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b">
                        <div>
                          <div className="font-medium text-sm">{workout?.dayLabel || `Day ${workout?.dayNumber}`}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {phase?.title} • {phase?.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2"
                            onClick={() => {
                              if (confirm('Dismiss today\'s workout? You can still access it from My Programs.')) {
                                setDismissedTodayWorkout(true);
                              }
                            }}
                            title="Dismiss today's workout"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              // Auto-populate first exercise when starting workout
                              if (displayExercises.length > 0) {
                                const firstEx = displayExercises[0];
                                const isTemplateFormat = !!firstEx.exerciseName;
                                const exerciseName = isTemplateFormat ? firstEx.exerciseName : (firstEx.exercises?.name || 'Exercise');

                                // Look up exercise by name
                                let foundExercise = isTemplateFormat
                                  ? exercises.find((e: any) => e.name?.toLowerCase() === exerciseName?.toLowerCase())
                                  : firstEx.exercises;

                                if (!foundExercise && isTemplateFormat) {
                                  foundExercise = exercises.find((e: any) =>
                                    e.name?.toLowerCase().includes(exerciseName?.toLowerCase()) ||
                                    exerciseName?.toLowerCase().includes(e.name?.toLowerCase())
                                  );
                                }

                                if (foundExercise) {
                                  setSelectedExercise({
                                    id: foundExercise.id,
                                    name: foundExercise.name,
                                    category: foundExercise.category || 'General',
                                    muscleGroups: foundExercise.muscleGroups || [],
                                    equipment: foundExercise.equipment || [],
                                    imageUrl: foundExercise.imageUrl,
                                    videoUrl: foundExercise.videoUrl
                                  });

                                  setNewEntry({
                                    ...newEntry,
                                    exerciseId: foundExercise.id,
                                    sets: String(firstEx.sets || 3),
                                    reps: String(firstEx.repsMin || firstEx.repsMax || 10),
                                    setType: 'REGULAR'
                                  });
                                } else {
                                  // Use exercise name even if not in database
                                  setSelectedExercise({
                                    id: `template:${exerciseName}`,
                                    name: exerciseName,
                                    category: 'General',
                                    muscleGroups: [],
                                    equipment: []
                                  });
                                }
                              }

                              setIsAddingEntry(true);

                              // Scroll to form
                              setTimeout(() => {
                                document.querySelector('[data-workout-form]')?.scrollIntoView({ behavior: 'smooth' });
                              }, 100);
                            }}
                          >
                            Start Workout
                          </Button>
                        </div>
                      </div>

                      {/* Exercise List */}
                      {displayExercises.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            {displayExercises.length} exercises
                          </div>
                          <div className="space-y-2">
                            {displayExercises.map((ex: any, idx: number) => {
                              // Handle both templateExercises format and workout_exercises format
                              const isTemplateFormat = !!ex.exerciseName;
                              const exerciseName = isTemplateFormat ? ex.exerciseName : (ex.exercises?.name || 'Exercise');
                              const setsDisplay = ex.sets || '-';
                              const repsDisplay = ex.repsMin && ex.repsMax
                                ? (ex.repsMin === ex.repsMax ? ex.repsMin : `${ex.repsMin}-${ex.repsMax}`)
                                : (ex.repsMin || ex.repsMax || '-');

                              return (
                                <div
                                  key={ex.id || idx}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                                  onClick={async () => {
                                    // For templateExercises, look up exercise by name
                                    let foundExercise = isTemplateFormat
                                      ? exercises.find((e: any) => e.name?.toLowerCase() === exerciseName?.toLowerCase())
                                      : ex.exercises;

                                    // If not found in global list, search by name
                                    if (!foundExercise && isTemplateFormat) {
                                      foundExercise = exercises.find((e: any) =>
                                        e.name?.toLowerCase().includes(exerciseName?.toLowerCase()) ||
                                        exerciseName?.toLowerCase().includes(e.name?.toLowerCase())
                                      );
                                    }

                                    console.log('[Program Exercise Click]', {
                                      exerciseName,
                                      isTemplateFormat,
                                      foundExercise: foundExercise?.name || 'Not found'
                                    });

                                    if (foundExercise) {
                                      setSelectedExercise({
                                        id: foundExercise.id,
                                        name: foundExercise.name,
                                        category: foundExercise.category || 'General',
                                        muscleGroups: foundExercise.muscleGroups || [],
                                        equipment: foundExercise.equipment || [],
                                        imageUrl: foundExercise.imageUrl,
                                        videoUrl: foundExercise.videoUrl
                                      });

                                      setNewEntry({
                                        ...newEntry,
                                        exerciseId: foundExercise.id,
                                        sets: String(ex.sets || 3),
                                        reps: String(ex.repsMin || ex.repsMax || 10),
                                        setType: 'REGULAR'
                                      });
                                    } else {
                                      // Use exercise name even if not in database
                                      setSelectedExercise({
                                        id: `template:${exerciseName}`,
                                        name: exerciseName,
                                        category: 'General',
                                        muscleGroups: [],
                                        equipment: []
                                      });

                                      setNewEntry({
                                        ...newEntry,
                                        exerciseId: '',
                                        sets: String(ex.sets || 3),
                                        reps: String(ex.repsMin || ex.repsMax || 10),
                                        setType: 'REGULAR'
                                      });
                                    }

                                    setIsAddingEntry(true);

                                    // Scroll to form
                                    setTimeout(() => {
                                      document.querySelector('[data-workout-form]')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                  }}
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{exerciseName}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {ex.section && <span>{ex.section}</span>}
                                      {ex.notes && <span className="ml-2 text-gray-400">• {ex.notes}</span>}
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-gray-900 ml-4">
                                    {setsDisplay} × {repsDisplay}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {displayExercises.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No exercises scheduled for today
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
            {/* Add New Entry Form */}
            {isAddingEntry && (
              <Card className="mb-8" data-workout-form>
                <CardHeader>
                  <CardTitle>Add New Workout Entry</CardTitle>
              <CardDescription>
                Log your workout details and add personal notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Recent Exercises Chips - Collapsible */}
              {recentExercises.length > 0 && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setRecentExercisesExpanded(!recentExercisesExpanded)}
                    className="flex items-center justify-between w-full text-sm font-medium text-brand-primary mb-2 hover:text-brand-primary-dark transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="mdi mdi-history text-base" />
                      Recent Exercises ({recentExercises.length})
                    </span>
                    <span className={`mdi ${recentExercisesExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'} text-lg transition-transform`} />
                  </button>
                  {recentExercisesExpanded && (
                    <div className="flex gap-2 flex-wrap">
                      {recentExercises.map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => {
                            const exercise = exercises.find(e => e.id === ex.id);
                            if (exercise) {
                              handleExerciseSelect(exercise);
                            }
                          }}
                          className="px-4 py-2 bg-white border-2 border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:border-brand-primary hover:bg-brand-secondary transition-all"
                        >
                          {ex.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1">
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
                      Browse All Exercises ({curatedExerciseCount || exercises.length})
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
                      <div className="flex items-start justify-between gap-3">
                        {/* Exercise Image */}
                        {selectedExercise.imageUrl && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-blue-200">
                            <img
                              src={selectedExercise.imageUrl}
                              alt={selectedExercise.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
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

                  {/* Exercise Media Section - Merged view for demo and community videos */}
                  {selectedExercise && (selectedExercise.imageUrl || exerciseMedia.length > 0) && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex gap-2">
                        {/* Primary Demo Button */}
                        {selectedExercise.imageUrl && (
                          <Button
                            variant="outline"
                            className="flex-1 h-10 bg-white border-blue-300 text-blue-700 hover:bg-blue-100 font-medium"
                            onClick={() => setShowExerciseExample(true)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Demo
                          </Button>
                        )}
                        {/* Community Videos Button */}
                        {exerciseMedia.length > 0 && (
                          <Button
                            variant="outline"
                            className="flex-1 h-10 bg-white border-blue-300 text-blue-700 hover:bg-blue-100 font-medium"
                            onClick={() => setShowFormGuideModal(true)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {exerciseMedia.length} {exerciseMedia.length === 1 ? 'Video' : 'Videos'}
                          </Button>
                        )}
                      </div>
                      {!selectedExercise.imageUrl && exerciseMedia.length === 0 && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          No media available for this exercise
                        </div>
                      )}
                    </div>
                  )}

                  {/* Coaching Cues */}
                  {coaching_cues.length > 0 && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                      <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-2">
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

                {/* Core Fields - Always Visible */}
                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1">
                    Weight (kg)
                  </label>
                  <Input
                    value={newEntry.weight}
                    onChange={(e) => setNewEntry({...newEntry, weight: e.target.value})}
                    placeholder="e.g. 60"
                    className="text-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1">
                    Reps
                  </label>
                  <Input
                    type="number"
                    value={newEntry.reps}
                    onChange={(e) => setNewEntry({...newEntry, reps: e.target.value})}
                    placeholder="8"
                    className="text-lg font-semibold"
                  />
                </div>

                {/* Big Add Button */}
                <Button
                  onClick={handleAddEntry}
                  disabled={!selectedExercise || !newEntry.reps || !newEntry.weight}
                  className="w-full py-6 text-xl font-bold bg-brand-primary hover:bg-brand-primary-dark text-white shadow-lg"
                >
                  LOG SET {newEntry.sets || '1'}/{newEntry.sets || '1'}
                </Button>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-semibold"
                    onClick={() => {
                      // TODO: Implement "Same as Last" logic
                      console.log('Same as last set');
                    }}
                  >
                    Same as Last
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-semibold"
                    onClick={() => {
                      const currentWeight = parseFloat(newEntry.weight || '0');
                      if (currentWeight > 0) {
                        setNewEntry({...newEntry, weight: String(currentWeight + 2.5)});
                      }
                    }}
                  >
                    +2.5kg
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-semibold"
                    onClick={() => {
                      const currentReps = parseInt(newEntry.reps || '0');
                      if (currentReps > 1) {
                        setNewEntry({...newEntry, reps: String(currentReps - 1)});
                      }
                    }}
                  >
                    -1 Rep
                  </Button>
                </div>

                {/* More Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                  className="w-full py-3 text-center text-brand-primary font-semibold rounded-lg hover:bg-brand-secondary transition-all flex items-center justify-center gap-2"
                >
                  <span className="mdi mdi-cog text-lg" />
                  <span>More Options</span>
                  <span className={`mdi ${showAdvancedFields ? 'mdi-chevron-up' : 'mdi-chevron-down'} text-sm`} />
                </button>

                {/* Advanced Fields (Collapsible) */}
                {showAdvancedFields && (
                  <div className="space-y-4 p-4 bg-brand-secondary rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center font-bold text-brand-primary mb-3 flex items-center justify-center gap-2">
                      <span className="mdi mdi-target text-lg" />
                      <span>Acute Variables</span>
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
                        <input
                          type="text"
                          value={newEntry.pyramidReps}
                          onChange={(e) => setNewEntry({ ...newEntry, pyramidReps: e.target.value })}
                          placeholder="e.g. 15,12,10,8"
                          className="w-full border rounded-md p-2 text-sm mb-2"
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="text-xs w-full sm:w-auto"
                            onClick={() => {
                              setNewEntry({ ...newEntry, pyramidReps: '15,12,10,8', sets: '4' });
                            }}
                          >15-12-10-8</Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="text-xs w-full sm:w-auto"
                            onClick={() => {
                              setNewEntry({ ...newEntry, pyramidReps: '12,10,8', sets: '3' });
                            }}
                          >12-10-8</Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="text-xs w-full sm:w-auto"
                            onClick={() => {
                              setNewEntry({ ...newEntry, pyramidReps: '6,8,10,12', sets: '4', pyramidDirection: 'DESC' });
                            }}
                          >6-8-10-12</Button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-purple-900 mb-1">Weights Auto‑fill</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                          <div className="flex gap-2 col-span-2 sm:col-span-1">
                            <Button type="button" variant="outline" className="text-xs flex-1 sm:flex-none" onClick={() => setNewEntry({ ...newEntry, pyramidStep: '2.5' })}>+2.5</Button>
                            <Button type="button" variant="outline" className="text-xs flex-1 sm:flex-none" onClick={() => setNewEntry({ ...newEntry, pyramidStep: '5' })}>+5</Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs text-purple-900 mb-2">Preset Step</div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="text-xs w-full sm:w-auto"
                              onClick={() => {
                                const step = getRecommendedPyramidStep();
                                setNewEntry({ ...newEntry, pyramidStep: step });
                                persistPyramidSettings(undefined, step);
                              }}
                            >Recommended ({getRecommendedPyramidStep()} kg)</Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="text-xs w-full sm:w-auto"
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
                        Tempo (e.g., 3-1-1-0)
                      </label>
                      <Input
                        value={newEntry.tempo}
                        onChange={(e) => setNewEntry({...newEntry, tempo: e.target.value})}
                        placeholder="3-1-1-0"
                      />
                    </div>

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
                        Rest Between Sets (seconds)
                      </label>
                      <Input
                        type="number"
                        value={newEntry.restSeconds}
                        onChange={(e) => setNewEntry({...newEntry, restSeconds: e.target.value})}
                        placeholder="90"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RPE (Rate of Perceived Exertion) 1-10
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
                        <span>Easy (1)</span>
                        <span className="font-semibold text-brand-primary">{actualRPE}</span>
                        <span>Max (10)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Form Quality (1-5)
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setFormQuality(rating)}
                            className={`flex-1 py-2 px-3 rounded-md border-2 transition-all ${
                              formQuality === rating
                                ? 'border-brand-primary bg-brand-primary text-white font-semibold'
                                : 'border-gray-300 hover:border-brand-primary'
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Personal Notes (for your coach)
                      </label>
                      <Textarea
                        value={newEntry.userComment}
                        onChange={(e) => setNewEntry({...newEntry, userComment: e.target.value})}
                        placeholder="How did this exercise feel? Any notes for your coach?"
                        rows={2}
                      />
                    </div>

                    {/* LOG SET Button inside Acute Variables */}
                    <Button
                      onClick={handleAddEntry}
                      disabled={!selectedExercise || !newEntry.reps || !newEntry.weight}
                      className="w-full py-6 text-xl font-bold bg-brand-primary hover:bg-brand-primary-dark text-white shadow-lg mt-4"
                    >
                      LOG SET {newEntry.sets || '1'}/{newEntry.sets || '1'}
                    </Button>
                  </div>
                )}

                {/* Form Bottom Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingEntry(false)}
                    className="text-gray-600"
                  >
                    Cancel
                  </Button>

                  {/* Form Validation Messages */}
                  {!selectedExercise && (
                    <div className="text-sm text-red-600">
                      Please select an exercise
                    </div>
                  )}
                </div>
              </div>
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
          <>
            {/* View Toggle */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={view_mode === 'cards' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => set_view_mode('cards')}
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Cards
                  </Button>
                  <Button
                    variant={view_mode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => set_view_mode('table')}
                  >
                    <TableIcon className="h-4 w-4 mr-2" />
                    Table
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {workoutEntries.length} {workoutEntries.length === 1 ? 'entry' : 'entries'}
                </div>
              </div>
              {/* Delete All Button */}
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 w-fit"
                onClick={async () => {
                  if (!confirm(`Are you sure you want to delete all ${workoutEntries.length} entries? This action cannot be undone.`)) {
                    return;
                  }
                  setLoading(true);
                  let deleted = 0;
                  let failed = 0;
                  try {
                    for (const entry of workoutEntries) {
                      const response = await fetch(`/api/workout/entries/${entry.id}`, { method: 'DELETE' });
                      if (response.ok) {
                        deleted++;
                      } else {
                        failed++;
                      }
                    }
                    await fetchWorkoutEntries();
                    if (failed > 0) {
                      alert(`Deleted ${deleted} entries. ${failed} entries could not be deleted (they may belong to another user or were already deleted).`);
                    }
                  } catch (error) {
                    console.error('Error deleting entries:', error);
                    alert('Failed to delete some entries. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            </div>

            {/* Cards View - Grouped by Exercise */}
            {view_mode === 'cards' && (
              <div className="space-y-4">
                {groupedWorkoutEntries.map((entriesGroup: WorkoutEntry[]) => {
                  const firstEntry = entriesGroup[0];
                  const formattedDate = firstEntry.date
                    ? new Date(firstEntry.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'No date';
                  const allSelected = entriesGroup.every(e => selectedEntries.has(e.id));
                  const someSelected = entriesGroup.some(e => selectedEntries.has(e.id));

                  return (
                    <Card key={`${firstEntry.exerciseId}_${firstEntry.date}`} className="hover:shadow-md transition-shadow duration-300 border-gray-100">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Group Selection Checkbox */}
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                              onChange={() => {
                                const newSelected = new Set(selectedEntries);
                                if (allSelected) {
                                  entriesGroup.forEach(e => newSelected.delete(e.id));
                                } else {
                                  entriesGroup.forEach(e => newSelected.add(e.id));
                                }
                                setSelectedEntries(newSelected);
                              }}
                              className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary h-5 w-5 cursor-pointer"
                              title="Select all sets"
                            />
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{formattedDate}</span>
                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800">
                              {entriesGroup.length} {entriesGroup.length === 1 ? 'set' : 'sets'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm(`Delete all ${entriesGroup.length} sets of ${firstEntry.exercise.name}?`)) {
                                  entriesGroup.forEach(e => handleDeleteEntry(e.id));
                                }
                              }}
                              disabled={loading}
                              className="h-9 w-9 hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete all sets"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Exercise Info with Image */}
                        <div className="flex items-start gap-3 mt-2">
                          {/* Exercise Image */}
                          {firstEntry.exercise.imageUrl ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                              <img
                                src={firstEntry.exercise.imageUrl}
                                alt={firstEntry.exercise.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg flex-shrink-0 bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <Dumbbell className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {/* Exercise Name */}
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                              <span className="truncate">{firstEntry.exercise.name}</span>
                            </h3>

                            {/* Exercise Metadata */}
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge variant="outline" className="text-xs bg-gray-100">
                                {firstEntry.exercise.category}
                              </Badge>
                              {firstEntry.exercise.muscleGroups?.slice(0, 2).map((mg: string) => (
                                <Badge key={mg} variant="outline" className="text-xs">
                                  {mg}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        {/* Sets Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-2 font-medium text-gray-600">Set</th>
                                <th className="text-left py-2 px-2 font-medium text-gray-600">Reps</th>
                                <th className="text-left py-2 px-2 font-medium text-gray-600">Weight</th>
                                <th className="text-left py-2 px-2 font-medium text-gray-600">Rest</th>
                                <th className="text-right py-2 px-2 font-medium text-gray-600">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entriesGroup.map((entry) => (
                                <tr key={entry.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                  <td className="py-2 px-2">
                                    <span className="font-medium">#{entry.setNumber}</span>
                                  </td>
                                  <td className="py-2 px-2">{entry.reps}</td>
                                  <td className="py-2 px-2">{entry.weight} {entry.unit}</td>
                                  <td className="py-2 px-2">{entry.restSeconds ? `${entry.restSeconds}s` : '-'}</td>
                                  <td className="py-2 px-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => startEditing(entry)}
                                        disabled={loading}
                                        className="h-7 w-7 hover:bg-gray-100"
                                      >
                                        <Edit className="h-3 w-3 text-gray-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteEntry(entry.id)}
                                        disabled={loading}
                                        className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Summary row */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-600">
                          <span><strong>Total:</strong> {entriesGroup.reduce((sum, e) => sum + e.reps, 0)} reps</span>
                          <span><strong>Volume:</strong> {entriesGroup.reduce((sum, e) => sum + (e.reps * parseFloat(e.weight || '0')), 0).toFixed(1)} kg</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Session Action Buttons - shown when there are entries */}
                {groupedWorkoutEntries.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-200">
                    <Button
                      onClick={async () => {
                        try {
                          // Try to find the session ID from entries or use activeSession
                          const sessionIdFromEntries = workoutEntries.find(e => e.sessionId)?.sessionId;
                          const sessionToEnd = activeSession?.id || sessionIdFromEntries;

                          // End the session if one exists
                          if (sessionToEnd) {
                            await fetch(`/api/workout/sessions/${sessionToEnd}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'COMPLETED' }),
                            });
                            setActiveSession(null);
                          }

                          // Fetch fresh subscriptions if none loaded
                          let subs = programSubscriptions;
                          if (subs.length === 0) {
                            try {
                              const r = await fetch('/api/workout/programs?subscriptions=true');
                              if (r.ok) {
                                subs = await r.json();
                                if (Array.isArray(subs)) {
                                  setProgramSubscriptions(subs);
                                }
                              }
                            } catch (e) {
                              console.error('Failed to fetch subscriptions:', e);
                            }
                          }

                          // Advance program day (do this regardless of session)
                          if (subs.length > 0) {
                            const sub = subs[0];
                            const currentWeek = sub.currentWeek || 1;
                            const currentDay = sub.currentDay || 1;

                            // Get total days from microcycle - default to 7 if not found
                            const program = sub.program_templates;
                            let totalDaysInWeek = 7;

                            if (program?.program_phases) {
                              const currentPhase = program.program_phases.find((phase: any) =>
                                phase.microcycles?.some((micro: any) => micro.weekNumber === currentWeek)
                              );
                              if (currentPhase) {
                                const currentMicrocycle = currentPhase.microcycles?.find(
                                  (micro: any) => micro.weekNumber === currentWeek
                                );
                                if (currentMicrocycle?.workouts) {
                                  totalDaysInWeek = currentMicrocycle.workouts.length;
                                }
                              }
                            }

                            // Calculate next day/week
                            let nextDay = currentDay + 1;
                            let nextWeek = currentWeek;

                            if (nextDay > totalDaysInWeek) {
                              nextDay = 1;
                              nextWeek = currentWeek + 1;
                            }

                            console.log('Advancing program:', { subscriptionId: sub.id, currentDay, nextDay, currentWeek, nextWeek, totalDaysInWeek });

                            // Update program progress
                            const progressRes = await fetch('/api/workout/programs/progress', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                subscriptionId: sub.id,
                                currentWeek: nextWeek,
                                currentDay: nextDay,
                              }),
                            });

                            if (progressRes.ok) {
                              // Update local state
                              setProgramSubscriptions(prev => prev.map(s =>
                                s.id === sub.id
                                  ? { ...s, currentWeek: nextWeek, currentDay: nextDay }
                                  : s
                              ));
                              console.log('Program advanced successfully to Day', nextDay);
                            } else {
                              console.error('Failed to advance program:', await progressRes.text());
                            }
                          } else {
                            console.log('No program subscriptions found to advance');
                          }

                          // Mark session as completed - hides logged entries from Today view
                          setSessionCompletedToday(true);

                          alert('Session completed! Great workout!');
                        } catch (err) {
                          console.error('Failed to end session:', err);
                          alert('Failed to end session. Please try again.');
                        }
                      }}
                      className="flex-1 py-4 text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
                    >
                      <span className="mdi mdi-check-circle mr-2" />
                      End Session
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Navigate to My Programs tab (day already advanced by End Session)
                        setActiveTab('my-programs');
                      }}
                      className="flex-1 py-4 text-base font-semibold border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
                    >
                      <span className="mdi mdi-skip-next mr-2" />
                      Move to Next Session
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Table View */}
            {view_mode === 'table' && (
              <WorkoutSummaryTable
                entries={workoutEntries}
                on_view_details={(date, entries) => {
                  set_workout_details_modal({
                    is_open: true,
                    date,
                    entries
                  });
                }}
              />
            )}

            {/* Workout Details Modal */}
            <WorkoutDetailsModal
              is_open={workout_details_modal.is_open}
              on_close={() => set_workout_details_modal({ is_open: false, date: '', entries: [] })}
              date={workout_details_modal.date}
              entries={workout_details_modal.entries}
              on_edit={(entry) => {
                // Close modal and start editing
                set_workout_details_modal({ is_open: false, date: '', entries: [] });
                startEditing(entry);
              }}
              on_delete={(entry_id) => {
                handleDeleteEntry(entry_id);
                // Refresh modal data by removing the deleted entry
                set_workout_details_modal(prev => ({
                  ...prev,
                  entries: prev.entries.filter(e => e.id !== entry_id)
                }));
              }}
            />
          </>
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

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Collapsible Session History */}
            <div className="bg-white rounded-lg border shadow-sm">
              <button
                type="button"
                onClick={() => setSessionHistoryExpanded(!sessionHistoryExpanded)}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-t-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="mdi mdi-history text-blue-600 text-lg" />
                  <h3 className="text-sm font-semibold text-gray-900">Session History</h3>
                </div>
                <span className={`mdi ${sessionHistoryExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'} text-gray-500 text-lg transition-transform duration-200`} />
              </button>
              {sessionHistoryExpanded && (
                <div className="px-4 pb-4 pt-2 border-t">
                  <SessionHistoryTable />
                </div>
              )}
            </div>

            {/* Calendar section */}
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Calendar</span>
                </div>
                <div className="flex gap-2 items-center">
                  <Button variant="outline" size="sm" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}><ChevronLeft className="h-4 w-4"/></Button>
                  <div className="text-sm font-medium text-gray-700 min-w-[120px] text-center">{format(calendarMonth, 'MMMM yyyy')}</div>
                  <Button variant="outline" size="sm" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}><ChevronRight className="h-4 w-4"/></Button>
                </div>
              </div>
              <WorkoutCalendar month={calendarMonth} sessions={monthSessions} />
            </div>
          </div>
        )}

        {activeTab === 'my-programs' && (
          loadingMyPrograms ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading your programs...</p>
              </div>
            </div>
          ) : (
            <MyPrograms
              programs={myProgramsData}
              onAddProgram={() => setActiveTab('programs')}
            />
          )
        )}

        {activeTab === 'programs' && (
          <ProgramsTab />
        )}

        {activeTab === 'athletes' && (
          <AthleteGallery />
        )}

        {activeTab === 'metrics' && (
          <BodyMetricsTab />
        )}

        {activeTab === 'progress' && (
          <ProgressTab />
        )}

        {activeTab === 'habits' && (
          <HabitsTab />
        )}
      </div>

      {/* Link My Exercise to Global Modal */}
      {linkMyExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow max-w-xl w-full p-4">
            <h3 className="text-lg font-semibold mb-2">Link “{linkMyExercise.name}” to a global exercise</h3>
            <p className="text-sm text-gray-600 mb-3">Select the closest match from the global database to use it in your workout logs.</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-10" placeholder="Search global exercises..." value={linkSearch} onChange={async (e)=>{
                const v = e.target.value; setLinkSearch(v);
                if (v.trim().length >= 2) {
                  const r = await fetch(`/api/workout/exercises?search=${encodeURIComponent(v)}&limit=10`);
                  if (r.ok) {
                    const data = await r.json();
                    const list = Array.isArray(data) ? data.map((e:any)=>({ id:String(e.id), name:e.name, category:e.category, muscleGroups:e.muscleGroups||[], equipment:e.equipment||[] })) : [];
                    setLinkResults(list);
                  }
                } else {
                  setLinkResults([]);
                }
              }} />
            </div>
            <div className="max-h-60 overflow-auto border rounded">
              {linkResults.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No results. Try another search.</div>
              ) : linkResults.map((ex)=> (
                <div key={ex.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0" onClick={async ()=>{
                  // Update my exercise to link to this global id
                  await fetch(`/api/workout/my_exercises/${linkMyExercise.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ baseExerciseId: ex.id }) });
                  // Proceed with selection
                  setSelectedExercise(ex);
                  setNewEntry({ ...newEntry, exercise: ex.name, exerciseId: ex.id, setType:'STRAIGHT', sets:'1' });
                  setExerciseSearch('');
                  setLinkMyExercise(null);
                }}>
                  <div className="font-medium">{ex.name}</div>
                  <div className="text-xs text-gray-500">{ex.category} • {ex.muscleGroups.slice(0,2).join(', ')}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setLinkMyExercise(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

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
                      {assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : 'No date'} - {assessment.primaryGoal}
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
                    <span className="mdi mdi-trophy text-6xl mb-2 block" />
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

      {/* Trainer/Admin: Create Session for Athlete Modal */}
      {showCreateForClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Create Session for Athlete</CardTitle>
              <CardDescription>Select an athlete and optional title to start a session on their behalf.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Athlete</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select an athlete</option>
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
                      alert('Athlete session started');
                      setShowCreateForClient(false);
                      setSelectedClientId('');
                      setSessionTitle('');
                    } else {
                      alert(data.error || 'Failed to create athlete session');
                    }
                  } catch (e) {
                    console.error(e);
                    alert('Failed to create athlete session');
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

      {/* Prefill Modal */}
      {showPrefillModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow max-w-2xl w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-medium">Choose a day from your program</div>
              <Button variant="ghost" size="sm" onClick={() => setShowPrefillModal(false)}>Close</Button>
            </div>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {!selectedProgram && <div className="text-sm text-muted-foreground">Loading…</div>}
              {selectedProgram && (selectedProgram.workout_templates || []).map((tpl: any) => (
                <div key={tpl.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="text-sm">
                    <div className="font-medium">{tpl.name || 'Day Template'}</div>
                    <div className="text-xs text-muted-foreground">{tpl.workout_template_exercises?.length || 0} exercises</div>
                  </div>
                  <Button size="sm" onClick={() => useTemplate(tpl)}>Use this day</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <RestTimerBar
        visible={restVisible}
        remaining={restRemaining}
        onAdd15={() => setRestRemaining((s) => s + 15)}
        onSkip={() => { setRestVisible(false); setRestRemaining(0); }}
        onDone={() => { setRestVisible(false); setRestRemaining(0); }}
        exerciseId={selectedExercise?.id}
        sessionId={activeSession?.id}
      />

      {/* Floating Action Button - Mobile only, for quick add */}
      {activeTab === 'today' && !isAddingEntry && (
        <div className="md:hidden">
          <FloatingActionButton
            onClick={() => setShowAddEntryModal(true)}
            label="Add workout entry"
          />
        </div>
      )}

      {/* Add Entry Modal - Full screen on mobile */}
      <AddEntryModal
        isOpen={showAddEntryModal}
        onClose={() => setShowAddEntryModal(false)}
        onSubmit={async (data: AddEntryData) => {
          // Use the existing handleAddEntry logic but adapted for modal data
          const today = new Date().toISOString().split('T')[0];
          try {
            const response = await fetch('/api/workout/entries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                entries: [{
                  date: today,
                  exerciseId: data.exerciseId,
                  setNumber: currentSetNumber,
                  setType: data.setType,
                  reps: data.reps,
                  weight: String(data.weight),
                  unit: 'KG',
                  sessionId: activeSession?.id,
                  intensity: data.rpe ? `RPE ${data.rpe}` : undefined,
                  restSeconds: data.restSeconds,
                  userComments: data.notes
                }]
              })
            });

            if (response.ok) {
              // Update state for next set
              setLastLoggedEntry({ weight: data.weight, reps: data.reps });
              setCurrentSetNumber(prev => prev + 1);

              // Refresh entries
              fetchWorkoutEntries();

              // Start rest timer if configured
              if (data.restSeconds && data.restSeconds > 0) {
                setRestTimerSeconds(data.restSeconds);
                setShowRestTimerOverlay(true);
                setShowAddEntryModal(false);
              }

              // Keep modal open for next set or close if done
              if (currentSetNumber >= totalSetsCount) {
                setShowAddEntryModal(false);
                setCurrentSetNumber(1);
              }
            }
          } catch (error) {
            console.error('Failed to add entry:', error);
          }
        }}
        exercises={exercises.map(e => ({
          id: e.id,
          name: e.name,
          category: e.category,
          muscleGroups: e.muscleGroups,
          equipment: e.equipment
        }))}
        recentExercises={recentExercises.map(e => {
          const full = exercises.find(ex => ex.id === e.id);
          return {
            id: e.id,
            name: e.name,
            category: full?.category || 'General',
            muscleGroups: full?.muscleGroups || [],
            equipment: full?.equipment || []
          };
        })}
        initialExercise={selectedExercise ? {
          id: selectedExercise.id,
          name: selectedExercise.name,
          category: selectedExercise.category,
          muscleGroups: selectedExercise.muscleGroups,
          equipment: selectedExercise.equipment
        } : null}
        currentSet={currentSetNumber}
        totalSets={totalSetsCount}
        lastEntry={lastLoggedEntry}
      />

      {/* Rest Timer Overlay - Full screen */}
      <RestTimerOverlay
        isOpen={showRestTimerOverlay}
        initialSeconds={restTimerSeconds}
        onComplete={() => {
          setShowRestTimerOverlay(false);
          setShowAddEntryModal(true); // Re-open add modal for next set
        }}
        onSkip={() => {
          setShowRestTimerOverlay(false);
          setShowAddEntryModal(true);
        }}
        nextExercise={selectedExercise ? {
          name: selectedExercise.name,
          weight: lastLoggedEntry?.weight || 0,
          reps: lastLoggedEntry?.reps || 8
        } : undefined}
      />

      {/* Exercise Example Modal */}
      {showExerciseExample && (selectedExercise?.imageUrl || selectedExercise?.videoUrl) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowExerciseExample(false)}>
          <div className="relative max-w-lg w-full bg-white rounded-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{selectedExercise.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowExerciseExample(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 bg-black">
              {/* Check if it's a video URL */}
              {(selectedExercise.videoUrl || selectedExercise.imageUrl?.match(/\.(mp4|webm|mov)$/i)) ? (
                <video
                  src={selectedExercise.videoUrl || selectedExercise.imageUrl}
                  className="w-full h-auto rounded-lg"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                /* For images and GIFs - GIFs will auto-animate */
                <img
                  src={selectedExercise.imageUrl}
                  alt={`${selectedExercise.name} demonstration`}
                  className="w-full h-auto rounded-lg"
                />
              )}
            </div>
            <div className="p-3 bg-gray-50 text-center text-xs text-gray-500">
              {selectedExercise.imageUrl?.includes('.gif') || selectedExercise.imageUrl?.includes('exercisedb')
                ? 'Animated demonstration'
                : 'Exercise demonstration'}
            </div>
          </div>
        </div>
      )}

      {/* Form Guide Modal */}
      {selectedExercise && (
        <FormGuideModal
          exerciseId={selectedExercise.id}
          exerciseName={selectedExercise.name}
          isOpen={showFormGuideModal}
          onClose={() => setShowFormGuideModal(false)}
        />
      )}
    </>
  );
}

export default function WorkoutLogPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <WorkoutLogPageContent />
    </Suspense>
  );
}
