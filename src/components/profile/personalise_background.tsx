// src/components/profile/personalise_background.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Upload, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations/variants';

const PREDEFINED_BACKGROUNDS = [
  { name: 'Amsterdam', url: '/images/background/amsterdam.jpg' },
  { name: 'Amsterdam Canals', url: '/images/background/amsterdam_canals.jpg' },
  { name: 'Athens', url: '/images/background/athens.jpg' },
  { name: 'Athletism Blue', url: '/images/background/athletism_blue.jpg' },
  { name: 'Athletism Red', url: '/images/background/athletism_red.jpg' },
  { name: 'Aurora', url: '/images/background/aurora.jpg' },
  { name: 'Barbell', url: '/images/background/barbell.jpg' },
  { name: 'Barcelona', url: '/images/background/barcelona.jpg' },
  { name: 'Brussels', url: '/images/background/brussels.jpg' },
  { name: 'Dumbbells & Gloves 1', url: '/images/background/dumbells_gloves_01.jpg' },
  { name: 'Dumbbells & Gloves 2', url: '/images/background/dumbells_gloves_02.jpg' },
  { name: 'Kettlebells', url: '/images/background/kettelbells.jpg' },
  { name: 'Greece', url: '/images/background/greece.jpg' },
  { name: 'Firenze', url: '/images/background/firenze.jpg' },
  { name: 'Lake', url: '/images/background/lake.jpg' },
  { name: 'Paris', url: '/images/background/paris.jpg' },
  { name: 'Santorini', url: '/images/background/santorini.jpg' },
  { name: 'Venezia', url: '/images/background/venezia.jpg' },
];

interface PersonaliseBackgroundProps {
  onUpdate?: () => void;
}

export default function PersonaliseBackground({ onUpdate }: PersonaliseBackgroundProps) {
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCurrentBackground();
  }, []);

  const loadCurrentBackground = async () => {
    try {
      const response = await fetch('/api/profile/background');
      if (response.ok) {
        const data = await response.json();
        if (data.customBackgroundUrl) {
          setCustomBackground(data.customBackgroundUrl);
          setSelectedBackground(data.customBackgroundUrl);
        } else if (data.backgroundImage) {
          setSelectedBackground(data.backgroundImage);
        }
      }
    } catch (error) {
      console.error('Failed to load background:', error);
    }
  };

  const handleBackgroundSelect = async (url: string) => {
    setSelectedBackground(url);
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundImage: url,
          customBackgroundUrl: null,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Background updated successfully!' });
        onUpdate?.();
        // Reload the page after a short delay to apply the background
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage({ type: 'error', text: 'Failed to update background' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'video/mp4'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Only JPG, PNG, and MP4 are allowed' });
      return;
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 20MB' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/profile/background/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const customUrl = uploadData.url;

      // Update user's background preference
      const updateResponse = await fetch('/api/profile/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundImage: null,
          customBackgroundUrl: customUrl,
        }),
      });

      if (updateResponse.ok) {
        setCustomBackground(customUrl);
        setSelectedBackground(customUrl);
        setMessage({ type: 'success', text: 'Custom background uploaded successfully!' });
        onUpdate?.();
        // Reload the page after a short delay to apply the background
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage({ type: 'error', text: 'Failed to set custom background' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload custom background' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalise your Massimino</CardTitle>
        <CardDescription>
          Choose a background image to personalize your Massimino experience across all pages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Custom Background Upload */}
        <div className="space-y-3">
          <Label htmlFor="custom-background" className="text-base font-semibold">
            Upload Custom Background
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="custom-background"
              type="file"
              accept="image/jpeg,image/jpg,image/png,video/mp4"
              onChange={handleFileUpload}
              disabled={isUploading || isLoading}
              className="flex-1"
            />
            {isUploading && <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />}
          </div>
          <p className="text-xs text-gray-500">
            Supported formats: JPG, PNG, MP4 (max 20MB)
          </p>
        </div>

        {/* Custom Background Preview */}
        {customBackground && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <Label className="text-base font-semibold mb-2 block">Your Custom Background</Label>
            <div
              className="relative h-32 rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-[1.02]"
              style={{
                borderColor: selectedBackground === customBackground ? '#16a34a' : 'transparent',
              }}
              onClick={() => handleBackgroundSelect(customBackground)}
            >
              <Image
                src={customBackground}
                alt="Custom Background"
                fill
                className="object-cover"
              />
              {selectedBackground === customBackground && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <div className="bg-green-500 rounded-full p-2">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Predefined Backgrounds */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Predefined Backgrounds</Label>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {PREDEFINED_BACKGROUNDS.map((bg) => (
              <motion.div
                key={bg.url}
                variants={staggerItemVariants}
                className="relative"
              >
                <div
                  className="relative h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-[1.05]"
                  style={{
                    borderColor: selectedBackground === bg.url ? '#16a34a' : 'transparent',
                  }}
                  onClick={() => handleBackgroundSelect(bg.url)}
                >
                  <Image
                    src={bg.url}
                    alt={bg.name}
                    fill
                    className="object-cover"
                  />
                  {selectedBackground === bg.url && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <div className="bg-green-500 rounded-full p-2">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-center mt-1 text-gray-600">{bg.name}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
