import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Card } from '../types';
import CardItem from './CardItem';
import SBCCard from './SBCCard';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
}

const CardDetailModal = React.memo(({ card, onClose }: CardDetailModalProps) => {
  const isSpecialSBC = card ? (
    card.isSpecialSBC || 
    ['legend_sbc', 'icon_sbc', 'moments_sbc', 'future_star', 'galaxy', 'invincible'].includes(card.rarity) ||
    card.category === 'Scream Edition' ||
    card.series === 'Scream Edition' ||
    card.id.startsWith('scream-')
  ) : false;

  return (
    <AnimatePresence>
      {card && (
        <motion.div 
          key={`card-detail-backdrop-${card.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[15000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div 
            key={`card-detail-box-${card.id}`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-lg flex flex-col items-center relative px-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute -top-12 sm:-top-16 right-4 sm:right-0 p-2.5 sm:p-3 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors border border-zinc-800 z-50 shadow-2xl"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>

            {/* Large Card Display */}
            <div className="w-full max-h-[75vh] flex items-center justify-center">
              <div className="w-full flex justify-center items-center">
                {isSpecialSBC ? (
                  <SBCCard card={card} size="lg" />
                ) : (
                  <CardItem card={card} isOwned={true} mode="large" isFocused={true} />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default CardDetailModal;
