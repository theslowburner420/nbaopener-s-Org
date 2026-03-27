import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

/**
 * StaticAd component for Adsterra banner.
 * Renders the ad script only if ads are not disabled (isPremium is false).
 */
export default function StaticAd() {
  const { isPremium } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPremium || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    const adWrapper = document.createElement('div');
    adWrapper.id = 'adsterra-banner-7b956296dd611d148eef5572569c1535';
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
      (window as any).atOptions = undefined;
    };
  }, [isPremium]);

  if (isPremium) return null;

  return (
    <div className="w-full bg-zinc-950 border-b border-zinc-900 flex justify-center items-center h-[60px] shrink-0 z-[1000] overflow-hidden">
      <div 
        ref={containerRef} 
        className="h-[50px] w-[320px] flex items-center justify-center bg-zinc-900/50 rounded overflow-hidden"
      >
        <span className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest">Advertisement</span>
      </div>
    </div>
  );
}
