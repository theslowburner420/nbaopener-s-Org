import React, { memo } from 'react';
import { Card } from '../types';
import SBCSpecialCard from './SBCSpecialCard';

interface SBCCardProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  isRevealed?: boolean;
}

const SBCCard: React.FC<SBCCardProps> = memo(({ card, size = 'md' }) => {
  return (
    <SBCSpecialCard 
      card={card}
      size={size}
    />
  );
});

export default SBCCard;
