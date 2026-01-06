"use client";

import * as React from "react"
import { Check } from "lucide-react"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div className={`h-4 w-4 shrink-0 rounded-sm border border-gray-300 peer-checked:bg-primary peer-checked:border-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center justify-center ${className}`}>
          {checked && <Check className="h-3 w-3 text-white" />}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox }
