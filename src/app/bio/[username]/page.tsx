// src/app/bio/[username]/page.tsx
/**
 * Massitree Public Profile Pages
 * bio.massimino.fitness/{username}
 * Server-side rendered trainer profiles with SEO optimization
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/core/database/client'
import { UserPublicProfile } from '@/components/layout/user_public_profile'
import { Share2 } from 'lucide-react'
import { ShareButton } from '@/components/ui/share_button'

// ===== INLINE FUNCTIONS =====

/**
 * Fetch user by massiminoUsername
 */
async function getUserByUsername(username: string) {
  const user = await prisma.users.findUnique({
    where: { massiminoUsername: username },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      trainerVerified: true,
      trainerBio: true,
      status: true,
      city: true,
      state: true
    }
  })

  return user
}

/**
 * Generate static params for top trainers (optional, for performance)
 */
export async function generateStaticParams() {
  const users = await prisma.users.findMany({
    where: {
      massiminoUsername: { not: null },
      trainerVerified: true,
      status: 'ACTIVE'
    },
    select: { massiminoUsername: true },
    take: 50 // Pre-render top 50 trainer profiles
  })

  return users.map(user => ({
    username: user.massiminoUsername!
  }))
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params
}: {
  params: { username: string }
}): Promise<Metadata> {
  const user = await getUserByUsername(params.username)

  if (!user) {
    return {
      title: 'Profile Not Found | Massimino',
      description: 'This trainer profile could not be found.'
    }
  }

  const name = user.name || 'Trainer'
  const bio = user.trainerBio || `${name} is a fitness professional on Massimino.`
  const location = user.city && user.state ? `${user.city}, ${user.state}` : ''

  return {
    title: `${name} - ${user.role} | Massimino`,
    description: bio.slice(0, 160),
    openGraph: {
      title: `${name} - Fitness ${user.role}`,
      description: bio.slice(0, 160),
      url: `https://bio.massimino.fitness/${params.username}`,
      siteName: 'Massimino',
      images: user.image ? [
        {
          url: user.image,
          width: 800,
          height: 800,
          alt: `${name}'s profile picture`
        }
      ] : [],
      locale: 'en_US',
      type: 'profile'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} - Fitness ${user.role}`,
      description: bio.slice(0, 160),
      images: user.image ? [user.image] : []
    },
    alternates: {
      canonical: `https://bio.massimino.fitness/${params.username}`
    },
    other: {
      'profile:username': params.username,
      'profile:role': user.role,
      ...(location && { 'profile:location': location })
    }
  }
}

// ===== PAGE COMPONENT =====

export default async function BioPage({
  params
}: {
  params: { username: string }
}) {
  const user = await getUserByUsername(params.username)

  // 404 if user not found
  if (!user) {
    notFound()
  }

  // 403 if user is suspended
  if (user.status === 'SUSPENDED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Profile Unavailable
          </h1>
          <p className="text-gray-600">
            This profile is currently unavailable.
          </p>
        </div>
      </div>
    )
  }

  // Share functionality (client-side)
  const shareUrl = `https://bio.massimino.fitness/${params.username}`
  const shareText = `Check out ${user.name || 'this trainer'}'s profile on Massimino!`

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-purple-600">
            Massimino
          </h1>
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-gray-700" />
            <ShareButton shareUrl={shareUrl} shareText={shareText} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <UserPublicProfile
          userId={user.id}
          variant="massitree"
          showActions={true}
          compact={false}
        />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Powered by{' '}
            <a
              href="https://massimino.fitness"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              Massimino
            </a>
          </p>
          <p className="mt-1">
            Want your own fitness profile?{' '}
            <a
              href="https://massimino.fitness/register"
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              Join now
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
