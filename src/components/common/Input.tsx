import React from 'react';
import { cn } from './Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || Math.random().toString(36).substring(7);
    
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-[var(--shadow-neu-pressed)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "ring-2 ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-[0.8rem] font-medium text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
