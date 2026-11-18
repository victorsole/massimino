// src/lib/mcp/tools.ts
// The tools the Massimino MCP server offers to AI assistants (Claude, ChatGPT and others).
// They are a thin layer over the public API's resources (src/lib/public-api/resources.ts),
// so an assistant sees exactly the content the open API serves, and nothing else.
//
// Two front doors every assistant understands:
//   search(query)  ->  { results: [{ id, title, url }] }
//   fetch(id)      ->  { id, title, text, url, metadata }
// (ChatGPT's connectors and deep research require this pair with these names.)
// The remaining tools answer the common fitness questions in one call.

import { ApiError, SCOPES, type Caller, type Page } from '@/lib/public-api/http';
import {
  getCountry,
  getExercise,
  getProgram,
  getTeam,
  getWorkout,
  listCountries,
  listExercises,
  listMySessions,
  listMySets,
  listPrograms,
  listTeams,
  listWorkouts,
} from '@/lib/public-api/resources';

type Json = Record<string, unknown>;

export interface McpTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Json;
  /** Personal tools are listed and callable only with a key that carries this scope */
  scope?: string;
  run: (args: Json, caller: Caller) => Promise<unknown> | unknown;
}

/** Thrown for a problem the assistant can fix by changing its arguments */
export class ToolInputError extends Error {}

const ALL: Page = { size: 100, offset: 0 };

function text(args: Json, name: string, required = false): string | null {
  const value = args[name];
  if (value === undefined || value === null || value === '') {
    if (required) throw new ToolInputError(`"${name}" is required.`);
    return null;
  }
  if (typeof value !== 'string') throw new ToolInputError(`"${name}" must be text.`);
  const trimmed = value.trim();
  if (trimmed.length > 200) throw new ToolInputError(`"${name}" can be at most 200 characters.`);
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) throw new ToolInputError(`"${name}" contains characters that are not allowed.`);
  if (!trimmed && required) throw new ToolInputError(`"${name}" is required.`);
  return trimmed || null;
}

function limit(args: Json, fallback: number, max: number): number {
  const value = args.limit;
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) throw new ToolInputError('"limit" must be a whole number of 1 or more.');
  return Math.min(value, max);
}

// ── search and fetch ─────────────────────────────────────────────────────────────────
// Result ids are "<kind>:<identifier>", e.g. "exercise:7d0f13ee-...", "program:hiit-workout",
// "workout:hiit-workout/1", "team:<uid>", "country:SE".

type Hit = { id: string; title: string; url: string; score: number };

const words = (value: string) => value.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);

/** How well a record's text matches the query: title matches count more than body matches */
function score(query: string, title: string, body: string): number {
  const q = query.toLowerCase().trim();
  const t = title.toLowerCase();
  const b = body.toLowerCase();
  let total = 0;
  if (t === q) total += 100;
  else if (t.includes(q)) total += 60;
  else if (b.includes(q)) total += 15;
  for (const word of words(query)) {
    if (t.includes(word)) total += 10;
    else if (b.includes(word)) total += 3;
  }
  return total;
}

async function search(args: Json) {
  const query = text(args, 'query', true) as string;
  const hits: Hit[] = [];

  // Exercises: the database searches the title. Try the phrase, then its words.
  const seen = new Set<string>();
  const exerciseQueries = [query, ...words(query).filter((w) => w !== query.toLowerCase())].slice(0, 4);
  for (const q of exerciseQueries) {
    const { items } = await listExercises({ q }, { size: 10, offset: 0 });
    for (const item of items) {
      if (seen.has(item.uid)) continue;
      seen.add(item.uid);
      hits.push({ id: `exercise:${item.uid}`, title: item.title, url: item.uri, score: score(query, item.title, item.body_txt) });
    }
    if (seen.size >= 10) break;
  }

  const [programs, teams] = await Promise.all([listPrograms(ALL), listTeams(ALL)]);
  for (const item of programs.items) {
    const s = score(query, item.title, `${item.body_txt} ${item.category ?? ''} ${item.level ?? ''}`);
    if (s > 0) hits.push({ id: `program:${item.uid}`, title: `${item.title} (training programme)`, url: item.uri, score: s });
  }
  for (const item of teams.items) {
    const s = score(query, item.title, item.body_txt);
    if (s > 0) hits.push({ id: `team:${item.uid}`, title: `${item.title} (team)`, url: item.uri, score: s });
  }
  for (const item of listCountries(ALL).items) {
    const s = score(query, item.title, item.iso_code);
    if (s > 0) hits.push({ id: `country:${item.iso_code}`, title: `${item.title}: physical activity and sport employment (Eurostat)`, url: item.uri, score: s });
  }

  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return { results: hits.slice(0, 12).map(({ id, title, url }) => ({ id, title, url })) };
}

