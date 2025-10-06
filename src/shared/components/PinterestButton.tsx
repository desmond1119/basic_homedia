import { memo, ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { pinterestClasses } from '../theme/pinterest';

interface PinterestButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  loading?: boolean;
}

export const PinterestButton = memo(({
  children,
  variant = 'primary',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: PinterestButtonProps) => {
  const baseClass = pinterestClasses.button[variant];
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      className={`${baseClass} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>{children}</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
});

PinterestButton.displayName = 'PinterestButton';
