// src/lib/public-api/openapi.ts
// The contract for the public API, served at /api/v1/openapi.json. Handlers implement
// this document; when the two disagree, fix one of them in the same change.
//
// Identifiers are American English (AIP-190: "program", "color"); prose is British English.

import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX, RATE_LIMIT, SITE_URL } from './http';

type Schema = Record<string, unknown>;

const str = (description: string, extra: Schema = {}): Schema => ({ type: 'string', description, ...extra });
const nullableStr = (description: string): Schema => ({ type: ['string', 'null'], description });
const int = (description: string, extra: Schema = {}): Schema => ({ type: 'integer', description, ...extra });
const nullableNum = (description: string): Schema => ({ type: ['number', 'null'], description });
const arr = (items: Schema, description: string): Schema => ({ type: 'array', items, description });

/** The canonical fields every resource carries */
const canonical = (resource: string, example: string): Record<string, Schema> => ({
  name: str(`Resource name. Stable for the life of the ${resource}, across API versions.`, { examples: [example] }),
  uid: str('System-assigned identifier. Output only.'),
  title: str('Human-readable label.'),
  body_txt: str('All the text of the resource as plain text. Paragraphs are separated by a blank line.'),
  body_html: str('The same text as minimal HTML (p, ul, ol, li, strong). Generated and escaped by the API; safe to insert into a page.'),
  lang: nullableStr('BCP 47 language of the text, or null when it is not known.'),
  uri: str('The page for this resource on massimino.fitness.', { format: 'uri' }),
  source: {
    type: 'object',
    description: 'Where the content comes from.',
    properties: { title: str('Name of the source.'), uri: str('Address of the source.', { format: 'uri' }) },
    required: ['title', 'uri'],
  },
  license: nullableStr('SPDX licence identifier for reuse, or null when the content is shown publicly but not licensed for reuse.'),
  create_time: str('When the record was created. RFC 3339, UTC.', { format: 'date-time' }),
  update_time: str('When the record last changed. RFC 3339, UTC.', { format: 'date-time' }),
});

const CANONICAL_REQUIRED = ['name', 'uid', 'title', 'body_txt', 'body_html', 'lang', 'uri', 'source', 'license', 'create_time', 'update_time'];

const workoutExercise: Schema = {
  type: 'object',
  description: 'One exercise inside a workout.',
  properties: {
    title: str('Name of the exercise or activity.'),
    sets: nullableNum('Number of sets, or null when the entry is a single block of work.'),
    reps: nullableStr('Repetitions or duration per set as written by the author, for example "8-12" or "30 sec".'),
    rest_seconds: nullableNum('Rest between sets, in seconds.'),
    notes: nullableStr('Coaching notes.'),
  },
  required: ['title', 'sets', 'reps', 'rest_seconds', 'notes'],
};

