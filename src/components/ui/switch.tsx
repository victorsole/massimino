"use client";

import * as React from "react"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = '', checked, onCheckedChange, disabled, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        } ${checked ? 'bg-blue-600' : 'bg-gray-200'} ${className}`}
      >
        <input
          type="checkbox"
          ref={ref}
          id={id}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </label>
    );
  }
);

Switch.displayName = "Switch";

export { Switch }
