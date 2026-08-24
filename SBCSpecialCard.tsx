import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { RotateCw, Sparkles, Trophy, Flame, Shield, Users, Target, Quote, Award, Star } from 'lucide-react';
import { Card } from '../types';
import { getLoreForPlayer } from '../data/sbcCardLore';
import { getTeamLogo } from '../data/nbaTeams';

export type SBCRarityTheme = 'future-star' | 'moments' | 'hof' | 'icon' | 'duo' | 'xfactor' | 'scream';

export interface SBCSpecialCardProps {
  card?: Card;
  rarityTheme?: SBCRarityTheme | string;
  size?: 'sm' | 'md' | 'lg';
  isFlipped?: boolean;
  onFlipToggle?: (isFlipped: boolean) => void;
  className?: string;
  showFlipButton?: boolean;
  interactive?: boolean;
}

const DEFAULT_SAMPLE_CARD: Card = {
  id: 'sbc-sample-card',
  number: 23,
  name: 'LeBron James',
  team: 'Los Angeles Lakers',
  teamAbbr: 'LAL',
  teamColor: '#552583',
  position: 'SF',
  rarity: 'hof',
  category: 'Hall of Fame',
  subtitle: 'SPECIAL SBC EDITION',
  series: 'Legendary MVP Series',
  isHistorical: true,
  pts: 30,
  reb: 8,
  ast: 8,
  nbaId: 2544,
  stats: {
    points: 98,
    rebounds: 94,
    assists: 96,
    ovr: 98,
  },
  description: 'Unstoppable force and 4x NBA Champion with legendary longevity.',
  quote: 'Strive for greatness.',
  imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png',
  isSpecialSBC: true,
};

export const SBC_RARITY_CONFIGS: Record<SBCRarityTheme, {
  className: string;
  badgeText: string;
  badgeBg: string;
  badgeTextColor: string;
  ovrColor: string;
  glowColor: string;
  accentBorder: string;
  icon: React.ReactNode;
  gradientOverlay: string;
}> = {
  'future-star': {
    className: 'sbc-card-future-star',
    badgeText: 'FUTURE STAR',
    badgeBg: 'bg-emerald-950/90 border-emerald-400/80',
    badgeTextColor: 'text-emerald-300',
    ovrColor: 'text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    accentBorder: 'border-emerald-400',
    icon: <Sparkles className="w-3.5 h-3.5 text-emerald-300" />,
    gradientOverlay: 'from-emerald-500/20 via-transparent to-black/80',
  },
  'moments': {
    className: 'sbc-card-moments',
    badgeText: 'MOMENTS SBC',
    badgeBg: 'bg-zinc-900/90 border-white/90',
    badgeTextColor: 'text-white font-extrabold',
    ovrColor: 'text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.95)]',
    glowColor: 'rgba(255, 255, 255, 0.5)',
    accentBorder: 'border-white',
    icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
    gradientOverlay: 'from-white/20 via-transparent to-black/80',
  },
  'hof': {
    className: 'sbc-card-hof',
    badgeText: 'HALL OF FAME',
    badgeBg: 'bg-amber-950/90 border-amber-400/80',
    badgeTextColor: 'text-amber-300',
    ovrColor: 'text-amber-300 drop-shadow-[0_0_14px_rgba(245,158,11,0.9)]',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    accentBorder: 'border-amber-400',
    icon: <Trophy className="w-3.5 h-3.5 text-amber-300" />,
    gradientOverlay: 'from-amber-500/20 via-transparent to-black/80',
  },
  'icon': {
    className: 'sbc-card-icon',
    badgeText: 'ICON SBC',
    badgeBg: 'bg-purple-950/90 border-purple-400/80',
    badgeTextColor: 'text-purple-300',
    ovrColor: 'text-purple-200 drop-shadow-[0_0_14px_rgba(168,85,247,0.9)]',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    accentBorder: 'border-purple-400',
    icon: <Shield className="w-3.5 h-3.5 text-purple-300" />,
    gradientOverlay: 'from-purple-500/20 via-transparent to-black/80',
  },
  'duo': {
    className: 'sbc-card-duo',
    badgeText: 'DYNAMIC DUO',
    badgeBg: 'bg-sky-950/90 border-sky-400/80',
    badgeTextColor: 'text-sky-300',
    ovrColor: 'text-sky-300 drop-shadow-[0_0_14px_rgba(56,189,248,0.9)]',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    accentBorder: 'border-sky-400',
    icon: <Users className="w-3.5 h-3.5 text-sky-300" />,
    gradientOverlay: 'from-sky-500/20 via-transparent to-black/80',
  },
  'xfactor': {
    className: 'sbc-card-xfactor',
    badgeText: 'X-FACTOR',
    badgeBg: 'bg-orange-950/90 border-orange-400/80',
    badgeTextColor: 'text-orange-300',
    ovrColor: 'text-orange-300 drop-shadow-[0_0_14px_rgba(249,115,22,0.9)]',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    accentBorder: 'border-orange-400',
    icon: <Target className="w-3.5 h-3.5 text-orange-300" />,
    gradientOverlay: 'from-orange-500/20 via-transparent to-black/80',
  },
  'scream': {
    className: 'sbc-card-scream',
    badgeText: 'SCREAM EDITION 🎃',
    badgeBg: 'bg-orange-950/90 border-orange-500/80',
    badgeTextColor: 'text-orange-300',
    ovrColor: 'text-orange-400 drop-shadow-[0_0_16px_rgba(249,115,22,0.95)]',
    glowColor: 'rgba(249, 115, 22, 0.7)',
    accentBorder: 'border-orange-500',
    icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
    gradientOverlay: 'from-orange-600/30 via-purple-950/40 to-black/90',
  },
};

