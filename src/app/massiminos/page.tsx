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
  X, User, Award, Instagram, Music, Youtube, Facebook, Linkedin, Star, Camera
} from 'lucide-react'
import { UserPublicProfile } from '@/components/layout/user_public_profile'
import { calculateLevel, LEVEL_NAMES } from '@/components/profile/XPLevelProgress'

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
  // Gamification fields
  totalXP?: number
  level?: number
  mediaContributions?: number
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
                    {role === 'CLIENT' ? 'ATHLETE' : role}
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

// Gradient colors for user cards
const CARD_GRADIENTS = [
  'from-brand-primary to-brand-primary-light',
  'from-blue-500 to-cyan-500',
  'from-green-400 to-teal-500',
  'from-purple-500 to-indigo-600',
  'from-pink-500 to-rose-500',
  'from-orange-400 to-red-500',
  'from-cyan-500 to-blue-600',
]

// Experience level progress percentages
const EXPERIENCE_PROGRESS: Record<string, number> = {
  'BEGINNER': 25,
  'INTERMEDIATE': 55,
  'ADVANCED': 85,
}

// Experience level colors
const EXPERIENCE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'BEGINNER': { bg: 'bg-green-100', text: 'text-green-700', bar: 'from-green-400 to-green-500' },
  'INTERMEDIATE': { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'from-yellow-400 to-orange-500' },
  'ADVANCED': { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'from-purple-500 to-indigo-600' },
}

