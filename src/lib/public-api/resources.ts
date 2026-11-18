// src/lib/public-api/resources.ts
// The public resources. Each one is assembled from an explicit list of fields; nothing
// here spreads a database row. Field names follow the public contract (snake_case,
// AIP-148 standard fields), not the column names.
//
// Every resource carries the canonical set:
//   name         resource name, e.g. "exercises/7d0f13ee-..."
//   uid          system-assigned identifier
//   title        human-readable label
//   body_txt     all the text of the resource, plain
//   body_html    the same text as escaped HTML
//   create_time  when the record was created (RFC 3339)
//   update_time  when it last changed (RFC 3339)
//   lang, uri, source, license   so a consumer knows where it came from and may reuse it

import { Prisma } from '@prisma/client';
import { prisma } from '@/core/database';
import { exerciseImageUrl } from '@/lib/exercise-image';
import { EUROSTAT_ACTIVITY, EUROSTAT_ACTIVITY_META } from '@/data/fitness/eurostat_activity';
import { SPORT_EUROPE, SPORT_EUROPE_META } from '@/data/fitness/sport_europe';
import { SITE_URL, type Page } from './http';
import { heading, list, paragraph, redactContacts, renderBody, slugValue, steps, timestamp, type Block } from './text';

// ── Exercises ────────────────────────────────────────────────────────────────────────
// Version 1 serves only the exercises imported from free-exercise-db, which is in the
// public domain. Exercises from sources without an open licence are not served.

const OPEN_EXERCISE_SOURCE = 'FREE_EXERCISE_DB';

const EXERCISE_SOURCE = {
  title: 'free-exercise-db',
  uri: 'https://github.com/yuhonas/free-exercise-db',
};

const exerciseSelect = {
  id: true,
  name: true,
  category: true,
  type: true,
  difficulty: true,
  bodyPart: true,
  muscleGroups: true,
  equipment: true,
  instructions: true,
  safetyNotes: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.exercisesSelect;

type ExerciseRow = Prisma.exercisesGetPayload<{ select: typeof exerciseSelect }>;

/** Some photos are hosted by Massimino and stored as a path; a consumer needs the full address. */
function absoluteUri(value?: string | null): string | null {
  if (!value) return null;
  return value.startsWith('/') ? `${SITE_URL}${value}` : value;
}

function toExercise(row: ExerciseRow) {
  const blocks: Block[] = [...steps(row.instructions)];
  if (row.safetyNotes) blocks.push(heading('Safety notes'), ...paragraph(row.safetyNotes));
  return {
    name: `exercises/${row.id}`,
    uid: row.id,
    title: row.name,
    ...renderBody(blocks),
    lang: 'en',
    difficulty: slugValue(row.difficulty),
    category: slugValue(row.category),
    exercise_type: slugValue(row.type),
    body_part: slugValue(row.bodyPart),
    muscle_groups: row.muscleGroups.map((m) => slugValue(m)).filter(Boolean),
    equipment: row.equipment.map((e) => slugValue(e)).filter(Boolean),
    image_uri: absoluteUri(exerciseImageUrl(row.imageUrl)),
    uri: `${SITE_URL}/exercises`,
    source: EXERCISE_SOURCE,
    license: 'Unlicense',
    create_time: timestamp(row.createdAt),
    update_time: timestamp(row.updatedAt),
  };
}

export interface ExerciseFilter {
  q?: string | null;
  muscle_group?: string | null;
  equipment?: string | null;
  difficulty?: string | null;
}

const insensitive = (value: string) => ({ equals: value, mode: 'insensitive' as const });

export async function listExercises(filter: ExerciseFilter, page: Page) {
  const where: Prisma.exercisesWhereInput = { isActive: true, source: OPEN_EXERCISE_SOURCE };
  if (filter.q) where.name = { contains: filter.q, mode: 'insensitive' };
  if (filter.difficulty) where.difficulty = insensitive(filter.difficulty);
  // Stored values are free text ("triceps", "Body Only"); match the slug form the API returns
  const spaced = (value: string) => value.replace(/_/g, ' ');
  if (filter.muscle_group) where.muscleGroups = { hasSome: variants(spaced(filter.muscle_group)) };
  if (filter.equipment) where.equipment = { hasSome: variants(spaced(filter.equipment)) };

  const [total, rows] = await Promise.all([
    prisma.exercises.count({ where }),
    prisma.exercises.findMany({
      where,
      select: exerciseSelect,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: page.offset,
      take: page.size,
    }),
  ]);
  return { total, items: rows.map(toExercise) };
}

/** "body only" also matches "Body Only" and "Body only" */
function variants(value: string): string[] {
  const lower = value.toLowerCase();
  const title = lower.replace(/\b[a-z]/g, (c) => c.toUpperCase());
  const sentence = lower.charAt(0).toUpperCase() + lower.slice(1);
  return [...new Set([value, lower, title, sentence])];
}

export async function getExercise(uid: string) {
  const row = await prisma.exercises.findFirst({
    where: { id: uid, isActive: true, source: OPEN_EXERCISE_SOURCE },
    select: exerciseSelect,
  });
  return row ? toExercise(row) : null;
}

// ── Programmes and their workouts ────────────────────────────────────────────────────
// An explicit list: programmes written for Massimino whose sessions are stored in a form
// that can be served. Programmes named after athletes, programmes by third-party authors
// and the medical-condition programmes are not in version 1.

const OPEN_PROGRAMS = [
  'balance-workout',
  'cardio-workout',
  'flexibility-workout',
  'hiit-workout',
  'i-dont-have-much-time',
  'i-just-became-a-dad',
  'i-just-became-a-mum',
  'linear-periodization-12week',
  'plyometric-workout',
];

const PROGRAM_SOURCE = { title: 'Massimino', uri: 'https://github.com/Beresol-BV/massimino' };

const programSelect = {
  id: true,
  name: true,
  description: true,
  duration: true,
  difficulty: true,
  category: true,
  templateData: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.program_templatesSelect;

type ProgramRow = Prisma.program_templatesGetPayload<{ select: typeof programSelect }>;

const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);
const numeric = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '') : []);

