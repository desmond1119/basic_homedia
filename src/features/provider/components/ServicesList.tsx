import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ProviderService } from '../domain/Provider.types';

interface ServicesListProps {
  services: ProviderService[];
}

export const ServicesList = ({ services }: ServicesListProps) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl p-6 border border-gray-200"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('provider.services.title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-gray-700">{t(`provider.services.types.${service.key}`)}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
