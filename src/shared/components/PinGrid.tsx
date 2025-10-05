import { motion } from 'framer-motion';
import { PinCard } from './PinCard';

interface PinGridItem {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  tags?: string[];
  isLiked?: boolean;
  isCollected?: boolean;
  likeCount?: number;
}

interface PinGridProps {
  items: PinGridItem[];
  onLike?: (id: string) => void;
  onCollect?: (id: string) => void;
  onShare?: (id: string) => void;
  onItemClick?: (id: string) => void;
  loading?: boolean;
}

export const PinGrid = ({
  items,
  onLike,
  onCollect,
  onShare,
  onItemClick,
  loading = false,
}: PinGridProps) => {
  if (loading && items.length === 0) {
    return (
      <div className="pin-grid">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="pin-card animate-pulse mb-4">
            <div className="w-full h-64 bg-gray-200 rounded-t-2xl" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pin-grid">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <PinCard
            id={item.id}
            imageUrl={item.imageUrl}
            title={item.title}
            description={item.description}
            tags={item.tags}
            isLiked={item.isLiked}
            isCollected={item.isCollected}
            likeCount={item.likeCount}
            onLike={onLike}
            onCollect={onCollect}
            onShare={onShare}
            onClick={onItemClick}
          />
        </motion.div>
      ))}
      
      {loading && items.length > 0 && (
        <>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`loading-${index}`} className="pin-card animate-pulse mb-4">
              <div className="w-full h-64 bg-gray-200 rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
