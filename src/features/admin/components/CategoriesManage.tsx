import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchCategories, createCategory, updateCategory, deleteCategory, setCategoriesRealtime } from '../store/adminSlice';
import { Category, CreateCategoryData } from '../domain/Admin.types';
import { PlusIcon, PencilIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { AdminRepository } from '../infrastructure/AdminRepository';

export const CategoriesManage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { categories, fetchCategories: fetchState, manageCategory } = useAppSelector((state) => state.admin);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CreateCategoryData>({ name: '', description: '', icon: '', featured: false });

  useEffect(() => {
    void dispatch(fetchCategories());

    const adminRepo = new AdminRepository();
    const unsubscribe = adminRepo.subscribeToCategories((updatedCategories) => {
      dispatch(setCategoriesRealtime(updatedCategories));
    });

    return () => unsubscribe();
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      await dispatch(updateCategory({ id: editingCategory.id, data: formData }));
    } else {
      await dispatch(createCategory(formData));
    }

    if (manageCategory.status === 'succeeded') {
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', icon: '', featured: false });
      void dispatch(fetchCategories());
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      featured: category.featured,
      parentId: category.parentId || undefined,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('admin.categories.deleteConfirm'))) {
      await dispatch(deleteCategory(id));
      void dispatch(fetchCategories());
    }
  };

  const renderCategoryTree = (cats: Category[], level = 0) => {
    return cats.map((cat) => (
      <div key={cat.id}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ paddingLeft: `${level * 24}px` }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {cat.icon && <span className="text-2xl">{cat.icon}</span>}
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  {cat.name}
                  {cat.featured && <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />}
                </h3>
                {cat.description && <p className="text-sm text-gray-600">{cat.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(cat)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
        {cat.children && cat.children.length > 0 && renderCategoryTree(cat.children, level + 1)}
      </div>
    ));
  };

  if (fetchState.status === 'pending') {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gray-200 border-t-red-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t('admin.categories.title')}</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingCategory(null);
            setFormData({ name: '', description: '', icon: '', featured: false });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          {t('admin.categories.add')}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingCategory ? t('admin.categories.edit') : t('admin.categories.create')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.categories.name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.categories.description')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.categories.icon')}</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🏠"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                {t('admin.categories.featured')}
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={manageCategory.status === 'pending'}
                className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {manageCategory.status === 'pending' ? t('admin.saving') : t('admin.save')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                {t('admin.cancel')}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-3">{renderCategoryTree(categories)}</div>
    </div>
  );
};
