import { memo, InputHTMLAttributes, forwardRef } from 'react';
import { pinterestClasses } from '../theme/pinterest';

interface PinterestInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PinterestInput = memo(
  forwardRef<HTMLInputElement, PinterestInputProps>(
    ({ label, error, className = '', ...props }, ref) => {
      return (
        <div className="w-full">
          {label && (
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {label}
            </label>
          )}
          <input
            ref={ref}
            className={`${pinterestClasses.input} ${
              error ? 'border-red-500 focus:border-red-500' : ''
            } ${className}`}
            {...props}
          />
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </div>
      );
    }
  )
);

PinterestInput.displayName = 'PinterestInput';
