'use client';

// src/app/developers/api_console.tsx
// The console on /developers: pick an endpoint, fill in its parameters, run it against
// the live API and see the response with the matching curl command. Signed-in users
// also manage their API keys here.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Check, Copy, KeyRound, Play, Trash2 } from 'lucide-react';
import { notify, confirmAction } from '@/lib/notify';

type Param = { name: string; in: 'path' | 'query'; placeholder: string; hint: string; required?: boolean; example?: string };

type Endpoint = { id: string; group: string; label: string; path: string; summary: string; params: Param[]; needsKey?: boolean };

const PAGE_PARAMS: Param[] = [
  { name: 'page_size', in: 'query', placeholder: '25', hint: 'Items per page, up to 100.' },
  { name: 'page_token', in: 'query', placeholder: '', hint: 'next_page_token from the previous response.' },
];

const ENDPOINTS: Endpoint[] = [
  { id: 'index', group: 'Start here', label: 'API index', path: '/api/v1', summary: 'What the API serves, its limits and where the contract is.', params: [] },
  {
    id: 'listExercises',
    group: 'Exercises',
    label: 'List exercises',
    path: '/api/v1/exercises',
    summary: 'Public-domain exercises with instructions.',
    params: [
      { name: 'q', in: 'query', placeholder: 'squat', hint: 'Text to find in the title.', example: 'squat' },
      { name: 'muscle_group', in: 'query', placeholder: 'quadriceps', hint: 'A muscle group.' },
      { name: 'equipment', in: 'query', placeholder: 'barbell', hint: 'A piece of equipment.' },
      { name: 'difficulty', in: 'query', placeholder: 'beginner', hint: 'beginner, intermediate or advanced.' },
      ...PAGE_PARAMS,
    ],
  },
  {
    id: 'getExercise',
    group: 'Exercises',
    label: 'Get an exercise',
    path: '/api/v1/exercises/{exercise}',
    summary: 'One exercise by its uid.',
    params: [{ name: 'exercise', in: 'path', placeholder: 'uid from the list', hint: 'The uid of an exercise.', required: true }],
  },
  { id: 'listPrograms', group: 'Programmes', label: 'List programmes', path: '/api/v1/programs', summary: 'Training programmes written for Massimino.', params: PAGE_PARAMS },
  {
    id: 'getProgram',
    group: 'Programmes',
    label: 'Get a programme',
    path: '/api/v1/programs/{program}',
    summary: 'One programme by its uid.',
    params: [{ name: 'program', in: 'path', placeholder: 'hiit-workout', hint: 'The uid of a programme.', required: true, example: 'hiit-workout' }],
  },
  {
    id: 'listWorkouts',
    group: 'Programmes',
    label: 'List its workouts',
    path: '/api/v1/programs/{program}/workouts',
    summary: 'The sessions of a programme, in order.',
    params: [{ name: 'program', in: 'path', placeholder: 'hiit-workout', hint: 'The uid of a programme.', required: true, example: 'hiit-workout' }, ...PAGE_PARAMS],
  },
  {
    id: 'getWorkout',
    group: 'Programmes',
    label: 'Get one workout',
    path: '/api/v1/programs/{program}/workouts/{workout}',
    summary: 'One session by its sequence number.',
    params: [
      { name: 'program', in: 'path', placeholder: 'hiit-workout', hint: 'The uid of a programme.', required: true, example: 'hiit-workout' },
      { name: 'workout', in: 'path', placeholder: '1', hint: 'Sequence number, starting at 1.', required: true, example: '1' },
    ],
  },
  { id: 'listTeams', group: 'Teams', label: 'List public teams', path: '/api/v1/teams', summary: 'Public teams. No members or contact details.', params: PAGE_PARAMS },
  {
    id: 'getTeam',
    group: 'Teams',
    label: 'Get a public team',
    path: '/api/v1/teams/{team}',
    summary: 'One public team by its uid.',
    params: [{ name: 'team', in: 'path', placeholder: 'uid from the list', hint: 'The uid of a team.', required: true }],
  },
  {
    id: 'listCountries',
    group: 'Fitness Intelligence',
    label: 'List countries',
    path: '/api/v1/fitness-intelligence/countries',
    summary: 'Eurostat figures on physical activity and sport employment.',
    params: PAGE_PARAMS,
  },
  {
    id: 'getCountry',
    group: 'Fitness Intelligence',
    label: 'Get a country',
    path: '/api/v1/fitness-intelligence/countries/{country}',
    summary: 'The figures for one country.',
    params: [{ name: 'country', in: 'path', placeholder: 'SE', hint: 'Two-letter ISO code.', required: true, example: 'SE' }],
  },
  {
    id: 'listMySets',
    group: 'Your workout log',
    label: 'List your logged sets',
    path: '/api/v1/me/workout-sets',
    summary: 'Every set you have logged, newest first: your complete log. Needs a key with the workout log permission.',
    params: PAGE_PARAMS,
    needsKey: true,
  },
  {
    id: 'getMySet',
    group: 'Your workout log',
    label: 'Get one logged set',
    path: '/api/v1/me/workout-sets/{set}',
    summary: 'One set by its uid. Needs a key with the workout log permission.',
    params: [{ name: 'set', in: 'path', placeholder: 'uid from the list', hint: 'The uid of one of your sets.', required: true }],
    needsKey: true,
  },
  {
    id: 'listMySessions',
    group: 'Your workout log',
    label: 'List your sessions',
    path: '/api/v1/me/workout-sessions',
    summary: 'Your own logged sessions, newest first. Needs a key with the workout log permission.',
    params: PAGE_PARAMS,
    needsKey: true,
  },
  {
    id: 'getMySession',
    group: 'Your workout log',
    label: 'Get one of your sessions',
    path: '/api/v1/me/workout-sessions/{session}',
    summary: 'One of your own sessions by its uid. Needs a key with the workout log permission.',
    params: [{ name: 'session', in: 'path', placeholder: 'uid from the list', hint: 'The uid of one of your sessions.', required: true }],
    needsKey: true,
  },
];

