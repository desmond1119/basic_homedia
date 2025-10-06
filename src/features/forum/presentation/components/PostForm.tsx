import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  X,
  Hash,
  Send,
  Sparkles,
  Upload,
} from 'lucide-react';

interface PostFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
}

const categories = [
  { id: 'technology', name: 'Technology', color: 'from-blue-400 to-cyan-400' },
  { id: 'design', name: 'Design', color: 'from-purple-400 to-pink-400' },
  { id: 'business', name: 'Business', color: 'from-green-400 to-teal-400' },
  { id: 'lifestyle', name: 'Lifestyle', color: 'from-yellow-400 to-orange-400' },
  { id: 'entertainment', name: 'Entertainment', color: 'from-red-400 to-pink-400' },
];

const PostForm: React.FC<PostFormProps> = ({ onSubmit, onClose }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('technology');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValid = file.size <= 5 * 1024 * 1024 && 
                     ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
      if (!isValid) {
        alert(t('forum.invalidFile'));
      }
      return isValid;
    });

    setMediaFiles([...mediaFiles, ...validFiles]);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert(t('forum.requiredFields'));
      return;
    }

    onSubmit({
      title,
      content,
      category,
      tags,
      media: mediaFiles,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('forum.createPost')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('forum.titlePlaceholder')}
              className="w-full px-4 py-3 text-lg font-medium bg-gray-50 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {t('forum.category')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    category === cat.id
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('forum.contentPlaceholder')}
              rows={6}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {t('forum.tags')}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder={t('forum.tagPlaceholder')}
                className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
              >
                <Hash className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="ml-1 text-purple-500 hover:text-purple-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {t('forum.media')}
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-pink-300 hover:bg-pink-50 transition-all flex items-center justify-center gap-2 text-gray-600"
              >
                <Upload className="w-5 h-5" />
                {t('forum.uploadMedia')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Media Previews */}
              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
          >
            {t('forum.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {t('forum.publish')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PostForm;