async function fetchRecord(args: Json) {
  const id = text(args, 'id', true) as string;
  const separator = id.indexOf(':');
  const kind = separator === -1 ? '' : id.slice(0, separator);
  const key = separator === -1 ? '' : id.slice(separator + 1);
  const missing = () => new ToolInputError(`Nothing found for "${id}". Use an id returned by the search tool.`);

  const shape = (record: any, extra: Json = {}) => ({
    id,
    title: record.title,
    text: record.body_txt,
    url: record.uri,
    metadata: { name: record.name, source: record.source?.title, license: record.license, update_time: record.update_time, ...extra },
  });

  if (kind === 'exercise') {
    const record = await getExercise(key);
    if (!record) throw missing();
    return shape(record, { difficulty: record.difficulty, muscle_groups: record.muscle_groups, equipment: record.equipment, image_uri: record.image_uri });
  }
  if (kind === 'program') {
    const record = await getProgram(key);
    if (!record) throw missing();
    const workouts = await listWorkouts(key, ALL);
    const sessions = (workouts?.items ?? []).map((w) => `${w.sequence}. ${w.title}\n${w.body_txt}`).join('\n\n');
    return {
      ...shape(record, { level: record.level, duration_weeks: record.duration_weeks, sessions_per_week: record.sessions_per_week, workout_count: record.workout_count }),
      text: [record.body_txt, sessions].filter(Boolean).join('\n\nWorkouts\n\n'),
    };
  }
  if (kind === 'workout') {
    const [program, sequence] = key.split('/');
    const record = program && sequence ? await getWorkout(program, sequence) : null;
    if (!record) throw missing();
    return shape(record, { parent: record.parent, week: record.week });
  }
  if (kind === 'team') {
    const record = await getTeam(key);
    if (!record) throw missing();
    return shape(record, { member_count: record.member_count, open_spots: record.open_spots });
  }
  if (kind === 'country') {
    const record = getCountry(key);
    if (!record) throw missing();
    return shape(record, { iso_code: record.iso_code, indicators: record.indicators });
  }
  throw missing();
}

// ── Domain tools ─────────────────────────────────────────────────────────────────────

async function findExercises(args: Json) {
  let result;
  try {
    result = await listExercises(
      { q: text(args, 'query'), muscle_group: text(args, 'muscle_group'), equipment: text(args, 'equipment'), difficulty: text(args, 'difficulty') },
      { size: limit(args, 8, 25), offset: 0 }
    );
  } catch (error) {
    // An unknown filter value: hand the valid ones back so the assistant can retry
    if (error instanceof ApiError && error.status === 'INVALID_ARGUMENT') {
      const allowed = error.metadata.allowed ? ` Valid values: ${error.metadata.allowed}.` : '';
      throw new ToolInputError(`${error.message}${allowed}`);
    }
    throw error;
  }
  return {
    total_matches: result.total,
    exercises: result.items.map((e) => ({
      id: `exercise:${e.uid}`,
      title: e.title,
      difficulty: e.difficulty,
      muscle_groups: e.muscle_groups,
      equipment: e.equipment,
      instructions: e.body_txt,
      image_uri: e.image_uri,
      license: e.license,
    })),
  };
}

async function listProgramsTool() {
  const { items } = await listPrograms(ALL);
  return {
    programs: items.map((p) => ({
      id: `program:${p.uid}`,
      program: p.uid,
      title: p.title,
      summary: p.body_txt.split('\n\n')[0],
      level: p.level,
      category: p.category,
      duration_weeks: p.duration_weeks,
      sessions_per_week: p.sessions_per_week,
      workout_count: p.workout_count,
      url: p.uri,
    })),
  };
}

async function getProgramTool(args: Json) {
  const uid = (text(args, 'program', true) as string).replace(/^program:/, '');
  const program = await getProgram(uid);
  if (!program) throw new ToolInputError(`There is no programme "${uid}". Call list_programs for the valid identifiers.`);
  const workouts = await listWorkouts(uid, ALL);
  return {
    title: program.title,
    description: program.body_txt,
    level: program.level,
    duration_weeks: program.duration_weeks,
    sessions_per_week: program.sessions_per_week,
    equipment: program.equipment,
    url: program.uri,
    license: program.license,
    workouts: (workouts?.items ?? []).map((w) => ({ sequence: w.sequence, title: w.title, week: w.week, focus: w.focus, exercises: w.exercises })),
  };
}

async function listTeamsTool() {
  const { items } = await listTeams(ALL);
  return {
    teams: items.map((t) => ({ id: `team:${t.uid}`, title: t.title, description: t.body_txt, team_type: t.team_type, member_count: t.member_count, open_spots: t.open_spots, url: t.uri })),
  };
}

function countryData(args: Json) {
  const wanted = (text(args, 'country', true) as string).toLowerCase();
  const all = listCountries(ALL).items;
  const match = all.find((c) => c.iso_code.toLowerCase() === wanted) ?? all.find((c) => c.title.toLowerCase() === wanted) ?? all.find((c) => c.title.toLowerCase().includes(wanted));
  if (!match) {
    throw new ToolInputError(`No Eurostat data for "${args.country}". Use a two-letter ISO code or an English country name. Available: ${all.map((c) => c.iso_code).join(', ')}.`);
  }
  return { country: match.title, iso_code: match.iso_code, indicators: match.indicators, summary: match.body_txt, source: 'Eurostat', license: match.license, url: match.uri };
}

