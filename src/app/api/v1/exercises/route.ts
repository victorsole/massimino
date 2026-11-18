// GET /api/v1/exercises
import { allowParams, nextPageToken, publicRoute, readPage, textParam } from '@/lib/public-api/http';
import { listExercises } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute(async (req) => {
  allowParams(req, ['q', 'muscle_group', 'equipment', 'difficulty']);
  const page = readPage(req);
  const { total, items } = await listExercises(
    {
      q: textParam(req, 'q'),
      muscle_group: textParam(req, 'muscle_group'),
      equipment: textParam(req, 'equipment'),
      difficulty: textParam(req, 'difficulty'),
    },
    page
  );
  return { exercises: items, next_page_token: nextPageToken(req, page, items.length, total), total_size: total };
});
