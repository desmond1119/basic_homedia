import { memo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { pinterestClasses } from '../theme/pinterest';

interface PinterestCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  hoverable?: boolean;
}

export const PinterestCard = memo(({
  children,
  onClick,
  className = '',
  hoverable = true,
}: PinterestCardProps) => {
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      onClick={onClick}
      whileHover={hoverable ? { y: -4, scale: 1.02 } : undefined}
      transition={{ duration: 0.2 }}
      className={`${pinterestClasses.card} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </Component>
  );
});

PinterestCard.displayName = 'PinterestCard';
