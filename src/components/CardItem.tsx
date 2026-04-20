import React, { useState, useCallback, useMemo, memo } from 'react';
import { motion } from 'motion/react';
import { Card, Rarity } from '../types';
import { Lock, Zap } from 'lucide-react';

interface CardItemProps {
  card: Card;
  isOwned: boolean;
  mode?: 'mini' | 'large';
  onClick?: (card: Card) => void;
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

const CardItem: React.FC<CardItemProps> = memo(({ card, isOwned, mode = 'mini', onClick, showBack = false, isFocused = false, isNew = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isMini = mode === 'mini';
  
  const { rarityClass, categoryClass, isDarkCard, isHolo, isFranchise, isLegend, isDPOY, isROTY, isXFactor, isVintage, isMoment, RarityColor } = useMemo(() => {
    const rClass = getRarityClass(card.rarity);
    const rColor = RARITY_COLORS[card.rarity] || '#94A3B8';
    
    const isMoment = card.category === 'Moment';
    const isDynasty = card.category === 'Dynasty';
    const isXFactor = card.category === 'X-Factor';
    const isRookie = card.category === 'Rookie';
    const isAward = card.category === 'Award';
    
    const cClass = isAward 
      ? (card.rarity === 'dpoy' ? 'card-dpoy' : 
         card.series === 'ROTY Series' ? 'card-roty' : 
         card.series === '6MOY Series' ? 'card-6moy' : 
         card.series === 'NBA Record Series' ? 'card-record' : 'card-award') 
      : isDynasty ? 'card-dynasty' : 
        isXFactor ? 'card-xfactor' : 
        isRookie ? 'card-rookie' : 
        card.category === 'All-Star MVP' ? 'card-as-mvp' : 
        card.category === 'Finals MVP' ? 'card-fmvp' : 
        isMoment ? 'card-moment' : '';
        
    const dark = isAward || card.category === 'Coach' || card.rarity === 'dpoy' || card.rarity === 'roty' || card.rarity === 'record' || isDynasty || isXFactor || card.category === 'NBA Record' || isRookie || card.category === 'All-Star MVP' || card.category === 'Finals MVP' || isMoment;
    const holo = ['allstar', 'franchise', 'legend', 'dpoy', 'roty', 'record', 'rookie'].includes(card.rarity) || isDynasty || isXFactor || isMoment;
    const franchise = card.rarity === 'franchise';
    const legend = card.rarity === 'legend' || isDynasty || isMoment;
    const dpoy = card.rarity === 'dpoy';
    const roty = card.rarity === 'roty';
    const xfactor = isXFactor;
    const vintage = card.nbaId < 1000;
    
    return { rarityClass: rClass, categoryClass: cClass, isDarkCard: dark, isHolo: holo, isFranchise: franchise, isLegend: legend, isDPOY: dpoy, isROTY: roty, isXFactor: xfactor, isVintage: vintage, isMoment, RarityColor: rColor };
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

  // Extreme Performance Optimization: Hardware Acceleration & Memory Management
  const gpuStyles = useMemo(() => ({
    transform: 'translateZ(0)',
    willChange: 'transform, opacity, filter',
    backfaceVisibility: 'hidden' as const,
    perspective: '1000px',
    WebkitFontSmoothing: 'antialiased' as const,
    contentVisibility: 'auto' as any,
  } as React.CSSProperties), []);

  const cardStyle = useMemo(() => {
    if (showBack) {
      return {
        ...gpuStyles,
        borderColor: '#27272a', // zinc-800
        borderWidth: isMini ? '4px' : '8px',
        backgroundColor: '#18181b', // zinc-900
      } as React.CSSProperties;
    }

    const shadowColor = isMoment ? '#d4af37' : RarityColor;
    const shadowOpacity = isMini ? '33' : '44';
    const shadowSize = isMini ? '20px' : '50px';
    const baseShadow = isMini ? `0 4px ${shadowSize} ${shadowColor}${shadowOpacity}` : `0 0 40px ${shadowColor}33, 0 10px 50px rgba(0,0,0,0.8)`;
    
    return {
      ...gpuStyles,
      '--opacity': isLegend || isDPOY || isROTY || isXFactor ? '0.45' : isFranchise ? '0.35' : isHolo ? '0.3' : '0',
      '--holo-opacity': isLegend || isDPOY || isROTY || isXFactor ? '0.5' : isFranchise ? '0.35' : isHolo ? '0.25' : '0',
      borderColor: isMoment ? '#d4af37' : RarityColor,
      boxShadow: isOwned ? baseShadow : 'none',
      borderWidth: isMini ? '3px' : '6px',
    } as React.CSSProperties;
  }, [isLegend, isDPOY, isROTY, isXFactor, isFranchise, isHolo, RarityColor, isOwned, gpuStyles, isMoment, isMini, showBack]);

  // Sub-renderers for cleaner JSX
  const renderMomentEffects = () => {
    if (!isMoment) return null;
    return (
      <>
        <div className="card-moment-texture" />
        <div className="card-moment-marble" />
        <div className={`card-moment-glow ${isMini ? 'mini-moment-glow' : ''}`} />
        {!isMini && <div className="absolute inset-0 bg-blue-900/5 mix-blend-overlay pointer-events-none z-[3]" />}
      </>
    );
  };

  const renderHoloEffects = () => {
    if (!isOwned || !isHolo) return null;
    return (
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
    );
  };

  const renderNewBadge = () => {
    if (!isNew) return null;
    return (
      <div className={isMini 
        ? "absolute top-2 left-0 z-[60] bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 shadow-md border-r border-white/20 rounded-r-sm"
        : "absolute top-12 left-0 z-[60] bg-red-600 text-white text-[10px] font-black px-2 py-0.5 transform -rotate-45 -translate-x-2 shadow-lg border-y border-white/20"
      }>
        {isMini ? 'NEW' : 'NEW!'}
      </div>
    );
  };

  const renderLockOverlay = () => {
    if (isOwned) return null;
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10">
        <Lock size={isMini ? 36 : 48} className="text-white/20 drop-shadow-lg" strokeWidth={2.5} />
      </div>
    );
  };

  const renderHeader = () => {
    if (isMini) {
      return (
        <div className="absolute top-0 left-0 right-0 p-1.5 z-50 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex flex-col min-w-0">
            <h3 className={`text-[9px] font-black uppercase italic leading-none drop-shadow-md truncate ${isMoment ? 'moment-title-text mini-moment-title-text' : 'text-white'}`}>
              {isMoment && card.momentTitle ? card.momentTitle : card.name}
            </h3>
            <span className="text-[6px] font-bold text-white/70 uppercase tracking-tighter truncate">
              {isMoment ? card.name : card.subtitle}
            </span>
          </div>
          <div className="bg-black/80 backdrop-blur-sm rounded px-1 py-0.5 border border-white/20">
            <span className="text-[9px] font-black text-white italic leading-none">{card.stats.ovr}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="px-3 py-1 flex justify-between items-center z-20 h-[18%] shrink-0">
        <div className="flex flex-col flex-1 min-w-0 pr-2">
          {isMoment && card.momentTitle ? (
            <h3 className="text-xl md:text-2xl moment-title-text leading-[0.8] mb-1 truncate">
              {card.momentTitle}
            </h3>
          ) : (
            <h3 className={`text-base md:text-lg font-black uppercase tracking-tighter leading-[0.9] drop-shadow-sm italic ${isDarkCard ? 'card-text-primary' : 'text-zinc-900'} truncate`}>
              {card.name}
            </h3>
          )}
          <span className={`text-[7px] md:text-[9px] font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${isDarkCard ? 'card-text-secondary' : 'text-zinc-700'} ${isXFactor ? 'font-mono tracking-[0.2em] text-blue-300' : ''}`}>
            {isXFactor ? 'X-FACTOR' : isMoment ? card.name : card.subtitle}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <span className={`text-[10px] font-bold uppercase drop-shadow-sm ${isDarkCard ? 'text-red-400' : 'text-red-700'}`}>
            OVR
          </span>
          <span className={`text-xl md:text-2xl font-black leading-none drop-shadow-sm italic ${isDarkCard ? 'card-text-primary' : 'text-zinc-900'}`}>
            {card.stats.ovr}
          </span>
        </div>
      </div>
    );
  };

  const renderPhoto = () => {
    const photoContent = (
      <>
        {isMoment && (
          <>
            <div className={`absolute ${isMini ? 'top-6 right-1' : 'top-2 right-2'} z-[50]`}>
              <div className={isMini ? "text-[4px] font-black bg-amber-500 text-black px-1 rounded-sm" : "moment-badge"}>MOMENT</div>
            </div>
            {!isMini && card.momentDate && (
              <div className="absolute bottom-2 right-2 z-[50] opacity-20 pointer-events-none">
                <span className="text-4xl font-black text-white italic tracking-tighter">
                  {card.momentDate.split(' ').pop()}
                </span>
              </div>
            )}
          </>
        )}
        <img
          src={card.imageUrl}
          alt={card.name}
          className={`w-full h-full object-cover object-top transition-transform duration-500 ${isMini ? 'group-hover/mini:scale-110' : ''} ${isVintage ? 'card-vintage' : ''} ${isMoment ? 'brightness-110 contrast-110' : ''}`}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          {...(isFocused || !isMini ? { fetchPriority: "high" } : { fetchPriority: "low" })}
        />
        <div className={`absolute inset-0 ${isMini ? 'bg-gradient-to-t from-black/90 via-transparent to-transparent' : 'opacity-30 z-10'}`} 
             style={!isMini ? { background: `linear-gradient(to bottom, ${card.teamColor}, transparent)` } : {}} />
      </>
    );

    if (isMini) {
      return (
        <div className={`w-full h-full relative ${isMoment ? 'moment-photo-mask' : 'bg-zinc-800'}`}>
          {photoContent}
        </div>
      );
    }

    return (
      <div className={`relative mx-2 mb-1 bg-white overflow-hidden rounded-sm border-[1.5px] border-black/10 shadow-md z-30 flex-1 ${isMoment ? 'moment-photo-mask' : ''}`}>
        <div className="w-full h-full relative overflow-hidden bg-zinc-200">
          {photoContent}
        </div>
      </div>
    );
  };

  const renderStats = () => {
    const stats = [
      { label: card.category === 'Coach' ? 'WINS' : 'PTS', value: card.stats.points, color: 'bg-amber-400', borderColor: 'border-amber-600' },
      { label: card.category === 'Coach' ? 'TITLES' : 'REB', value: card.stats.rebounds, color: 'bg-zinc-400', borderColor: 'border-zinc-600' },
      { label: card.category === 'Coach' ? 'EXP' : 'AST', value: card.stats.assists, color: 'bg-blue-400', borderColor: 'border-blue-600' },
    ];

    if (isMini) {
      return (
        <div className="grid grid-cols-3 gap-0.5 pt-0.5 shrink-0">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[6px] font-black text-zinc-500 uppercase tracking-tighter leading-none">{s.label}</span>
              <span className="text-[9px] font-black text-white leading-none mt-0.5">{s.value}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="px-3 h-1/4 flex items-center shrink-0">
        <div className={`grid grid-cols-3 w-full py-1 border-b ${isDarkCard ? 'card-border-subtle' : 'border-black/5'}`}>
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center justify-center border-r border-black/5 last:border-r-0">
              <div className={`w-3 h-3 rounded-full ${s.color} ${s.borderColor} border shadow-sm mb-0.5`} />
              <span className={`text-[9px] font-black leading-none ${isDarkCard ? 'card-text-primary' : 'text-zinc-900'}`}>
                {s.value} <span className={`text-[6px] opacity-60 ${isDarkCard ? 'card-text-muted' : ''}`}>{s.label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInfo = () => {
    if (isMini) {
      return (
        <div className="flex-1 flex items-center justify-center px-1 min-h-0">
          <p className="text-[8px] text-zinc-400 italic leading-none text-center line-clamp-1">
            {card.description}
          </p>
        </div>
      );
    }

    return (
      <div className="px-4 h-1/2 flex flex-col justify-center min-h-0 overflow-hidden shrink-0">
        {isMoment && card.quote && (
          <div className="flex gap-2 items-start mb-0.5">
            <div className="w-0.5 h-full bg-amber-500/50 rounded-full shrink-0" />
            <p className="text-[9px] md:text-[10px] italic leading-tight text-zinc-400 text-left line-clamp-1">
              {card.quote}
            </p>
          </div>
        )}
        <p className={`text-[10px] md:text-[11px] italic leading-tight text-center line-clamp-2 font-medium ${isDarkCard ? 'card-text-secondary' : 'text-zinc-800'}`}>
          {isMoment && card.momentDate && (
            <span className="block font-black not-italic text-[7px] mb-0.5 text-amber-500 uppercase">{card.momentDate}</span>
          )}
          "{card.description}"
        </p>
      </div>
    );
  };

  const renderFooter = () => {
    if (isMini) {
      return (
        <div className="flex items-center justify-between border-t border-white/5 pt-1 pb-0.5 shrink-0 px-1.5">
          <div className="grid grid-cols-3 w-full items-center">
            <div className="flex items-center gap-0.5 min-w-0">
              {card.teamLogoUrl && (
                <img src={card.teamLogoUrl} alt="" className="w-3 h-3 object-contain opacity-80 shrink-0" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
              )}
              <span className="text-[6px] font-black text-zinc-400 uppercase tracking-tight leading-none truncate">{card.teamAbbr}</span>
            </div>
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full shrink-0 border border-white/10" style={{ backgroundColor: RarityColor }} />
            </div>
            <div className="flex justify-end">
              <span className="text-[6px] font-bold text-zinc-600 shrink-0">#{card.number}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`px-3 h-1/4 border-t shrink-0 flex items-center mt-auto ${isDarkCard ? 'card-border-subtle' : 'border-black/10'}`}>
        <div className="grid grid-cols-3 w-full items-center">
          <div className="flex items-center gap-1 min-w-0">
            {card.teamLogoUrl && (
              <img src={card.teamLogoUrl} alt="" className="w-4 h-4 md:w-5 md:h-5 object-contain drop-shadow-sm shrink-0" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
            )}
            <div className="flex flex-col min-w-0">
              <span className={`text-[7px] font-black uppercase leading-none mb-0.5 ${isDarkCard ? 'card-text-muted' : 'text-zinc-600'}`}>TEAM</span>
              <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-tighter leading-none truncate ${isDarkCard ? 'card-text-primary' : 'text-zinc-900'}`}>
                {card.team}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className={`text-[7px] font-black uppercase leading-none mb-0.5 ${isDarkCard ? 'card-text-muted' : 'text-zinc-600'}`}>RARITY</span>
            <div className="w-2 h-2 rounded-full border border-black/20 shadow-sm" style={{ backgroundColor: RarityColor }} />
          </div>
          <div className="flex flex-col items-end justify-center">
            <span className={`text-[7px] font-black uppercase leading-none mb-0.5 ${isDarkCard ? 'card-text-muted' : 'text-zinc-600'}`}>CARD NO.</span>
            <span className={`text-[7px] md:text-[8px] font-bold ${isDarkCard ? 'card-text-primary' : 'text-zinc-800'}`}>
              #{card.number}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const cardContent = showBack ? (
    <div className="absolute inset-4 border-2 border-zinc-700 rounded-lg flex flex-col items-center justify-center overflow-hidden bg-zinc-950">
      <div className="w-24 h-24 rounded-full border-4 border-zinc-800 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-transparent opacity-50" />
        <Zap size={48} className="text-zinc-800 relative z-10" fill="currentColor" />
      </div>
      <div className="mt-4 flex flex-col items-center">
        <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em]">HOOPS</span>
        <span className="text-[8px] font-bold text-zinc-800 uppercase tracking-[0.3em]">COLLECTOR</span>
      </div>
    </div>
  ) : (
    <div className={`flex flex-col h-full ${!isOwned ? 'grayscale brightness-[0.2] bg-black' : ''}`}>
      {renderMomentEffects()}
      {!isMini && (
        <>
          <div className="card-texture" />
          <div className="card-vintage-overlay" />
          <div className="card-inner-border" />
        </>
      )}
      {renderHoloEffects()}
      {!isMini && !isHolo && <div className="card-shine" />}
      {renderNewBadge()}

      <div className="h-[65%] shrink-0 flex flex-col relative overflow-hidden">
        {renderHeader()}
        {renderPhoto()}
      </div>

      <div className={`h-[35%] flex flex-col justify-between relative overflow-hidden ${isMini ? 'bg-zinc-950 px-1.5 py-1 border-t border-white/10' : 'bg-gradient-to-b from-transparent to-black/40 border-t border-white/5'}`}>
        {renderStats()}
        {renderInfo()}
        {renderFooter()}
      </div>

      {renderLockOverlay()}
    </div>
  );

  if (isMini) {
    return (
      <div 
        className={`nba-card relative aspect-[2.5/3.5] rounded-xl overflow-hidden transition-all ${isOwned ? 'cursor-pointer hover:scale-105' : 'cursor-default'} ${!showBack ? `${rarityClass} ${categoryClass} group/mini content-auto` : 'items-center justify-center bg-zinc-900 border-zinc-800'}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={cardStyle}
        onClick={() => (isOwned || showBack) && onClick?.(card)}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <motion.div
      layoutId={card.id}
      onClick={() => (isOwned || showBack) && onClick?.(card)}
      className="w-full max-w-[340px] aspect-[2.5/3.5] cursor-pointer"
      whileHover={isOwned && !showBack ? { 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.2, ease: "easeOut" }
      } : {}}
      whileTap={{ scale: 0.98 }}
      initial={false}
    >
      <div 
        className={`nba-card relative flex flex-col h-full rounded-xl overflow-hidden transition-all ${!showBack ? `${rarityClass} ${categoryClass} ${isDarkCard ? 'dark-card' : ''}` : 'items-center justify-center bg-zinc-900 border-zinc-800'}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={cardStyle}
      >
        {cardContent}
      </div>
    </motion.div>
  );
});

export default CardItem;
