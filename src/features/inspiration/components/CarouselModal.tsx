import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BookmarkIcon,
  HeartIcon,
  UserPlusIcon,
  ShareIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import type { InspirationItem } from '../domain/Inspiration.types';

interface CarouselModalProps {
  readonly item: InspirationItem | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCollect: (item: InspirationItem) => void;
  readonly onLike: (item: InspirationItem) => void;
  readonly onFollow: (item: InspirationItem) => void;
  readonly onShare: (item: InspirationItem) => void;
  readonly onMessage: (item: InspirationItem) => void;
}

const imageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 160 : -160,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction > 0 ? -160 : 160,
    opacity: 0,
    scale: 0.98,
  }),
};

export const CarouselModal: FC<CarouselModalProps> = ({
  item,
  isOpen,
  onClose,
  onCollect,
  onLike,
  onFollow,
  onShare,
  onMessage,
}) => {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const images = useMemo(() => {
    if (!item) {
      return [] as string[];
    }
    const merged = [item.heroImage, ...item.gallery];
    return Array.from(new Set(merged.filter(Boolean)));
  }, [item]);

  const priceLabel = useMemo(() => {
    if (!item) {
      return null;
    }
    const { priceMin, priceMax, currency } = item;
    if (priceMin == null || priceMax == null) {
      return null;
    }
    try {
      const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      });
      const formattedMin = formatter.format(priceMin);
      const formattedMax = formatter.format(priceMax);
      return `${formattedMin} - ${formattedMax}`;
    } catch (error) {
      console.error('Failed to format price range', error);
      const fallbackMin = priceMin.toString();
      const fallbackMax = priceMax.toString();
      return `${currency} ${fallbackMin} - ${currency} ${fallbackMax}`;
    }
  }, [item]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    setIndex(0);
    setDirection(1);

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'ArrowRight' && images.length > 1) {
        setDirection(1);
        setIndex((prev) => (prev + 1) % images.length);
      }
      if (event.key === 'ArrowLeft' && images.length > 1) {
        setDirection(-1);
        setIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [images.length, isOpen, onClose]);

  const handleNext = useCallback(() => {
    if (images.length < 2) {
      return;
    }
    setDirection(1);
    setIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length < 2) {
      return;
    }
    setDirection(-1);
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (images.length < 2) {
      return;
    }
    if (info.offset.y < -80) {
      handleNext();
    } else if (info.offset.y > 80) {
      handlePrev();
    }
  };

  if (!isOpen || !item) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-6 backdrop-blur"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-gray-950/95 text-white shadow-2xl lg:h-auto lg:flex-row"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black"
            >
              <XMarkIcon className="h-5 w-5" />
              <span className="sr-only">{t('inspiration.modal.close')}</span>
            </button>

            <div className="relative flex-1 overflow-hidden bg-black/60">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={images[index]}
                  custom={direction}
                  variants={imageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  onDragEnd={handleDragEnd}
                  className="flex h-full w-full items-center justify-center"
                >
                  <img
                    src={images[index] ?? item.heroImage}
                    alt={`${item.title}-${String(index + 1)}`}
                    className="max-h-[80vh] w-full object-contain"
                  />
                </motion.div>
              </AnimatePresence>

              {images.length > 1 && (
                <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                  {images.map((_, dotIndex) => (
                    <span
                      key={`${item.id}-${String(dotIndex)}`}
                      className={`h-1.5 w-8 rounded-full transition ${
                        dotIndex === index ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/60 p-3 text-white transition hover:bg-black lg:flex"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                    <span className="sr-only">{t('inspiration.modal.previous')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/60 p-3 text-white transition hover:bg-black lg:flex"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                    <span className="sr-only">{t('inspiration.modal.next')}</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex w-full flex-col gap-6 p-8 lg:w-[340px] lg:border-l lg:border-white/10 lg:bg-black/40">
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {item.projectType &&
                    t(`inspiration.type.${item.projectType}`, {
                      defaultValue: item.projectType,
                    })}
                </span>
                <h2 className="text-2xl font-semibold leading-tight">{item.title}</h2>
                {item.description && (
                  <p className="text-sm text-white/70">{item.description}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {item.provider.logoUrl ? (
                    <img
                      src={item.provider.logoUrl}
                      alt={item.provider.companyName}
                      className="h-12 w-12 rounded-2xl bg-white p-2 object-contain"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-gray-900">
                      {item.provider.companyName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                      {t('inspiration.modal.byLine')}
                    </p>
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <span>{item.provider.companyName}</span>
                      {item.provider.isVerified && <VerifiedBadge />}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.2em] text-white/60">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div>{t('inspiration.stats.collects', { count: item.stats.collects })}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div>{t('inspiration.stats.likes', { count: item.stats.likes })}</div>
                  </div>
                  {priceLabel && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div>{t('inspiration.modal.priceRange', { range: priceLabel })}</div>
                    </div>
                  )}
                  {item.location && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div>{item.location}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onCollect(item);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    item.isCollected
                      ? 'bg-orange-500 text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <BookmarkIcon className="h-4 w-4" />
                  {item.isCollected ? t('inspiration.actions.collected') : t('inspiration.actions.collect')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLike(item);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    item.isLiked
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <HeartIcon className="h-4 w-4" />
                  {item.isLiked ? t('inspiration.actions.liked') : t('inspiration.actions.like')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onFollow(item);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    item.provider.isFollowing
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <UserPlusIcon className="h-4 w-4" />
                  {item.provider.isFollowing
                    ? t('inspiration.actions.following')
                    : t('inspiration.actions.follow')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onShare(item);
                  }}
                  className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  <ShareIcon className="h-4 w-4" />
                  {t('inspiration.actions.share')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onMessage(item);
                  }}
                  className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  {t('inspiration.actions.message')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
    </AnimatePresence>,
    document.body
  );
};

const VerifiedBadge: FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-sky-400"
  >
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);