interface WorkoutExercise {
  title: string;
  sets: number | null;
  reps: string | null;
  rest_seconds: number | null;
  notes: string | null;
}

interface RawWorkout {
  title: string;
  week: number | null;
  focus: string | null;
  duration_minutes: number | null;
  exercises: WorkoutExercise[];
}

function toWorkoutExercise(raw: any): WorkoutExercise | null {
  if (typeof raw === 'string') return raw.trim() ? { title: raw.trim(), sets: null, reps: null, rest_seconds: null, notes: null } : null;
  const title = text(raw?.exercise_name) || text(raw?.exercise) || text(raw?.name);
  if (!title) return null;
  const reps = raw.reps;
  return {
    title,
    sets: numeric(raw.sets),
    reps: typeof reps === 'number' ? String(reps) : text(reps),
    rest_seconds: numeric(raw.rest_seconds),
    notes: text(raw.notes),
  };
}

const exercisesOf = (items: unknown): WorkoutExercise[] =>
  (Array.isArray(items) ? items : []).map(toWorkoutExercise).filter((e): e is WorkoutExercise => e !== null);

/** The stored templates use three layouts; all of them become the same flat list. */
function extractWorkouts(data: any): RawWorkout[] {
  if (!data || typeof data !== 'object') return [];

  if (Array.isArray(data.training_days)) {
    return data.training_days.map((day: any, i: number) => {
      const title = text(day?.day_name) || `Session ${i + 1}`;
      const week = title.match(/Week\s+(\d+)/i);
      return {
        title,
        week: week ? parseInt(week[1], 10) : null,
        focus: text(day?.focus),
        duration_minutes: numeric(day?.duration_minutes),
        exercises: exercisesOf(day?.exercises),
      };
    });
  }

  if (Array.isArray(data.workout_sessions)) {
    return data.workout_sessions.map((session: any, i: number) => ({
      title: text(session?.name) || `Session ${i + 1}`,
      week: null,
      focus: text(session?.focus),
      duration_minutes: numeric(session?.duration_minutes),
      exercises: (Array.isArray(session?.sections) ? session.sections : []).flatMap((section: any) => exercisesOf(section?.exercises)),
    }));
  }

  if (Array.isArray(data.weekly_structure)) {
    return data.weekly_structure.flatMap((week: any) =>
      (Array.isArray(week?.sessions) ? week.sessions : []).map((session: any, i: number) => ({
        title: `Week ${numeric(week?.week) ?? '?'}: ${text(session?.name) || `Session ${i + 1}`}`,
        week: numeric(week?.week),
        focus: text(session?.goal) || text(week?.theme),
        duration_minutes: null,
        exercises: exercisesOf(session?.components ?? session?.details ?? session?.exercises),
      }))
    );
  }

  return [];
}

