import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  X,
  Star,
  MapPin,
  Heart,
  Bookmark,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Calendar,
  Users,
  Award,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import { type AppDispatch, type RootState } from '@/core/store/store';
import {
  Provider,
  followProviderThunk,
  collectProviderThunk,
  fetchProviderReviewsThunk,
} from '../../infrastructure/ProviderThunks';
import { toast } from 'react-hot-toast';

interface ProviderDetailProps {
  provider: Provider;
  onClose: () => void;
}

const ProviderDetail: React.FC<ProviderDetailProps> = ({ provider, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { followedProviders, collectedProviders } = useSelector(
    (state: RootState) => state.provider
  );
  
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  const isFollowed = followedProviders.has(provider.id);
  const isCollected = collectedProviders.has(provider.id);

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0) {
      loadReviews();
    }
  }, [activeTab]);

  const loadReviews = async () => {
    setLoadingReviews(true);
    const result = await dispatch(fetchProviderReviewsThunk({ providerId: provider.id }));
    if (result.payload?.isSuccess()) {
      setReviews(result.payload.getValue().reviews);
    }
    setLoadingReviews(false);
  };

  const handleFollow = async () => {
    await dispatch(followProviderThunk(provider.id));
    toast.success(isFollowed ? t('providers.unfollowed') : t('providers.followed'));
  };

  const handleCollect = async () => {
    await dispatch(collectProviderThunk(provider.id));
    toast.success(isCollected ? t('providers.uncollected') : t('providers.collected'));
  };

  const handleMessage = () => {
    toast.success(t('providers.messageStarted'));
  };

  const formatPrice = (min?: number, max?: number, currency = 'USD') => {
    if (!min && !max) return t('providers.priceOnRequest');
    const symbol = currency === 'USD' ? '$' : currency;
    if (min && max) {
      return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
    }
    if (min) return `From ${symbol}${min.toLocaleString()}`;
    if (max) return `Up to ${symbol}${max.toLocaleString()}`;
    return '';
  };

  const socialIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-5 h-5" />,
    instagram: <Instagram className="w-5 h-5" />,
    twitter: <Twitter className="w-5 h-5" />,
    website: <Globe className="w-5 h-5" />,
    phone: <Phone className="w-5 h-5" />,
    email: <Mail className="w-5 h-5" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleMessage}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-medium text-sm hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {t('providers.message')}
            </button>
            <button
              onClick={handleFollow}
              className={`px-4 py-2 rounded-full font-medium text-sm hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 ${
                isFollowed
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              }`}
            >
              <Heart className="w-4 h-4" />
              {isFollowed ? t('providers.following') : t('providers.follow')}
            </button>
            <button
              onClick={handleCollect}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isCollected
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-32 overflow-y-auto max-h-[calc(100vh-60px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Hero Section */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
              {provider.logo_url ? (
                <img
                  src={provider.logo_url}
                  alt={provider.company_name}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <Briefcase className="w-20 h-20 text-white/50" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {provider.company_name}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="font-medium">{provider.type_display_name}</span>
                      {provider.location && (
                        <>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {provider.location}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {provider.badge && provider.badge !== 'standard' && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      provider.badge === 'new'
                        ? 'bg-green-100 text-green-700'
                        : provider.badge === 'top_rated'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {provider.badge === 'new' && '✨ New'}
                      {provider.badge === 'top_rated' && '⭐ Top Rated'}
                      {provider.badge === 'experienced' && '🏆 Experienced'}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 py-4 border-y border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="text-xl font-bold text-gray-900">
                        {provider.rating_avg.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">
                      {provider.review_count} {t('providers.reviews')}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      {provider.portfolio_count}
                    </div>
                    <span className="text-xs text-gray-600">
                      {t('providers.portfolios')}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      {provider.follower_count}
                    </div>
                    <span className="text-xs text-gray-600">
                      {t('providers.followers')}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      {provider.experience_years || 0}
                    </div>
                    <span className="text-xs text-gray-600">
                      {t('providers.years')}
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-6 mb-4 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      activeTab === 'about'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t('providers.about')}
                  </button>
                  <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      activeTab === 'portfolio'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t('providers.portfolio')}
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      activeTab === 'reviews'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t('providers.reviewsTab')}
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'about' && (
                  <div className="space-y-4">
                    {provider.bio && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {t('providers.aboutUs')}
                        </h3>
                        <p className="text-gray-600 whitespace-pre-wrap">
                          {provider.bio}
                        </p>
                      </div>
                    )}

                    {provider.services && provider.services.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {t('providers.services')}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {provider.services.map((service, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {provider.tags && provider.tags.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {t('providers.specialties')}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {provider.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'portfolio' && (
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="aspect-square bg-gray-100 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {loadingReviews ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      </div>
                    ) : reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-4">
                          <div className="flex items-start gap-3">
                            {review.avatar_url ? (
                              <img
                                src={review.avatar_url}
                                alt={review.username}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">
                                  {review.username}
                                </span>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? 'text-yellow-500 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.title && (
                                <h4 className="font-medium text-gray-900 mb-1">
                                  {review.title}
                                </h4>
                              )}
                              {review.content && (
                                <p className="text-gray-600 text-sm">
                                  {review.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        {t('providers.noReviews')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price & Contact */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                {t('providers.pricing')}
              </h3>
              <div className="text-2xl font-bold text-gray-900 mb-4">
                {formatPrice(provider.price_min, provider.price_max, provider.currency)}
              </div>
              
              <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all">
                {t('providers.getQuote')}
              </button>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                {t('providers.companyInfo')}
              </h3>
              <div className="space-y-3">
                {provider.founded_year && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {t('providers.founded')} {provider.founded_year}
                    </span>
                  </div>
                )}
                {provider.team_size && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {provider.team_size} {t('providers.teamMembers')}
                    </span>
                  </div>
                )}
                {provider.experience_years && (
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {provider.experience_years} {t('providers.yearsExperience')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            {provider.social_links && Object.keys(provider.social_links).length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {t('providers.connect')}
                </h3>
                <div className="space-y-2">
                  {Object.entries(provider.social_links).map(([key, value]) => (
                    <a
                      key={key}
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {socialIcons[key] || <Globe className="w-5 h-5" />}
                      <span className="text-sm text-gray-600 capitalize">{key}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProviderDetail;
