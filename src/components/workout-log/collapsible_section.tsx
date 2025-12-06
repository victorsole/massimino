'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/core/utils/common';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'blue' | 'gray';
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon: Icon,
  variant = 'default',
  defaultCollapsed = false,
  children,
  className
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const variantStyles = {
    default: {
      container: 'bg-white border border-gray-200',
      header: 'text-gray-700 hover:bg-gray-50',
      content: 'text-gray-600'
    },
    blue: {
      container: 'bg-blue-50 border border-blue-200',
      header: 'text-blue-800 hover:bg-blue-100',
      content: 'text-blue-700'
    },
    gray: {
      container: 'bg-gray-50 border border-gray-200',
      header: 'text-gray-800 hover:bg-gray-100',
      content: 'text-gray-700'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn('rounded-lg overflow-hidden', styles.container, className)}>
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          'w-full flex items-center justify-between p-3 transition-colors duration-200',
          styles.header
        )}
        aria-expanded={!isCollapsed}
        aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
        ) : (
          <ChevronUp className="h-4 w-4 transition-transform duration-200" />
        )}
      </button>

      <div
        id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isCollapsed ? 'max-h-0' : 'max-h-[1000px]'
        )}
      >
        <div className={cn('p-3 pt-0 text-sm', styles.content)}>
          {children}
        </div>
      </div>
    </div>
  );
}
