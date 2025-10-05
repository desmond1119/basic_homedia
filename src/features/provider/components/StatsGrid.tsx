import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BriefcaseIcon, CalendarIcon, UsersIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface StatsGridProps {
  completedProjects: number;
  experienceYears: number;
  teamSize: number;
  foundedYear: number | null;
}

export const StatsGrid = ({ completedProjects, experienceYears, teamSize, foundedYear }: StatsGridProps) => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: TrophyIcon,
      value: completedProjects,
      label: t('provider.stats.projects'),
      color: 'text-blue-500',
    },
    {
      icon: BriefcaseIcon,
      value: `${experienceYears} ${t('provider.stats.years')}`,
      label: t('provider.stats.experience'),
      color: 'text-green-500',
    },
    {
      icon: UsersIcon,
      value: teamSize,
      label: t('provider.stats.team'),
      color: 'text-purple-500',
    },
    {
      icon: CalendarIcon,
      value: foundedYear || '-',
      label: t('provider.stats.founded'),
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <stat.icon className={`w-8 h-8 ${stat.color} mb-3`} />
          <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
          <div className="text-sm text-gray-600">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
};
