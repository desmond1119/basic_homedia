import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { StarIcon, MapPinIcon } from '@heroicons/react/24/solid';

interface ProviderHeaderProps {
  logoUrl?: string;
  companyName: string;
  bio?: string;
  overallRating: number;
  totalReviews: number;
  services: Array<{ id: string; key: string; name: string }>;
}

export const ProviderHeader = memo(({
  logoUrl,
  companyName,
  bio,
  overallRating,
  totalReviews,
  services,
}: ProviderHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col lg:flex-row items-start gap-8">
      {logoUrl && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0"
        >
          <img
            src={logoUrl}
            alt={companyName}
            className="w-32 h-32 object-contain bg-white rounded-2xl p-4 shadow-lg border border-gray-100"
          />
        </motion.div>
      )}

      <div className="flex-1 min-w-0">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-gray-900 mb-3"
        >
          {companyName}
        </motion.h1>

        {bio && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 text-base mb-6 leading-relaxed"
          >
            {bio}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center gap-6 mb-6"
        >
          <div className="flex items-center gap-2">
            <StarIcon className="w-6 h-6 text-yellow-500" />
            <span className="text-gray-900 font-bold text-xl">
              {overallRating.toFixed(1)}
            </span>
            <span className="text-gray-500 text-sm">
              ({totalReviews} {t('provider.reviewsLabel')})
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-500">
            <MapPinIcon className="w-5 h-5" />
            <span className="text-sm">{t('provider.location')}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-3"
        >
          {services.slice(0, 6).map((service, index) => (
            <motion.span
              key={service.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors"
            >
              {t(`provider.services.${service.key}`, service.name)}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </div>
  );
});

ProviderHeader.displayName = 'ProviderHeader';
