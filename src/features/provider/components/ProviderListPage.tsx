import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, MapPinIcon, StarIcon } from '@heroicons/react/24/outline';

interface Provider {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  location: string;
  image: string;
  description: string;
}

const mockProviders: Provider[] = [
  {
    id: '1',
    name: 'Modern Design Studio',
    type: 'Interior Design',
    rating: 4.8,
    reviews: 124,
    location: 'Hong Kong',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    description: 'Award-winning interior design studio specializing in modern residential spaces',
  },
  {
    id: '2',
    name: 'Elite Renovation Co.',
    type: 'Renovation',
    rating: 4.9,
    reviews: 98,
    location: 'Kowloon',
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
    description: 'Full-service renovation contractor with 15+ years experience',
  },
  {
    id: '3',
    name: 'Clean Home Services',
    type: 'Cleaning',
    rating: 4.7,
    reviews: 156,
    location: 'New Territories',
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
    description: 'Professional cleaning services for residential and commercial properties',
  },
];

export const ProviderListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const filteredProviders = mockProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || provider.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('provider.list.title')}
          </h1>
          <p className="text-gray-600">{t('provider.list.subtitle')}</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('provider.list.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-300 transition-all duration-200"
              />
            </div>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-300 transition-all duration-200"
          >
            <option value="all">{t('provider.list.allTypes')}</option>
            <option value="Interior Design">{t('provider.type.interiorDesign')}</option>
            <option value="Renovation">{t('provider.type.renovation')}</option>
            <option value="Cleaning">{t('provider.type.cleaning')}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/providers/${provider.id}`)}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all shadow-sm"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-900">
                  {provider.type}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {provider.name}
                </h3>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-gray-900">{provider.rating}</span>
                    <span className="text-gray-500 text-sm">({provider.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="text-sm">{provider.location}</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2">
                  {provider.description}
                </p>

                <button className="mt-4 w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium transition-colors">
                  {t('providers.viewProfile') || 'View Profile'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">{t('providers.noResults') || 'No providers found'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