const schemas: Record<string, Schema> = {
  Exercise: {
    type: 'object',
    description: 'An exercise with its instructions. Version 1 serves the exercises that are in the public domain.',
    properties: {
      ...canonical('exercise', 'exercises/7d0f13ee-c162-4221-8a8f-ca89d984e570'),
      difficulty: nullableStr('beginner, intermediate or advanced.'),
      category: nullableStr('Broad category, for example strength.'),
      exercise_type: nullableStr('Kind of work, for example resistance or mobility.'),
      body_part: nullableStr('Main body part trained.'),
      muscle_groups: arr({ type: 'string' }, 'Muscle groups trained, most important first.'),
      equipment: arr({ type: 'string' }, 'Equipment needed. Empty when none is.'),
      image_uri: nullableStr('A photo of the exercise, or null.'),
    },
    required: [...CANONICAL_REQUIRED, 'difficulty', 'category', 'exercise_type', 'body_part', 'muscle_groups', 'equipment', 'image_uri'],
  },
  Program: {
    type: 'object',
    description: 'A training programme: a planned series of workouts.',
    properties: {
      ...canonical('programme', 'programs/hiit-workout'),
      level: nullableStr('Intended level, for example beginner.'),
      category: nullableStr('Kind of programme, for example conditioning.'),
      duration_weeks: nullableNum('Length of the programme in weeks.'),
      sessions_per_week: nullableNum('Planned sessions per week.'),
      equipment: arr({ type: 'string' }, 'Equipment the programme uses.'),
      workout_count: int('Number of workouts in the programme.'),
      workouts: str('Resource name of the collection of workouts.', { examples: ['programs/hiit-workout/workouts'] }),
    },
    required: [...CANONICAL_REQUIRED, 'level', 'category', 'duration_weeks', 'sessions_per_week', 'equipment', 'workout_count', 'workouts'],
  },
  Workout: {
    type: 'object',
    description: 'One session of a programme.',
    properties: {
      ...canonical('workout', 'programs/hiit-workout/workouts/1'),
      parent: str('Resource name of the programme this workout belongs to.'),
      sequence: int('Position in the programme, starting at 1.', { minimum: 1 }),
      week: nullableNum('Week of the programme, when the author states it.'),
      focus: nullableStr('What the session concentrates on.'),
      duration_minutes: nullableNum('Planned length in minutes.'),
      exercises: arr({ $ref: '#/components/schemas/WorkoutExercise' }, 'The exercises, in order.'),
    },
    required: [...CANONICAL_REQUIRED, 'parent', 'sequence', 'week', 'focus', 'duration_minutes', 'exercises'],
  },
  WorkoutExercise: workoutExercise,
  Team: {
    type: 'object',
    description: 'A public training team. Members, trainers and contact details are never included.',
    properties: {
      ...canonical('team', 'teams/59a6b466-d856-4b3a-a0a6-a9fda688c618'),
      team_type: nullableStr('Kind of team.'),
      member_count: int('Current number of members.', { minimum: 0 }),
      max_members: int('Capacity.', { minimum: 0 }),
      open_spots: int('Places left.', { minimum: 0 }),
    },
    required: [...CANONICAL_REQUIRED, 'team_type', 'member_count', 'max_members', 'open_spots'],
  },
  Country: {
    type: 'object',
    description: 'Eurostat figures on physical activity and sport employment for one country.',
    properties: {
      ...canonical('country', 'fitness-intelligence/countries/SE'),
      iso_code: str('ISO 3166-1 alpha-2 code.', { examples: ['SE'] }),
      indicators: arr(
        {
          type: 'object',
          properties: {
            code: str('Eurostat dataset code, with a suffix when one dataset gives several measures.'),
            title: str('What is measured.'),
            value: { type: 'number', description: 'The figure, in the unit below.' },
            unit: str('percent or thousand_persons.'),
            year: int('Reference year.'),
            eu27_value: nullableNum('The same measure for the EU27.'),
            source_uri: str('The dataset at Eurostat.', { format: 'uri' }),
          },
          required: ['code', 'title', 'value', 'unit', 'year', 'eu27_value', 'source_uri'],
        },
        'The figures available for this country.'
      ),
    },
    required: [...CANONICAL_REQUIRED, 'iso_code', 'indicators'],
  },
  Error: {
    type: 'object',
    description: 'The one error shape for the whole API.',
    properties: {
      error: {
        type: 'object',
        properties: {
          code: int('The HTTP status code.'),
          status: str('Stable error category.', {
            enum: ['INVALID_ARGUMENT', 'UNAUTHENTICATED', 'PERMISSION_DENIED', 'NOT_FOUND', 'RESOURCE_EXHAUSTED', 'INTERNAL'],
          }),
          message: str('An explanation for a person. The wording may change; do not match on it.'),
          details: arr(
            {
              type: 'object',
              properties: {
                reason: str('Stable machine-readable reason, for example EXERCISE_NOT_FOUND. Match on this.'),
                metadata: { type: 'object', additionalProperties: { type: 'string' }, description: 'Values referred to in the message.' },
              },
              required: ['reason', 'metadata'],
            },
            'Structured detail.'
          ),
        },
        required: ['code', 'status', 'message', 'details'],
      },
    },
    required: ['error'],
  },
};

const pageParameters = [
  {
    name: 'page_size',
    in: 'query',
    description: `How many items to return. Omitted or 0 means ${PAGE_SIZE_DEFAULT}. Values above ${PAGE_SIZE_MAX} are reduced to ${PAGE_SIZE_MAX}.`,
    schema: { type: 'integer', minimum: 0, maximum: PAGE_SIZE_MAX, default: PAGE_SIZE_DEFAULT },
  },
  {
    name: 'page_token',
    in: 'query',
    description: 'The next_page_token from the previous response, unchanged. Keep the other parameters the same while paging.',
    schema: { type: 'string' },
  },
];

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const commonErrors = {
  '400': errorResponse('A parameter is not valid.'),
  '401': errorResponse('The API key is malformed or not recognised.'),
  '403': errorResponse('The API key has been revoked.'),
  '429': errorResponse('Too many requests. See the Retry-After header.'),
};

const listOperation = (id: string, summary: string, field: string, schema: string, parameters: unknown[] = [], extraErrors: Schema = {}) => ({
  operationId: id,
  summary,
  parameters: [...parameters, ...pageParameters],
  responses: {
    '200': {
      description: 'A page of results.',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              [field]: { type: 'array', items: { $ref: `#/components/schemas/${schema}` } },
              next_page_token: str('Pass this as page_token to get the next page. Empty when there are no more results.'),
              total_size: int('How many items match in total.'),
            },
            required: [field, 'next_page_token', 'total_size'],
          },
        },
      },
    },
    ...commonErrors,
    ...extraErrors,
  },
});

