/**
 * Standard response envelope for App Router API routes (runbook 04).
 *
 *   Success: { success: true, data }
 *   Failure: { success: false, error: { code, message, details? } }
 *
 * Clients branch on `success` and `error.code`, never on the message text.
 */

import { NextResponse } from 'next/server'

/**
 * The closed set of machine-readable error codes. Add a code deliberately
 * (and record it in the api-builder skill's massimino-stack.md), never per handler.
 */
export type ApiErrorCode =
  | 'AUTH_REQUIRED' // 401
  | 'FORBIDDEN' // 403
  | 'VALIDATION_ERROR' // 400
  | 'NOT_FOUND' // 404
  | 'CONFLICT' // 409
  | 'RATE_LIMITED' // 429
  | 'INTERNAL' // 500

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiFailure {
  success: false
  error: {
    code: ApiErrorCode
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true as const, data }, init)
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown,
  headers?: HeadersInit
): NextResponse<ApiFailure> {
  const error: ApiFailure['error'] = { code, message }
  if (details !== undefined) error.details = details
  return NextResponse.json({ success: false as const, error }, { status, headers })
}
