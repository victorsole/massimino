'use client';

import React from 'react';
import { ProgramGoals as ProgramGoalsType } from '@/types/program';

interface ProgramGoalsProps {
  goals: ProgramGoalsType;
}

const GOAL_ICONS = [
  'mdi-shield-check',
  'mdi-arm-flex',
  'mdi-trending-up',
  'mdi-heart-pulse',
  'mdi-lightning-bolt',
  'mdi-scale-bathroom',
];

export function ProgramGoals({ goals }: ProgramGoalsProps) {
  const allGoals = [
    ...(goals.outcome_goals || []),
    ...(goals.what_program_can_do || []),
  ].slice(0, 4);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="mdi mdi-target text-xl text-[#254967]" />
        <h3 className="text-base font-bold text-gray-900">Program Goals</h3>
      </div>

      <div className="space-y-0">
        {allGoals.map((goal, index) => (
          <GoalItem
            key={index}
            icon={GOAL_ICONS[index % GOAL_ICONS.length]}
            title={extractTitle(goal)}
            description={extractDescription(goal)}
            isLast={index === allGoals.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function GoalItem({
  icon,
  title,
  description,
  isLast,
}: {
  icon: string;
  title: string;
  description: string;
  isLast: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 py-3 ${
        !isLast ? 'border-b border-gray-100' : ''
      }`}
    >
      <div className="w-9 h-9 rounded-lg bg-[#254967]/10 flex items-center justify-center flex-shrink-0">
        <span className={`mdi ${icon} text-lg text-[#254967]`} />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function extractTitle(goal: string): string {
  // If the goal has a colon, use the part before as title
  if (goal.includes(':')) {
    return goal.split(':')[0].trim();
  }
  // Otherwise, use first few words
  const words = goal.split(' ');
  if (words.length <= 4) {
    return goal;
  }
  return words.slice(0, 4).join(' ');
}

function extractDescription(goal: string): string {
  // If the goal has a colon, use the part after as description
  if (goal.includes(':')) {
    return goal.split(':').slice(1).join(':').trim();
  }
  // Otherwise, use the remaining words after the title
  const words = goal.split(' ');
  if (words.length <= 4) {
    return '';
  }
  return words.slice(4).join(' ');
}

export default ProgramGoals;
