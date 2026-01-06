'use client';

import React from 'react';
import Image from 'next/image';
import {
  ProgramCategory,
  ProgramMetadata,
  AthleteInfo,
  PROGRAM_CATEGORY_COLORS,
  getProgramHeroImage,
} from '@/types/program';

interface ProgramHeroProps {
  programId: string;
  metadata: ProgramMetadata;
  category: ProgramCategory;
  athleteInfo?: AthleteInfo | null;
  isFollowing?: boolean;
  onFollow?: () => void;
  onSaveForLater?: () => void;
}

const CATEGORY_ICONS: Record<ProgramCategory, string> = {
  celebrity: 'mdi-star',
  goal: 'mdi-fire',
  lifestyle: 'mdi-heart-pulse',
  sport: 'mdi-basketball',
  modality: 'mdi-dumbbell',
};

const CATEGORY_LABELS: Record<ProgramCategory, string> = {
  celebrity: 'Celebrity Program',
  goal: 'Goal-Based Program',
  lifestyle: 'Lifestyle Program',
  sport: 'Sport-Specific Program',
  modality: 'Training Modality',
};

export function ProgramHero({
  programId,
  metadata,
  category,
  athleteInfo,
  isFollowing = false,
  onFollow,
  onSaveForLater,
}: ProgramHeroProps) {
  const heroImage = getProgramHeroImage(programId);
  const colors = PROGRAM_CATEGORY_COLORS[category];

  const gradientStyle = {
    background: `linear-gradient(135deg, ${colors.gradient_start} 0%, ${colors.gradient_end} 100%)`,
  };

  return (
    <div className="relative overflow-hidden text-white">
      {/* Background Image */}
      {heroImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt={metadata.program_name}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10" style={gradientStyle} />

      {/* Content */}
      <div className="relative z-20 max-w-[1200px] mx-auto px-6 py-12 md:py-16">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
          style={{ background: colors.badge_bg }}
        >
          <span className={`mdi ${CATEGORY_ICONS[category]} text-sm`} />
          {CATEGORY_LABELS[category]}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
          {metadata.program_name}
        </h1>

        {/* Subtitle / Description */}
        <div className="text-base md:text-lg opacity-95 max-w-xl mb-5 space-y-2">
          {metadata.description.split('\n').map((line, idx) => (
            <p key={idx} className={line.startsWith('•') ? 'pl-2' : ''}>
              {line}
            </p>
          ))}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 mb-6">
          <MetaItem icon="mdi-calendar-sync">
            {metadata.duration_weeks} Weeks
          </MetaItem>
          <MetaItem icon="mdi-clock-outline">
            {metadata.session_duration_minutes.min}-{metadata.session_duration_minutes.max} min
          </MetaItem>
          <MetaItem icon="mdi-shield-star">
            {metadata.level}
          </MetaItem>
          <MetaItem icon="mdi-dumbbell">
            {metadata.settings.join(' / ')}
          </MetaItem>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {isFollowing ? (
            <button
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
              }}
            >
              <span className="mdi mdi-check" />
              Following
            </button>
          ) : (
            <button
              onClick={onFollow}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-white text-[#254967] hover:bg-[#fcf8f2] transition-all hover:-translate-y-0.5"
            >
              <span className="mdi mdi-plus" />
              Start Program
            </button>
          )}
          <button
            onClick={onSaveForLater}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <span className="mdi mdi-bookmark-outline" />
            Save for Later
          </button>
        </div>
      </div>
    </div>
  );
}

function MetaItem({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm opacity-90">
      <span className={`mdi ${icon} text-lg opacity-80`} />
      {children}
    </div>
  );
}

export default ProgramHero;
