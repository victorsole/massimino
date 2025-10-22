import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Display helper: map internal role values to user-facing labels
export function formatRole(role?: string | null): string {
  switch ((role || '').toUpperCase()) {
    case 'CLIENT':
      return 'ATHLETE'
    case 'TRAINER':
      return 'TRAINER'
    case 'ADMIN':
      return 'ADMIN'
    default:
      return role || ''
  }
}
