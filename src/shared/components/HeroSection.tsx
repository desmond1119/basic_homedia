// Mobbin-style hero section with animations
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>
      
      {/* Floating elements */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
            {t('hero.title', 'Renovation')}
            <br />
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {t('hero.subtitle', 'Platform')}
            </span>
          </h1>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-shallow max-w-2xl mx-auto mb-12"
        >
          {t('hero.description', 'Modern design system for renovation projects')}
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex gap-4 justify-center flex-wrap"
        >
          <button className="btn-primary group">
            {t('hero.cta', 'Get Started')}
            <ArrowRightIcon className="inline-block w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="btn-secondary">
            {t('hero.learn', 'Learn More')}
          </button>
        </motion.div>
        
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto"
        >
          {[
            { value: '10K+', label: t('hero.stats.users', 'Users') },
            { value: '500+', label: t('hero.stats.projects', 'Projects') },
            { value: '98%', label: t('hero.stats.satisfaction', 'Satisfaction') },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-shallow text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
