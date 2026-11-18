// GET /api/v1/programs/{program}
import { allowParams, notFound, publicRoute } from '@/lib/public-api/http';
import { getProgram } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute<{ program: string }>(async (req, { params }) => {
  allowParams(req, []);
  return (await getProgram(params.program)) ?? notFound('PROGRAM_NOT_FOUND', 'There is no programme with this identifier.', { program: params.program });
});
