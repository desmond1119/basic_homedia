import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { ProviderReview, RatingsBreakdown } from '../domain/Provider.types';
import {
  PaintBrushIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface ReviewListProps {
  reviews: ProviderReview[];
  ratingsBreakdown: RatingsBreakdown;
}

export const ReviewList = ({ reviews, ratingsBreakdown }: ReviewListProps) => {
  const { t } = useTranslation();

  const ratingCategories = [
    { key: 'design', label: t('provider.ratings.design', '設計品質'), icon: PaintBrushIcon, value: ratingsBreakdown.design },
    { key: 'construction', label: t('provider.ratings.construction', '施工品質'), icon: WrenchScrewdriverIcon, value: ratingsBreakdown.construction },
    { key: 'service', label: t('provider.ratings.service', '服務態度'), icon: UserGroupIcon, value: ratingsBreakdown.service },
    { key: 'communication', label: t('provider.ratings.communication', '溝通'), icon: ChatBubbleLeftRightIcon, value: ratingsBreakdown.communication },
    { key: 'timeline', label: t('provider.ratings.timeline', '進度'), icon: ClockIcon, value: ratingsBreakdown.timeline },
    { key: 'value', label: t('provider.ratings.value', '物有所值'), icon: CurrencyDollarIcon, value: ratingsBreakdown.value },
  ];

  const renderStars = (rating: number, small = false) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarSolid
            key={i}
            className={`${small ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-500`}
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarOutline className={`${small ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-500`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <StarSolid className={`${small ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-500`} />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarOutline
            key={i}
            className={`${small ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600`}
          />
        );
      }
    }
    return stars;
  };

  return (
    <div className="mobbin-card p-6">
      <h2 className="text-xl font-bold text-white mb-6">{t('provider.reviews.title', '實績評分')}</h2>

      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ratingCategories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="flex justify-center mb-2">
                  <Icon className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{category.value.toFixed(1)}</div>
                <div className="text-shallow text-xs mb-2">{category.label}</div>
                <div className="flex justify-center gap-0.5">
                  {renderStars(category.value, true)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {review.reviewerAvatar ? (
                  <img
                    src={review.reviewerAvatar}
                    alt={review.reviewerName}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {review.reviewerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-white">{review.reviewerName}</div>
                    <div className="text-shallow text-sm">
                      {t('provider.reviews.addedTo', '加入Homedia')}
                      {review.createdAt.getFullYear()}{t('provider.reviews.year', '年')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-0.5 mb-1">{renderStars(review.overallRating, true)}</div>
                    <div className="text-shallow text-xs">
                      {review.createdAt.getFullYear()}{t('provider.reviews.year', '年')}
                      {review.createdAt.getMonth() + 1}{t('provider.reviews.month', '月')} · 
                      {review.isVerified && (
                        <span className="ml-1 text-green-400">{t('provider.reviews.verified', '驗證購買')}</span>
                      )}
                    </div>
                  </div>
                </div>
                {review.reviewText && <p className="text-gray-300 text-sm leading-relaxed">{review.reviewText}</p>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {reviews.length > 0 && (
        <div className="mt-6 text-center">
          <button className="text-shallow hover:text-white transition text-sm">
            {t('provider.reviews.showMore', '顯示全部247則評價')}
          </button>
        </div>
      )}
    </div>
  );
};
