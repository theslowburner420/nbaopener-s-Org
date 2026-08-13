import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCw, Sparkles, Trophy, Flame, Shield, Info, Quote, Award, Star } from 'lucide-react';
import { Card } from '../types';
import { getLoreForPlayer } from '../data/sbcCardLore';

export interface Card3DProps {
  card?: Card;
  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isRevealed?: boolean;
  onFlipChange?: (isFlipped: boolean) => void;
}

export const Card3D: React.FC<Card3DProps> = ({
  card,
  frontContent,
  backContent,
  size = 'md',
  className = '',
  isRevealed = true,
  onFlipChange,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPointerOver, setIsPointerOver] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  // Drag / Pointer tracking refs to avoid re-renders on rAF
  const pointerState = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
    tiltX: 0,
    tiltY: 0,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
    rafId: 0 as number,
    hasMoved: false,
  });

  const toggleFlip = useCallback((e?: React.MouseEvent | React.PointerEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsFlipped(prev => {
      const next = !prev;
      if (onFlipChange) onFlipChange(next);
      return next;
    });
  }, [onFlipChange]);

  // Update loop for smooth rAF tilt animation
  const updateTransform = useCallback(() => {
    if (!cardInnerRef.current) return;

    const state = pointerState.current;
    const baseRotationY = isFlipped ? 180 : 0;
    
    // Calculate final rotation degrees
    // When flipped, Y rotation tilt is inverted relative to back face perspective
    const currentTiltY = isFlipped ? -state.tiltY : state.tiltY;
    const currentTiltX = state.tiltX;

    const scale = state.isDown ? 1.04 : 1.0;

    cardInnerRef.current.style.transform = `perspective(1000px) rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${(baseRotationY + currentTiltY).toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;

    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle at ${state.glareX.toFixed(1)}% ${state.glareY.toFixed(1)}%, rgba(255,255,255,${state.glareOpacity.toFixed(2)}) 0%, rgba(255,255,255,0) 70%)`;
    }
  }, [isFlipped]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary button / touch
    if (e.button !== undefined && e.button !== 0) return;

    const state = pointerState.current;
    state.isDown = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.startTime = Date.now();
    state.hasMoved = false;

    // Remove transition during active dragging so tilt is instant
    if (cardInnerRef.current) {
      cardInnerRef.current.style.transition = 'transform 0.05s ease-out';
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback if capture fails
    }

    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerState.current;
    if (!state.isDown || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    const distSq = dx * dx + dy * dy;

    if (distSq > 36) { // > 6px movement
      state.hasMoved = true;
      setIsDragging(true);
    }

    // Pointer location relative to card center (0.5, 0.5)
    const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    // Calculate smooth tilt angles
    // Max tilt is ~18 degrees
    const MAX_TILT = 20;
    state.tiltY = (px - 0.5) * MAX_TILT;
    state.tiltX = (py - 0.5) * -MAX_TILT;

    state.glareX = px * 100;
    state.glareY = py * 100;
    state.glareOpacity = 0.45;

    // Schedule rAF update
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(updateTransform);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerState.current;
    if (!state.isDown) return;

    state.isDown = false;
    setIsDragging(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    const duration = Date.now() - state.startTime;
    const isTap = !state.hasMoved && duration < 300;

    // Smooth elastic recovery to neutral position
    if (cardInnerRef.current) {
      cardInnerRef.current.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    state.tiltX = 0;
    state.tiltY = 0;
    state.glareOpacity = 0;

    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(updateTransform);

    // If gesture was a short tap without drag, trigger flip!
    if (isTap) {
      toggleFlip();
    }
  };

  const handlePointerLeave = () => {
    const state = pointerState.current;
    setIsPointerOver(false);

    if (state.isDown) {
      state.isDown = false;
      setIsDragging(false);
    }

    if (cardInnerRef.current) {
      cardInnerRef.current.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    state.tiltX = 0;
    state.tiltY = 0;
    state.glareOpacity = 0;

    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(updateTransform);
  };

  // Sync transform when flipped state changes externally
  useEffect(() => {
    if (cardInnerRef.current) {
      cardInnerRef.current.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
    }
    updateTransform();
  }, [isFlipped, updateTransform]);

  // Clean up rAF on unmount
  useEffect(() => {
    return () => {
      if (pointerState.current.rafId) {
        cancelAnimationFrame(pointerState.current.rafId);
      }
    };
  }, []);

  // Size styling mapping
  const sizeClasses = {
    sm: 'w-[120px] h-[190px]',
    md: 'w-[190px] h-[300px]',
    lg: 'w-[300px] h-[470px]',
  };

  return (
    <div
      ref={containerRef}
      className={`relative touch-none select-none ${sizeClasses[size]} ${className}`}
      style={{ perspective: '1000px' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={() => setIsPointerOver(true)}
    >
      {/* Interactive 3D Card Shell */}
      <div
        ref={cardInnerRef}
        className="w-full h-full relative rounded-2xl cursor-grab active:cursor-grabbing will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transform: `perspective(1000px) rotateY(${isFlipped ? 180 : 0}deg) rotateX(0deg)`,
        }}
      >
        {/* Holographic Specular Glare Layer */}
        <div
          ref={glareRef}
          className="absolute inset-0 z-30 rounded-2xl pointer-events-none transition-opacity duration-300"
          style={{
            mixBlendMode: 'overlay',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        />

        {/* --- FRONT FACE --- */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {frontContent}

          {/* Quick Flip Button Badge in Top-Right Corner */}
          <button
            type="button"
            onClick={toggleFlip}
            className="absolute top-2 right-2 z-40 p-1.5 rounded-full bg-black/70 hover:bg-black/90 border border-amber-400/60 text-amber-300 shadow-lg backdrop-blur-md transition-transform hover:scale-110 active:scale-95 flex items-center gap-1 group"
            title="Girar carta (3D Back)"
          >
            <RotateCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
            {size === 'lg' && (
              <span className="text-[8px] font-black tracking-wider uppercase pr-1 text-amber-200">
                INFO
              </span>
            )}
          </button>
        </div>

        {/* --- BACK FACE --- */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-b from-zinc-950 via-zinc-900 to-black border-2 border-amber-500/60 flex flex-col justify-between p-3.5 select-none font-condensed"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {backContent ? (
            backContent
          ) : (
            <DefaultBackFace card={card} size={size} onFlip={toggleFlip} />
          )}

          {/* Flip Back Corner Button */}
          <button
            type="button"
            onClick={toggleFlip}
            className="absolute top-2 right-2 z-40 p-1.5 rounded-full bg-black/80 hover:bg-black border border-amber-400/80 text-amber-300 shadow-xl backdrop-blur-md transition-transform hover:scale-110 active:scale-95 flex items-center gap-1"
            title="Volver a la portada"
          >
            <RotateCw size={12} className="rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Default Back Face component with rich English context narrative & Player Achievements
const DefaultBackFace: React.FC<{ card?: Card; size?: 'sm' | 'md' | 'lg'; onFlip: () => void }> = ({ card, size = 'md', onFlip }) => {
  if (!card) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 text-zinc-400">
        <Sparkles size={20} className="text-amber-400 mb-2" />
        <p className="text-xs font-black uppercase text-white">SPECIAL EDITION</p>
        <p className="text-[9px]">Tap to flip back</p>
      </div>
    );
  }

  const lore = getLoreForPlayer(card.name);
  const name = card.name || 'NBA SPECIAL';
  const subtitle = card.subtitle || `${card.team || 'NBA'} • #${card.number || 23}`;
  const englishContext = card.englishContext || card.description || lore.englishContext;
  const achievements = (card.achievements && card.achievements.length > 0) ? card.achievements : lore.achievements;
  const ovr = card.stats?.ovr || card.pts || 90;

  const iconsList = [
    <Trophy key="t" size={size === 'sm' ? 10 : 12} className="text-amber-400 shrink-0" />,
    <Award key="a" size={size === 'sm' ? 10 : 12} className="text-amber-300 shrink-0" />,
    <Star key="s" size={size === 'sm' ? 10 : 12} className="text-emerald-400 shrink-0" />
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between text-white relative z-10 font-sans p-0.5">
      {/* Metallic Back Background Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:12px_12px]" />

      {/* Header Info */}
      <div className="flex justify-between items-center pb-2 border-b border-amber-500/25">
        <div className="flex flex-col min-w-0 pr-4">
          <span className="text-[7px] font-black text-amber-400 tracking-widest uppercase truncate">
            {card.rarity.replace(/_/g, ' ')}
          </span>
          <h3 className="text-xs sm:text-sm font-black italic uppercase text-white tracking-tight leading-tight truncate">
            {name}
          </h3>
          <span className="text-[7.5px] font-bold text-zinc-400 uppercase truncate">
            {subtitle}
          </span>
        </div>
        <div className="flex flex-col items-center bg-amber-500/15 border border-amber-400/40 rounded-lg px-2 py-0.5 shrink-0 shadow-sm">
          <span className="text-xs font-black text-amber-300 italic leading-none">{ovr}</span>
          <span className="text-[5px] font-extrabold text-amber-400/80">OVR</span>
        </div>
      </div>

      {/* Minimal Narrative Box */}
      <div className="flex-1 my-2 flex flex-col justify-center px-2.5 py-2 bg-black/60 rounded-xl border border-white/10 relative overflow-hidden backdrop-blur-sm">
        <Quote size={12} className="text-amber-400/30 absolute top-1.5 left-1.5 pointer-events-none" />
        <p className="text-[8.5px] sm:text-[10px] font-medium text-zinc-200 leading-relaxed text-center z-10 tracking-tight my-auto px-1">
          "{englishContext}"
        </p>
      </div>

      {/* Player Honors Section - Sleek Minimalist Pills */}
      <div className="flex flex-col gap-1 mb-1">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[7px] font-black uppercase text-amber-400/90 tracking-wider flex items-center gap-1">
            <Flame size={9} className="text-amber-400" /> HONORS & ACCOMPLISHMENTS
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {achievements.slice(0, 2).map((ach, idx) => (
            <div key={idx} className="flex items-center gap-1.5 bg-zinc-900/80 rounded-md px-2 py-1 border border-white/5">
              {iconsList[idx % iconsList.length]}
              <span className="text-[8px] sm:text-[9px] font-extrabold text-zinc-200 truncate uppercase tracking-tight">
                {ach}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Seal */}
      <div className="flex justify-between items-center pt-1.5 border-t border-zinc-800/80 text-[7px] text-zinc-400 font-bold uppercase tracking-widest">
        <div className="flex items-center gap-1">
          <Shield size={9} className="text-amber-400" />
          <span className="text-[6.5px]">SBC AUTHENTIC</span>
        </div>
        <button
          type="button"
          onClick={onFlip}
          className="text-amber-400 hover:text-amber-300 font-black cursor-pointer underline underline-offset-2 text-[7px]"
        >
          TAP TO FLIP
        </button>
      </div>
    </div>
  );
};

export default Card3D;
