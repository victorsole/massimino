// src/components/layout/dynamic_background.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function DynamicBackground() {
  const { data: session } = useSession();
  const [background, setBackground] = useState<{
    type: 'image' | 'video' | null;
    url: string | null;
  }>({ type: null, url: null });

  useEffect(() => {
    if (session?.user?.email) {
      loadBackground();
    }
  }, [session]);

  const loadBackground = async () => {
    try {
      const response = await fetch('/api/profile/background');
      if (response.ok) {
        const data = await response.json();
        const bgUrl = data.customBackgroundUrl || data.backgroundImage;

        if (bgUrl) {
          // Determine if it's a video or image
          const isVideo = bgUrl.endsWith('.mp4');
          setBackground({
            type: isVideo ? 'video' : 'image',
            url: bgUrl,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load background:', error);
    }
  };

  if (!background.url || !background.type) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {background.type === 'video' ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-40"
        >
          <source src={background.url} type="video/mp4" />
        </video>
      ) : (
        <Image
          src={background.url}
          alt="Background"
          fill
          className="object-cover opacity-40"
          priority={false}
        />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/50 to-brand-secondary-dark/50" />
    </div>
  );
}
