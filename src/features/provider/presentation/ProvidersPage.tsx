import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Star,
} from 'lucide-react';
import { type RootState, type AppDispatch } from '@/core/store/store';
import {
  fetchProvidersThunk,
  approveProviderThunk,
} from '../infrastructure/ProviderThunks';
import {
  setFilters,
  setCurrentProvider,
  incrementPage,
  setupProviderRealtimeSubscription,
} from '../application/providerSlice';
import ProviderCard from './components/ProviderCard';
import ProviderDetail from './components/ProviderDetail';
import { toast } from 'react-hot-toast';

const providerTypes = [
  { id: 'all', name: 'All', color: 'bg-gradient-to-r from-purple-400 to-pink-400' },
  { id: 'interior_designer', name: 'Interior Designer', color: 'bg-gradient-to-r from-blue-400 to-cyan-400' },
  { id: 'architect', name: 'Architect', color: 'bg-gradient-to-r from-green-400 to-teal-400' },
  { id: 'contractor', name: 'Contractor', color: 'bg-gradient-to-r from-yellow-400 to-orange-400' },
  { id: 'landscaper', name: 'Landscaper', color: 'bg-gradient-to-r from-red-400 to-pink-400' },
];

const locations = [
  { id: 'all', name: 'All Locations' },
  { id: 'new-york', name: 'New York' },
  { id: 'los-angeles', name: 'Los Angeles' },
  { id: 'chicago', name: 'Chicago' },
  { id: 'san-francisco', name: 'San Francisco' },
];

const priceRanges = [
  { id: 'all', name: 'Any Budget', min: undefined, max: undefined },
  { id: 'budget', name: '$', min: 0, max: 10000 },
  { id: 'mid', name: '$$', min: 10000, max: 50000 },
  { id: 'high', name: '$$$', min: 50000, max: 100000 },
  { id: 'luxury', name: '$$$$', min: 100000, max: undefined },
];

const ProvidersPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { providers, loading, hasMore, filters, currentProvider } = useSelector(
    (state: RootState) => state.provider
  );
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastProviderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dispatch(fetchProvidersThunk({ ...filters, page: 1 }));
    const unsubscribe = dispatch(setupProviderRealtimeSubscription());
    return () => unsubscribe();
  }, [dispatch, filters]);

  useEffect(() => {
    if (loading || !hasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        dispatch(incrementPage());
        dispatch(fetchProvidersThunk({ ...filters }));
      }
    });

    if (lastProviderRef.current) {
      observerRef.current.observe(lastProviderRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, hasMore, dispatch, filters]);

  const handleSearch = useCallback(() => {
    dispatch(setFilters({ search: searchQuery }));
  }, [dispatch, searchQuery]);

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    dispatch(setFilters({ 
      type: type === 'all' ? undefined : type 
    }));
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    dispatch(setFilters({ 
      location: location === 'all' ? undefined : location 
    }));
  };

  const handlePriceSelect = (priceId: string) => {
    setSelectedPrice(priceId);
    const range = priceRanges.find(p => p.id === priceId);
    if (range) {
      dispatch(setFilters({ 
        priceMin: range.min,
        priceMax: range.max
      }));
    }
  };

  const handleRatingFilter = (rating: number) => {
    const newRating = minRating === rating ? undefined : rating;
    setMinRating(newRating);
    dispatch(setFilters({ ratingMin: newRating }));
  };

  const handleApprove = async (providerId: string) => {
    const result = await dispatch(approveProviderThunk(providerId));
    if (result.payload?.isSuccess()) {
      toast.success(t('providers.approveSuccess'));
    } else {
      toast.error(t('providers.approveError'));
    }
  };

  if (currentProvider) {
    return (
      <ProviderDetail
        provider={currentProvider}
        onClose={() => dispatch(setCurrentProvider(null))}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-semibold text-gray-900 hidden sm:block">
                {t('providers.title')}
              </span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('providers.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-purple-300 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium text-sm hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:block">{t('providers.filters')}</span>
            </button>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {/* Type Filter */}
            <div className="flex gap-2">
              {providerTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedType === type.id
                      ? `${type.color} text-white shadow-lg`
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-200" />

            {/* Location Chip */}
            <button
              className="px-4 py-2 bg-gray-50 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {locations.find(l => l.id === selectedLocation)?.name}
            </button>

            {/* Price Chip */}
            <button
              className="px-4 py-2 bg-gray-50 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              {priceRanges.find(p => p.id === selectedPrice)?.name}
            </button>

            {/* Rating Chip */}
            <button
              onClick={() => handleRatingFilter(4)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                minRating === 4
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Star className="w-4 h-4" />
              4+ {t('providers.rating')}
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100 bg-gray-50"
            >
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Location Dropdown */}
                  <select
                    value={selectedLocation}
                    onChange={(e) => handleLocationSelect(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-300"
                  >
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>

                  {/* Price Range */}
                  <select
                    value={selectedPrice}
                    onChange={(e) => handlePriceSelect(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-300"
                  >
                    {priceRanges.map((range) => (
                      <option key={range.id} value={range.id}>
                        {range.name}
                      </option>
                    ))}
                  </select>

                  {/* Sort By */}
                  <select
                    value={filters.sortBy}
                    onChange={(e) => dispatch(setFilters({ sortBy: e.target.value as any }))}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-300"
                  >
                    <option value="rating">{t('providers.sortByRating')}</option>
                    <option value="reviews">{t('providers.sortByReviews')}</option>
                    <option value="newest">{t('providers.sortByNewest')}</option>
                    <option value="price_low">{t('providers.sortByPriceLow')}</option>
                    <option value="price_high">{t('providers.sortByPriceHigh')}</option>
                  </select>

                  {/* Clear Filters */}
                  <button
                    onClick={() => {
                      setSelectedType('all');
                      setSelectedLocation('all');
                      setSelectedPrice('all');
                      setMinRating(undefined);
                      dispatch(setFilters({}));
                    }}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('providers.clearFilters')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content - Pinterest Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {providers.map((provider, index) => (
            <div
              key={provider.id}
              ref={index === providers.length - 1 ? lastProviderRef : null}
              className="break-inside-avoid"
            >
              <ProviderCard
                provider={provider}
                onClick={() => dispatch(setCurrentProvider(provider))}
                onApprove={user?.role === 'admin' && !provider.is_approved ? handleApprove : undefined}
              />
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && providers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('providers.noProviders')}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProvidersPage;
