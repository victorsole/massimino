'use client';

import { cn } from '@/core/utils/common';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function FloatingActionButton({
  onClick,
  icon,
  label,
  className,
  disabled = false
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label || 'Add'}
      className={cn(
        'fixed bottom-6 right-6 z-40',
        'w-16 h-16 rounded-full',
        'bg-brand-primary text-white',
        'flex items-center justify-center',
        'shadow-lg transition-all duration-200',
        'touch-manipulation',
        'hover:bg-brand-primary-dark hover:scale-105',
        'active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Custom shadow for depth
        '[box-shadow:0_6px_20px_rgba(37,73,103,0.4)]',
        className
      )}
    >
      {icon || <Plus className="w-7 h-7" strokeWidth={2.5} />}
    </button>
  );
}

// Extended FAB with text label (for wider screens)
interface ExtendedFABProps extends FloatingActionButtonProps {
  showLabel?: boolean;
}

export function ExtendedFAB({
  onClick,
  icon,
  label = 'Add Entry',
  className,
  disabled = false,
  showLabel = true
}: ExtendedFABProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'fixed bottom-6 right-6 z-40',
        'h-14 rounded-full',
        'bg-brand-primary text-white',
        'flex items-center justify-center gap-2',
        'shadow-lg transition-all duration-200',
        'touch-manipulation',
        'hover:bg-brand-primary-dark',
        'active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        '[box-shadow:0_6px_20px_rgba(37,73,103,0.4)]',
        showLabel ? 'px-6' : 'w-14',
        className
      )}
    >
      {icon || <Plus className="w-6 h-6" strokeWidth={2.5} />}
      {showLabel && <span className="font-semibold">{label}</span>}
    </button>
  );
}
