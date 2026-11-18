// GET /api/v1/openapi.json  : the contract
import { publicRoute } from '@/lib/public-api/http';
import { openApiDocument } from '@/lib/public-api/openapi';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute(async () => openApiDocument);
