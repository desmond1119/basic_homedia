import { motion } from 'framer-motion';
import { HeartIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Portfolio } from '../domain/Portfolio.types';

interface Props {
  portfolio: Portfolio;
  isCollected?: boolean;
  onCollect?: (portfolioId: string) => void;
  onClick?: (portfolioId: string) => void;
}

export const PortfolioCard = ({ portfolio, isCollected, onCollect, onClick }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer"
      onClick={() => onClick?.(portfolio.id)}
    >
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900">
        <img
          src={portfolio.coverImageUrl || portfolio.images[0]?.imageUrl || ''}
          alt={portfolio.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="absolute inset-0 flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-full">
            <h3 className="text-white font-bold text-xl mb-2">{portfolio.title}</h3>
            {portfolio.address && (
              <p className="text-gray-300 text-sm mb-3">{portfolio.address}</p>
            )}
            <div className="flex items-center gap-4">
              {portfolio.areaSqft && (
                <span className="text-gray-300 text-sm">{portfolio.areaSqft} sqft</span>
              )}
              {portfolio.totalCost && (
                <span className="text-gray-300 text-sm">
                  {portfolio.currency} {portfolio.totalCost.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onCollect?.(portfolio.id);
          }}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          {isCollected ? (
            <HeartSolidIcon className="w-5 h-5 text-red-500" />
          ) : (
            <HeartIcon className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {portfolio.logoUrl && (
            <img
              src={portfolio.logoUrl}
              alt={portfolio.companyName}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <span className="text-gray-300 text-sm font-medium">
            {portfolio.companyName || portfolio.username}
          </span>
        </div>

        <div className="flex items-center gap-4 text-gray-400 text-sm">
          <div className="flex items-center gap-1">
            <HeartIcon className="w-4 h-4" />
            <span>{portfolio.collectsCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <EyeIcon className="w-4 h-4" />
            <span>{portfolio.impressionsCount}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
