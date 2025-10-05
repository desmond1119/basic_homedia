import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoIcon, BuildingOfficeIcon, StarIcon } from '@heroicons/react/24/solid';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchCollectedImages, fetchFollowedCompanies, setActiveTab, clearCollections } from '../store/profileStatsSlice';
import type { CollectionTab } from '../domain/Profile.types';

export const CollectionsPage = () => {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    collectedImages,
    followedCompanies,
    activeTab,
    hasMoreImages,
    hasMoreCompanies,
    fetchCollections,
  } = useAppSelector((state) => state.profileStats);

  useEffect(() => {
    if (userId) {
      dispatch(clearCollections());
      if (activeTab === 'images') {
        void dispatch(fetchCollectedImages({ userId, limit: 20, offset: 0 }));
      } else {
        void dispatch(fetchFollowedCompanies({ userId, limit: 20, offset: 0 }));
      }
    }
  }, [dispatch, userId, activeTab]);

  useEffect(() => {
    if (!userId) return;
    const hasMore = activeTab === 'images' ? hasMoreImages : hasMoreCompanies;
    if (!hasMore || fetchCollections.status === 'pending') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          const offset = activeTab === 'images' ? collectedImages.length : followedCompanies.length;
          if (activeTab === 'images') {
            void dispatch(fetchCollectedImages({ userId, limit: 20, offset }));
          } else {
            void dispatch(fetchFollowedCompanies({ userId, limit: 20, offset }));
          }
        }
      },
      { rootMargin: '200px' }
    );

    const node = sentinelRef.current;
    if (node) observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [dispatch, userId, activeTab, collectedImages.length, followedCompanies.length, hasMoreImages, hasMoreCompanies, fetchCollections.status]);

  const handleTabChange = (tab: CollectionTab) => {
    dispatch(setActiveTab(tab));
  };

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-6">{t('profile.collections.title')}</h1>

          <div className="flex gap-4 border-b border-gray-800">
            <TabButton
              isActive={activeTab === 'images'}
              onClick={() => handleTabChange('images')}
              icon={<PhotoIcon className="w-5 h-5" />}
              label={t('profile.collections.images')}
              count={collectedImages.length}
            />
            <TabButton
              isActive={activeTab === 'companies'}
              onClick={() => handleTabChange('companies')}
              icon={<BuildingOfficeIcon className="w-5 h-5" />}
              label={t('profile.collections.companies')}
              count={followedCompanies.length}
            />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'images' && (
            <motion.div
              key="images"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {collectedImages.map((image, index) => (
                <motion.div
                  key={image.bookmarkId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  onClick={() => navigate(`/portfolio/${image.portfolioId}`)}
                  className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group bg-gray-900"
                >
                  {image.coverImageUrl ? (
                    <img
                      src={image.coverImageUrl}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PhotoIcon className="w-16 h-16 text-gray-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-semibold mb-1">{image.title}</p>
                      {image.providerName && (
                        <p className="text-gray-300 text-sm">{image.providerName}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'companies' && (
            <motion.div
              key="companies"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {followedCompanies.map((company, index) => (
                <motion.div
                  key={company.followId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                  onClick={() => navigate(`/provider/${company.companyId}`)}
                  className="bg-gray-900 rounded-2xl border border-gray-800 p-6 cursor-pointer hover:border-gray-700 transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.companyName || company.username}
                        className="w-16 h-16 rounded-xl object-cover bg-white p-2"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center">
                        <BuildingOfficeIcon className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-1">
                        {company.companyName || company.username}
                      </h3>
                      {company.avgRating > 0 && (
                        <div className="flex items-center gap-1 text-yellow-500 text-sm">
                          <StarIcon className="w-4 h-4" />
                          <span>{company.avgRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {company.bio && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{company.bio}</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {t('profile.collections.portfoliosCount', { count: company.portfoliosCount })}
                    </span>
                    <span className="text-gray-400">
                      {new Date(company.followedAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={sentinelRef} className="h-20 flex items-center justify-center mt-8">
          {fetchCollections.status === 'pending' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full"
            />
          )}
        </div>

        {activeTab === 'images' && collectedImages.length === 0 && fetchCollections.status === 'succeeded' && (
          <div className="text-center py-12">
            <PhotoIcon className="w-20 h-20 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">{t('profile.collections.noImages')}</p>
          </div>
        )}

        {activeTab === 'companies' && followedCompanies.length === 0 && fetchCollections.status === 'succeeded' && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="w-20 h-20 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">{t('profile.collections.noCompanies')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}

const TabButton = ({ isActive, onClick, icon, label, count }: TabButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors relative ${
      isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
    }`}
  >
    {icon}
    <span>{label}</span>
    <span className="ml-2 px-2 py-0.5 bg-gray-800 rounded-full text-xs">{count}</span>
    {isActive && (
      <motion.div
        layoutId="activeTab"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    )}
  </motion.button>
);
