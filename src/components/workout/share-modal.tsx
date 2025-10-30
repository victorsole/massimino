'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Instagram,
  Youtube,
  Download,
  TrendingUp,
  Dumbbell,
  Trophy,
  Calendar
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionName: string;
}

interface ShareData {
  type: 'program' | 'custom';
  name: string;
  description?: string;
  athleteName?: string;
  imageUrl?: string;
  difficulty?: string;
  category?: string;
  date?: Date;
  progress?: {
    currentWeek: number;
    totalWeeks: number;
    progressPercentage: number;
    workoutsCompleted: number;
  };
  exercises?: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }>;
  stats: {
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    totalDuration?: number;
    duration?: number;
    exerciseCount?: number;
    recentWorkouts?: number;
  };
  shareText: string;
}

export function ShareModal({ isOpen, onClose, sessionId, sessionName }: ShareModalProps) {
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchShareData();
    }
  }, [isOpen, sessionId]);

  const fetchShareData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workout/sessions/${sessionId}/share`);
      if (response.ok) {
        const shareData = await response.json();
        setData(shareData);
      }
    } catch (error) {
      console.error('Failed to fetch share data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!data) return;

    try {
      await navigator.clipboard.writeText(data.shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleWhatsAppShare = () => {
    if (!data) return;
    const text = encodeURIComponent(data.shareText);
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleInstagramShare = () => {
    // Instagram doesn't support direct sharing via URL, so copy text
    handleCopy();
    alert('Share text copied! Open Instagram and paste it in your story or post.');
  };

  const handleTikTokShare = () => {
    // TikTok doesn't support direct sharing via URL, so copy text
    handleCopy();
    alert('Share text copied! Open TikTok and paste it in your video description.');
  };

  const handleYouTubeShare = () => {
    // YouTube doesn't support direct sharing, copy for description
    handleCopy();
    alert('Share text copied! Paste it in your YouTube video description.');
  };

  const generateImage = () => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1080;
    canvas.height = 1350; // Instagram portrait ratio

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise texture
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 10000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        1
      );
    }
    ctx.globalAlpha = 1;

    // White rounded card
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 60, 100, canvas.width - 120, canvas.height - 200, 24);

    // Session name
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    wrapText(ctx, data.name, canvas.width / 2, 240, canvas.width - 200, 80);

    // Athlete name badge (if program)
    if (data.athleteName) {
      ctx.fillStyle = '#fbbf24';
      roundRect(ctx, canvas.width / 2 - 150, 360, 300, 60, 30);
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 32px system-ui';
      ctx.fillText(`🏆 ${data.athleteName}`, canvas.width / 2, 400);
    }

    // Progress section (for programs)
    let yOffset = data.athleteName ? 480 : 420;
    if (data.type === 'program' && data.progress) {
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 48px system-ui';
      ctx.fillText(`Week ${data.progress.currentWeek} of ${data.progress.totalWeeks}`, canvas.width / 2, yOffset);

      // Progress bar
      yOffset += 60;
      const barWidth = canvas.width - 240;
      const barHeight = 40;
      const barX = 120;

      // Background
      ctx.fillStyle = '#e5e7eb';
      roundRect(ctx, barX, yOffset, barWidth, barHeight, 20);

      // Progress
      const progressWidth = (barWidth * data.progress.progressPercentage) / 100;
      ctx.fillStyle = '#6366f1';
      roundRect(ctx, barX, yOffset, progressWidth, barHeight, 20);

      // Percentage
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 36px system-ui';
      ctx.fillText(`${data.progress.progressPercentage}%`, canvas.width / 2, yOffset + 100);

      yOffset += 140;
    }

    // Stats grid
    yOffset += 40;
    const stats = [
      { label: 'Total Volume', value: `${data.stats.totalVolume} kg`, icon: '⚡' },
      { label: 'Sets', value: data.stats.totalSets.toString(), icon: '🏋️' },
      { label: 'Reps', value: data.stats.totalReps.toString(), icon: '🔢' },
      { label: 'Workouts', value: (data.progress?.workoutsCompleted || data.stats.exerciseCount || 0).toString(), icon: '💪' },
    ];

    const statsPerRow = 2;
    const statWidth = 400;
    const statHeight = 180;
    const spacing = 60;

    stats.forEach((stat, index) => {
      const col = index % statsPerRow;
      const row = Math.floor(index / statsPerRow);
      const x = 140 + col * (statWidth + spacing);
      const y = yOffset + row * (statHeight + spacing);

      // Stat card with subtle shadow
      ctx.fillStyle = '#f3f4f6';
      roundRect(ctx, x, y, statWidth, statHeight, 16);

      // Icon
      ctx.font = '64px system-ui';
      ctx.fillText(stat.icon, x + statWidth / 2, y + 80);

      // Value
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 56px system-ui';
      ctx.fillText(stat.value, x + statWidth / 2, y + 120);

      // Label
      ctx.fillStyle = '#6b7280';
      ctx.font = '28px system-ui';
      ctx.fillText(stat.label, x + statWidth / 2, y + 160);
    });

    // Branding
    yOffset = canvas.height - 120;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px system-ui';
    ctx.fillText('Massimino Fitness', canvas.width / 2, yOffset);

    ctx.fillStyle = '#e0e7ff';
    ctx.font = '32px system-ui';
    ctx.fillText('massimino.fitness', canvas.width / 2, yOffset + 50);
  };

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let offsetY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, offsetY);
        line = words[n] + ' ';
        offsetY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, offsetY);
  };

  const handleDownload = () => {
    generateImage();

    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sessionName.replace(/\s+/g, '-')}-workout-summary.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              <CardTitle>Share Your Progress</CardTitle>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <CardDescription>
            Share your workout progress with friends and followers
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          ) : data ? (
            <>
              {/* Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border">
                <h3 className="font-bold text-xl mb-4">{data.name}</h3>

                {data.type === 'program' && data.progress && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Week {data.progress.currentWeek} of {data.progress.totalWeeks}</span>
                      <span>{data.progress.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-3">
                      <div
                        className="bg-blue-600 rounded-full h-3"
                        style={{ width: `${data.progress.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.stats.totalVolume} kg
                    </div>
                    <div className="text-xs text-gray-600">Total Volume</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.stats.totalSets}
                    </div>
                    <div className="text-xs text-gray-600">Sets</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.stats.totalReps}
                    </div>
                    <div className="text-xs text-gray-600">Reps</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.progress?.workoutsCompleted || data.stats.exerciseCount || 0}
                    </div>
                    <div className="text-xs text-gray-600">
                      {data.type === 'program' ? 'Workouts' : 'Exercises'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Text */}
              <div className="relative">
                <div className="bg-gray-50 rounded-lg p-4 pr-12 border text-sm whitespace-pre-wrap">
                  {data.shareText}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Social Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleWhatsAppShare}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={handleInstagramShare}
                  className="flex items-center gap-2"
                >
                  <Instagram className="h-4 w-4 text-pink-600" />
                  Instagram
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTikTokShare}
                  className="flex items-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                  TikTok
                </Button>
                <Button
                  variant="outline"
                  onClick={handleYouTubeShare}
                  className="flex items-center gap-2"
                >
                  <Youtube className="h-4 w-4 text-red-600" />
                  YouTube
                </Button>
              </div>

              {/* Download Image */}
              <Button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Image for Instagram/TikTok
              </Button>

              {/* Hidden canvas for image generation */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Failed to load share data
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
