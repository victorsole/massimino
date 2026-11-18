// GET /api/v1/programs
import { allowParams, nextPageToken, publicRoute, readPage } from '@/lib/public-api/http';
import { listPrograms } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute(async (req) => {
  allowParams(req, []);
  const page = readPage(req);
  const { total, items } = await listPrograms(page);
  return { programs: items, next_page_token: nextPageToken(req, page, items.length, total), total_size: total };
});
