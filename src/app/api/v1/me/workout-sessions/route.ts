// GET /api/v1/me/workout-sessions  : the key owner's own workout sessions
import { allowParams, nextPageToken, ownerOf, publicRoute, readPage, SCOPES } from '@/lib/public-api/http';
import { listMySessions } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute(
  async (req, _ctx, caller) => {
    allowParams(req, []);
    const page = readPage(req);
    const { total, items } = await listMySessions(ownerOf(caller), page);
    return { workout_sessions: items, next_page_token: nextPageToken(req, page, items.length, total), total_size: total };
  },
  { scope: SCOPES.workoutLogRead }
);
