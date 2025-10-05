import { motion } from 'framer-motion';
import { StarIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { ProviderProfile } from '../domain/Provider.types';

interface Props {
  profile: ProviderProfile;
}

export const ProviderHero = ({ profile }: Props) => {
  return (
    <div className="relative h-[400px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-8 w-full"
        >
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-2xl bg-white/10 border-2 border-white/20 p-4 backdrop-blur-sm">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={profile.companyName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50 text-4xl font-bold">
                  {profile.companyName[0]}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-5xl font-bold text-white mb-3">
              {profile.companyName}
            </h1>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <StarIcon className="w-6 h-6 text-yellow-400" />
                <span className="text-2xl font-bold text-white">
                  {profile.overallRating.toFixed(1)}
                </span>
                <span className="text-gray-400">
                  ({profile.totalReviews} reviews)
                </span>
              </div>

              <div className="h-6 w-px bg-gray-700" />

              <div className="flex items-center gap-2 text-gray-400">
                <MapPinIcon className="w-5 h-5" />
                <span>Hong Kong</span>
              </div>
            </div>

            {profile.bio && (
              <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
