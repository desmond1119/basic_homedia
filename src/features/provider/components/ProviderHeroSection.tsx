import { memo } from 'react';
import { motion } from 'framer-motion';

interface ProviderHeroSectionProps {
  heroImage?: string;
}

export const ProviderHeroSection = memo(({ heroImage }: ProviderHeroSectionProps) => {
  if (!heroImage) return null;

  return (
    <div className="relative h-[60vh] overflow-hidden">
      <motion.img
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2 }}
        src={heroImage}
        alt="Hero"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-white" />
    </div>
  );
});

ProviderHeroSection.displayName = 'ProviderHeroSection';
