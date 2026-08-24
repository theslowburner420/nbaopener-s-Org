import React, { useState } from 'react';

interface PlayerHeadshotProps {
  nbaId: number;
  name: string;
  className?: string;
  isVintage?: boolean;
}

export const PlayerHeadshot: React.FC<PlayerHeadshotProps> = ({ nbaId, name, className = "w-full h-full object-contain origin-bottom scale-110", isVintage = false }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // If the ID is clearly fake/generated (e.g. rookies in draft pool), show the fallback immediately
  const isGenerated = !nbaId || nbaId >= 5000 || nbaId < 1;

  if (hasError || isGenerated) {
    const initials = name
      ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : 'HC';
    return (
      <div className="w-full h-full bg-gradient-to-b from-zinc-850 to-zinc-950 flex flex-col items-center justify-center p-1 text-center relative select-none">
        {/* Athletic shadow silhouette vector representation */}
        <svg className="absolute inset-x-0 bottom-0 w-full h-3/4 text-zinc-800 opacity-30 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" fill="currentColor">
          <path d="M50,15 C40,15 32,23 32,33 C32,43 40,51 50,51 C60,51 68,43 68,33 C68,23 60,15 50,15 Z M20,85 C20,70 30,58 50,58 C70,58 80,70 80,85 L80,100 L20,100 Z" />
        </svg>
        <div className="relative z-10 flex flex-col items-center justify-center">
          <span className="text-[12px] font-black tracking-tighter text-zinc-550 uppercase italic leading-none">
            {initials}
          </span>
          <span className="text-[5px] font-black text-zinc-600 uppercase tracking-widest leading-none mt-1">DRAFT POOL</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-zinc-800 border-t-zinc-600 rounded-full animate-spin" />
        </div>
      )}
      <img
        src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`}
        alt={name}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`${className} transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0 scale-95'} ${isVintage ? 'brightness-95 contrast-[1.05] grayscale-[15%]' : ''}`}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
};