async function myWorkoutLog(args: Json, caller: Caller) {
  // The owner comes from the key, never from the arguments
  if (!caller.ownerId) throw new ToolInputError('This tool needs a Massimino sign-in or an API key with the workout log permission.');
  const size = limit(args, 20, 100);
  const [sets, sessions] = await Promise.all([listMySets(caller.ownerId, { size, offset: 0 }), listMySessions(caller.ownerId, { size: 10, offset: 0 })]);
  return {
    total_sets_logged: sets.total,
    sets: sets.items.map((s) => ({ date: s.performed_date, exercise: s.exercise_title, set_number: s.set_number, reps: s.reps, weight_kg: s.weight_kg, notes: s.notes })),
    total_sessions: sessions.total,
    recent_sessions: sessions.items.map((s) => ({ title: s.title, start_time: s.start_time, duration_minutes: s.duration_minutes, completed: s.completed, set_count: s.set_count, total_volume_kg: s.total_volume_kg })),
  };
}

// ── Registry ─────────────────────────────────────────────────────────────────────────

const object = (properties: Json, required: string[] = []): Json => ({ type: 'object', properties, required, additionalProperties: false });
const string = (description: string): Json => ({ type: 'string', description });

export const TOOLS: McpTool[] = [
  {
    name: 'search',
    title: 'Search Massimino',
    description:
      'Search Massimino\'s open fitness data: exercises, training programmes, public teams and Eurostat physical-activity figures by country. Returns ids to pass to fetch. Use short keyword queries such as "squat", "hiit" or "Sweden".',
    inputSchema: object({ query: string('Keywords to search for.') }, ['query']),
    run: search,
  },
  {
    name: 'fetch',
    title: 'Fetch a Massimino record',
    description: 'Get the full text of one record by an id returned from search: an exercise with its instructions, a programme with all its workouts, a team, or a country\'s figures.',
    inputSchema: object({ id: string('An id from search, for example "exercise:7d0f..." or "program:hiit-workout".') }, ['id']),
    run: fetchRecord,
  },
  {
    name: 'find_exercises',
    title: 'Find exercises',
    description:
      'Find exercises with step-by-step instructions, filtered by any of: text in the name, muscle group, equipment, difficulty. Use this to build or explain a workout. All exercises are public-domain.',
    inputSchema: object({
      query: string('Text to find in the exercise name, for example "squat".'),
      muscle_group: string('For example quadriceps, hamstrings, glutes, chest, shoulders, lats, biceps, triceps, abdominals, calves, lower_back.'),
      equipment: string('For example barbell, dumbbell, kettlebells, cable, machine, bands, body_only.'),
      difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], description: 'Difficulty level.' },
      limit: { type: 'integer', minimum: 1, maximum: 25, description: 'How many to return. Default 8.' },
    }),
    run: findExercises,
  },
  {
    name: 'list_programs',
    title: 'List training programmes',
    description: 'List Massimino\'s open training programmes (HIIT, balance, flexibility, cardio, plyometrics, periodised strength, programmes for new parents and for people short of time) with level, length and sessions per week.',
    inputSchema: object({}),
    run: listProgramsTool,
  },
  {
    name: 'get_program',
    title: 'Get a training programme',
    description: 'Get one training programme in full: every workout in order, with exercises, sets, repetitions and rest. Use an identifier from list_programs.',
    inputSchema: object({ program: string('The programme identifier, for example "hiit-workout".') }, ['program']),
    run: getProgramTool,
  },
  {
    name: 'list_teams',
    title: 'List public teams',
    description: 'List the public training teams on Massimino that people can join, with their description and how many places are left. No member or contact details.',
    inputSchema: object({}),
    run: listTeamsTool,
  },
  {
    name: 'get_country_fitness_data',
    title: 'Fitness figures for a European country',
    description:
      'Eurostat figures for one European country: the share of adults meeting the WHO physical-activity guideline, and employment in sport, each with the EU27 value for comparison.',
    inputSchema: object({ country: string('A two-letter ISO code (SE) or an English country name (Sweden).') }, ['country']),
    run: countryData,
  },
  {
    name: 'get_my_workout_log',
    title: 'My workout log',
    description: 'The workout log of the person who signed in (or whose API key is connected): the sets they logged (date, exercise, repetitions, weight) and their recent sessions. Personal data, read-only.',
    inputSchema: object({ limit: { type: 'integer', minimum: 1, maximum: 100, description: 'How many recent sets to return. Default 20.' } }),
    scope: SCOPES.workoutLogRead,
    run: myWorkoutLog,
  },
];

/** The tools this caller may see: personal tools only with a key that carries their scope */
export function toolsFor(caller: Caller): McpTool[] {
  return TOOLS.filter((tool) => !tool.scope || caller.scopes.includes(tool.scope));
}
