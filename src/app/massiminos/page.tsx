// src/app/massiminos/page.tsx

'use client'

// src/app/massiminos/page.tsx
/**
 * Massiminos Discovery Feature
 * Location-based user discovery with map and list views
 * Filters: distance, role, experience, fitness goals
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  MapPin, Map, List, Loader2, Filter,
  X, User, Award, Instagram, Music, Youtube, Facebook, Linkedin
} from 'lucide-react'
import { UserPublicProfile } from '@/components/layout/user_public_profile'

// ===== TYPES =====

interface DiscoveryUser {
  id: string
  name: string
  image: string | null
  role: string
  trainerVerified: boolean
  city: string | null
  state: string | null
  experienceLevel: string
  fitnessGoals: string[]
  preferredWorkoutTypes: string[]
  availableWorkoutDays: string[]
  instagramUrl: string | null
  spotifyUrl: string | null
  tiktokUrl: string | null
  youtubeUrl: string | null
  facebookUrl: string | null
  linkedinUrl: string | null
}

interface DiscoveryFilters {
  distance: number // miles
  role: 'ALL' | 'TRAINER' | 'CLIENT'
  experienceLevel: 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  goals: string[]
}

// ===== INLINE HOOKS =====

function useDiscovery(filters: DiscoveryFilters) {
  const [users, setUsers] = useState<DiscoveryUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          ...(filters.role !== 'ALL' && { role: filters.role }),
          ...(filters.experienceLevel !== 'ALL' && { experienceLevel: filters.experienceLevel }),
          ...(filters.goals.length > 0 && { goals: filters.goals.join(',') })
        })

        const response = await fetch(`/api/discovery?${params}`)
        const result = await response.json()

        if (result.success) {
          setUsers(result.users)
        } else {
          setError(result.message || 'Failed to fetch users')
        }
      } catch (err) {
        setError('Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [filters])

  return { users, loading, error }
}

// ===== INLINE COMPONENTS =====

function FilterPanel({
  filters,
  onFiltersChange
}: {
  filters: DiscoveryFilters
  onFiltersChange: (filters: DiscoveryFilters) => void
}) {
  const [showFilters, setShowFilters] = useState(false)

  const goalOptions = [
    'Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility',
    'Strength', 'General Fitness', 'Sports Performance'
  ]

  const toggleGoal = (goal: string) => {
    const newGoals = filters.goals.includes(goal)
      ? filters.goals.filter(g => g !== goal)
      : [...filters.goals, goal]
    onFiltersChange({ ...filters, goals: newGoals })
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Filter size={16} />
          Filters
        </div>
        {filters.goals.length > 0 && (
          <Badge variant="secondary">{filters.goals.length}</Badge>
        )}
      </Button>

      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">

            {/* Role */}
            <div>
              <label className="text-sm font-medium block mb-2">Role</label>
              <div className="flex gap-2 flex-wrap">
                {(['ALL', 'TRAINER', 'CLIENT'] as const).map(role => (
                  <Button
                    key={role}
                    variant={filters.role === role ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onFiltersChange({ ...filters, role })}
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="text-sm font-medium block mb-2">Experience</label>
              <div className="flex gap-2 flex-wrap">
                {(['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map(level => (
                  <Button
                    key={level}
                    variant={filters.experienceLevel === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onFiltersChange({ ...filters, experienceLevel: level })}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Fitness Goals */}
            <div>
              <label className="text-sm font-medium block mb-2">Fitness Goals</label>
              <div className="flex gap-2 flex-wrap">
                {goalOptions.map(goal => (
                  <Button
                    key={goal}
                    variant={filters.goals.includes(goal) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleGoal(goal)}
                  >
                    {goal}
                  </Button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({
                distance: 10,
                role: 'ALL',
                experienceLevel: 'ALL',
                goals: []
              })}
              className="w-full"
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function UserCard({
  user,
  onViewProfile
}: {
  user: DiscoveryUser
  onViewProfile: (userId: string) => void
}) {
  // Social media links - Spotify icon component
  const SpotifyIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1.5C6.21 1.5 1.5 6.21 1.5 12S6.21 22.5 12 22.5 22.5 17.79 22.5 12 17.79 1.5 12 1.5zm4.93 15.34a.75.75 0 01-1.03.25c-2.82-1.73-6.37-2.12-10.56-1.15a.75.75 0 11-.33-1.46c4.57-1.05 8.49-.6 11.58 1.27.35.21.46.67.25 1.02zm1.38-3.15a.94.94 0 01-1.3.32c-3.23-1.98-8.16-2.56-11.98-1.39a.94.94 0 11-.55-1.8c4.29-1.31 9.67-.66 13.35 1.56.45.27.6.86.32 1.31zm.13-3.28c-3.71-2.2-9.85-2.4-13.4-1.31a1.13 1.13 0 11-.65-2.17c4.09-1.23 10.9-1 15.09 1.47a1.13 1.13 0 01-1.04 2.01z" />
    </svg>
  )

  const socialLinks = [
    { url: user.instagramUrl, icon: Instagram, label: 'Instagram', color: 'text-pink-600' },
    { url: user.spotifyUrl, icon: SpotifyIcon, label: 'Spotify', color: 'text-green-600' },
    { url: user.tiktokUrl, icon: Music, label: 'TikTok', color: 'text-black' },
    { url: user.youtubeUrl, icon: Youtube, label: 'YouTube', color: 'text-red-600' },
    { url: user.facebookUrl, icon: Facebook, label: 'Facebook', color: 'text-blue-600' },
    { url: user.linkedinUrl, icon: Linkedin, label: 'LinkedIn', color: 'text-blue-700' }
  ].filter(link => link.url)

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewProfile(user.id)}>
      <CardContent className="p-5">
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar className="w-20 h-20 flex-shrink-0">
            <AvatarImage src={user.image || ''} alt={user.name} />
            <AvatarFallback className="text-lg">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Name and Role */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-lg">{user.name}</h3>
                {user.trainerVerified && (
                  <span title="Verified Trainer">
                    <Award size={16} className="text-blue-600" />
                  </span>
                )}
              </div>
              <Badge variant={user.role === 'TRAINER' ? 'default' : user.role === 'ADMIN' ? 'destructive' : 'secondary'} className="text-xs">
                {user.role}
              </Badge>
            </div>

            {/* Social Media Icons */}
            {socialLinks.length > 0 && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                {socialLinks.map(link => (
                  <a
                    key={link.label}
                    href={link.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${link.color} hover:opacity-70 transition-opacity`}
                    title={link.label}
                  >
                    <link.icon size={18} />
                  </a>
                ))}
              </div>
            )}

            {/* Location */}
            {(user.city || user.state) && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin size={14} />
                <span>
                  {user.city && user.state ? `${user.city}, ${user.state}` : user.city || user.state}
                </span>
              </div>
            )}

            {/* Fitness Info */}
            <div className="space-y-1.5">
              {/* Experience Level */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500">Experience:</span>
                <Badge variant="outline" className="text-xs">
                  {user.experienceLevel}
                </Badge>
              </div>

              {/* Fitness Goals */}
              {user.fitnessGoals.length > 0 && (
                <div className="flex items-start gap-1.5">
                  <span className="text-xs font-medium text-gray-500 mt-0.5">Goals:</span>
                  <div className="flex gap-1 flex-wrap">
                    {user.fitnessGoals.map(goal => (
                      <Badge key={goal} variant="secondary" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Workout Types */}
              {user.preferredWorkoutTypes.length > 0 && (
                <div className="flex items-start gap-1.5">
                  <span className="text-xs font-medium text-gray-500 mt-0.5">Workouts:</span>
                  <div className="flex gap-1 flex-wrap">
                    {user.preferredWorkoutTypes.map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Days */}
              {user.availableWorkoutDays.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-gray-500">Available:</span>
                  <span className="text-xs text-gray-700">
                    {user.availableWorkoutDays.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfileModal({
  userId,
  onClose
}: {
  userId: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Profile</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
        <div className="p-4">
          <UserPublicProfile
            userId={userId}
            variant="massiminos"
            showActions={true}
            compact={false}
          />
        </div>
      </div>
    </div>
  )
}

// ===== MAIN PAGE COMPONENT =====

export default function MassiminosPage() {
  const { data: session } = useSession()

  const [filters, setFilters] = useState<DiscoveryFilters>({
    distance: 10,
    role: 'ALL',
    experienceLevel: 'ALL',
    goals: []
  })

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const { users, loading: usersLoading, error: usersError } = useDiscovery(filters)

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Please sign in to discover nearby fitness enthusiasts.</p>
            <Button className="w-full" onClick={() => window.location.href = '/login'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-secondary">
      {/* Header */}
      <header className="bg-white border-b border-brand-primary/10 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-primary">Massiminos</h1>
              <p className="text-sm text-brand-primary-light">Discover fitness enthusiasts</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List size={16} className="mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                disabled
                title="Map view coming soon"
              >
                <Map size={16} className="mr-2" />
                Map
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Filters */}
            <FilterPanel filters={filters} onFiltersChange={setFilters} />

            {/* Results Count */}
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-brand-primary">{users.length}</div>
                <div className="text-sm text-brand-primary-light">users found</div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">

            {usersLoading && (
              <div className="text-center py-12">
                <Loader2 className="inline animate-spin" size={32} />
                <p className="text-gray-600 mt-4">Finding nearby users...</p>
              </div>
            )}

            {usersError && (
              <Card>
                <CardContent className="p-8 text-center text-red-600">
                  {usersError}
                </CardContent>
              </Card>
            )}

            {!usersLoading && users.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <User size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                  <p className="text-gray-600">
                    No users have enabled discovery yet. Try adjusting your filters or check back later.
                  </p>
                </CardContent>
              </Card>
            )}

            {!usersLoading && users.length > 0 && (
              <div className="space-y-3">
                {users.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onViewProfile={setSelectedUserId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      {selectedUserId && (
        <ProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  )
}