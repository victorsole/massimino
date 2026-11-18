// GET /api/v1/me/workout-sets  : every set the key owner has logged, newest first
import { allowParams, nextPageToken, ownerOf, publicRoute, readPage, SCOPES } from '@/lib/public-api/http';
import { listMySets } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute(
  async (req, _ctx, caller) => {
    allowParams(req, []);
    const page = readPage(req);
    const { total, items } = await listMySets(ownerOf(caller), page);
    return { workout_sets: items, next_page_token: nextPageToken(req, page, items.length, total), total_size: total };
  },
  { scope: SCOPES.workoutLogRead }
);
