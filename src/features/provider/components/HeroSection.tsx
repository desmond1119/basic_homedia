import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MapPinIcon, StarIcon } from '@heroicons/react/24/solid';
import { ProviderProfile } from '../domain/Provider.types';

interface HeroSectionProps {
  profile: ProviderProfile;
}

export const HeroSection = ({ profile }: HeroSectionProps) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-80 bg-gradient-to-br from-gray-900 via-gray-800 to-black"
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative h-full max-w-7xl mx-auto px-6 flex items-end pb-8">
        <div className="flex items-end gap-6">
          {profile.logoUrl && (
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={profile.logoUrl}
              alt={profile.companyName}
              className="w-32 h-32 rounded-2xl border-4 border-white shadow-2xl object-cover"
            />
          )}
          <div className="text-white pb-2">
            <h1 className="text-4xl font-bold mb-2">{profile.companyName}</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPinIcon className="w-4 h-4" />
                <span>{t('provider.location')}</span>
              </div>
              <div className="flex items-center gap-1">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold">{profile.overallRating.toFixed(1)}</span>
                <span className="text-white/80">({profile.totalReviews} {t('provider.reviewsLabel')})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
