import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  MapPin,
  DollarSign,
  Heart,
  Bookmark,
  MessageCircle,
  Award,
  Users,
  Briefcase,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { type AppDispatch, type RootState } from '@/core/store/store';
import { 
  followProviderThunk, 
  collectProviderThunk,
  Provider 
} from '../../infrastructure/ProviderThunks';
import { toast } from 'react-hot-toast';

interface ProviderCardProps {
  provider: Provider;
  onClick: () => void;
  onApprove?: (providerId: string) => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onClick, onApprove }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { followedProviders, collectedProviders } = useSelector(
    (state: RootState) => state.provider
  );
  const [isHovered, setIsHovered] = useState(false);
  
  const isFollowed = followedProviders.has(provider.id);
  const isCollected = collectedProviders.has(provider.id);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await dispatch(followProviderThunk(provider.id));
    toast.success(isFollowed ? t('providers.unfollowed') : t('providers.followed'));
  };

  const handleCollect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await dispatch(collectProviderThunk(provider.id));
    toast.success(isCollected ? t('providers.uncollected') : t('providers.collected'));
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to messages
    toast.success(t('providers.messageStarted'));
  };

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApprove) {
      onApprove(provider.id);
    }
  };

  const gradients = [
    'from-purple-400 to-pink-400',
    'from-blue-400 to-cyan-400',
    'from-green-400 to-teal-400',
    'from-yellow-400 to-orange-400',
    'from-red-400 to-pink-400',
    'from-indigo-400 to-purple-400',
  ];

  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

  const formatPrice = (min?: number, max?: number, currency = 'USD') => {
    if (!min && !max) return '';
    const symbol = currency === 'USD' ? '$' : currency;
    if (min && max) {
      return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
    }
    if (min) return `From ${symbol}${min.toLocaleString()}`;
    if (max) return `Up to ${symbol}${max.toLocaleString()}`;
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
    >
      {/* Badge */}
      {provider.badge && provider.badge !== 'standard' && (
        <div className="absolute top-3 left-3 z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md ${
            provider.badge === 'new' 
              ? 'bg-green-500/90 text-white'
              : provider.badge === 'top_rated'
              ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
              : 'bg-purple-500/90 text-white'
          }`}>
            {provider.badge === 'new' && '✨ New'}
            {provider.badge === 'top_rated' && '⭐ Top Rated'}
            {provider.badge === 'experienced' && '🏆 Experienced'}
          </span>
        </div>
      )}

      {/* Admin Approve Button */}
      {onApprove && !provider.is_approved && (
        <button
          onClick={handleApprove}
          className="absolute top-3 right-3 z-10 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium hover:bg-red-600 transition-colors"
        >
          Approve
        </button>
      )}

      {/* Image or Gradient Background */}
      {provider.logo_url ? (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={provider.logo_url}
            alt={provider.company_name}
            className="w-full h-full object-cover"
          />
          {isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          )}
        </div>
      ) : (
        <div className={`relative aspect-[4/3] bg-gradient-to-br ${randomGradient} p-6 flex items-center justify-center`}>
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-white font-bold text-xl">
              {provider.company_name || provider.type_display_name}
            </h3>
          </div>
        </div>
      )}

      {/* Hover Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute top-3 right-3 flex flex-col gap-2"
      >
        <button
          onClick={handleCollect}
          className={`w-10 h-10 ${
            isCollected 
              ? 'bg-purple-500 text-white' 
              : 'bg-white/90 text-gray-700'
          } backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-all`}
        >
          <Bookmark className="w-5 h-5" />
        </button>
        <button
          onClick={handleFollow}
          className={`w-10 h-10 ${
            isFollowed 
              ? 'bg-pink-500 text-white' 
              : 'bg-white/90 text-gray-700'
          } backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-all`}
        >
          <Heart className="w-5 h-5" />
        </button>
        <button
          onClick={handleMessage}
          className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all"
        >
          <MessageCircle className="w-5 h-5 text-gray-700" />
        </button>
      </motion.div>

      {/* Content */}
      <div className="p-4">
        {/* Company Name */}
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
          {provider.company_name}
        </h3>

        {/* Type & Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span className="font-medium">{provider.type_display_name}</span>
          {provider.location && (
            <>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">{provider.location}</span>
              </div>
            </>
          )}
        </div>

        {/* Bio */}
        {provider.bio && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {provider.bio}
          </p>
        )}

        {/* Services */}
        {provider.services && provider.services.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {provider.services.slice(0, 3).map((service, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {service}
              </span>
            ))}
            {provider.services.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{provider.services.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-gray-700">
                {provider.rating_avg.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">
                ({provider.review_count})
              </span>
            </div>

            {/* Portfolio Count */}
            {provider.portfolio_count > 0 && (
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {provider.portfolio_count}
                </span>
              </div>
            )}

            {/* Followers */}
            {provider.follower_count > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {provider.follower_count}
                </span>
              </div>
            )}
          </div>

          {/* Price Range */}
          {(provider.price_min || provider.price_max) && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">
                {formatPrice(provider.price_min, provider.price_max, provider.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Experience */}
        {provider.experience_years && (
          <div className="mt-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-600">
              {provider.experience_years} {t('providers.yearsExperience')}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProviderCard;
