// GET /api/v1/teams/{team}
import { allowParams, notFound, publicRoute } from '@/lib/public-api/http';
import { getTeam } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute<{ team: string }>(async (req, { params }) => {
  allowParams(req, []);
  // A private team answers exactly like a missing one, so its existence is not revealed
  return (await getTeam(params.team)) ?? notFound('TEAM_NOT_FOUND', 'There is no public team with this identifier.', { team: params.team });
});
