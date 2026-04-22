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
const StaticAd = React.memo(({ position }: StaticAdProps) => {
  const { isPremium } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If user is premium, we don't render anything
    if (isPremium || !containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Create unique ID for this instance
    const adId = position === 'header' 
      ? 'adsterra-banner-header-ca59b0dcdd453b6300a8f085b2df6f47'
      : 'adsterra-banner-footer-ca59b0dcdd453b6300a8f085b2df6f47';

    const adWrapper = document.createElement('div');
    adWrapper.id = adId;
    containerRef.current.appendChild(adWrapper);

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      atOptions = {
        'key' : 'ca59b0dcdd453b6300a8f085b2df6f47',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;
    
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/ca59b0dcdd453b6300a8f085b2df6f47/invoke.js';
    invokeScript.async = true;
    invokeScript.defer = true; // Added defer for non-blocking

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
    ? "w-full bg-zinc-950 border-b border-zinc-900 flex justify-center items-center h-[100px] shrink-0 z-10 overflow-hidden relative"
    : "w-full bg-zinc-950 border-t border-zinc-900 flex justify-center items-center h-[100px] shrink-0 z-10 overflow-hidden relative";

  return (
    <div className={containerClasses}>
      {/* Outer wrapper for ad with strict fixed dimensions */}
      <div 
        className="flex items-center justify-center bg-zinc-900/50 rounded overflow-hidden relative adsterra-container"
        style={{ 
          width: '728px',
          height: '90px',
          minWidth: '728px',
          maxWidth: '728px',
          minHeight: '90px',
          maxHeight: '90px',
          overflow: 'hidden',
          display: 'flex',
          position: 'relative',
          scale: '0.8', // Slightly scale down to fit small desktops
        }}
      >
        {/* Inner container where the script is injected */}
        <div 
          ref={containerRef} 
          className="w-full h-full flex items-center justify-center pointer-events-auto"
          style={{
            width: '728px',
            height: '90px',
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
});

export default StaticAd;
