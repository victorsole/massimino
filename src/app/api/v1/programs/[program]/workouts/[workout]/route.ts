// GET /api/v1/programs/{program}/workouts/{workout}
import { allowParams, notFound, publicRoute } from '@/lib/public-api/http';
import { getWorkout } from '@/lib/public-api/resources';

export const dynamic = 'force-dynamic';
export { OPTIONS } from '@/lib/public-api/http';

export const GET = publicRoute<{ program: string; workout: string }>(async (req, { params }) => {
  allowParams(req, []);
  const workout = await getWorkout(params.program, params.workout);
  if (workout === undefined) notFound('PROGRAM_NOT_FOUND', 'There is no programme with this identifier.', { program: params.program });
  return workout ?? notFound('WORKOUT_NOT_FOUND', 'This programme has no workout with this number.', { program: params.program, workout: params.workout });
});
