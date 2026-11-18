// GET /api/v1/me/workout-sets/{set}
import { allowParams, notFound, ownerOf, publicRoute, SCOPES } from '@/lib/public-api/http';
import { getMySet } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute<{ set: string }>(
  async (req, { params }, caller) => {
    allowParams(req, []);
    return (
      (await getMySet(ownerOf(caller), params.set)) ??
      notFound('WORKOUT_SET_NOT_FOUND', 'You have no logged set with this identifier.', { set: params.set })
    );
  },
  { scope: SCOPES.workoutLogRead }
);
