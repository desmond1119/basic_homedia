import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import {
  fetchProviderTypes,
  createProviderType,
  updateProviderType,
  deleteProviderType,
  setProviderTypesRealtime,
} from '../store/adminSlice';
import { ProviderType, CreateProviderTypeData } from '../domain/Admin.types';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { AdminRepository } from '../infrastructure/AdminRepository';

export const ProviderTypesManage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { providerTypes, fetchProviderTypes: fetchState, manageProviderType } = useAppSelector((state) => state.admin);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<ProviderType | null>(null);
  const [formData, setFormData] = useState<CreateProviderTypeData>({
    typeName: '',
    displayName: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    void dispatch(fetchProviderTypes());

    const adminRepo = new AdminRepository();
    const unsubscribe = adminRepo.subscribeToProviderTypes((updatedTypes) => {
      dispatch(setProviderTypesRealtime(updatedTypes));
    });

    return () => unsubscribe();
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingType) {
        await dispatch(updateProviderType({ id: editingType.id, data: formData })).unwrap();
        toast.success(t('admin.providerTypes.updateSuccess'), {
          icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
          duration: 3000,
        });
      } else {
        await dispatch(createProviderType(formData)).unwrap();
        toast.success(t('admin.providerTypes.createSuccess'), {
          icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
          duration: 3000,
        });
      }
      setShowForm(false);
      setEditingType(null);
      setFormData({ typeName: '', displayName: '', description: '', isActive: true });
    } catch (error: any) {
      const errorKey = error?.message === 'PROVIDER_TYPE_EXISTS' 
        ? 'admin.providerTypes.errors.typeExists' 
        : 'admin.providerTypes.errors.saveFailed';
      toast.error(t(errorKey), {
        icon: <XCircleIcon className="w-5 h-5 text-red-500" />,
        duration: 4000,
      });
    }
  };

  const handleEdit = (type: ProviderType) => {
    setEditingType(type);
    setFormData({
      typeName: type.typeName,
      displayName: type.displayName,
      description: type.description || '',
      isActive: type.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('admin.providerTypes.deleteConfirm'))) {
      try {
        await dispatch(deleteProviderType(id)).unwrap();
        toast.success(t('admin.providerTypes.deleteSuccess'), {
          icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
          duration: 3000,
        });
      } catch (error) {
        toast.error(t('admin.providerTypes.errors.deleteFailed'), {
          icon: <XCircleIcon className="w-5 h-5 text-red-500" />,
          duration: 4000,
        });
      }
    }
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
        <h2 className="text-xl font-bold text-gray-900">{t('admin.providerTypes.title')}</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingType(null);
            setFormData({ typeName: '', displayName: '', description: '', isActive: true });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          {t('admin.providerTypes.add')}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingType ? t('admin.providerTypes.edit') : t('admin.providerTypes.create')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.providerTypes.typeName')}
              </label>
              <input
                type="text"
                value={formData.typeName}
                onChange={(e) => setFormData({ ...formData, typeName: e.target.value })}
                placeholder="interior_design"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.providerTypes.displayName')}
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Interior Design Company"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.providerTypes.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                {t('admin.providerTypes.active')}
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={manageProviderType.status === 'pending'}
                className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {manageProviderType.status === 'pending' ? t('admin.saving') : t('admin.save')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingType(null);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                {t('admin.cancel')}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providerTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{type.displayName}</h3>
                <p className="text-sm text-gray-500 mb-2">{type.typeName}</p>
                {type.description && <p className="text-sm text-gray-600">{type.description}</p>}
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      type.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {type.isActive ? t('admin.active') : t('admin.inactive')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(type)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(type.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
