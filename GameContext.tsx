import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

interface StaticAdProps {
  position: 'header' | 'footer';
}

/**
 * StaticAd component for Adsterra banner.
 * Renders the ad script only if ads are not disabled (isPremium is false).
 * Uses fixed dimensions to prevent layout shifts.
 */
export default function StaticAd({ position }: StaticAdProps) {
  const { isPremium } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If user is premium, we don't render anything
    if (isPremium || !containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Create unique ID for this instance
    const adId = position === 'header' 
      ? 'adsterra-banner-header-7b956296dd611d148eef5572569c1535'
      : 'adsterra-banner-footer-7b956296dd611d148eef5572569c1535';

    const adWrapper = document.createElement('div');
    adWrapper.id = adId;
    containerRef.current.appendChild(adWrapper);

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      atOptions = {
        'key' : '7b956296dd611d148eef5572569c1535',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;
    
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/7b956296dd611d148eef5572569c1535/invoke.js';
    invokeScript.async = true;

    containerRef.current.appendChild(optionsScript);
    containerRef.current.appendChild(invokeScript);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [isPremium, position]);

  // CRITICAL: If premium, do not render the component at all
  if (isPremium) return null;

  const containerClasses = position === 'header'
    ? "w-full bg-zinc-950 border-b border-zinc-900 flex justify-center items-center h-[60px] shrink-0 z-10 overflow-hidden relative"
    : "w-full bg-zinc-950 border-t border-zinc-900 flex justify-center items-center h-[60px] shrink-0 z-10 overflow-hidden relative";

  return (
    <div className={containerClasses}>
      {/* Outer wrapper for ad with strict fixed dimensions */}
      <div 
        className="flex items-center justify-center bg-zinc-900/50 rounded overflow-hidden relative adsterra-container"
        style={{ 
          width: '320px',
          height: '50px',
          minWidth: '320px',
          maxWidth: '320px',
          minHeight: '50px',
          maxHeight: '50px',
          overflow: 'hidden',
          display: 'flex',
          position: 'relative'
        }}
      >
        {/* Inner container where the script is injected */}
        <div 
          ref={containerRef} 
          className="w-full h-full flex items-center justify-center pointer-events-auto"
          style={{
            width: '320px',
            height: '50px',
            overflow: 'hidden',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          <span className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest">Advertisement</span>
        </div>
      </div>
    </div>
  );
}
