import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchPortfolios, setFilters, setSort, collectPortfolio, uncollectPortfolio } from '../store/portfolioSlice';
import { PortfolioCard } from './PortfolioCard';
import { useNavigate } from 'react-router-dom';

export const PortfolioListPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { portfolios, hasMore, filters, sort, fetchPortfolios: fetchState } = useAppSelector((state) => state.portfolio);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    void dispatch(fetchPortfolios({ filters, sort, limit: 20, offset: 0 }));
  }, [dispatch, filters, sort]);

  const loadMore = useCallback(() => {
    if (hasMore && fetchState.status !== 'pending') {
      void dispatch(fetchPortfolios({ filters, sort, limit: 20, offset: portfolios.length }));
    }
  }, [dispatch, hasMore, fetchState.status, filters, sort, portfolios.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const handleCollect = async (portfolioId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    await dispatch(collectPortfolio({ userId: user.id, portfolioId }));
  };

  const handleSortChange = (field: 'created_at' | 'collects_count' | 'impressions_count') => {
    dispatch(setSort({ field, order: sort.field === field && sort.order === 'desc' ? 'asc' : 'desc' }));
  };

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">{t('portfolio.list.title')}</h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSortChange('created_at')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                sort.field === 'created_at' ? 'bg-white text-black' : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {t('portfolio.list.sortNewest')}
            </button>
            <button
              onClick={() => handleSortChange('collects_count')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                sort.field === 'collects_count' ? 'bg-white text-black' : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {t('portfolio.list.sortPopular')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              portfolio={portfolio}
              onCollect={handleCollect}
              onClick={(id) => navigate(`/portfolio/${id}`)}
            />
          ))}
        </div>

        {fetchState.status === 'pending' && portfolios.length === 0 && (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
            />
          </div>
        )}

        {!hasMore && portfolios.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">{t('portfolio.list.noMore')}</p>
          </div>
        )}

        {portfolios.length === 0 && fetchState.status === 'succeeded' && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">{t('portfolio.list.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