export function resolveSBCTheme(rarityTheme?: string, card?: Card): SBCRarityTheme {
  if (rarityTheme) {
    const normalized = rarityTheme.toLowerCase().replace(/_/g, '-');
    if (normalized.includes('scream') || normalized.includes('halloween')) return 'scream';
    if (normalized.includes('future') || normalized.includes('rising')) return 'future-star';
    if (normalized.includes('moment')) return 'moments';
    if (normalized.includes('hof') || normalized.includes('hall')) return 'hof';
    if (normalized.includes('icon') || normalized.includes('legend')) return 'icon';
    if (normalized.includes('duo')) return 'duo';
    if (normalized.includes('xfactor') || normalized.includes('x-factor')) return 'xfactor';
  }

  if (card) {
    const r = card.rarity?.toLowerCase() || '';
    const c = card.category?.toLowerCase() || '';
    const s = card.series?.toLowerCase() || '';
    const id = card.id?.toLowerCase() || '';

    if (c === 'scream edition' || s === 'scream edition' || id.startsWith('scream-') || c.includes('scream')) return 'scream';
    if (r === 'future_star' || c.includes('rising star') || c.includes('rookie')) return 'future-star';
    if (r === 'moments_sbc' || c.includes('moment') || c.includes('record')) return 'moments';
    if (r === 'hof' || c.includes('hall of fame') || s.includes('hall of fame')) return 'hof';
    if (r === 'icon_sbc' || r === 'legend_sbc' || c.includes('dynasty')) return 'icon';
    if (c.includes('duo') || s.includes('duo')) return 'duo';
    if (c.includes('x-factor') || s.includes('x-factor')) return 'xfactor';
  }

  return 'hof';
}

