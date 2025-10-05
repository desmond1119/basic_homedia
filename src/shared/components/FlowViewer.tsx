// Interactive flow viewer with hotspots and animations
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface Hotspot {
  x: number;
  y: number;
  label: string;
  targetScreen?: number;
}

interface Screen {
  id: number;
  image: string;
  title: string;
  hotspots: Hotspot[];
}

interface FlowViewerProps {
  screens: Screen[];
}

export const FlowViewer = ({ screens }: FlowViewerProps) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [hoveredHotspot, setHoveredHotspot] = useState<number | null>(null);

  const screen = screens[currentScreen];

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Screen container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="relative aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Screen image */}
          <img
            src={screen?.image}
            alt={screen?.title}
            className="w-full h-full object-cover"
          />
          
          {/* Hotspots */}
          {screen?.hotspots.map((hotspot, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="absolute cursor-pointer"
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              onMouseEnter={() => setHoveredHotspot(index)}
              onMouseLeave={() => setHoveredHotspot(null)}
              onClick={() => hotspot.targetScreen !== undefined && setCurrentScreen(hotspot.targetScreen)}
            >
              {/* Pulse animation */}
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-white/30 rounded-full blur-sm"
              />
              
              {/* Hotspot dot */}
              <div className="relative w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-black rounded-full" />
              </div>
              
              {/* Label */}
              <AnimatePresence>
                {hoveredHotspot === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white text-black px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg"
                  >
                    {hotspot.label}
                    {hotspot.targetScreen !== undefined && (
                      <ArrowRightIcon className="inline-block w-3 h-3 ml-1" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
      <div className="flex gap-2 mt-6 justify-center">
        {screens.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentScreen(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentScreen ? 'w-8 bg-white' : 'w-2 bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
