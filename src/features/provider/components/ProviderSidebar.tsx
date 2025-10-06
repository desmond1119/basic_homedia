import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChatBubbleLeftIcon, CalendarIcon } from '@heroicons/react/24/solid';
import { StatsGrid } from './StatsGrid';
import { SocialLinks } from './SocialLinks';

interface ProviderSidebarProps {
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  socialLinks: Record<string, string>;
  completedProjects: number;
  experienceYears: number;
  teamSize: number;
  foundedYear: number;
}

export const ProviderSidebar = memo(({
  priceRange,
  socialLinks,
  completedProjects,
  experienceYears,
  teamSize,
  foundedYear,
}: ProviderSidebarProps) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {t('provider.pricing.title')}
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600">{t('provider.pricing.range')}</span>
            <span className="text-gray-900 font-semibold">
              {priceRange.currency} {priceRange.min.toLocaleString()} - {priceRange.max.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {t('provider.contact.title')}
          </h3>
          <SocialLinks socialLinks={socialLinks} />
        </div>

        <div className="mt-8 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors shadow-md"
          >
            <ChatBubbleLeftIcon className="w-5 h-5" />
            {t('provider.actions.message')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <CalendarIcon className="w-5 h-5" />
            {t('provider.actions.book')}
          </motion.button>
        </div>
      </div>

      <StatsGrid
        completedProjects={completedProjects}
        experienceYears={experienceYears}
        teamSize={teamSize}
        foundedYear={foundedYear}
      />
    </motion.div>
  );
});

ProviderSidebar.displayName = 'ProviderSidebar';
