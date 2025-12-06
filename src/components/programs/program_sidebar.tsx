'use client';

import React from 'react';
import {
  ProgramMetadata,
  ProgramPrerequisites,
  AthleteInfo,
  ProgramCategory,
  PROGRAM_CATEGORY_COLORS,
} from '@/types/program';

interface ProgramSidebarProps {
  metadata: ProgramMetadata;
  prerequisites?: ProgramPrerequisites;
  redFlagsToStop?: string[];
  athleteInfo?: AthleteInfo | null;
  category: ProgramCategory;
}

export function ProgramSidebar({
  metadata,
  prerequisites,
  redFlagsToStop,
  athleteInfo,
  category,
}: ProgramSidebarProps) {
  const colors = PROGRAM_CATEGORY_COLORS[category];

  return (
    <aside className="space-y-5">
      {/* Athlete Card (for celebrity programs) */}
      {athleteInfo && (
        <AthleteCard athleteInfo={athleteInfo} colors={colors} />
      )}

      {/* Red Flags (for lifestyle/medical programs) */}
      {redFlagsToStop && redFlagsToStop.length > 0 && (
        <RedFlagsCard redFlags={redFlagsToStop} />
      )}

      {/* Prerequisites */}
      {prerequisites && (
        <PrerequisitesCard prerequisites={prerequisites} />
      )}

      {/* Program Stats */}
      <StatsCard metadata={metadata} />

      {/* Equipment */}
      <EquipmentCard equipment={metadata.equipment} />
    </aside>
  );
}

function AthleteCard({
  athleteInfo,
  colors,
}: {
  athleteInfo: AthleteInfo;
  colors: { gradient_start: string; gradient_end: string };
}) {
  const initials = athleteInfo.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="rounded-xl p-5 text-white"
      style={{
        background: `linear-gradient(135deg, ${colors.gradient_start.replace('0.82', '1')} 0%, ${colors.gradient_end.replace('0.82', '1')} 100%)`,
      }}
    >
      <div className="flex items-center gap-3.5 mb-3.5">
        <div className="w-13 h-13 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
          {initials}
        </div>
        <div>
          <div className="text-base font-bold">{athleteInfo.name}</div>
          <div className="text-xs opacity-90">{athleteInfo.achievements}</div>
        </div>
      </div>
      {athleteInfo.training_philosophy && (
        <p className="text-sm italic opacity-90 border-l-2 border-white/40 pl-3.5">
          "{athleteInfo.training_philosophy}"
        </p>
      )}
    </div>
  );
}

function RedFlagsCard({ redFlags }: { redFlags: string[] }) {
  return (
    <div className="bg-red-50 border border-red-400 rounded-xl p-4">
      <div className="flex items-center gap-2 font-semibold text-sm text-red-800 mb-3">
        <span className="mdi mdi-alert-octagon text-lg" />
        Stop Immediately If
      </div>
      <ul className="space-y-1.5">
        {redFlags.slice(0, 5).map((flag, index) => (
          <li
            key={index}
            className="flex items-center gap-2 text-xs text-red-800"
          >
            <span className="mdi mdi-close-circle text-sm" />
            {flag}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrerequisitesCard({
  prerequisites,
}: {
  prerequisites: ProgramPrerequisites;
}) {
  const allPrereqs = [
    ...(prerequisites.required || []),
    ...(prerequisites.recommended || []).slice(0, 2),
  ];

  return (
    <div className="bg-amber-50 border border-amber-400 rounded-xl p-4">
      <div className="flex items-center gap-2 font-semibold text-sm text-amber-800 mb-3">
        <span className="mdi mdi-alert-outline text-lg" />
        Prerequisites
      </div>
      <ul className="space-y-1.5">
        {allPrereqs.map((prereq, index) => (
          <li
            key={index}
            className="flex items-center gap-2 text-xs text-amber-800"
          >
            <span className="mdi mdi-check-circle text-sm" />
            {prereq}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatsCard({ metadata }: { metadata: ProgramMetadata }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
        <span className="mdi mdi-chart-box text-base" />
        Program Stats
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatItem value={metadata.duration_weeks} label="Weeks" />
        <StatItem value={metadata.frequency_per_week} label="Days/Week" />
        <StatItem value={metadata.session_duration_minutes.max} label="Max Minutes" />
        <StatItem value={metadata.total_workouts} label="Workouts" />
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center p-3 bg-[#fcf8f2] rounded-lg">
      <div className="text-2xl font-bold text-[#254967]">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function EquipmentCard({
  equipment,
}: {
  equipment: ProgramMetadata['equipment'];
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
        <span className="mdi mdi-dumbbell text-base" />
        Equipment
      </div>
      <div className="flex flex-wrap gap-2">
        {equipment.required.map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#fcf8f2] rounded-lg text-xs border border-[#254967] text-[#254967]"
          >
            <span className="mdi mdi-check text-sm" />
            {item}
          </span>
        ))}
        {equipment.recommended?.map((item, index) => (
          <span
            key={`rec-${index}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#fcf8f2] rounded-lg text-xs"
          >
            <span className="mdi mdi-minus text-sm text-gray-400" />
            {item}
          </span>
        ))}
        {equipment.optional?.map((item, index) => (
          <span
            key={`opt-${index}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#fcf8f2] rounded-lg text-xs"
          >
            <span className="mdi mdi-minus text-sm text-gray-400" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ProgramSidebar;
