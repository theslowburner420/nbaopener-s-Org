import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

interface StaticAdProps {
  position: 'header' | 'footer';
}

/**
 * StaticAd component for Adsterra native banner placement.
 * Features:
 * 1. Native Banner format only (no popunders or aggressive formats)
 * 2. Sandboxed ad iframes via MutationObserver (sandbox="allow-scripts allow-same-origin")
 * 3. Isolated container with overflow:hidden and strict dimensions
 * 4. Async & deferred script loading
 */
const StaticAd = React.memo(({ position }: StaticAdProps) => {
  const { isPremium } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If user is premium, we don't render anything
    if (isPremium || !containerRef.current) return;

    const currentContainer = containerRef.current;

    // Clear previous content
    currentContainer.innerHTML = '';

    // Create unique ID for this instance
    const adId = position === 'header' 
      ? 'adsterra-banner-header-ca59b0dcdd453b6300a8f085b2df6f47'
      : 'adsterra-banner-footer-ca59b0dcdd453b6300a8f085b2df6f47';

    const adWrapper = document.createElement('div');
    adWrapper.id = adId;
    currentContainer.appendChild(adWrapper);

    // MutationObserver to automatically apply strict sandbox attributes to dynamically generated iframes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IFRAME') {
            const iframe = node as HTMLIFrameElement;
            // Explicitly excluding allow-popups, allow-top-navigation, allow-top-navigation-by-user-activation
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            iframe.setAttribute('loading', 'lazy');
          } else if (node.hasChildNodes && 'querySelectorAll' in node) {
            const element = node as HTMLElement;
            element.querySelectorAll('iframe').forEach((iframe) => {
              iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
              iframe.setAttribute('loading', 'lazy');
            });
          }
        });
      });
    });

    observer.observe(currentContainer, { childList: true, subtree: true });

    // Options Script (Clean Native Iframe Format)
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
    
    // Asynchronous Ad Script
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/ca59b0dcdd453b6300a8f085b2df6f47/invoke.js';
    invokeScript.async = true;

    currentContainer.appendChild(optionsScript);
    currentContainer.appendChild(invokeScript);

    return () => {
      observer.disconnect();
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [isPremium, position]);

  // CRITICAL: If premium, do not render the component at all
  if (isPremium) return null;

  const containerClasses = position === 'header'
    ? "w-full bg-zinc-950 border-b border-zinc-900 flex justify-center items-center h-[65px] shrink-0 z-10 overflow-hidden relative"
    : "w-full bg-zinc-950 border-t border-zinc-900 flex justify-center items-center h-[65px] shrink-0 z-10 overflow-hidden relative";

  return (
    <div className={containerClasses}>
      {/* Isolated ad container with strict bounding dimensions & relative overflow isolation */}
      <div 
        className="ad-container flex items-center justify-center bg-zinc-900/50 rounded overflow-hidden relative border border-white/5"
        style={{ 
          position: 'relative',
          overflow: 'hidden',
          width: '728px',
          height: '90px',
          minWidth: '728px',
          maxWidth: '728px',
          minHeight: '90px',
          maxHeight: '90px',
          scale: '0.6', // Scaled down to fit mobile/desktop viewports
        }}
      >
        {/* Inner container where the script is injected */}
        <div 
          ref={containerRef} 
          className="w-full h-full flex items-center justify-center pointer-events-auto"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '728px',
            height: '90px',
            overflow: 'hidden'
          }}
        >
          <span className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest">Advertisement</span>
        </div>
      </div>
    </div>
  );
});

export default StaticAd;