type Result = { status: number; ms: number; limit: string | null; remaining: string | null; body: string };

type KeyRecord = { id: string; label: string; prefix: string; scopes: string[]; createdAt: string; lastUsedAt: string | null; revokedAt: string | null };

const WORKOUT_LOG_SCOPE = 'workout_log.read';

/**
 * Copies text. The Clipboard API can refuse, or never answer (no permission, page not
 * focused), so it gets a short time limit and an old-fashioned fallback.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      const done = await Promise.race([
        navigator.clipboard.writeText(text).then(() => true),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 800)),
      ]);
      if (done) return true;
    }
  } catch {
    // fall through to the fallback
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } else {
          notify('Copying is not available in this browser. Select the text and copy it by hand.');
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </button>
  );
}

export function ApiConsole() {
  const { status: sessionStatus } = useSession();
  const [endpointId, setEndpointId] = useState('listExercises');
  const [values, setValues] = useState<Record<string, string>>({ q: 'squat', page_size: '2' });
  const [apiKey, setApiKey] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  const endpoint = ENDPOINTS.find((e) => e.id === endpointId) ?? ENDPOINTS[0];

  const { url, missing } = useMemo(() => {
    let path = endpoint.path;
    const query = new URLSearchParams();
    const missingParams: string[] = [];
    for (const param of endpoint.params) {
      const value = (values[param.name] ?? '').trim();
      if (param.in === 'path') {
        if (!value) missingParams.push(param.name);
        path = path.replace(`{${param.name}}`, encodeURIComponent(value || `{${param.name}}`));
      } else if (value) {
        query.set(param.name, value);
      }
    }
    const qs = query.toString();
    return { url: qs ? `${path}?${qs}` : path, missing: missingParams };
  }, [endpoint, values]);

  // Same text on the server and on first paint (no hydration mismatch); the real origin
  // is filled in once the page is running in the browser.
  const [origin, setOrigin] = useState('https://massimino.fitness');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const curl = `curl ${apiKey ? `-H "Authorization: Bearer ${apiKey}" ` : ''}"${origin}${url}"`;

  const selectEndpoint = (id: string) => {
    const next = ENDPOINTS.find((e) => e.id === id);
    if (!next) return;
    setEndpointId(id);
    setResult(null);
    // Start each endpoint with its examples filled in, so Run works straight away
    setValues(Object.fromEntries(next.params.filter((p) => p.example).map((p) => [p.name, p.example as string])));
  };

  const run = async () => {
    if (missing.length || running) return;
    setRunning(true);
    const started = performance.now();
    try {
      const response = await fetch(url, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined, cache: 'no-store' });
      const text = await response.text();
      let body = text;
      try {
        body = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // not JSON: show it as it came
      }
      setResult({
        status: response.status,
        ms: Math.round(performance.now() - started),
        limit: response.headers.get('X-RateLimit-Limit'),
        remaining: response.headers.get('X-RateLimit-Remaining'),
        body,
      });
    } catch {
      setResult({ status: 0, ms: Math.round(performance.now() - started), limit: null, remaining: null, body: 'The request did not reach the API. Check your connection and try again.' });
    } finally {
      setRunning(false);
      // On a narrow screen the response sits below the form: bring it into view
      if (window.matchMedia('(max-width: 1023px)').matches) {
        responseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // ── Keys ──
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [allowWorkoutLog, setAllowWorkoutLog] = useState(false);
  const [freshKey, setFreshKey] = useState<string | null>(null);

  const loadKeys = async () => {
    try {
      const response = await fetch('/api/developer/keys', { cache: 'no-store' });
      const json = await response.json();
      if (json?.success) setKeys(json.data.keys);
    } catch {
      // the panel shows its empty state
    } finally {
      setKeysLoaded(true);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'authenticated') loadKeys();
  }, [sessionStatus]);

  const createKey = async () => {
    if (!label.trim() || creating) return;
    setCreating(true);
    try {
      const response = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, scopes: allowWorkoutLog ? [WORKOUT_LOG_SCOPE] : [] }),
      });
      const json = await response.json();
      if (!json?.success) {
        notify(json?.error?.message || 'We could not create the key. Please try again.');
        return;
      }
      setFreshKey(json.data.key);
      setApiKey(json.data.key);
      setLabel('');
      setAllowWorkoutLog(false);
      await loadKeys();
    } catch {
      notify('We could not create the key. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (key: KeyRecord) => {
    if (!(await confirmAction(`Revoke the key "${key.label}"? Anything using it will stop working. This cannot be undone.`))) return;
    try {
      const response = await fetch(`/api/developer/keys/${key.id}`, { method: 'DELETE' });
      const json = await response.json();
      if (!json?.success) {
        notify(json?.error?.message || 'We could not revoke the key. Please try again.');
        return;
      }
      // If the revoked key is the one in the console, take it out: it no longer works
      if (apiKey.startsWith(key.prefix)) setApiKey('');
      if (freshKey?.startsWith(key.prefix)) setFreshKey(null);
      await loadKeys();
      notify(`The key "${key.label}" has been revoked.`);
    } catch {
      notify('We could not revoke the key. Please try again.');
    }
  };

  const groups = [...new Set(ENDPOINTS.map((e) => e.group))];
  const statusTone = !result ? '' : result.status >= 200 && result.status < 300 ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200';

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* ── Request ── */}
      <div className="lg:col-span-5">
        <div className="rounded-card bg-card p-6 shadow-soft sm:p-8">
          <label htmlFor="endpoint" className="block text-xs font-semibold uppercase tracking-wider text-brand-primary/70">
            Endpoint
          </label>
          <select
            id="endpoint"
            value={endpointId}
            onChange={(e) => selectEndpoint(e.target.value)}
            className="mt-2 w-full rounded-field border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            {groups.map((group) => (
              <optgroup key={group} label={group}>
                {ENDPOINTS.filter((e) => e.group === group).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-600">{endpoint.summary}</p>

          {endpoint.params.length > 0 && (
            <div className="mt-6 space-y-4">
              {endpoint.params.map((param) => (
                <div key={param.name}>
                  <label htmlFor={`param-${param.name}`} className="flex items-baseline justify-between text-sm font-medium text-gray-900">
                    <code className="font-mono text-[13px]">{param.name}</code>
                    <span className="text-xs font-normal text-gray-500">{param.required ? 'required' : 'optional'}</span>
                  </label>
                  <input
                    id={`param-${param.name}`}
                    type="text"
                    value={values[param.name] ?? ''}
                    onChange={(e) => setValues({ ...values, [param.name]: e.target.value })}
                    placeholder={param.placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    className="mt-1 w-full rounded-field border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                  <p className="mt-1 text-xs text-gray-500">{param.hint}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <label htmlFor="console-key" className="flex items-baseline justify-between text-sm font-medium text-gray-900">
              API key
              <span className="text-xs font-normal text-gray-500">optional</span>
            </label>
            <input
              id="console-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value.trim())}
              placeholder="msk_live_..."
              autoComplete="off"
              spellCheck={false}
              className="mt-1 w-full rounded-field border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
            <p className="mt-1 text-xs text-gray-500">Stays in this page. It is sent only with the requests you run here.</p>
          </div>

          <button
            type="button"
            onClick={run}
            disabled={running || missing.length > 0}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {running ? 'Running…' : 'Run request'}
          </button>
          {missing.length > 0 && <p className="mt-2 text-xs text-gray-600">Fill in {missing.join(', ')} to run this request.</p>}
          {endpoint.needsKey && !apiKey && (
            <p className="mt-2 text-xs text-gray-600">This endpoint needs a key with the workout log permission. Without one it answers 401.</p>
          )}
        </div>

        {/* ── Keys ── */}
        <div className="mt-8 rounded-card bg-card p-6 shadow-soft sm:p-8">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-brand-primary" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-brand-primary">Your API keys</h3>
          </div>

          {sessionStatus !== 'authenticated' ? (
            <p className="mt-3 text-sm text-gray-600">
              The API works without a key. For the higher limit,{' '}
              <Link href="/login" className="font-semibold text-brand-primary underline underline-offset-2">
                sign in
              </Link>{' '}
              and create a free key here.
            </p>
          ) : (
            <>
              {freshKey && (
                <div className="mt-4 rounded-field border border-emerald-300 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">Copy your key now. It will not be shown again.</p>
                  <code className="mt-2 block break-all rounded bg-white px-3 py-2 font-mono text-xs text-gray-900">{freshKey}</code>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <label htmlFor="key-label" className="sr-only">
                  Name for the new key
                </label>
                <input
                  id="key-label"
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="What is this key for?"
                  maxLength={60}
                  className="min-w-0 flex-1 rounded-field border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
                <button
                  type="button"
                  onClick={createKey}
                  disabled={creating || !label.trim()}
                  className="rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create key'}
                </button>
              </div>

              <label className="mt-3 flex items-start gap-2.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={allowWorkoutLog}
                  onChange={(e) => setAllowWorkoutLog(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span>
                  Let this key read my workout log
                  <span className="block text-xs text-gray-500">
                    Off by default. Only turn it on for a key you keep private: anyone holding it can read your sessions.
                  </span>
                </span>
              </label>

              <ul className="mt-4 divide-y divide-brand-primary/10">
                {keysLoaded && keys.length === 0 && <li className="py-3 text-sm text-gray-600">No keys yet.</li>}
                {keys.map((key) => (
                  <li key={key.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-medium ${key.revokedAt ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{key.label}</p>
                      <p className="font-mono text-xs text-gray-500">
                        {key.prefix === 'sign-in' ? 'signed in from an assistant app' : `${key.prefix}…`} · {key.revokedAt ? 'revoked' : key.lastUsedAt ? `last used ${new Date(key.lastUsedAt).toLocaleDateString('en-GB')}` : 'never used'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {key.scopes.includes(WORKOUT_LOG_SCOPE) ? 'Open data and your workout log' : 'Open data only'}
                      </p>
                    </div>
                    {!key.revokedAt && (
                      <button
                        type="button"
                        onClick={() => revokeKey(key)}
                        aria-label={`Revoke the key ${key.label}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Revoke
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* ── Response: stays in view while the (longer) request form scrolls ── */}
      <div ref={responseRef} className="scroll-mt-20 lg:sticky lg:top-24 lg:col-span-7 lg:self-start">
        <div className="overflow-hidden rounded-card bg-[#0f202c] shadow-soft-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
            <code className="min-w-0 break-all font-mono text-xs text-white/90">
              <span className="mr-2 rounded bg-white/10 px-1.5 py-0.5 font-semibold text-white">GET</span>
              {url}
            </code>
            <CopyButton text={curl} label="Copy curl" />
          </div>
          <pre className="overflow-x-auto border-b border-white/10 px-5 py-3 font-mono text-xs leading-relaxed text-white/70">{curl}</pre>

          <div className="flex flex-wrap items-center gap-3 px-5 py-3 text-xs text-white/70" aria-live="polite">
            {result ? (
              <>
                <span className={`rounded-full px-2.5 py-1 font-semibold ${statusTone}`}>{result.status === 0 ? 'No response' : `HTTP ${result.status}`}</span>
                <span>{result.ms} ms</span>
                {result.limit && (
                  <span>
                    {result.remaining} of {result.limit} requests left this minute
                  </span>
                )}
                <span className="ml-auto">
                  <CopyButton text={result.body} label="Copy response" />
                </span>
              </>
            ) : (
              <span>Run the request to see the response.</span>
            )}
          </div>
          <pre className="max-h-[min(640px,calc(100vh-18rem))] min-h-[240px] overflow-auto px-5 pb-6 font-mono text-xs leading-relaxed text-emerald-100" tabIndex={0}>
            {result ? result.body : ''}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default ApiConsole;
