import { NextResponse } from 'next/server'

// Minimal middleware to ensure middleware-manifest exists in dev
export function middleware() {
  return NextResponse.next()
}

// Scope narrowly to root to avoid overhead
export const config = {
  matcher: ['/'],
}

