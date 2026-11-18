// GET /api/v1/programs/{program}/workouts
import { allowParams, nextPageToken, notFound, publicRoute, readPage } from '@/lib/public-api/http';
import { listWorkouts } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute<{ program: string }>(async (req, { params }) => {
  allowParams(req, []);
  const page = readPage(req);
  const result = await listWorkouts(params.program, page);
  if (!result) notFound('PROGRAM_NOT_FOUND', 'There is no programme with this identifier.', { program: params.program });
  const { total, items } = result!;
  return { workouts: items, next_page_token: nextPageToken(req, page, items.length, total), total_size: total };
});
