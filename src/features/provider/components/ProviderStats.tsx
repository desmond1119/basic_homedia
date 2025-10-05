import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, UserGroupIcon, BriefcaseIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ProviderProfile } from '../domain/Provider.types';

interface Props {
  profile: ProviderProfile;
}

export const ProviderStats = ({ profile }: Props) => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: BriefcaseIcon,
      label: t('provider.stats.projects'),
      value: profile.completedProjects,
    },
    {
      icon: ClockIcon,
      label: t('provider.stats.experience'),
      value: `${profile.experienceYears} ${t('provider.stats.years')}`,
    },
    {
      icon: UserGroupIcon,
      label: t('provider.stats.team'),
      value: profile.teamSize,
    },
    {
      icon: CalendarIcon,
      label: t('provider.stats.founded'),
      value: profile.foundedYear || '-',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-900 rounded-xl p-6 border border-gray-800"
        >
          <stat.icon className="w-8 h-8 text-gray-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
          <div className="text-sm text-gray-400">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
};
