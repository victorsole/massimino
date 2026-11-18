// GET /api/v1/fitness-intelligence/countries
import { allowParams, nextPageToken, publicRoute, readPage } from '@/lib/public-api/http';
import { listCountries } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute(async (req) => {
  allowParams(req, []);
  const page = readPage(req);
  const { total, items } = listCountries(page);
  return { countries: items, next_page_token: nextPageToken(req, page, items.length, total), total_size: total };
});
