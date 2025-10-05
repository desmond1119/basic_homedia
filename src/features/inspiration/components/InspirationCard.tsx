import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  BookmarkIcon,
  HeartIcon,
  ShareIcon,
  UserPlusIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';
import { ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';
import type { InspirationItem } from '../domain/Inspiration.types';

interface InspirationCardProps {
  readonly item: InspirationItem;
  readonly isAuthenticated: boolean;
  readonly onCollect: (id: string, nextState: boolean) => void;
  readonly onLike: (id: string, nextState: boolean) => void;
  readonly onShare: (item: InspirationItem) => void;
  readonly onFollow: (item: InspirationItem) => void;
  readonly onMessage: (item: InspirationItem) => void;
  readonly onOpenModal: (item: InspirationItem) => void;
}

export const InspirationCard = memo(
  ({
    item,
    isAuthenticated,
    onCollect,
    onLike,
    onShare,
    onFollow,
    onMessage,
    onOpenModal,
  }: InspirationCardProps) => {
    const { t } = useTranslation();

    const collectLabel = item.isCollected
      ? t('inspiration.card.collected')
      : t('inspiration.card.collect');

    const likeLabel = item.isLiked
      ? t('inspiration.card.liked')
      : t('inspiration.card.like');

    const priceLabel = (() => {
      if (item.priceMin !== undefined && item.priceMax !== undefined) {
        return `${item.currency} ${Math.round(item.priceMin ?? 0).toLocaleString()} - ${Math.round(
          item.priceMax ?? 0
        ).toLocaleString()}`;
      }
      if (item.priceMin !== undefined) {
        return `${item.currency} ${Math.round(item.priceMin ?? 0).toLocaleString()}+`;
      }
      return undefined;
    })();

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="group relative overflow-hidden rounded-3xl bg-[#101010] shadow-[0_30px_60px_rgba(0,0,0,0.45)]"
      >
        <div className="relative">
          <motion.img
            src={item.heroImage}
            alt={item.title}
            className="h-72 w-full cursor-pointer object-cover transition duration-500 group-hover:scale-[1.04]"
            onClick={() => {
              onOpenModal(item);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            draggable={false}
          />

          <div className="absolute left-0 top-0 flex w-full items-start justify-between p-5">
            <div className="space-y-2">
              {item.pinned && (
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur">
                  {t('inspiration.card.pinned')}
                </span>
              )}
              {item.featured && (
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur">
                  {t('inspiration.card.featured')}
                </span>
              )}
            </div>
            {isAuthenticated && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onCollect(item.id, !item.isCollected);
                }}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  item.isCollected
                    ? 'bg-white text-black'
                    : 'bg-black/50 text-white hover:bg-white hover:text-black'
                }`}
              >
                <BookmarkIcon className="h-4 w-4" aria-hidden="true" />
                {collectLabel}
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              {item.location && <p className="text-sm text-gray-400">{item.location}</p>}
              {priceLabel && <p className="text-sm text-gray-400">{priceLabel}</p>}
            </div>
            {item.provider.logoUrl ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-white">
                <img
                  src={item.provider.logoUrl}
                  alt={item.provider.companyName}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                {item.provider.companyName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">{item.provider.companyName}</p>
                {item.provider.isVerified && (
                  <CheckBadgeIcon className="h-5 w-5 text-sky-400" aria-hidden="true" />
                )}
                {item.provider.isSponsored && (
                  <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                    {t('inspiration.card.sponsored')}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {t('inspiration.card.rating', {
                  rating: item.provider.rating.toFixed(1),
                  count: item.provider.reviewCount,
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onFollow(item);
                }}
                className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white hover:text-black"
              >
                <UserPlusIcon className="h-4 w-4" aria-hidden="true" />
                {t('inspiration.card.follow')}
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onMessage(item);
                }}
                className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white hover:text-black"
              >
                <ChatBubbleOvalLeftIcon className="h-4 w-4" aria-hidden="true" />
                {t('inspiration.card.message')}
              </motion.button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <motion.span
                key={tag}
                whileTap={{ scale: 0.92 }}
                className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-gray-300"
              >
                #{tag}
              </motion.span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <BookmarkIcon className="h-4 w-4 text-white" aria-hidden="true" />
                <span>{t('inspiration.card.collects', { count: item.stats.collects })}</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartIcon className="h-4 w-4 text-rose-400" aria-hidden="true" />
                <span>{t('inspiration.card.likes', { count: item.stats.likes })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onLike(item.id, !item.isLiked);
                }}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  item.isLiked
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white hover:text-black'
                }`}
              >
                <HeartIcon className="h-4 w-4" aria-hidden="true" />
                {likeLabel}
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onShare(item);
                }}
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white hover:text-black"
              >
                <ShareIcon className="h-4 w-4" aria-hidden="true" />
                {t('inspiration.card.share')}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

InspirationCard.displayName = 'InspirationCard';
