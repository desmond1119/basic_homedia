import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  TrendingUp,
  Clock,
  Award,
  Filter,
  ChevronDown,
  X,
} from 'lucide-react';
import { type RootState, type AppDispatch } from '@/core/store/store';
import {
  fetchForumFeedThunk,
  postArticleThunk,
} from '../infrastructure/ForumThunks';
import {
  setFilters,
  setCurrentPost,
  setupForumRealtimeSubscription,
} from '../application/forumSlice';
import PostCard from './components/PostCard';
import PostForm from './components/PostForm';
import PostDetail from './components/PostDetail';

const categories = [
  { id: 'all', name: 'All', color: 'bg-gradient-to-r from-pink-400 to-purple-400' },
  { id: 'technology', name: 'Technology', color: 'bg-gradient-to-r from-blue-400 to-cyan-400' },
  { id: 'design', name: 'Design', color: 'bg-gradient-to-r from-purple-400 to-pink-400' },
  { id: 'business', name: 'Business', color: 'bg-gradient-to-r from-green-400 to-teal-400' },
  { id: 'lifestyle', name: 'Lifestyle', color: 'bg-gradient-to-r from-yellow-400 to-orange-400' },
  { id: 'entertainment', name: 'Entertainment', color: 'bg-gradient-to-r from-red-400 to-pink-400' },
];

const ForumPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { posts, loading, hasMore, filters, currentPost } = useSelector(
    (state: RootState) => state.forum
  );
  
  const [showPostForm, setShowPostForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dispatch(fetchForumFeedThunk({ ...filters, page: 1 }));
    const unsubscribe = dispatch(setupForumRealtimeSubscription());
    return () => unsubscribe();
  }, [dispatch, filters]);

  useEffect(() => {
    if (loading || !hasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        dispatch(fetchForumFeedThunk(filters));
      }
    });

    if (lastPostRef.current) {
      observerRef.current.observe(lastPostRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, hasMore, dispatch, filters]);

  const handleSearch = useCallback(() => {
    dispatch(setFilters({ search: searchQuery }));
  }, [dispatch, searchQuery]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    dispatch(setFilters({ category: category === 'all' ? undefined : category }));
    setShowCategoryDropdown(false);
  };

  const handleSortChange = (sortBy: 'hot' | 'new' | 'top') => {
    dispatch(setFilters({ sortBy }));
  };

  const handlePostSubmit = async (formData: any) => {
    const result = await dispatch(postArticleThunk(formData));
    if (result.payload?.isSuccess()) {
      setShowPostForm(false);
    }
  };

  if (currentPost) {
    return (
      <PostDetail
        post={currentPost}
        onClose={() => dispatch(setCurrentPost(null))}
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
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="font-semibold text-gray-900 hidden sm:block">
                {t('forum.title')}
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
                  placeholder={t('forum.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-pink-300 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowPostForm(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-medium text-sm hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:block">{t('forum.create')}</span>
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {/* Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="px-4 py-2 bg-gray-50 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {categories.find(c => c.id === selectedCategory)?.name || 'All'}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showCategoryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <div className={`w-3 h-3 rounded-full ${category.color}`} />
                        {category.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Options */}
            <div className="flex gap-2">
              <button
                onClick={() => handleSortChange('hot')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filters.sortBy === 'hot'
                    ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-1" />
                {t('forum.hot')}
              </button>
              <button
                onClick={() => handleSortChange('new')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filters.sortBy === 'new'
                    ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-1" />
                {t('forum.new')}
              </button>
              <button
                onClick={() => handleSortChange('top')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filters.sortBy === 'top'
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Award className="w-4 h-4 inline mr-1" />
                {t('forum.top')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Pinterest Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {posts.map((post, index) => (
            <div
              key={post.id}
              ref={index === posts.length - 1 ? lastPostRef : null}
              className="break-inside-avoid"
            >
              <PostCard
                post={post}
                onClick={() => dispatch(setCurrentPost(post))}
              />
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('forum.noPosts')}</p>
          </div>
        )}
      </main>

      {/* Post Form Modal */}
      <AnimatePresence>
        {showPostForm && (
          <PostForm
            onSubmit={handlePostSubmit}
            onClose={() => setShowPostForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForumPage;
