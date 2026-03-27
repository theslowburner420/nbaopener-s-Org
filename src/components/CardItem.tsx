import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Card, Rarity } from '../types';
import { Lock, Zap } from 'lucide-react';

interface CardItemProps {
  card: Card;
  isOwned: boolean;
  mode?: 'mini' | 'large';
  onClick?: () => void;
  showBack?: boolean;
  isFocused?: boolean;
  isNew?: boolean;
}

const getRarityClass = (rarity: Rarity) => {
  switch (rarity) {
    case 'bench': return 'card-bench';
    case 'starter': return 'card-starter';
    case 'allstar': return 'card-allstar';
    case 'franchise': return 'card-franchise';
    case 'legend': return 'card-legend';
    case 'coach': return 'card-coach';
    case 'dpoy': return 'card-dpoy';
    case 'roty': return 'card-roty';
    case 'record': return 'card-record';
    case 'rookie': return 'card-rookie';
    default: return '';
  }
};

const RARITY_COLORS: Record<Rarity, string> = {
  'bench': '#94A3B8',
  'starter': '#10B981',
  'allstar': '#3B82F6',
  'franchise': '#A855F7',
  'legend': '#F59E0B',
  'coach': '#3B82F6',
  'dpoy': '#064E3B', // Deep emerald
  'roty': '#EA580C', // Bright orange
  'record': '#F59E0B', // Gold/Amber
  'rookie': '#3B82F6', // Blue
};