export const SBCSpecialCard: React.FC<SBCSpecialCardProps> = memo(({
  card = DEFAULT_SAMPLE_CARD,
  rarityTheme,
  size = 'md',
  isFlipped: externalFlipped,
  onFlipToggle,
  className = '',
  showFlipButton = true,
  interactive = true,
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const [imgError, setImgError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef({ x: 0, y: 0, time: 0, moved: false });
  const rafRef = useRef<number | null>(null);

  const isFlipped = externalFlipped !== undefined ? externalFlipped : internalFlipped;

  const resolvedThemeKey = resolveSBCTheme(rarityTheme, card);
  const config = SBC_RARITY_CONFIGS[resolvedThemeKey];

  const lore = getLoreForPlayer(card.name);
  const teamLogo = getTeamLogo(card.teamAbbr || card.team);

  // Sync transform when flipped state changes
  useEffect(() => {
    if (cardInnerRef.current) {
      cardInnerRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(${isFlipped ? 180 : 0}deg) scale3d(1, 1, 1)`;
      cardInnerRef.current.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    }
    if (glareRef.current) {
      glareRef.current.style.background = 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 70%)';
    }
  }, [isFlipped]);

  const toggleFlip = useCallback((e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    const nextState = !isFlipped;
    if (externalFlipped === undefined) {
      setInternalFlipped(nextState);
    }
    if (onFlipToggle) {
      onFlipToggle(nextState);
    }
  }, [isFlipped, externalFlipped, onFlipToggle]);

  // Direct RAF DOM update for 60-120fps hardware acceleration without React state thrashing
  const applyTiltTransform = useCallback((rx: number, ry: number, glareX: number, glareY: number, opacity: number, isDown: boolean) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (cardInnerRef.current) {
        const rotY = isFlipped ? 180 - ry : ry;
        const scale = isDown ? 1.03 : 1.0;
        cardInnerRef.current.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(${scale}, ${scale}, 1)`;
        cardInnerRef.current.style.transition = isDown ? 'transform 0.05s ease-out' : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      }
      if (glareRef.current) {
        glareRef.current.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,${opacity}) 0%, rgba(255,255,255,0) 70%)`;
      }
    });
  }, [isFlipped]);

  // Pointer event handlers for 3D tilt & tap
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.button !== undefined && e.button !== 0) return;

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      moved: false,
    };

    applyTiltTransform(0, 0, 50, 50, 0.15, true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;

    const start = pointerStartRef.current;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    if (Math.hypot(dx, dy) > 5) {
      start.moved = true;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);

    const maxTilt = 16;
    const rx = -Math.max(-1, Math.min(1, normY)) * maxTilt;
    const ry = Math.max(-1, Math.min(1, normX)) * maxTilt;

    const glareX = (normX + 1) * 50;
    const glareY = (normY + 1) * 50;
    const opacity = Math.min(0.45, Math.hypot(normX, normY) * 0.3);

    applyTiltTransform(rx, ry, glareX, glareY, opacity, true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;

    const start = pointerStartRef.current;
    const duration = Date.now() - start.time;

    if (!start.moved && duration < 300) {
      toggleFlip(e);
    } else {
      applyTiltTransform(0, 0, 50, 50, 0, false);
    }

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
  };

  const handlePointerLeave = () => {
    applyTiltTransform(0, 0, 50, 50, 0, false);
  };

  // Dimensions based on size preset
  const sizeClasses = {
    sm: 'w-48 h-[300px]',
    md: 'w-64 h-[400px]',
    lg: 'w-80 h-[500px]',
  }[size];

  const textSizes = {
    sm: { ovr: 'text-2xl', name: 'text-sm', pos: 'text-[9px]', badge: 'text-[7px]', statVal: 'text-xs', statLbl: 'text-[7px]' },
    md: { ovr: 'text-3xl md:text-4xl', name: 'text-base md:text-lg', pos: 'text-[10px]', badge: 'text-[8px]', statVal: 'text-sm', statLbl: 'text-[8px]' },
    lg: { ovr: 'text-5xl md:text-6xl', name: 'text-xl md:text-2xl', pos: 'text-xs', badge: 'text-[10px]', statVal: 'text-base', statLbl: 'text-[9px]' },
  }[size];

  return (
    <div
      ref={containerRef}
      className={`relative select-none touch-none ${sizeClasses} ${className}`}
      style={{ perspective: '1000px', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      {/* 3D Preserving Inner Card */}
      <div
        ref={cardInnerRef}
        className="w-full h-full relative rounded-2xl shadow-2xl cursor-pointer"
        style={{
          transform: `perspective(1000px) rotateX(0deg) rotateY(${isFlipped ? 180 : 0}deg) scale3d(1, 1, 1)`,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {/* Dynamic Glare Overlay */}
        <div
          ref={glareRef}
          className="absolute inset-0 z-40 rounded-2xl pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 70%)',
          }}
        />

        {/* ------------------- FRONT FACE ------------------- */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden flex flex-col font-sans border-[3px] shadow-2xl ${config.className} ${config.accentBorder}`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg) translateZ(1px)',
          }}
        >
          {/* Shimmer & Foil Overlay Effects */}
          <div className="subtle-shimmer opacity-30 pointer-events-none z-10" />
          <div className="rainbow-foil opacity-35 pointer-events-none z-10" />

          {/* Inner Metallic Hairline Frame */}
          <div className="absolute inset-1 rounded-xl border border-white/20 pointer-events-none z-30" />

          {/* Top Header matching Collection Cards (CardItem) */}
          <div className="px-3 py-2 flex justify-between items-center z-20 shrink-0 border-b border-white/15 bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <h3 className={`${textSizes.name} font-black uppercase tracking-tighter leading-none italic text-white truncate drop-shadow-md`}>
                  {card.name}
                </h3>
                {resolvedThemeKey === 'scream' ? (
                  <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(249,115,22,0.8)] border border-orange-300 uppercase tracking-wider shrink-0">
                    🎃 SCREAM
                  </span>
                ) : (
                  <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow-md border border-amber-200/60 uppercase tracking-wider shrink-0">
                    SBC
                  </span>
                )}
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-300/90 mt-0.5 truncate">
                {card.team} {card.subtitle ? `• ${card.subtitle}` : ''}
              </span>
            </div>
            <div className={`flex items-center gap-1 shrink-0 bg-black/80 px-2 py-1 rounded-md border ${resolvedThemeKey === 'scream' ? 'border-orange-500/80 shadow-[0_0_12px_rgba(249,115,22,0.5)]' : 'border-amber-400/50 shadow-lg'}`}>
              <span className={`text-[9px] font-black uppercase tracking-wider ${resolvedThemeKey === 'scream' ? 'text-orange-400' : 'text-amber-400'}`}>OVR</span>
              <span className={`${textSizes.ovr} font-black italic ${resolvedThemeKey === 'scream' ? 'text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.9)]' : 'text-white'} leading-none drop-shadow-md`}>
                {card.stats?.ovr || card.pts || 95}
              </span>
            </div>
          </div>

          {/* Inner Recessed Photo Window matching Collection Cards */}
          <div className="relative mx-2.5 my-1 bg-zinc-950 overflow-hidden rounded-lg border border-white/20 shadow-xl z-20 flex-1 flex items-center justify-center">
            {/* Team Color Gradient Background inside photo frame */}
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background: resolvedThemeKey === 'scream'
                  ? `radial-gradient(circle at 50% 30%, ${card.teamColor || '#552583'} 0%, #18062b 60%, #08020e 100%)`
                  : `linear-gradient(135deg, ${card.teamColor || '#1e3a8a'} 0%, #09090b 100%)`,
              }}
            />

            {/* Team Logo Watermark */}
            {teamLogo && (
              <img
                src={teamLogo}
                alt=""
                className="absolute w-36 h-36 object-contain opacity-15 filter blur-[1px] pointer-events-none"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Player Photo Cutout */}
            {imgError ? (
              <div className="relative z-10 text-center p-2">
                <span className={`text-3xl font-black italic ${resolvedThemeKey === 'scream' ? 'text-orange-400' : 'text-amber-400'}`}>
                  {card.name.split(' ').map(n => n[0]).join('')}
                </span>
                <span className="block text-[9px] font-bold text-zinc-400 uppercase mt-1">{card.teamAbbr}</span>
              </div>
            ) : (
              <img
                src={card.imageUrl}
                alt={card.name}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover object-top filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] z-10 transition-transform duration-500 transform group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            )}

            {/* Special Theme Badge Pill on Top Right of Photo */}
            <div className="absolute top-2 right-2 z-20">
              <div className={`px-2 py-0.5 rounded-full border backdrop-blur-md flex items-center gap-1 shadow-lg ${config.badgeBg} ${config.badgeTextColor}`}>
                {config.icon}
                <span className="text-[8px] font-black tracking-wider uppercase italic whitespace-nowrap">
                  {config.badgeText}
                </span>
              </div>
            </div>

            {/* Position Pill on Bottom Left of Photo */}
            <div className="absolute bottom-2 left-2 z-20">
              <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${resolvedThemeKey === 'scream' ? 'text-orange-300 border-orange-500/60 bg-black/90' : 'text-amber-300 border-amber-400/50 bg-black/85'} rounded-md border shadow-md`}>
                {card.position || 'SF'}
              </span>
            </div>
          </div>

          {/* Stats or Halloween Banner */}
          {resolvedThemeKey === 'scream' ? (
            <div className="px-3 py-1.5 z-20 shrink-0 bg-gradient-to-r from-orange-950/80 via-purple-950/80 to-black border-t border-b border-orange-500/40 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🎃</span>
                  <div className="flex flex-col">
                    <span className="text-[8.5px] font-black uppercase tracking-widest text-orange-300">SCREAM EDITION</span>
                    <span className="text-[6.5px] font-bold text-purple-300 uppercase tracking-wider">HALLOWEEN EXCLUSIVE</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/50 text-orange-400 text-[7.5px] font-black uppercase tracking-widest shadow-sm">
                  COLLECTIBLE
                </span>
              </div>
            </div>
          ) : (
            <div className="px-3 py-1.5 z-20 shrink-0 bg-black/75 border-t border-b border-white/10 backdrop-blur-sm">
              <div className="grid grid-cols-3 w-full">
                <div className="flex flex-col items-center border-r border-white/10">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600 shadow-inner mb-0.5" />
                  <span className={`${textSizes.statVal} font-black text-white leading-none`}>
                    {card.pts || card.stats?.points || 28}
                  </span>
                  <span className="text-[7px] font-extrabold uppercase text-zinc-400 tracking-widest mt-0.5">PTS</span>
                </div>
                <div className="flex flex-col items-center border-r border-white/10">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 border border-zinc-600 shadow-inner mb-0.5" />
                  <span className={`${textSizes.statVal} font-black text-white leading-none`}>
                    {card.reb || card.stats?.rebounds || 8}
                  </span>
                  <span className="text-[7px] font-extrabold uppercase text-zinc-400 tracking-widest mt-0.5">REB</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 border border-blue-600 shadow-inner mb-0.5" />
                  <span className={`${textSizes.statVal} font-black text-white leading-none`}>
                    {card.ast || card.stats?.assists || 7}
                  </span>
                  <span className="text-[7px] font-extrabold uppercase text-zinc-400 tracking-widest mt-0.5">AST</span>
                </div>
              </div>
            </div>
          )}

          {/* Description / Lore Quote */}
          <div className="px-3 py-1 text-center z-20 min-h-0 flex items-center justify-center">
            <p className={`text-[9px] ${resolvedThemeKey === 'scream' ? 'text-orange-200/90' : 'text-zinc-300'} italic line-clamp-1 font-medium`}>
              "{card.quote || card.description || 'Special collectible card.'}"
            </p>
          </div>

          {/* Footer Bar matching Collection Cards */}
          <div className="px-3 py-1.5 flex items-center justify-between z-20 shrink-0 border-t border-white/10 bg-black/85 backdrop-blur-md">
            <div className="flex items-center gap-1.5 min-w-0">
              {teamLogo && (
                <img src={teamLogo} alt="" className="w-4 h-4 object-contain shrink-0 filter drop-shadow" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              )}
              <span className={`text-[8px] font-black ${resolvedThemeKey === 'scream' ? 'text-orange-300' : 'text-amber-300'} uppercase tracking-wider truncate`}>
                {card.teamAbbr || card.team}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: config.glowColor }} />
              {showFlipButton && (
                <div className="flex items-center gap-1 text-[8px] font-extrabold text-amber-400/90 ml-1">
                  <RotateCw className="w-2.5 h-2.5 animate-spin-slow" />
                  <span>FLIP 3D</span>
                </div>
              )}
            </div>
            <span className="text-[8px] font-extrabold text-zinc-400">#{card.number || 23}</span>
          </div>
        </div>

        {/* ------------------- BACK FACE ------------------- */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden flex flex-col p-4 font-sans border-2 shadow-2xl bg-zinc-950 text-white ${config.accentBorder}`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg) translateZ(1px)',
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-2.5 border-b border-white/15">
            <div className="flex items-center gap-2">
              {teamLogo && <img src={teamLogo} alt={card.team} className="w-6 h-6 object-contain" loading="lazy" decoding="async" referrerPolicy="no-referrer" />}
              <div>
                <h4 className="text-xs font-black uppercase text-white truncate max-w-[130px]">{card.name}</h4>
                <p className="text-[8px] font-bold text-amber-400">{card.position} • #{card.number || 23}</p>
              </div>
            </div>
            <button
              onClick={toggleFlip}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Flip back"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 flex flex-col justify-between py-2 gap-2 overflow-y-auto custom-scrollbar">
            {/* Lore / Context */}
            <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 space-y-1.5">
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-300">
                <Quote className="w-3 h-3 text-amber-400" />
                <span>Career Context</span>
              </div>
              <p className="text-[10px] text-zinc-300 leading-snug font-medium">
                {lore.englishContext || card.description}
              </p>
            </div>

            {/* Achievements List */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-300">
                <Award className="w-3 h-3 text-amber-400" />
                <span>Special Accolades</span>
              </div>
              <div className="space-y-1">
                {(lore.achievements || ['NBA Superstar', 'SBC Reward']).map((ach, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded text-[9px] text-amber-200 font-bold">
                    <Star className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    <span className="truncate">{ach}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="bg-black/60 p-2 rounded-lg border border-white/10 space-y-1">
              <div className="flex justify-between items-center text-[8px] font-bold text-zinc-400 uppercase">
                <span>Rating Breakdown</span>
                <span className="text-amber-400 font-extrabold">OVR {card.stats?.ovr || 95}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-zinc-400">Points</span>
                  <div className="flex items-center gap-1.5 w-24">
                    <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.min(100, (card.pts || 28) * 3)}%` }} />
                    </div>
                    <span className="font-bold text-white w-5 text-right">{card.pts || 28}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-zinc-400">Rebounds</span>
                  <div className="flex items-center gap-1.5 w-24">
                    <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-400 h-full rounded-full" style={{ width: `${Math.min(100, (card.reb || 8) * 6)}%` }} />
                    </div>
                    <span className="font-bold text-white w-5 text-right">{card.reb || 8}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-zinc-400">Assists</span>
                  <div className="flex items-center gap-1.5 w-24">
                    <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(100, (card.ast || 7) * 8)}%` }} />
                    </div>
                    <span className="font-bold text-white w-5 text-right">{card.ast || 7}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Badge */}
          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[8px] font-bold text-zinc-500 uppercase">
            <span>Authentic SBC Collectible</span>
            <span className="text-amber-400/80">3D Interactive</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SBCSpecialCard;
