/**
 * Authentication and ownership middleware for App Router API routes.
 *
 * Usage:
 *
 *   export const GET = withAuth(async ({ session }, req) => {
 *     return ok({ hello: session.user.id })
 *   })
 *
 *   export const POST = withAuth(async ({ session }, req, { params }) => {
 *     await assertOwnership(session, params.userId)
 *     ...
 *   })
 *
 * The helper resolves the NextAuth session, returns a uniform 401 on miss,
 * and forwards the raw request and route context to the handler so existing
 * patterns (request.json(), request.url, params) keep working.
 */

import { getServerSession, type Session } from 'next-auth'
import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'
import { authOptions } from '@/core'
import { fail } from './response'

export interface AuthContext {
  session: Session & { user: { id: string; email?: string | null; name?: string | null; role?: string } }
}

export interface RouteContext<P = Record<string, string>> {
  params: P
}

type Handler<P, R> = (
  ctx: AuthContext,
  req: NextRequest,
  routeCtx: RouteContext<P>
) => Promise<NextResponse<R>> | NextResponse<R>

/**
 * Wrap a route handler so it only runs for authenticated users.
 * Returns a uniform 401 with the standard envelope when no session is present.
 */
export function withAuth<P = Record<string, string>, R = unknown>(
  handler: Handler<P, R>
) {
  // Next.js App Router always passes the route context object (with params) as
  // the second argument; no default is required.
  return async (req: NextRequest, routeCtx: RouteContext<P>) => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return fail('AUTH_REQUIRED', 'Authentication required', 401)
    }
    return handler({ session: session as AuthContext['session'] }, req, routeCtx)
  }
}

/**
 * OwnershipError is thrown by assertOwnership and assertOwnershipAsync.
 * Routes can catch it and return the standard 403 envelope, or use
 * the assertOwnershipOrFail helper that returns the response directly.
 */
export class OwnershipError extends Error {
  readonly status = 403
  readonly code = 'FORBIDDEN' as const
  constructor(message = 'Not authorised to access this resource') {
    super(message)
    this.name = 'OwnershipError'
  }
}

/**
 * Synchronous ownership check: the session user must equal targetUserId.
 * Use this when only the resource owner should access the endpoint.
 */
export function assertOwnership(session: AuthContext['session'], targetUserId: string): void {
  if (session.user.id !== targetUserId) {
    throw new OwnershipError()
  }
}

/**
 * Async ownership check that also accepts a custom predicate, e.g. to
 * verify a coaching relationship between a trainer and an athlete.
 *
 *   await assertOwnershipAsync(session, athleteId, async () => {
 *     return prisma.trainer_clients.findFirst({
 *       where: { trainerId: session.user.id, clientId: athleteId, status: 'ACTIVE' },
 *     }) != null
 *   })
 */
export async function assertOwnershipAsync(
  session: AuthContext['session'],
  targetUserId: string,
  predicate?: () => Promise<boolean>
): Promise<void> {
  if (session.user.id === targetUserId) return
  if (predicate && (await predicate())) return
  throw new OwnershipError()
}

/**
 * Convenience wrapper that converts an OwnershipError into a 403 NextResponse.
 * Useful when you do not want to add a try/catch in the handler.
 */
export function assertOwnershipOrFail(
  session: AuthContext['session'],
  targetUserId: string
) {
  try {
    assertOwnership(session, targetUserId)
    return null
  } catch (err) {
    if (err instanceof OwnershipError) {
      return fail(err.code, err.message, err.status)
    }
    throw err
  }
}
