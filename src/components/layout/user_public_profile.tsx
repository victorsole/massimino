// src/components/layout/user_public_profile.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  CheckCircle, MapPin, MessageCircle, Award,
  Instagram, Music, Youtube, Facebook, Linkedin
} from 'lucide-react'
import Link from 'next/link'

// Types
interface PublicUserProfile {
  id: string
  name: string
  image: string | null
  role: string
  trainerVerified: boolean
  city: string | null
  state: string | null
  country: string | null
  experienceLevel: string
  fitnessGoals: string[]
  preferredWorkoutTypes: string[]
  availableWorkoutDays: string[]
  trainerBio: string | null
  trainerCredentials: string | null
  trainerRating: number | null
  instagramUrl: string | null
  tiktokUrl: string | null
  facebookUrl: string | null
  youtubeUrl: string | null
  linkedinUrl: string | null
  showSocialMedia: boolean
  locationVisibility: string
  acceptDMs: boolean
  onlyTrainerDMs: boolean
  createdAt: Date
}

interface UserPublicProfileProps {
  userId: string
  variant: 'massitree' | 'massiminos' | 'embed'
  showActions?: boolean
  compact?: boolean
}

// ===== INLINE HOOK =====
function usePublicProfile(userId: string) {
  const [data, setData] = useState<PublicUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPublicProfile() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/users/${userId}/public`, {
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }

        const result = await response.json()
        if (result.success) {
          setData(result.data)
        } else {
          throw new Error(result.message)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) fetchPublicProfile()
  }, [userId])

  return { data, isLoading, error }
}

// ===== INLINE HELPER FUNCTIONS =====
function getDisplayLocation(profile: PublicUserProfile, variant: string) {
  if (variant === 'embed') return profile.city ? `${profile.city}` : null

  switch (profile.locationVisibility) {
    case 'CITY':
      return profile.city && profile.state ? `${profile.city}, ${profile.state}` : null
    case 'EXACT':
      return [profile.city, profile.state, profile.country].filter(Boolean).join(', ') || null
    default:
      return null
  }
}

function getAvatarSize(variant: string) {
  switch (variant) {
    case 'massitree': return 'w-32 h-32'
    case 'massiminos': return 'w-20 h-20'
    case 'embed': return 'w-10 h-10'
    default: return 'w-20 h-20'
  }
}

function parseCredentials(credentialsJson: string | null) {
  if (!credentialsJson) return []
  try {
    const parsed = JSON.parse(credentialsJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ===== MINI COMPONENTS =====
function VerifiedBadge() {
  return (
    <div className="flex items-center gap-1 text-blue-600">
      <CheckCircle size={16} />
      <span className="text-xs font-medium">Verified</span>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    TRAINER: 'bg-purple-100 text-purple-800',
    CLIENT: 'bg-green-100 text-green-800',
    ADMIN: 'bg-red-100 text-red-800'
  }
  return <Badge className={styles[role] || ''}>{role}</Badge>
}

function SocialLinks({ profile }: { profile: PublicUserProfile }) {
  if (!profile.showSocialMedia) return null

  const links = [
    { url: profile.instagramUrl, icon: Instagram, label: 'Instagram', color: 'text-pink-600' },
    { url: profile.tiktokUrl, icon: Music, label: 'TikTok', color: 'text-black' },
    { url: profile.youtubeUrl, icon: Youtube, label: 'YouTube', color: 'text-red-600' },
    { url: profile.facebookUrl, icon: Facebook, label: 'Facebook', color: 'text-blue-600' },
    { url: profile.linkedinUrl, icon: Linkedin, label: 'LinkedIn', color: 'text-blue-700' }
  ].filter(link => link.url)

  if (links.length === 0) return null

  return (
    <div className="flex gap-3">
      {links.map(link => (
        <a
          key={link.label}
          href={link.url!}
          target="_blank"
          rel="noopener noreferrer"
          className={`${link.color} hover:opacity-70 transition-opacity`}
          aria-label={link.label}
        >
          <link.icon size={20} />
        </a>
      ))}
    </div>
  )
}

function CredentialsList({ credentials }: { credentials: string | null }) {
  const parsed = parseCredentials(credentials)
  if (parsed.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">Credentials</h4>
      {parsed.map((cred: any, idx: number) => (
        <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm">
          <Award size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">{cred.providerName}</div>
            {cred.qualifications && (
              <div className="text-xs text-gray-600">
                {Array.isArray(cred.qualifications) ? cred.qualifications.join(', ') : cred.qualifications}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingSkeleton({ variant }: { variant: string }) {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`${getAvatarSize(variant)} bg-gray-200 rounded-full`} />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== MAIN COMPONENT =====
export function UserPublicProfile({
  userId,
  variant,
  showActions = true,
  compact = false
}: UserPublicProfileProps) {
  const { data: profile, isLoading, error } = usePublicProfile(userId)

  if (isLoading) return <LoadingSkeleton variant={variant} />
  if (error || !profile) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-gray-500">
          Profile not available
        </CardContent>
      </Card>
    )
  }

  const location = getDisplayLocation(profile, variant)
  const isEmbed = variant === 'embed'
  const isMassitree = variant === 'massitree'

  return (
    <Card className={isMassitree ? 'max-w-4xl' : ''}>
      <CardHeader className={isEmbed ? 'p-3' : 'p-6'}>
        <div className={`flex ${isEmbed ? 'items-center gap-3' : 'flex-col gap-4'}`}>
          {/* Avatar */}
          <Avatar className={getAvatarSize(variant)}>
            <AvatarImage src={profile.image || ''} alt={profile.name} />
            <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {/* Name + Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={isMassitree ? 'text-2xl font-bold' : 'font-semibold'}>
                {profile.name}
              </h3>
              {profile.trainerVerified && <VerifiedBadge />}
              <RoleBadge role={profile.role} />
            </div>

            {/* Location */}
            {location && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <MapPin size={14} />
                <span>{location}</span>
              </div>
            )}

            {/* Experience + Goals (not in embed) */}
            {!isEmbed && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{profile.experienceLevel}</Badge>
                {profile.fitnessGoals.slice(0, compact ? 2 : 4).map(goal => (
                  <Badge key={goal} variant="secondary" className="text-xs">
                    {goal}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {!isEmbed && (
        <CardContent className="p-6 space-y-4">
          {/* Bio (trainers only, not compact) */}
          {profile.trainerBio && !compact && (
            <div>
              <h4 className="font-semibold mb-2">About</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.trainerBio}</p>
            </div>
          )}

          {/* Fitness Preferences */}
          {!compact && (
            <div className="space-y-3">
              {/* Preferred Workout Types */}
              {profile.preferredWorkoutTypes && profile.preferredWorkoutTypes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Preferred Workouts</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferredWorkoutTypes.map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Days */}
              {profile.availableWorkoutDays && profile.availableWorkoutDays.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Available Days</h4>
                  <div className="text-sm text-gray-700">
                    {profile.availableWorkoutDays.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Credentials (massitree only) */}
          {isMassitree && profile.role === 'TRAINER' && (
            <CredentialsList credentials={profile.trainerCredentials} />
          )}

          {/* Social Links */}
          {!compact && <SocialLinks profile={profile} />}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2">
              {profile.acceptDMs && (
                <Button size="sm" asChild>
                  <Link href={`/messages?userId=${profile.id}`}>
                    <MessageCircle size={16} className="mr-2" />
                    Message
                  </Link>
                </Button>
              )}
              <Button size="sm" variant="outline" asChild>
                <Link href={`/teams?user=${profile.id}`}>
                  View Teams
                </Link>
              </Button>
              {profile.role === 'TRAINER' && profile.trainerVerified && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/trainer/${profile.id}`}>
                    View Services
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}