function programBlocks(row: ProgramRow, data: any): Block[] {
  const blocks: Block[] = [...paragraph(row.description)];
  const goal = data?.goal;
  if (typeof goal === 'string') blocks.push(heading('Goal'), ...paragraph(goal));
  else if (goal && typeof goal === 'object') {
    if (text(goal.outcome_goal)) blocks.push(heading('Goal'), ...paragraph(goal.outcome_goal));
    blocks.push(...list(strings(goal.progress_goals)));
  }
  const goals = strings(data?.goals);
  if (goals.length) blocks.push(heading('Goals'), ...list(goals));
  return blocks;
}

function toProgram(row: ProgramRow) {
  const data = row.templateData as any;
  const workouts = extractWorkouts(data);
  const weeks = numeric(data?.duration_weeks) ?? (row.duration.match(/(\d+)\s*week/i) ? parseInt(row.duration.match(/(\d+)\s*week/i)![1], 10) : null);
  return {
    name: `programs/${row.id}`,
    uid: row.id,
    title: row.name,
    ...renderBody(programBlocks(row, data)),
    lang: 'en',
    level: slugValue(text(data?.level) || row.difficulty),
    category: slugValue(row.category),
    duration_weeks: weeks,
    sessions_per_week: numeric(data?.frequency_per_week),
    equipment: strings(data?.equipment),
    workout_count: workouts.length,
    workouts: `programs/${row.id}/workouts`,
    uri: `${SITE_URL}/workout-log/programs/${row.id}`,
    source: PROGRAM_SOURCE,
    license: 'Apache-2.0',
    create_time: timestamp(row.createdAt),
    update_time: timestamp(row.updatedAt),
  };
}

function toWorkout(row: ProgramRow, raw: RawWorkout, index: number) {
  const blocks: Block[] = [];
  if (raw.focus) blocks.push(...paragraph(raw.focus));
  blocks.push(
    ...list(
      raw.exercises.map((e) => {
        const dose = [e.sets && e.reps ? `${e.sets} x ${e.reps}` : e.reps || (e.sets ? `${e.sets} sets` : null), e.rest_seconds ? `rest ${e.rest_seconds} s` : null]
          .filter(Boolean)
          .join(', ');
        return [e.title, dose ? `(${dose})` : null, e.notes ? `: ${e.notes}` : null].filter(Boolean).join(' ').replace(' :', ':');
      }),
      true
    )
  );
  const number = index + 1;
  return {
    name: `programs/${row.id}/workouts/${number}`,
    uid: `${row.id}:${number}`,
    parent: `programs/${row.id}`,
    title: raw.title,
    ...renderBody(blocks),
    lang: 'en',
    sequence: number,
    week: raw.week,
    focus: raw.focus,
    duration_minutes: raw.duration_minutes,
    exercises: raw.exercises,
    uri: `${SITE_URL}/workout-log/programs/${row.id}`,
    source: PROGRAM_SOURCE,
    license: 'Apache-2.0',
    create_time: timestamp(row.createdAt),
    update_time: timestamp(row.updatedAt),
  };
}

