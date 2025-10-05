import { motion } from 'framer-motion';
import { StarIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { ProviderReview } from '../domain/Provider.types';

interface Props {
  review: ProviderReview;
}

export const ReviewCard = ({ review }: Props) => {
  const { t } = useTranslation();

  const ratingDimensions = [
    { key: 'quality', label: t('provider.reviews.quality') },
    { key: 'communication', label: t('provider.reviews.communication') },
    { key: 'timeliness', label: t('provider.reviews.timeliness') },
    { key: 'value', label: t('provider.reviews.value') },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 rounded-xl p-6 border border-gray-800"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {review.reviewerAvatar ? (
            <img src={review.reviewerAvatar} alt={review.reviewerName} className="w-full h-full rounded-full object-cover" />
          ) : (
            review.reviewerName[0]?.toUpperCase()
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white font-semibold">{review.reviewerName}</span>
            {review.isVerified && (
              <CheckBadgeIcon className="w-5 h-5 text-blue-400" />
            )}
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`w-5 h-5 ${
                    star <= review.overallRating ? 'text-yellow-400' : 'text-gray-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-400 text-sm">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>

          {review.projectType && (
            <div className="inline-block px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300 mb-3">
              {review.projectType}
            </div>
          )}

          {review.reviewText && (
            <p className="text-gray-300 leading-relaxed mb-4">{review.reviewText}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {ratingDimensions.map((dim) => (
              <div key={dim.key} className="flex justify-between items-center">
                <span className="text-sm text-gray-400">{dim.label}</span>
                <div className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white font-medium">
                    {review.ratingsBreakdown[dim.key].toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