const getOperation = (id: string, summary: string, schema: string, parameters: unknown[]) => ({
  operationId: id,
  summary,
  parameters,
  responses: {
    '200': { description: 'The resource.', content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } } },
    ...commonErrors,
    '404': errorResponse('Nothing public exists with this identifier.'),
  },
});

const pathParam = (name: string, description: string) => ({ name, in: 'path', required: true, description, schema: { type: 'string' } });
const queryParam = (name: string, description: string) => ({ name, in: 'query', description, schema: { type: 'string' } });

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Massimino API',
    version: '1.0.0',
    summary: 'Open, read-only fitness data from Massimino.',
    description: [
      'Exercises, training programmes with their workouts, public teams and Eurostat fitness figures, for anyone building a fitness product.',
      '',
      `No key is needed. Without one you get about ${RATE_LIMIT.anonymous.maxRequests} requests a minute; with a free key from ${SITE_URL}/developers, about ${RATE_LIMIT.keyed.maxRequests}. The limits are counted per server, so treat them as approximate.`,
      '',
      'Every resource carries the same core fields: name, uid, title, body_txt, body_html, lang, uri, source, license, create_time and update_time. Check license before reusing content: null means the content is public but not licensed for reuse.',
      '',
      'Field names use American English (program, not programme). Fields are only ever added within version 1, never renamed or removed.',
    ].join('\n'),
    license: { name: 'Apache-2.0', identifier: 'Apache-2.0' },
    contact: { name: 'Massimino', url: `${SITE_URL}/contact` },
  },
  servers: [{ url: `${SITE_URL}/api/v1` }],
  security: [{}, { bearerKey: [] }, { headerKey: [] }],
  tags: [
    { name: 'Exercises' },
    { name: 'Programs', description: 'Training programmes and their workouts.' },
    { name: 'Teams' },
    { name: 'Fitness Intelligence' },
  ],
  paths: {
    '/exercises': {
      get: {
        tags: ['Exercises'],
        ...listOperation('listExercises', 'List exercises', 'exercises', 'Exercise', [
          queryParam('q', 'Text to find in the title. Case-insensitive.'),
          queryParam('muscle_group', 'A muscle group as returned in muscle_groups, for example triceps.'),
          queryParam('equipment', 'A piece of equipment as returned in equipment, for example dumbbell.'),
          queryParam('difficulty', 'beginner, intermediate or advanced.'),
        ]),
      },
    },
    '/exercises/{exercise}': {
      get: { tags: ['Exercises'], ...getOperation('getExercise', 'Get an exercise', 'Exercise', [pathParam('exercise', 'The uid of the exercise.')]) },
    },
    '/programs': {
      get: { tags: ['Programs'], ...listOperation('listPrograms', 'List programmes', 'programs', 'Program') },
    },
    '/programs/{program}': {
      get: { tags: ['Programs'], ...getOperation('getProgram', 'Get a programme', 'Program', [pathParam('program', 'The uid of the programme.')]) },
    },
    '/programs/{program}/workouts': {
      get: {
        tags: ['Programs'],
        ...listOperation('listWorkouts', 'List the workouts of a programme', 'workouts', 'Workout', [pathParam('program', 'The uid of the programme.')], {
          '404': errorResponse('There is no programme with this identifier.'),
        }),
      },
    },
    '/programs/{program}/workouts/{workout}': {
      get: {
        tags: ['Programs'],
        ...getOperation('getWorkout', 'Get one workout', 'Workout', [
          pathParam('program', 'The uid of the programme.'),
          pathParam('workout', 'The sequence number of the workout, starting at 1.'),
        ]),
      },
    },
    '/teams': {
      get: { tags: ['Teams'], ...listOperation('listTeams', 'List public teams', 'teams', 'Team') },
    },
    '/teams/{team}': {
      get: { tags: ['Teams'], ...getOperation('getTeam', 'Get a public team', 'Team', [pathParam('team', 'The uid of the team.')]) },
    },
    '/fitness-intelligence/countries': {
      get: { tags: ['Fitness Intelligence'], ...listOperation('listCountries', 'List countries with Eurostat figures', 'countries', 'Country') },
    },
    '/fitness-intelligence/countries/{country}': {
      get: {
        tags: ['Fitness Intelligence'],
        ...getOperation('getCountry', 'Get the figures for one country', 'Country', [pathParam('country', 'Two-letter ISO country code, for example SE.')]),
      },
    },
  },
  components: {
    schemas,
    securitySchemes: {
      bearerKey: { type: 'http', scheme: 'bearer', description: 'Authorization: Bearer <your key>' },
      headerKey: { type: 'apiKey', in: 'header', name: 'X-API-Key', description: 'An alternative to the Authorization header.' },
    },
  },
} as const;
