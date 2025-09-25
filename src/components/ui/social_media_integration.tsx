'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Instagram,
  Youtube,
  Facebook,
  Link,
  Unlink,
  Share2,
  CheckCircle,
  XCircle,
  Clock,
  Hash
} from 'lucide-react'

interface Platform {
  platform: string
  connected: boolean
  capabilities: {
    supportsPhoto: boolean
    supportsVideo: boolean
    requiresAuth: boolean
  }
  connectedAt?: string
  expiresAt?: string
}

interface ShareResult {
  platform: string
  success: boolean
  error?: string
  postId?: string
}

interface SocialMediaIntegrationProps {
  userId: string
  mediaUrl?: string
  mediaType?: 'photo' | 'video'
  workoutData?: {
    exercise: string
    sets: number
    reps: number
    weight: string
    duration?: string
  }
}

const PLATFORM_ICONS = {
  instagram: Instagram,
  tiktok: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.83a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.26z"/>
    </svg>
  ),
  youtube: Youtube,
  facebook: Facebook
}

const PLATFORM_COLORS = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  tiktok: 'bg-black',
  youtube: 'bg-red-600',
  facebook: 'bg-blue-600'
}

export default function SocialMediaIntegration({
  userId: _userId,
  mediaUrl,
  mediaType,
  workoutData
}: SocialMediaIntegrationProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [shareResults, setShareResults] = useState<ShareResult[]>([])

  // Share form state
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  const loadPlatforms = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/social/share')
      const data = await response.json()

      if (response.ok) {
        setPlatforms(data.platforms || [])
      } else {
        console.error('Failed to load platforms:', data.error)
      }
    } catch (error) {
      console.error('Error loading platforms:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlatforms()
  }, [loadPlatforms])

  const handleConnect = async (platform: string) => {
    try {
      setConnecting(platform)

      // Get authorization URL
      const response = await fetch(`/api/social/auth/${platform}?action=auth`)
      const data = await response.json()

      if (response.ok && data.authUrl) {
        // Open authorization in popup
        const popup = window.open(
          data.authUrl,
          `${platform}_auth`,
          'width=600,height=700,scrollbars=yes,resizable=yes'
        )

        // Listen for popup completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            setConnecting(null)
            // Refresh platforms after auth
            setTimeout(loadPlatforms, 1000)
          }
        }, 1000)
      } else {
        console.error('Failed to get auth URL:', data.error)
        setConnecting(null)
      }
    } catch (error) {
      console.error('Connection error:', error)
      setConnecting(null)
    }
  }

  const handleDisconnect = async (platform: string) => {
    try {
      const response = await fetch(`/api/social/auth/${platform}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadPlatforms() // Refresh platforms
      } else {
        console.error('Failed to disconnect:', await response.text())
      }
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  const handleShare = async () => {
    if (!mediaUrl || selectedPlatforms.length === 0) {
      return
    }

    try {
      setSharing(true)
      setShareResults([])

      const hashtagArray = hashtags
        .split(/[,\s]+/)
        .map(tag => tag.replace('#', '').trim())
        .filter(Boolean)

      const response = await fetch('/api/social/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          caption,
          mediaUrl,
          mediaType,
          hashtags: hashtagArray,
          workoutData
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShareResults(data.results || [])

        // Clear form on successful shares
        if (data.summary.successful > 0) {
          setCaption('')
          setHashtags('')
          setSelectedPlatforms([])
        }
      } else {
        console.error('Share failed:', data.error)
      }
    } catch (error) {
      console.error('Share error:', error)
    } finally {
      setSharing(false)
    }
  }

  const connectedPlatforms = platforms.filter(p => p.connected)
  const availableForSharing = connectedPlatforms.filter(p =>
    mediaType === 'photo' ? p.capabilities.supportsPhoto : p.capabilities.supportsVideo
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Media Integration</CardTitle>
          <CardDescription>Loading platforms...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Social Media Integration
        </CardTitle>
        <CardDescription>
          Connect your social media accounts to share workout content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Connections */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Connected Platforms</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((platform) => {
              const IconComponent = PLATFORM_ICONS[platform.platform as keyof typeof PLATFORM_ICONS]
              const colorClass = PLATFORM_COLORS[platform.platform as keyof typeof PLATFORM_COLORS]

              return (
                <div
                  key={platform.platform}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg text-white ${colorClass}`}>
                      {IconComponent && <IconComponent />}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{platform.platform}</div>
                      <div className="text-sm text-gray-500">
                        {platform.connected ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </span>
                        ) : (
                          <span className="text-gray-500">Not connected</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {platform.connected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(platform.platform)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect(platform.platform)}
                        disabled={connecting === platform.platform}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Link className="h-4 w-4 mr-1" />
                        {connecting === platform.platform ? 'Connecting...' : 'Connect'}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sharing Section */}
        {mediaUrl && availableForSharing.length > 0 && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">Share Content</h4>

            {/* Platform Selection */}
            <div>
              <Label className="text-sm font-medium">Select Platforms</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableForSharing.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.platform)
                  return (
                    <button
                      key={platform.platform}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPlatforms(prev => prev.filter(p => p !== platform.platform))
                        } else {
                          setSelectedPlatforms(prev => [...prev, platform.platform])
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {platform.platform}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Caption */}
            <div>
              <Label htmlFor="caption" className="text-sm font-medium">Caption</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption for your post..."
                className="mt-1"
                rows={3}
                maxLength={2200}
              />
              <div className="text-sm text-gray-500 text-right mt-1">
                {caption.length}/2200
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <Label htmlFor="hashtags" className="text-sm font-medium flex items-center gap-1">
                <Hash className="h-4 w-4" />
                Hashtags
              </Label>
              <Input
                id="hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="fitness, workout, gym, motivation"
                className="mt-1"
              />
              <div className="text-sm text-gray-500 mt-1">
                Separate hashtags with commas or spaces
              </div>
            </div>

            {/* Workout Data Preview */}
            {workoutData && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">Workout Details (will be added to caption)</div>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>🏋️ Exercise: {workoutData.exercise}</div>
                  <div>📊 Sets: {workoutData.sets} × {workoutData.reps} reps</div>
                  <div>⚖️ Weight: {workoutData.weight}</div>
                  {workoutData.duration && <div>⏱️ Duration: {workoutData.duration}</div>}
                </div>
              </div>
            )}

            {/* Share Button */}
            <Button
              onClick={handleShare}
              disabled={sharing || !caption.trim() || selectedPlatforms.length === 0}
              className="w-full"
            >
              {sharing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share to {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Share Results */}
        {shareResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Share Results</h4>
            <div className="space-y-2">
              {shareResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.success
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium capitalize">{result.platform}</span>
                  </div>
                  <div className="text-sm">
                    {result.success ? (
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Shared successfully
                      </Badge>
                    ) : (
                      <span className="text-red-600">{result.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="text-sm text-gray-600">
          {connectedPlatforms.length > 0 ? (
            `Connected to ${connectedPlatforms.length} platform${connectedPlatforms.length !== 1 ? 's' : ''}`
          ) : (
            'Connect platforms to start sharing your workout content'
          )}
        </div>
      </CardContent>
    </Card>
  )
}
