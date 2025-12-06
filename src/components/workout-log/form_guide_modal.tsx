'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, ExternalLink, Loader2, Video, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ExerciseMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  mediaType: 'image' | 'video' | 'gif';
  provider: string;
  featured?: boolean;
  viewCount?: number;
}

interface FormGuideModalProps {
  exerciseId: string;
  exerciseName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FormGuideModal({
  exerciseId,
  exerciseName,
  isOpen,
  onClose,
}: FormGuideModalProps) {
  const [media, setMedia] = useState<ExerciseMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen && exerciseId) {
      fetchMedia();
    }
  }, [isOpen, exerciseId]);

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/workout/exercises/${exerciseId}/media`);
      if (response.ok) {
        const data = await response.json();
        if (data.media && data.media.length > 0) {
          // Sort: featured first, then videos, then by viewCount
          const sorted = [...data.media].sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            if (a.mediaType === 'video' && b.mediaType !== 'video') return -1;
            if (a.mediaType !== 'video' && b.mediaType === 'video') return 1;
            return (b.viewCount || 0) - (a.viewCount || 0);
          });
          setMedia(sorted);
          setCurrentIndex(0);

          // Increment view count for the first media
          if (sorted[0]?.id) {
            incrementViewCount(sorted[0].id);
          }
        } else {
          setError('No form guides available for this exercise yet.');
        }
      } else {
        setError('Failed to load form guides.');
      }
    } catch (err) {
      console.error('Failed to fetch exercise media:', err);
      setError('Failed to load form guides.');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async (mediaId: string) => {
    try {
      await fetch(`/api/workout/exercises/media/${mediaId}/view`, {
        method: 'POST',
      });
    } catch {
      // Silently fail - view tracking is not critical
    }
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % media.length;
    setCurrentIndex(nextIndex);
    if (media[nextIndex]?.id) {
      incrementViewCount(media[nextIndex].id);
    }
  };

  const handlePrev = () => {
    const prevIndex = currentIndex === 0 ? media.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    if (media[prevIndex]?.id) {
      incrementViewCount(media[prevIndex].id);
    }
  };

  const currentMedia = media[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-green-600" />
            Form Guide: {exerciseName}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">Loading form guides...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{error}</p>
              <p className="text-sm text-gray-400 mt-2">
                Be the first to contribute a form guide for this exercise!
              </p>
            </div>
          ) : currentMedia ? (
            <div className="space-y-4">
              {/* Media Display */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                {currentMedia.mediaType === 'video' ? (
                  <video
                    key={currentMedia.id}
                    src={currentMedia.url}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                    poster={currentMedia.thumbnailUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : currentMedia.mediaType === 'gif' ? (
                  <img
                    key={currentMedia.id}
                    src={currentMedia.url}
                    alt={`${exerciseName} form demonstration`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    key={currentMedia.id}
                    src={currentMedia.url}
                    alt={`${exerciseName} form demonstration`}
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Navigation Arrows */}
                {media.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                      aria-label="Next"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Media Counter */}
                {media.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {currentIndex + 1} / {media.length}
                  </div>
                )}
              </div>

              {/* Media Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {currentMedia.mediaType === 'video' ? (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Video
                      </>
                    ) : currentMedia.mediaType === 'gif' ? (
                      'GIF'
                    ) : (
                      'Image'
                    )}
                  </Badge>
                  {currentMedia.provider && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {currentMedia.provider}
                    </Badge>
                  )}
                  {currentMedia.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
                {currentMedia.viewCount !== undefined && currentMedia.viewCount > 0 && (
                  <span className="text-xs text-gray-400">
                    {currentMedia.viewCount.toLocaleString()} views
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {media.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {media.map((m, idx) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        incrementViewCount(m.id);
                      }}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        idx === currentIndex
                          ? 'border-green-500'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={m.thumbnailUrl || m.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {m.mediaType === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
