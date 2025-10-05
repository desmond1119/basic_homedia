import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Category } from '../domain/Forum.types';

interface CategoryNavProps {
  categories: Category[];
  currentCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export const CategoryNav = ({ categories, currentCategoryId, onCategoryChange }: CategoryNavProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onCategoryChange(null)}
        className={`px-6 py-2.5 rounded-full whitespace-nowrap font-medium transition-all duration-200 ${
          currentCategoryId === null
            ? 'bg-white text-black shadow-lg'
            : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
      >
        {t('forum.categories.all')}
      </motion.button>
      {categories.map((category, index) => (
        <motion.button
          key={category.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onCategoryChange(category.id)}
          className={`px-6 py-2.5 rounded-full whitespace-nowrap font-medium transition-all duration-200 ${
            currentCategoryId === category.id
              ? 'bg-white text-black shadow-lg'
              : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          {category.name}
        </motion.button>
      ))}
    </div>
  );
};