const CardItem: React.FC<CardItemProps> = ({ card, isOwned, mode = 'mini', onClick, showBack = false, isFocused = false, isNew = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isMini = mode === 'mini';
  
  const { rarityClass, categoryClass, isDarkCard, isHolo, isFranchise, isLegend, isDPOY, isROTY, isXFactor, isVintage } = useMemo(() => {
    const rClass = getRarityClass(card.rarity);
    const cClass = card.category === 'Award' 
      ? (card.rarity === 'dpoy' ? 'card-dpoy' : 
         card.series === 'ROTY Series' ? 'card-roty' : 
         card.series === '6MOY Series' ? 'card-6moy' : 
         card.series === 'NBA Record Series' ? 'card-record' : 'card-award') 
      : card.category === 'Dynasty' ? 'card-dynasty' : 
        card.category === 'X-Factor' ? 'card-xfactor' : 
        card.category === 'Rookie' ? 'card-rookie' : 
        card.category === 'All-Star MVP' ? 'card-as-mvp' : 
        card.category === 'Finals MVP' ? 'card-fmvp' : '';
    const dark = card.category === 'Award' || card.category === 'Coach' || card.rarity === 'dpoy' || card.rarity === 'roty' || card.rarity === 'record' || card.category === 'Dynasty' || card.category === 'X-Factor' || card.category === 'NBA Record' || card.category === 'Rookie' || card.category === 'All-Star MVP' || card.category === 'Finals MVP';
    const holo = ['allstar', 'franchise', 'legend', 'dpoy', 'roty', 'record', 'rookie'].includes(card.rarity) || card.category === 'Dynasty' || card.category === 'X-Factor';
    const franchise = card.rarity === 'franchise';
    const legend = card.rarity === 'legend' || card.category === 'Dynasty';
    const dpoy = card.rarity === 'dpoy';
    const roty = card.rarity === 'roty';
    const xfactor = card.category === 'X-Factor';
    const vintage = card.nbaId < 1000;
    
    return { rarityClass: rClass, categoryClass: cClass, isDarkCard: dark, isHolo: holo, isFranchise: franchise, isLegend: legend, isDPOY: dpoy, isROTY: roty, isXFactor: xfactor, isVintage: vintage };
  }, [card.rarity, card.category, card.series, card.nbaId]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovered) setIsHovered(true);
    if (!isOwned || !isHolo) return;
    
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    const multiplier = isLegend ? 1.5 : 1;
    const rx = (py / 100 - 0.5) * -25 * multiplier;
    const ry = (px / 100 - 0.5) * 25 * multiplier;
    
    let holoOpacity = 0.35;
    if (isLegend) holoOpacity = 0.8;
    else if (isFranchise) holoOpacity = 0.55;

    requestAnimationFrame(() => {
      target.style.setProperty('--mx', `${px}%`);
      target.style.setProperty('--my', `${py}%`);
      target.style.setProperty('--rx', `${rx}deg`);
      target.style.setProperty('--ry', `${ry}deg`);
      target.style.setProperty('--opacity', '1');
      target.style.setProperty('--holo-opacity', holoOpacity.toString());
    });
  }, [isHovered, isOwned, isHolo, isLegend, isFranchise]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(false);
    const target = e.currentTarget;
    
    let baseOpacity = 0.3;
    let baseHoloOpacity = 0.25;
    
    if (isLegend) {
      baseOpacity = 0.45;
      baseHoloOpacity = 0.5;
    } else if (isFranchise) {
      baseOpacity = 0.35;
      baseHoloOpacity = 0.35;
    }
    
    requestAnimationFrame(() => {
      target.style.setProperty('--rx', '0deg');
      target.style.setProperty('--ry', '0deg');
      target.style.setProperty('--opacity', isHolo ? baseOpacity.toString() : '0');
      target.style.setProperty('--holo-opacity', isHolo ? baseHoloOpacity.toString() : '0');
    });
  }, [isHolo, isLegend, isFranchise]);

  const RarityColor = RARITY_COLORS[card.rarity] || '#333';

  const cardContent = (
    <div
      className={`nba-card relative flex flex-col w-full aspect-[2.5/3.5] ${rarityClass} ${categoryClass} ${isDarkCard ? 'dark-card' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        '--opacity': isLegend || isDPOY || isROTY || isXFactor ? '0.45' : isFranchise ? '0.35' : isHolo ? '0.3' : '0',
        '--holo-opacity': isLegend || isDPOY || isROTY || isXFactor ? '0.5' : isFranchise ? '0.35' : isHolo ? '0.25' : '0',
        borderColor: RarityColor,
        boxShadow: !isOwned ? 'none' : `0 0 40px ${RarityColor}33, 0 10px 50px rgba(0,0,0,0.8)`,
        borderWidth: '6px',
      } as React.CSSProperties}
    >
      {/* Content Wrapper for Grayscale/Darkening */}
      <div className={`flex-1 flex flex-col relative ${!isOwned && isMini ? 'grayscale brightness-[0.2] bg-black' : ''}`}>
        {/* Vintage & Texture Layers */}
        <div className="card-texture" />
        <div className="card-vintage-overlay" />
        <div className="card-inner-border" />
        
        {/* Holographic Effects */}
        {isHolo && isOwned && (
          <>
            <div className={`subtle-shimmer ${isMini && !isHovered && !isFocused ? 'opacity-10' : 'opacity-30'}`} />
            <div className={`micro-sparkles ${isMini && !isHovered && !isFocused ? 'opacity-5' : 'opacity-15'}`} />
            <div className={`rainbow-foil ${isMini && !isHovered && !isFocused ? 'opacity-20' : 'opacity-60'}`} />
            {(isMini ? isHovered : isFocused) && (
              <>
                <div className="holo-texture-pattern" />
                <div className="modern-holo" />
              </>
            )}
          </>
        )}
        
        {!isHolo && <div className="card-shine" />}

        {/* NEW Badge */}
        {isNew && (
          <div className="absolute top-12 left-0 z-[60] bg-red-600 text-white text-[10px] font-black px-2 py-0.5 transform -rotate-45 -translate-x-2 shadow-lg border-y border-white/20">
            NEW!
          </div>
        )}

        {/* Header (Pokémon Style) */}
        <div className="px-3 py-1 flex justify-between items-center z-20 min-h-[40px]">
          <div className="flex flex-col flex-1 min-w-0 pr-2">
            <h3 className={`text-base md:text-lg font-black uppercase tracking-tighter leading-[0.9] drop-shadow-sm italic ${isDarkCard ? 'card-text-primary' : 'text-zinc-900'} break-words line-clamp-2`}>
              {card.name}
            </h3>
            <span className={`text-[7px] md:text-[9px] font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${isDarkCard ? 'card-text-secondary' : 'text-zinc-700'} ${isXFactor ? 'font-mono tracking-[0.2em] text-blue-300' : ''}`}>
              {isXFactor ? 'X-FACTOR' : card.subtitle}
            </span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <span className={`text-[8px] font-bold uppercase drop-shadow-sm ${isDarkCard ? 'text-red-400' : 'text-red-700'}`}>
              OVR
            </span>
            <span className={`text-xl md:text-2xl font-black leading-none drop-shadow-sm italic ${isDarkCard ? 'card-text-primary' : 'text-zinc-900'}`}>
              {card.stats.ovr}
            </span>
          </div>
        </div>

        {/* Photo Area (Modern Pokémon Style Frame) */}
        <div className="relative mx-2 mt-0.5 bg-white overflow-hidden rounded-sm border-[1.5px] border-black/10 shadow-md z-30 flex-[2] min-h-0">
          <div className="w-full h-full relative overflow-hidden bg-zinc-200">
            {(card.category === 'Duo' || card.category === 'All-Star MVP') && card.player2Id ? (
              <div className="flex w-full h-full">
                <div className="w-1/2 h-full relative overflow-hidden border-r border-black/10">
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-full object-cover object-top relative z-40"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
                <div className="w-1/2 h-full relative overflow-hidden">
                  <img
                    src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.player2Id}.png`}
                    alt={card.name}
                    className="w-full h-full object-cover object-top relative z-40"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
              </div>
            ) : (
              <img
                src={card.imageUrl}
                alt={card.name}
                className={`w-full h-full object-cover object-top relative z-40 ${isVintage ? 'card-vintage' : ''}`}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            )}
            {/* Background Gradient */}
            <div 
              className="absolute inset-0 opacity-30 z-10"
              style={{ background: `linear-gradient(to bottom, ${card.teamColor}, transparent)` }}
            />
          </div>
        </div>

        {/* Skills / Stats Section (Pokémon Attack Style - Horizontal) */}
        <div className="px-3 py-1 flex flex-col justify-center z-10 shrink-0">
          <div className={`flex items-center justify-around py-1 border-b ${isDarkCard ? 'card-border-subtle' : 'border-black/5'}`}>
            {/* PTS / WINS */}
            <div className="flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-600 shadow-sm mb-0.5" />
              <span className={`text-[9px] font-black ${isDarkCard ? 'card-text-primary' : 'text-zinc-900'}`}>
                {card.stats.points} <span className={`text-[6px] opacity-60 ${isDarkCard ? 'card-text-muted' : ''}`}>{card.category === 'Coach' ? 'WINS' : 'PTS'}</span>
              </span>
            </div>
            {/* REB / TITLES */}
            <div className="flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-zinc-400 border border-zinc-600 shadow-sm mb-0.5" />
              <span className={`text-[9px] font-black ${isDarkCard ? 'card-text-primary' : 'text-zinc-900'}`}>
                {card.stats.rebounds} <span className={`text-[6px] opacity-60 ${isDarkCard ? 'card-text-muted' : ''}`}>{card.category === 'Coach' ? 'TITLES' : 'REB'}</span>
              </span>
            </div>
            {/* AST / EXP */}
            <div className="flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-400 border border-blue-600 shadow-sm mb-0.5" />
              <span className={`text-[9px] font-black ${isDarkCard ? 'card-text-primary' : 'text-zinc-900'}`}>
                {card.stats.assists} <span className={`text-[6px] opacity-60 ${isDarkCard ? 'card-text-muted' : ''}`}>{card.category === 'Coach' ? 'EXP' : 'AST'}</span>
              </span>
            </div>
          </div>

          {/* Description (Pokémon Flavor Text) */}
          <div className="mt-1 px-1">
            <p className={`text-[8px] italic leading-tight text-center line-clamp-2 font-medium ${isDarkCard ? 'card-text-secondary' : 'text-zinc-800'}`}>
              "{card.description}"
            </p>
          </div>
        </div>

        {/* Bottom Info (Pokémon Style) */}
        <div className={`px-3 py-1.5 border-t z-10 shrink-0 ${isDarkCard ? 'card-border-subtle' : 'border-black/10'}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {card.teamLogoUrl && (
                <img 
                  src={card.teamLogoUrl} 
                  alt={`${card.team} logo`} 
                  className="w-6 h-6 object-contain drop-shadow-sm"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-[6px] font-black uppercase ${isDarkCard ? 'card-text-muted' : 'text-zinc-600'}`}>Team</span>
                <span className={`text-[8px] font-black uppercase tracking-tighter leading-tight break-words line-clamp-1 ${isDarkCard ? 'card-text-primary' : 'text-zinc-900'}`}>
                  {card.team}
                </span>
                {card.coach && (
                  <span className={`text-[5px] font-bold italic truncate ${isDarkCard ? 'card-text-muted' : 'text-zinc-500'}`}>
                    Coach: {card.coach}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className={`text-[6px] font-black uppercase ${isDarkCard ? 'card-text-muted' : 'text-zinc-600'}`}>Rarity</span>
              <div className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: RarityColor }} />
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-[6px] font-black uppercase ${isDarkCard ? 'card-text-muted' : 'text-zinc-600'}`}>Card No.</span>
              <span className={`text-[8px] font-bold ${isDarkCard ? 'card-text-primary' : 'text-zinc-800'}`}>
                #{card.number}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lock Overlay for Mini mode */}
      {!isOwned && isMini && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center">
          <Lock size={64} className="text-white/40 drop-shadow-2xl" strokeWidth={2.5} />
        </div>
      )}
    </div>
  );

  if (showBack) {
    return (
      <div 
        className={`nba-card relative flex flex-col items-center justify-center bg-zinc-900 ${isMini ? 'border-4' : 'border-8'} border-zinc-800 ${isMini ? 'aspect-[2.5/3.5]' : 'w-full max-w-[340px] aspect-[2.5/3.5]'}`}
        onClick={onClick}
      >
        <div className="absolute inset-4 border-2 border-zinc-700 rounded-lg flex flex-col items-center justify-center overflow-hidden bg-zinc-950">
          <div className="w-24 h-24 rounded-full border-4 border-zinc-800 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-transparent opacity-50" />
            <Zap size={48} className="text-zinc-800 relative z-10" fill="currentColor" />
          </div>
          <div className="mt-4 flex flex-col items-center">
            <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em]">NBA</span>
            <span className="text-[8px] font-bold text-zinc-800 uppercase tracking-[0.3em]">OPENER</span>
          </div>
        </div>
      </div>
    );
  }

  if (isMini) {
    return (
      <div 
        className={`nba-card relative aspect-[2.5/3.5] rounded-xl overflow-hidden border-[3px] transition-all group/mini ${rarityClass} ${isOwned ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          '--opacity': isLegend || isROTY || isXFactor ? '0.45' : isFranchise ? '0.35' : isHolo ? '0.3' : '0',
          '--holo-opacity': isLegend || isROTY || isXFactor ? '0.5' : isFranchise ? '0.35' : isHolo ? '0.25' : '0',
          borderColor: RarityColor,
          boxShadow: isOwned ? `0 4px 20px ${RarityColor}33` : 'none',
          background: 'transparent' // Override nba-card default bg
        } as React.CSSProperties}
        onClick={onClick}
      >
        <div className={`flex flex-col h-full ${!isOwned ? 'grayscale brightness-[0.2] bg-black' : ''}`}>
          {/* Top Half: Photo */}
          <div className="relative h-[55%] overflow-hidden bg-zinc-800">
            {(card.category === 'Duo' || card.category === 'All-Star MVP') && card.player2Id ? (
              <div className="flex w-full h-full transition-transform duration-500 group-hover/mini:scale-110">
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-1/2 h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <img
                  src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.player2Id}.png`}
                  alt={card.name}
                  className="w-1/2 h-full object-cover object-top border-l border-white/10"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
            ) : (
              <img
                src={card.imageUrl}
                alt={card.name}
                className={`w-full h-full object-cover object-top transition-transform duration-500 group-hover/mini:scale-110 ${isVintage ? 'card-vintage' : ''}`}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            
            {/* Name Overlay */}
            <div className="absolute bottom-1 left-1.5 right-1.5">
              <h3 className="text-[9px] font-black text-white uppercase italic leading-[0.9] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] line-clamp-2">
                {card.name}
              </h3>
              <p className="text-[6px] font-bold text-white/70 uppercase tracking-tighter truncate">
                {card.subtitle}
              </p>
            </div>

            {/* OVR Badge */}
            <div className="absolute top-1 right-1 bg-black/80 backdrop-blur-md rounded px-1 py-0.5 border border-white/20 shadow-lg">
              <span className="text-[9px] font-black text-white italic leading-none">{card.stats.ovr}</span>
            </div>
          </div>

          {/* Bottom Half: Stats */}
          <div className="flex-1 bg-zinc-950 flex flex-col justify-center px-1.5 py-1.5 relative border-t border-white/10">
            <div className="grid grid-cols-3 gap-1">
              <div className="flex flex-col items-center">
                <span className="text-[6px] font-black text-zinc-500 uppercase tracking-tighter">{card.category === 'Coach' ? 'WINS' : 'PTS'}</span>
                <span className="text-[9px] font-black text-white leading-none">{card.stats.points}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[6px] font-black text-zinc-500 uppercase tracking-tighter">{card.category === 'Coach' ? 'TITLES' : 'REB'}</span>
                <span className="text-[9px] font-black text-white leading-none">{card.stats.rebounds}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[6px] font-black text-zinc-500 uppercase tracking-tighter">{card.category === 'Coach' ? 'EXP' : 'AST'}</span>
                <span className="text-[9px] font-black text-white leading-none">{card.stats.assists}</span>
              </div>
            </div>

            {/* Team/Rarity Indicator */}
            <div className="mt-1.5 flex items-center justify-between border-t border-white/5 pt-1">
              <div className="flex items-center gap-1 min-w-0">
                {card.teamLogoUrl && (
                  <img 
                    src={card.teamLogoUrl} 
                    alt="" 
                    className="w-3 h-3 object-contain opacity-80"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                )}
                <div className="w-0.5 h-0.5 rounded-full shrink-0" style={{ backgroundColor: RarityColor }} />
                <span className="text-[6px] font-black text-zinc-400 uppercase tracking-tight leading-tight flex-1 line-clamp-2">{card.teamAbbr}</span>
              </div>
              <span className="text-[6px] font-bold text-zinc-600">#{card.number}</span>
            </div>
          </div>
        </div>

        {/* Lock Overlay */}
        {!isOwned && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10">
            <Lock size={36} className="text-white/20 drop-shadow-lg" strokeWidth={2.5} />
          </div>
        )}

        {/* Holographic Effects for Mini */}
        {isOwned && isHolo && (
          <>
            <div className={`subtle-shimmer ${!isHovered && !isFocused ? 'opacity-10' : 'opacity-30'}`} />
            <div className={`micro-sparkles ${!isHovered && !isFocused ? 'opacity-5' : 'opacity-15'}`} />
            <div className={`rainbow-foil ${!isHovered && !isFocused ? 'opacity-20' : 'opacity-60'}`} />
            {(isHovered || isFocused) && (
              <>
                <div className="holo-texture-pattern opacity-10" />
                <div className="modern-holo" />
              </>
            )}
          </>
        )}

        {/* NEW Badge for Mini */}
        {isNew && (
          <div className="absolute top-2 left-0 z-[60] bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 shadow-md border-r border-white/20 rounded-r-sm">
            NEW
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      layoutId={card.id}
      onClick={onClick}
      className="w-full max-w-[340px] aspect-[2.5/3.5] cursor-pointer"
      whileHover={isOwned ? { 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.2, ease: "easeOut" }
      } : {}}
      whileTap={{ scale: 0.98 }}
      initial={false}
    >
      {cardContent}
    </motion.div>
  );
};

export default React.memo(CardItem);
