// GET /api/v1  : the entry point, a map of what the API serves
import { allowParams, API_VERSION, PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX, publicRoute, RATE_LIMIT, SITE_URL } from '@/lib/public-api/http';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute(async (req) => {
  allowParams(req, []);
  const base = `${SITE_URL}/api/${API_VERSION}`;
  return {
    title: 'Massimino API',
    version: API_VERSION,
    documentation_uri: `${SITE_URL}/developers`,
    openapi_uri: `${base}/openapi.json`,
    collections: {
      exercises: `${base}/exercises`,
      programs: `${base}/programs`,
      teams: `${base}/teams`,
      countries: `${base}/fitness-intelligence/countries`,
    },
    personal: {
      workout_sets: `${base}/me/workout-sets`,
      workout_sessions: `${base}/me/workout-sessions`,
      requires: 'An API key with the workout_log.read permission. Returns only the key owner\'s sessions.',
    },
    pagination: { page_size_default: PAGE_SIZE_DEFAULT, page_size_max: PAGE_SIZE_MAX },
    rate_limits: {
      without_key_per_minute: RATE_LIMIT.anonymous.maxRequests,
      with_key_per_minute: RATE_LIMIT.keyed.maxRequests,
    },
  };
});
