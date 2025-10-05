import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchProviderProfile, fetchProviderReviews } from '../store/providerSlice';
import { StarIcon, MapPinIcon, ChatBubbleLeftIcon, CalendarIcon } from '@heroicons/react/24/solid';
import { StatsGrid } from './StatsGrid';
import { ReviewList } from './ReviewList';
import { ImageGallery } from './ImageGallery';
import { SocialLinks } from './SocialLinks';

export const ProviderProfilePage = () => {
  const { t } = useTranslation();
  const { providerId } = useParams<{ providerId: string }>();
  const dispatch = useAppDispatch();
  const { currentProfile, reviews, fetchProfile } = useAppSelector((state) => state.provider);

  useEffect(() => {
    if (providerId) {
      void dispatch(fetchProviderProfile(providerId));
      void dispatch(fetchProviderReviews({ providerId, limit: 20, offset: 0 }));
    }
  }, [dispatch, providerId]);

  if (fetchProfile.status === 'pending') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🏢</div>
          <div className="text-white text-2xl font-bold">{t('provider.notFound')}</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-['Inter']">
      {currentProfile.portfolios[0] && (
        <div className="relative h-[60vh] overflow-hidden">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2 }}
            src={currentProfile.portfolios[0].imageUrl}
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`${currentProfile.portfolios[0] ? '-mt-40' : 'pt-20'} relative`}
        >
          <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {currentProfile.logoUrl && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex-shrink-0"
                >
                  <img
                    src={currentProfile.logoUrl}
                    alt={currentProfile.companyName}
                    className="w-32 h-32 object-contain bg-white rounded-2xl p-4 shadow-lg"
                  />
                </motion.div>
              )}

              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-bold text-white mb-3"
                >
                  {currentProfile.companyName}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-300 text-base mb-6 leading-relaxed"
                >
                  {currentProfile.bio}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap items-center gap-6 mb-6"
                >
                  <div className="flex items-center gap-2">
                    <StarIcon className="w-6 h-6 text-yellow-500" />
                    <span className="text-white font-bold text-xl">
                      {currentProfile.overallRating.toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ({currentProfile.totalReviews} {t('provider.reviewsLabel')})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-400">
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
                  {currentProfile.services.slice(0, 6).map((service, index) => (
                    <motion.span
                      key={service.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-gray-800 text-gray-200 rounded-full text-sm font-medium border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      {t(`provider.services.${service.key}`, service.name)}
                    </motion.span>
                  ))}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex-shrink-0"
              >
                <StatsGrid
                  completedProjects={currentProfile.completedProjects}
                  experienceYears={currentProfile.experienceYears}
                  teamSize={currentProfile.teamSize}
                  foundedYear={currentProfile.foundedYear}
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <ReviewList reviews={reviews} ratingsBreakdown={currentProfile.ratingsBreakdown} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <ImageGallery portfolios={currentProfile.portfolios} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-6"
          >
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 sticky top-6">
              <h3 className="text-xl font-bold text-white mb-6">
                {t('provider.pricing.title')}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400">{t('provider.pricing.range')}</span>
                  <span className="text-white font-semibold">
                    {currentProfile.priceRange.currency} {currentProfile.priceRange.min.toLocaleString()} - {currentProfile.priceRange.max.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-800">
                <h3 className="text-xl font-bold text-white mb-6">
                  {t('provider.contact.title')}
                </h3>
                <SocialLinks socialLinks={currentProfile.socialLinks} />
              </div>

              <div className="mt-8 space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  {t('provider.actions.message')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  <CalendarIcon className="w-5 h-5" />
                  {t('provider.actions.book')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
