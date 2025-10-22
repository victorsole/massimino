// src/components/layout/user_public_profile.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRole } from '@/core/utils'
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
  sections?: {
    workouts?: Array<{
      sessionId: string
      date: string | Date
      title: string | null
      exercises: Array<{ name: string; sets: number; reps: string }>
      pr?: boolean
      volumeHint?: number
    }>
    achievements?: Array<{ id: string; code: string; name: string; category: string; earnedAt: string | Date }>
    media?: Array<{ id: string; url: string; thumbnailUrl?: string | null; provider: string; title?: string | null }>
    teams?: Array<{ id: string; name: string; memberCount: number }>
  }
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

        const response = await fetch(`/api/users/${userId}/public?include=workouts,achievements,media,teams&workouts_limit=5&media_limit=6`, {
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
  const key = (role || '').toUpperCase()
  return <Badge className={styles[key] || ''}>{formatRole(role)}</Badge>
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
  const { data: session } = useSession()
  const [tipLoading, setTipLoading] = useState(false)
  const [tipAmount, setTipAmount] = useState<number>(5)

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
            {profile.image ? (
              <AvatarImage src={profile.image} alt={profile.name} />
            ) : null}
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

          {/* Recent Workouts */}
          {!compact && profile.sections?.workouts && profile.sections.workouts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Recent Workouts</h4>
              <div className="space-y-3">
                {profile.sections.workouts.map((w) => {
                  const makeSummary = () => {
                    const header = `${new Date(w.date).toLocaleDateString()}${w.title ? ' — ' + w.title : ''}`;
                    const lines = w.exercises.map((ex: any) => `• ${ex.name}: ${ex.sets} sets (${ex.reps} reps)`);
                    return [header, ...lines].join('\n');
                  };
                  const copySummary = async () => {
                    try {
                      await navigator.clipboard.writeText(makeSummary());
                      alert('Workout summary copied');
                    } catch (e) {
                      console.error('Copy failed', e);
                    }
                  };
                  return (
                    <div key={w.sessionId} className="p-3 rounded border bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{w.title || 'Workout'}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">{new Date(w.date).toLocaleDateString()}</div>
                          <Button size="sm" variant="outline" onClick={copySummary}>
                            Copy summary
                          </Button>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        {w.exercises.slice(0, 3).map((ex: any) => (
                          <span key={ex.name} className="mr-3">{ex.name} ({ex.sets} x {ex.reps})</span>
                        ))}
                        {w.exercises.length > 3 && <span className="text-xs text-gray-500">+{w.exercises.length - 3} more</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">Tip: Use “Copy summary” to save inspiration from this workout.</p>
            </div>
          )}

          {/* When workouts are not publicly shared */}
          {!compact && (!profile.sections?.workouts || profile.sections.workouts.length === 0) && (
            <div className="p-4 rounded border bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold">Workouts not shared publicly</h4>
                  <p className="text-sm text-gray-600">
                    This athlete does not share workout logs publicly. You can request access or send a message for inspiration.
                  </p>
                </div>
                {session?.user?.id !== profile.id && (
                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <a href={`/messages?userId=${profile.id}&prefill=${encodeURIComponent('Hi! Could I get access to view your workout logs for inspiration?')}`}>
                        Request access
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/messages?userId=${profile.id}`}>
                        Message
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Achievements */}
          {!compact && profile.sections?.achievements && profile.sections.achievements.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Achievements</h4>
              <div className="flex flex-wrap gap-2">
                {profile.sections.achievements.map(a => (
                  <Badge key={a.id} variant="secondary" className="text-xs">{a.name}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Media Gallery */}
          {!compact && profile.sections?.media && profile.sections.media.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Media</h4>
              <div className="grid grid-cols-3 gap-2">
                {profile.sections.media.map(m => (
                  <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="block">
                    { (m.thumbnailUrl || m.url) ? (
                      <img src={m.thumbnailUrl || m.url} alt={m.title || 'media'} className="w-full h-24 object-cover rounded" />
                    ) : null }
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Public Teams */}
          {!compact && profile.sections?.teams && profile.sections.teams.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Teams</h4>
              <div className="flex flex-wrap gap-2">
                {profile.sections.teams.map(t => (
                  <Badge key={t.id} variant="outline" className="text-xs">
                    <a href={`/teams/${t.id}`} className="hover:underline">{t.name}</a> · {t.memberCount}
                  </Badge>
                ))}
              </div>
            </div>
          )}

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

          {/* Services: Tip Jar (85/15 split) */}
          {!compact && profile.role === 'TRAINER' && (
            <div className="mt-2 p-3 rounded border bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Support this coach</div>
                <div className="text-xs text-gray-500">85/15 coach/platform</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(parseInt(e.target.value, 10))}
                >
                  {[5, 10, 20].map(v => (
                    <option key={v} value={v}>€{v}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={tipLoading}
                  onClick={async () => {
                    try {
                      setTipLoading(true)
                      const res = await fetch('/api/payments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'tip',
                          trainerId: profile.id,
                          clientId: session?.user?.id,
                          amount: tipAmount,
                          currency: 'EUR',
                          description: `Tip for coach ${profile.name}`,
                          redirectUrl: window.location.href
                        })
                      })
                      const data = await res.json()
                      if (res.ok && data?.data?.checkoutUrl) {
                        window.location.href = data.data.checkoutUrl
                      } else if (res.status === 401) {
                        window.location.href = '/login'
                      } else {
                        alert(data?.error || 'Failed to start payment')
                      }
                    } finally {
                      setTipLoading(false)
                    }
                  }}
                >
                  {tipLoading ? 'Processing…' : 'Send Tip'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