const openProgramWhere = { id: { in: OPEN_PROGRAMS }, isPublic: true, isActive: true };

export async function listPrograms(page: Page) {
  const [total, rows] = await Promise.all([
    prisma.program_templates.count({ where: openProgramWhere }),
    prisma.program_templates.findMany({
      where: openProgramWhere,
      select: programSelect,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: page.offset,
      take: page.size,
    }),
  ]);
  return { total, items: rows.map(toProgram) };
}

async function findProgram(uid: string) {
  if (!OPEN_PROGRAMS.includes(uid)) return null;
  return prisma.program_templates.findFirst({ where: { ...openProgramWhere, id: uid }, select: programSelect });
}

export async function getProgram(uid: string) {
  const row = await findProgram(uid);
  return row ? toProgram(row) : null;
}

/** null when the programme does not exist */
export async function listWorkouts(programUid: string, page: Page) {
  const row = await findProgram(programUid);
  if (!row) return null;
  const all = extractWorkouts(row.templateData).map((raw, i) => toWorkout(row, raw, i));
  return { total: all.length, items: all.slice(page.offset, page.offset + page.size) };
}

/** undefined when the programme does not exist, null when the workout does not */
export async function getWorkout(programUid: string, sequence: string) {
  const row = await findProgram(programUid);
  if (!row) return undefined;
  const index = /^\d+$/.test(sequence) ? parseInt(sequence, 10) - 1 : -1;
  const raw = extractWorkouts(row.templateData)[index];
  return raw ? toWorkout(row, raw, index) : null;
}

// ── Teams ────────────────────────────────────────────────────────────────────────────
// Public, active teams only, and only what a visitor to the Teams page already sees.
// No members, no trainer, no contact details.

