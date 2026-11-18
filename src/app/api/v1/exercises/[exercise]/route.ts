// GET /api/v1/exercises/{exercise}
import { allowParams, notFound, publicRoute } from '@/lib/public-api/http';
import { getExercise } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute<{ exercise: string }>(async (req, { params }) => {
  allowParams(req, []);
  return (await getExercise(params.exercise)) ?? notFound('EXERCISE_NOT_FOUND', 'There is no exercise with this identifier.', { exercise: params.exercise });
});
