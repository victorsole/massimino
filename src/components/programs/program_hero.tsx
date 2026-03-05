'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ProgramCategory,
  ProgramMetadata,
  AthleteInfo,
  PROGRAM_CATEGORY_COLORS,
  getProgramHeroImage,
} from '@/types/program';

// Programs that should fetch a Pexels background image
const PEXELS_HERO_QUERIES: Record<string, string> = {
  // Celebrity
  'cbum-classic-physique': 'classic physique bodybuilding stage',
  'arnold-volume-workout': 'bodybuilding gym training heavy weights',
  'arnold-golden-six': 'barbell strength training gym',
  'ronnie-coleman-mass-builder': 'heavy deadlift powerlifting gym',
  'colorado-experiment-hit': 'intense weight training gym',
  'ifbb-classic-physique': 'bodybuilding competition physique',
  // Goal-Based
  'nasm-fat-loss-program': 'fitness weight loss cardio training',
  'nasm-muscle-gain-program': 'muscle building gym workout',
  'nasm-performance-program': 'athletic performance training',
  'aesthetics-hunter': 'aesthetic physique gym mirror',
  'wanna-lose-beer-belly': 'fitness transformation belly fat exercise',
  // Lifestyle
  'i-just-became-a-mum': 'postpartum fitness mother exercise',
  'i-just-became-a-dad': 'father fitness workout baby',
  'bye-stress-bye': 'yoga meditation stress relief exercise',
  'i-dont-have-much-time': 'quick workout home fitness',
  'medical-conditions': 'rehabilitation exercise physical therapy',
  // Training Modality
  'flexibility-workout': 'stretching flexibility yoga',
  'balance-workout': 'balance training stability exercise',
  'cardio-workout': 'running cardio treadmill fitness',
  'superday-workout': 'crossfit functional fitness workout',
  'hiit-workout': 'hiit high intensity interval training',
  'hyrox-training': 'hyrox fitness race functional',
  // Sport-Specific
  'basketball-conditioning': 'basketball training court athletes',
  'football-conditioning': 'football soccer training pitch',
  'handball-conditioning': 'handball sport training team',
  'rugby-conditioning': 'rugby training scrum athletes',
  'tennis-conditioning': 'tennis court training athlete',
  'volleyball-conditioning': 'volleyball training jump athletes',
  'pingpong-conditioning': 'table tennis ping pong training',
  'castellers': 'castellers human tower catalonia',
  // Personalized
  'victor-hypertrophy-fat-loss': 'hypertrophy weight training gym',
};

// Keywords in program names that map to a Pexels query (for UUID-based programs)
const NAME_HERO_QUERIES: Record<string, string> = {
  baixos: 'castellers human tower base pinya',
  contrafort: 'castellers human tower support team',
  'primeres mans': 'castellers human tower climbing',
  segons: 'castellers climbing human tower',
  'pom de dalt': 'castellers children top human tower',
};

function resolveHeroQuery(programId: string, programName?: string): string | null {
  if (PEXELS_HERO_QUERIES[programId]) return PEXELS_HERO_QUERIES[programId];
  if (programName) {
    const lower = programName.toLowerCase();
    for (const [keyword, query] of Object.entries(NAME_HERO_QUERIES)) {
      if (lower.includes(keyword)) return query;
    }
  }
  return null;
}

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
  const pexelsQuery = resolveHeroQuery(programId, metadata.program_name);
  const [pexelsImage, setPexelsImage] = useState<{ src: string; photographer: string } | null>(null);

  useEffect(() => {
    if (!pexelsQuery) return;
    fetch(`/api/pexels?query=${encodeURIComponent(pexelsQuery)}&per_page=5`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const photo = data?.photos?.[0];
        if (photo) setPexelsImage({ src: photo.src.large2x || photo.src.large, photographer: photo.photographer });
      })
      .catch(() => {});
  }, [pexelsQuery]);

  const bgImage = pexelsImage?.src || heroImage;

  const gradientStyle = {
    background: `linear-gradient(135deg, ${colors.gradient_start} 0%, ${colors.gradient_end} 100%)`,
  };

  return (
    <div className="relative overflow-hidden text-white">
      {/* Background Image */}
      {bgImage && (
        <div className="absolute inset-0 z-0">
          {pexelsImage ? (
            <img
              src={pexelsImage.src}
              alt={metadata.program_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={bgImage}
              alt={metadata.program_name}
              fill
              className="object-cover"
              priority
            />
          )}
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

        {pexelsImage && (
          <p className="mt-6 text-white/30 text-xs">
            Photo by {pexelsImage.photographer} on Pexels
          </p>
        )}
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