function UserCard({
  user,
  onViewProfile,
  index = 0
}: {
  user: DiscoveryUser
  onViewProfile: (userId: string) => void
  index?: number
}) {
  // Social media links - Spotify icon component
  const SpotifyIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1.5C6.21 1.5 1.5 6.21 1.5 12S6.21 22.5 12 22.5 22.5 17.79 22.5 12 17.79 1.5 12 1.5zm4.93 15.34a.75.75 0 01-1.03.25c-2.82-1.73-6.37-2.12-10.56-1.15a.75.75 0 11-.33-1.46c4.57-1.05 8.49-.6 11.58 1.27.35.21.46.67.25 1.02zm1.38-3.15a.94.94 0 01-1.3.32c-3.23-1.98-8.16-2.56-11.98-1.39a.94.94 0 11-.55-1.8c4.29-1.31 9.67-.66 13.35 1.56.45.27.6.86.32 1.31zm.13-3.28c-3.71-2.2-9.85-2.4-13.4-1.31a1.13 1.13 0 11-.65-2.17c4.09-1.23 10.9-1 15.09 1.47a1.13 1.13 0 01-1.04 2.01z" />
    </svg>
  )

  const socialLinks = [
    { url: user.instagramUrl, icon: Instagram, label: 'Instagram', color: 'text-pink-600 hover:text-pink-700' },
    { url: user.spotifyUrl, icon: SpotifyIcon, label: 'Spotify', color: 'text-green-600 hover:text-green-700' },
    { url: user.tiktokUrl, icon: Music, label: 'TikTok', color: 'text-black hover:text-gray-700' },
    { url: user.youtubeUrl, icon: Youtube, label: 'YouTube', color: 'text-red-600 hover:text-red-700' },
    { url: user.facebookUrl, icon: Facebook, label: 'Facebook', color: 'text-blue-600 hover:text-blue-700' },
    { url: user.linkedinUrl, icon: Linkedin, label: 'LinkedIn', color: 'text-blue-700 hover:text-blue-800' }
  ].filter(link => link.url)

  // Get gradient based on index or user role
  const gradient = user.role === 'TRAINER'
    ? CARD_GRADIENTS[0]
    : CARD_GRADIENTS[index % CARD_GRADIENTS.length]

  // Get experience colors
  const expColors = EXPERIENCE_COLORS[user.experienceLevel] || EXPERIENCE_COLORS['BEGINNER']
  const expProgress = EXPERIENCE_PROGRESS[user.experienceLevel] || 25

  // Calculate level info
  const levelInfo = user.totalXP !== undefined && user.totalXP > 0
    ? calculateLevel(user.totalXP)
    : null

  return (
    <div
      className="user-card bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer transition-all duration-400 hover:-translate-y-2 hover:shadow-xl"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => onViewProfile(user.id)}
    >
      {/* Gradient Header */}
      <div className="relative">
        <div className={`h-24 bg-gradient-to-r ${gradient}`}></div>

        {/* Avatar positioned over header */}
        <div className="absolute -bottom-10 left-6">
          <div className="relative">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name} />
              ) : null}
              <AvatarFallback className={`text-2xl font-bold text-white bg-gradient-to-br ${gradient}`}>
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            {/* Level Badge */}
            {levelInfo && (
              <div
                className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900 border-2 border-white"
                title={`Level ${levelInfo.level}: ${LEVEL_NAMES[levelInfo.level - 1]}`}
              >
                {levelInfo.level}
              </div>
            )}
          </div>
        </div>

        {/* Role Badge - Top Right */}
        <div className="absolute top-4 right-4">
          {user.trainerVerified ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              <Award size={12} />
              Premium
            </span>
          ) : user.role === 'TRAINER' ? (
            <span className="px-2 py-1 bg-brand-secondary text-brand-primary text-xs font-medium rounded-full">
              Trainer
            </span>
          ) : (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Athlete
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="pt-14 px-6 pb-6">
        {/* Name and Location */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
            {(user.city || user.state) && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin size={14} />
                {user.city && user.state ? `${user.city}, ${user.state}` : user.city || user.state}
              </p>
            )}
          </div>
        </div>

        {/* Experience Level with Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Experience</span>
            <span className={`px-2 py-0.5 ${expColors.bg} ${expColors.text} text-xs font-medium rounded`}>
              {user.experienceLevel}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${expColors.bar} rounded-full transition-all duration-1000`}
              style={{ width: `${expProgress}%` }}
            />
          </div>
        </div>

        {/* XP Display */}
        {levelInfo && (
          <div className="flex items-center gap-3 mb-3 p-2 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-bold text-yellow-700">{user.totalXP?.toLocaleString()} XP</span>
            </div>
            <span className="text-xs text-yellow-600">{LEVEL_NAMES[levelInfo.level - 1]}</span>
          </div>
        )}

        {/* Fill The Gym Contributions */}
        {user.mediaContributions !== undefined && user.mediaContributions > 0 && (
          <div className="flex items-center gap-3 mb-3 p-2 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-1">
              <Camera size={16} className="text-purple-500" />
              <span className="text-sm font-bold text-purple-700">{user.mediaContributions} Videos</span>
            </div>
            <span className="text-xs text-purple-600">Fill The Gym</span>
          </div>
        )}

        {/* Tags - Fitness Goals & Workout Types */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {user.fitnessGoals.slice(0, 2).map(goal => (
            <span key={goal} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              {goal}
            </span>
          ))}
          {user.preferredWorkoutTypes.slice(0, 2).map(type => (
            <span key={type} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
              {type}
            </span>
          ))}
        </div>

        {/* Footer with Social Icons and View Profile Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Social Media Icons */}
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {socialLinks.slice(0, 3).map(link => (
              <a
                key={link.label}
                href={link.url!}
                target="_blank"
                rel="noopener noreferrer"
                className={`${link.color} transition-all duration-200 hover:scale-125`}
                title={link.label}
              >
                <link.icon size={18} />
              </a>
            ))}
          </div>

          {/* View Profile Button */}
          <Button
            size="sm"
            className="bg-brand-primary hover:bg-brand-primary-dark text-white text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation()
              onViewProfile(user.id)
            }}
          >
            View Profile
          </Button>
        </div>
      </div>
    </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {users.map((user, index) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onViewProfile={setSelectedUserId}
                    index={index}
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
