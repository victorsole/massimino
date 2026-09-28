// src/app/sitemap.ts
// Served at /sitemap.xml (declared in public/robots.txt).

import type { MetadataRoute } from 'next'
import { prisma } from '@/core/database/client'
import { bioProfileUrl } from '@/lib/bio-url'

const BASE_URL = 'https://massimino.fitness'

// Regenerate once a day so new trainer profiles are picked up
export const revalidate = 86400

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/exercises', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/fitness-intelligence', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/partnerships', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/safety', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/signup', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/legal/subprocessors', priority: 0.2, changeFrequency: 'yearly' },
]

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
  const staticEntries = STATIC_ROUTES.map(route => ({
    url: `${BASE_URL}${route.path === '/' ? '' : route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  return [...staticEntries, ...(await getTrainerProfiles())]
}
