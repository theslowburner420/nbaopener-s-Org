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
    // If premium (ads disabled) or no container, do nothing
    if (isPremium || !containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create a wrapper div for the ad to ensure it centers correctly
    const adWrapper = document.createElement('div');
    adWrapper.id = 'adsterra-banner-7b956296dd611d148eef5572569c1535';
    containerRef.current.appendChild(adWrapper);

    // Create the script element for atOptions
    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      atOptions = {
        'key' : '7b956296dd611d148eef5572569c1535',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;
    
    // Create the script element for the invoke.js
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/7b956296dd611d148eef5572569c1535/invoke.js';
    invokeScript.async = true;

    // Append scripts to the container
    containerRef.current.appendChild(optionsScript);
    containerRef.current.appendChild(invokeScript);

    return () => {
      // Cleanup: remove scripts and content when component unmounts or isPremium changes
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      // Also clean up any global atOptions if necessary, though usually not needed for single ad
      (window as any).atOptions = undefined;
    };
  }, [isPremium]);

  // If premium, don't render anything at all (no script load, no div)
  if (isPremium) {
    return null;
  }

  return (
    <div className="w-full flex justify-center py-4 z-[100] overflow-hidden" id="static-ad-container">
      <div 
        ref={containerRef} 
        className="min-h-[90px] w-full max-w-[728px] flex items-center justify-center"
      />
    </div>
  );
}
