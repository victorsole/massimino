'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, X, ExternalLink } from 'lucide-react';

interface SpotifyLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionName: string;
  currentSpotifyUrl?: string | null;
  onSuccess: () => void;
}

export function SpotifyLinkModal({
  isOpen,
  onClose,
  sessionId,
  sessionName,
  currentSpotifyUrl,
  onSuccess,
}: SpotifyLinkModalProps) {
  const [spotifyUrl, setSpotifyUrl] = useState(currentSpotifyUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSpotifyUrl(currentSpotifyUrl || '');
      setError('');
    }
  }, [isOpen, currentSpotifyUrl]);

  const extractSpotifyId = (url: string) => {
    // Extract Spotify ID from various URL formats
    const match = url.match(/(?:track|playlist|album)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const getSpotifyEmbedUrl = (url: string) => {
    const id = extractSpotifyId(url);
    if (!id) return null;

    // Determine type (track, playlist, album)
    if (url.includes('/track/')) {
      return `https://open.spotify.com/embed/track/${id}`;
    } else if (url.includes('/playlist/')) {
      return `https://open.spotify.com/embed/playlist/${id}`;
    } else if (url.includes('/album/')) {
      return `https://open.spotify.com/embed/album/${id}`;
    }
    return null;
  };

  const handleSave = async () => {
    if (!spotifyUrl.trim()) {
      setError('Please enter a Spotify URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/workout/sessions/${sessionId}/spotify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotifyUrl: spotifyUrl.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to save Spotify link');
      }
    } catch (err) {
      console.error('Error saving Spotify link:', err);
      setError('Failed to save Spotify link');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/workout/sessions/${sessionId}/spotify`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError('Failed to remove Spotify link');
      }
    } catch (err) {
      console.error('Error removing Spotify link:', err);
      setError('Failed to remove Spotify link');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const embedUrl = spotifyUrl ? getSpotifyEmbedUrl(spotifyUrl) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-green-600" />
              <CardTitle>Session Soundtrack</CardTitle>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <CardDescription>
            Link a Spotify track, playlist, or album to {sessionName}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Spotify URL
            </label>
            <Input
              type="url"
              placeholder="https://open.spotify.com/playlist/..."
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              disabled={loading}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste a Spotify track, playlist, or album link
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Preview */}
          {embedUrl && (
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={embedUrl}
                width="100%"
                height="152"
                frameBorder="0"
                allow="encrypted-media"
                title="Spotify Preview"
              />
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900 font-medium mb-1">
              How to get a Spotify link:
            </p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Open Spotify and find your track/playlist/album</li>
              <li>Click the "..." menu button</li>
              <li>Click "Share" → "Copy link to [track/playlist/album]"</li>
              <li>Paste the link here</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {currentSpotifyUrl && (
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={loading}
                className="flex-1"
              >
                Remove
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={loading || !spotifyUrl.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Saving...' : currentSpotifyUrl ? 'Update' : 'Save'}
            </Button>
          </div>

          {/* Open in Spotify */}
          {currentSpotifyUrl && (
            <a
              href={currentSpotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Spotify
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
