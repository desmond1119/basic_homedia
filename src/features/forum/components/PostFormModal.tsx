/**
 * Post Form Modal
 * Modal for creating/editing posts with media upload
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { uploadMedia } from '../store/forumSlice';
import { useGetCategoriesQuery, useCreatePostMutation } from '../api/forumApi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

interface PostFormModalProps {
  onClose: () => void;
  categoryId?: string;
}

export const PostFormModal = ({ onClose, categoryId }: PostFormModalProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { data: categories = [] } = useGetCategoriesQuery();
  const [createPostMutation] = useCreatePostMutation();
  const { user } = useAppSelector((state) => state.auth);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '');
  const [tags, setTags] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCategoryId || !title || !content) return;

    setUploading(true);

    try {
      // Upload media files
      const mediaUrls: string[] = [];
      for (const file of mediaFiles) {
        const result = await dispatch(uploadMedia({ file, userId: user.id }));
        if (uploadMedia.fulfilled.match(result)) {
          mediaUrls.push(result.payload);
        }
      }

      // Create post using RTK Query mutation for immediate UI update
      await createPostMutation({
        categoryId: selectedCategoryId,
        title,
        content,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        mediaUrls,
      }).unwrap();

      toast.success(t('forum.post.createSuccess'));
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error(t('forum.post.createError'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">{t('forum.post.create')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Category Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forum.post.category')} *
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">{t('forum.post.categoryPlaceholder')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forum.post.title')} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={300}
                placeholder={t('forum.post.titlePlaceholder')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forum.post.content')} *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                placeholder={t('forum.post.contentPlaceholder')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forum.post.tags')}
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t('forum.post.tagsPlaceholder')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forum.post.media')}
              </label>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
              {mediaFiles.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {t('forum.post.mediaSelected', { count: mediaFiles.length })}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
              >
                {t('common.cancel')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={uploading || !title || !content || !selectedCategoryId}
                className="px-8 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    {t('forum.post.posting')}
                  </span>
                ) : (
                  t('forum.post.post')
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};
