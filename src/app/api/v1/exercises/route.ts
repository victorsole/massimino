// GET /api/v1/exercises
import { allowParams, nextPageToken, publicRoute, readPage } from '@/lib/public-api/http';
import { listExercises } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute(async (req) => {
  allowParams(req, ['q', 'muscle_group', 'equipment', 'difficulty']);
  const page = readPage(req);
  const p = req.nextUrl.searchParams;
  const { total, items } = await listExercises(
    { q: p.get('q'), muscle_group: p.get('muscle_group'), equipment: p.get('equipment'), difficulty: p.get('difficulty') },
    page
  );
  return { exercises: items, next_page_token: nextPageToken(req, page, items.length, total), total_size: total };
});
