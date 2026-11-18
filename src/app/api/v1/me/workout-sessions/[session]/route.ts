// GET /api/v1/me/workout-sessions/{session}
import { allowParams, notFound, ownerOf, publicRoute, SCOPES } from '@/lib/public-api/http';
import { getMySession } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute<{ session: string }>(
  async (req, { params }, caller) => {
    allowParams(req, []);
    // Someone else's session answers exactly like one that does not exist
    return (
      (await getMySession(ownerOf(caller), params.session)) ??
      notFound('WORKOUT_SESSION_NOT_FOUND', 'You have no workout session with this identifier.', { session: params.session })
    );
  },
  { scope: SCOPES.workoutLogRead }
);
