import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Portfolio } from '../domain/Provider.types';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ImageGalleryProps {
  portfolios: Portfolio[];
}

export const ImageGallery = ({ portfolios }: ImageGalleryProps) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < portfolios.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  if (portfolios.length === 0) return null;

  return (
    <div className="mobbin-card p-6">
      <h2 className="text-xl font-bold text-white mb-6">{t('provider.portfolio.title', '作品集')}</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {portfolios.map((portfolio, index) => (
          <motion.div
            key={portfolio.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => openLightbox(index)}
          >
            <img
              src={portfolio.imageUrl}
              alt={portfolio.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-sm">{portfolio.title}</h3>
                {portfolio.projectType && (
                  <p className="text-gray-300 text-xs">{portfolio.projectType}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>

            {selectedIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition"
              >
                <ChevronLeftIcon className="w-8 h-8" />
              </button>
            )}

            {selectedIndex < portfolios.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition"
              >
                <ChevronRightIcon className="w-8 h-8" />
              </button>
            )}

            {selectedIndex !== null && portfolios[selectedIndex] && (
              <div className="max-w-6xl max-h-[90vh] px-16" onClick={(e) => e.stopPropagation()}>
                <motion.img
                  key={selectedIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  src={portfolios[selectedIndex].imageUrl}
                  alt={portfolios[selectedIndex].title}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
                <div className="mt-4 text-center">
                  <h3 className="text-white text-xl font-semibold">
                    {portfolios[selectedIndex].title}
                  </h3>
                  {portfolios[selectedIndex].projectType && (
                    <p className="text-gray-400 text-sm mt-1">
                      {portfolios[selectedIndex].projectType}
                      {portfolios[selectedIndex].projectYear && 
                        ` · ${portfolios[selectedIndex].projectYear}`
                      }
                    </p>
                  )}
                  <p className="text-gray-500 text-sm mt-2">
                    {selectedIndex + 1} / {portfolios.length}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
