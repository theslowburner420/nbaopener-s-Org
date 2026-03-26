import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Card } from '../types';
import CardItem from './CardItem';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
}

export default function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  return (
    <AnimatePresence>
      {card && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-lg flex flex-col items-center relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute -top-16 right-0 p-3 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors border border-zinc-800"
            >
              <X size={24} />
            </button>

            {/* Large Card Display */}
            <div className="w-full">
              <CardItem card={card} isOwned={true} mode="large" isFocused={true} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
