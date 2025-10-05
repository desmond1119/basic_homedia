// Mobbin-inspired card component for displaying patterns/screens
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MobbinCardProps {
  title: string;
  description?: string;
  image?: string;
  icon?: ReactNode;
  onClick?: () => void;
  delay?: number;
}

export const MobbinCard = ({ title, description, image, icon, onClick, delay = 0 }: MobbinCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="mobbin-card cursor-pointer overflow-hidden group"
    >
      {image && (
        <div className="relative h-48 w-full overflow-hidden bg-gray-900">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      
      <div className="p-6">
        {icon && <div className="mb-4 text-gray-400">{icon}</div>}
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        {description && <p className="text-shallow text-sm line-clamp-2">{description}</p>}
      </div>
      
      {/* Hover effect border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 rounded-lg transition-all duration-300 pointer-events-none" />
    </motion.div>
  );
};
