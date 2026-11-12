// src/app/sitemap.ts
// Served at /sitemap.xml (declared in public/robots.txt).

import type { MetadataRoute } from 'next'
import { prisma } from '@/core/database/client'
import { bioProfileUrl } from '@/lib/bio-url'

const BASE_URL = 'https://massimino.fitness'

// Regenerate once a day so new trainer profiles are picked up
export const revalidate = 86400

type StaticRoute = {
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  // Date the page content last changed, when it is known. Pages without one omit
  // lastModified: search engines ignore it once it is always "today".
  lastModified?: string
}

const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/exercises', priority: 0.9, changeFrequency: 'weekly' },
  // "Last updated: June 2026" in src/data/fitness/europe_2024.ts
  { path: '/fitness-intelligence', priority: 0.9, changeFrequency: 'monthly', lastModified: '2026-06-01' },
  { path: '/community', priority: 0.7, changeFrequency: 'daily' },
  { path: '/teams/discover', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/partnerships', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/safety', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/about', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/signup', priority: 0.5, changeFrequency: 'yearly' },
  // "Last Updated" dates stated on the pages themselves
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly', lastModified: '2025-10-30' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly', lastModified: '2025-10-30' },
  { path: '/cookies', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/legal/subprocessors', priority: 0.2, changeFrequency: 'yearly' },
]

/** Most recent change to a curated exercise, the set /exercises shows by default */
async function getExercisesLastModified(): Promise<Date | undefined> {
  try {
    const latest = await prisma.exercises.findFirst({
      where: { isActive: true, curated: true },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    })
    return latest?.updatedAt
  } catch {
    // Database unavailable (e.g. during build): leave the date out
    return undefined
  }
}

/**
 * Public bio profiles of verified, active trainers only, matching the
 * profiles pre-rendered by /bio/[username]. Athlete profiles stay out.
 */
async function getTrainerProfiles(): Promise<MetadataRoute.Sitemap> {
  try {
    const trainers = await prisma.users.findMany({
      where: {
        massiminoUsername: { not: null },
        trainerVerified: true,
        status: 'ACTIVE',
      },
      select: { massiminoUsername: true, updatedAt: true },
      take: 5000,
    })

    return trainers.map(trainer => ({
      url: bioProfileUrl(trainer.massiminoUsername!),
      lastModified: trainer.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch (error) {
    // Database unavailable (e.g. during build): ship the static routes only
    console.warn('Sitemap: could not load trainer profiles', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const exercisesLastModified = await getExercisesLastModified()

  const staticEntries = STATIC_ROUTES.map(route => {
    const lastModified = route.path === '/exercises' ? exercisesLastModified : route.lastModified
    return {
      url: `${BASE_URL}${route.path === '/' ? '' : route.path}`,
      ...(lastModified && { lastModified }),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }
  })

  return [...staticEntries, ...(await getTrainerProfiles())]
}