const teamSelect = {
  id: true,
  name: true,
  description: true,
  type: true,
  customTypeDescription: true,
  memberCount: true,
  maxMembers: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.teamsSelect;

type TeamRow = Prisma.teamsGetPayload<{ select: typeof teamSelect }>;

const publicTeamWhere = { isActive: true, visibility: 'PUBLIC' as const };

function toTeam(row: TeamRow) {
  return {
    name: `teams/${row.id}`,
    uid: row.id,
    title: redactContacts(row.name),
    ...renderBody(paragraph(row.description ? redactContacts(row.description) : null)),
    // Teams write in their own language; the API does not guess it
    lang: null,
    team_type: slugValue(row.type === 'CUSTOM' && row.customTypeDescription ? redactContacts(row.customTypeDescription) : row.type),
    member_count: row.memberCount,
    max_members: row.maxMembers,
    open_spots: Math.max(0, row.maxMembers - row.memberCount),
    uri: `${SITE_URL}/teams/${row.id}`,
    source: { title: 'Massimino', uri: SITE_URL },
    // Written by the team's trainer: shown publicly, not licensed for reuse
    license: null,
    create_time: timestamp(row.createdAt),
    update_time: timestamp(row.updatedAt),
  };
}

export async function listTeams(page: Page) {
  const [total, rows] = await Promise.all([
    prisma.teams.count({ where: publicTeamWhere }),
    prisma.teams.findMany({
      where: publicTeamWhere,
      select: teamSelect,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: page.offset,
      take: page.size,
    }),
  ]);
  return { total, items: rows.map(toTeam) };
}

export async function getTeam(uid: string) {
  const row = await prisma.teams.findFirst({ where: { ...publicTeamWhere, id: uid }, select: teamSelect });
  return row ? toTeam(row) : null;
}

// ── Fitness Intelligence: countries ──────────────────────────────────────────────────
// Version 1 serves the Eurostat series only. The market figures on the Fitness
// Intelligence page come from commercial reports and are not redistributed here.

const EUROSTAT_LICENSE = 'CC-BY-4.0';

interface Indicator {
  code: string;
  title: string;
  value: number;
  unit: string;
  year: number;
  eu27_value: number | null;
  source_uri: string;
}

function countryIndicators(iso: string): { title: string | null; indicators: Indicator[] } {
  const indicators: Indicator[] = [];
  let title: string | null = null;

  const activity = EUROSTAT_ACTIVITY.find((c) => c.iso_code === iso);
  if (activity) {
    title = activity.name;
    indicators.push({
      code: EUROSTAT_ACTIVITY_META.dataset_code,
      title: 'Adults meeting the WHO aerobic and muscle-strengthening guideline',
      value: activity.activity_pct,
      unit: 'percent',
      year: activity.year,
      eu27_value: EUROSTAT_ACTIVITY_META.eu27_average,
      source_uri: EUROSTAT_ACTIVITY_META.public_url,
    });
  }

  const sport = SPORT_EUROPE.find((c) => c.iso_code === iso);
  if (sport?.employment) {
    title = title || sport.name;
    indicators.push(
      {
        code: 'sprt_emp_sex.jobs',
        title: 'People employed in sport',
        value: sport.employment.jobs_thousands,
        unit: 'thousand_persons',
        year: SPORT_EUROPE_META.employment.year,
        eu27_value: SPORT_EUROPE_META.employment.eu27_jobs_thousands,
        source_uri: SPORT_EUROPE_META.employment.url,
      },
      {
        code: 'sprt_emp_sex.share',
        title: 'Sport employment as a share of total employment',
        value: sport.employment.share_pct,
        unit: 'percent',
        year: SPORT_EUROPE_META.employment.year,
        eu27_value: SPORT_EUROPE_META.employment.eu27_share_pct,
        source_uri: SPORT_EUROPE_META.employment.url,
      }
    );
  }
  return { title, indicators };
}

const UNIT_LABEL: Record<string, string> = { percent: '%', thousand_persons: ' thousand people' };

// When this data was last retrieved from Eurostat and published by Massimino
const FI_CREATE_TIME = '2026-06-21T00:00:00.000Z';
const FI_UPDATE_TIME = '2026-11-18T00:00:00.000Z';

function toCountry(iso: string) {
  const { title, indicators } = countryIndicators(iso);
  if (!title || indicators.length === 0) return null;
  const blocks: Block[] = [
    ...paragraph(`Eurostat figures on physical activity and sport employment for ${title}.`),
    ...list(
      indicators.map(
        (i) =>
          `${i.title} (${i.year}): ${i.value}${UNIT_LABEL[i.unit] ?? ''}` +
          (i.eu27_value !== null ? `. EU27: ${i.eu27_value}${UNIT_LABEL[i.unit] ?? ''}` : '')
      )
    ),
    ...paragraph('Source: Eurostat.'),
  ];
  return {
    name: `fitness-intelligence/countries/${iso}`,
    uid: iso,
    title,
    ...renderBody(blocks),
    lang: 'en',
    iso_code: iso,
    indicators,
    uri: `${SITE_URL}/fitness-intelligence`,
    source: { title: 'Eurostat', uri: 'https://ec.europa.eu/eurostat' },
    license: EUROSTAT_LICENSE,
    create_time: FI_CREATE_TIME,
    update_time: FI_UPDATE_TIME,
  };
}

function allCountryCodes(): string[] {
  const codes = new Set<string>();
  for (const c of EUROSTAT_ACTIVITY) codes.add(c.iso_code);
  for (const c of SPORT_EUROPE) if (c.employment) codes.add(c.iso_code);
  return [...codes].sort();
}

export function listCountries(page: Page) {
  const all = allCountryCodes()
    .map(toCountry)
    .filter((c): c is NonNullable<ReturnType<typeof toCountry>> => c !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
  return { total: all.length, items: all.slice(page.offset, page.offset + page.size) };
}

export function getCountry(code: string) {
  return toCountry(code.toUpperCase());
}
