import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PhotoIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { createPost, uploadMedia, fetchCategories } from '../store/forumSliceSimple';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

interface PostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: string;
}

export const PostFormModalNew = ({ isOpen, onClose, categoryId }: PostFormModalProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { categories } = useAppSelector((state) => state.forum);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '');
  const [tags, setTags] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (categories.length === 0) {
      void dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  const handleClose = () => {
    setTitle('');
    setContent('');
    setSelectedCategoryId(categoryId || '');
    setTags('');
    setMediaFiles([]);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title || title.trim().length < 3) {
      newErrors.title = t('forum.post.titleRequired');
    }

    if (!content || content.trim().length < 10) {
      newErrors.content = t('forum.post.contentRequired');
    }

    if (!selectedCategoryId) {
      newErrors.category = t('forum.post.categoryRequired');
    }

    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    const uniqueTags = new Set(tagArray);
    if (tagArray.length !== uniqueTags.size) {
      newErrors.tags = t('forum.post.tagsUnique');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    setIsSubmitting(true);

    try {
      const mediaUrls: string[] = [];
      
      for (const file of mediaFiles) {
        const url = await dispatch(uploadMedia({ file, userId: user.id })).unwrap();
        mediaUrls.push(url);
      }

      await dispatch(createPost({
        userId: user.id,
        data: {
          categoryId: selectedCategoryId,
          title: title.trim(),
          content: content.trim(),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          mediaUrls,
        },
      })).unwrap();

      toast.success(t('forum.post.published'), {
        icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
        duration: 3000,
      });

      handleClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      const errorMessage = error instanceof Error ? error.message : t('error.unexpectedError');
      
      toast.error(errorMessage, {
        icon: <XCircleIcon className="w-5 h-5 text-red-500" />,
        duration: 4000,
      });
      
      setErrors({ ...errors, submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 10) {
        setErrors({ ...errors, media: t('forum.post.mediaLimit') });
        return;
      }
      setMediaFiles(files);
      setErrors({ ...errors, media: '' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-8 py-4 flex justify-between items-center rounded-t-3xl">
                <h2 className="text-2xl font-bold text-gray-900">{t('forum.post.create')}</h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('forum.post.category')} *
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  >
                    <option value="">{t('forum.post.categoryPlaceholder')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-2 text-sm text-red-500">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('forum.post.title')} *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={300}
                    placeholder={t('forum.post.titlePlaceholder')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                  {errors.title && <p className="mt-2 text-sm text-red-500">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('forum.post.content')} *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    placeholder={t('forum.post.contentPlaceholder')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
                  />
                  {errors.content && <p className="mt-2 text-sm text-red-500">{errors.content}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('forum.post.tags')}
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder={t('forum.post.tagsPlaceholder')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                  {errors.tags && <p className="mt-2 text-sm text-red-500">{errors.tags}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('forum.post.media')}
                  </label>
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-red-600"
                    >
                      <PhotoIcon className="w-5 h-5" />
                      <span>{mediaFiles.length > 0 ? t('forum.post.mediaSelected', { count: mediaFiles.length }) : t('forum.post.mediaUpload')}</span>
                    </button>
                  </div>
                  {errors.media && <p className="mt-2 text-sm text-red-500">{errors.media}</p>}
                </div>

                {errors.submit && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                    {errors.submit}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? t('forum.post.posting') : t('forum.post.post')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-3 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    {t('common.cancel')}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
