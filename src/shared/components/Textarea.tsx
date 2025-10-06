import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3 
            bg-gray-50 
            text-gray-900 
            border border-gray-200 
            rounded-2xl 
            focus:outline-none 
            focus:ring-2 
            focus:ring-primary-500 
            focus:bg-white 
            focus:border-primary-300 
            transition-all duration-200
            placeholder:text-gray-400
            resize-none
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${props.disabled ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
