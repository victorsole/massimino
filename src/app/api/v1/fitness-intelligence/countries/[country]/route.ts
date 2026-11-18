// GET /api/v1/fitness-intelligence/countries/{country}
import { allowParams, notFound, publicRoute } from '@/lib/public-api/http';
import { getCountry } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute<{ country: string }>(async (req, { params }) => {
  allowParams(req, []);
  return getCountry(params.country) ?? notFound('COUNTRY_NOT_FOUND', 'There is no data for this country code. Use a two-letter ISO code, for example SE.', { country: params.country });
});
