import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { HeartIcon, BookmarkIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface PinCardProps {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  tags?: string[];
  isLiked?: boolean;
  isCollected?: boolean;
  likeCount?: number;
  onLike?: (id: string) => void;
  onCollect?: (id: string) => void;
  onShare?: (id: string) => void;
  onClick?: (id: string) => void;
}

export const PinCard = ({
  id,
  imageUrl,
  title,
  description,
  tags = [],
  isLiked = false,
  isCollected = false,
  likeCount = 0,
  onLike,
  onCollect,
  onShare,
  onClick,
}: PinCardProps) => {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="pin-card mb-4"
      onClick={() => onClick?.(id)}
    >
      <div className="relative group">
        {!imageError ? (
          <img
            src={imageUrl}
            alt={title}
            className={`pin-image transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-t-2xl">
            <span className="text-gray-400 text-sm">{t('common.imageError')}</span>
          </div>
        )}
        
        <div className="pin-overlay">
          <div className="absolute top-4 right-4 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => handleAction(e, () => onCollect?.(id))}
              className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm"
            >
              {isCollected ? (
                <BookmarkSolidIcon className="w-5 h-5 text-primary-500" />
              ) : (
                <BookmarkIcon className="w-5 h-5 text-gray-700" />
              )}
            </motion.button>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleAction(e, () => onLike?.(id))}
                className="flex items-center gap-1 px-3 py-2 bg-white/90 rounded-full shadow-lg backdrop-blur-sm"
              >
                {isLiked ? (
                  <HeartSolidIcon className="w-4 h-4 text-red-500" />
                ) : (
                  <HeartIcon className="w-4 h-4 text-gray-700" />
                )}
                <span className="text-sm font-medium text-gray-700">{likeCount}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleAction(e, () => onShare?.(id))}
                className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm"
              >
                <ShareIcon className="w-4 h-4 text-gray-700" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pin-content">
        <h3 className="pin-title">{title}</h3>
        {description && <p className="pin-description">{description}</p>}
        {tags.length > 0 && (
          <div className="pin-tags">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="pin-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
