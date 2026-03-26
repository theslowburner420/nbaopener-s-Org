import React, { useEffect, useRef } from 'react';

/**
 * InterstitialAd component for Adsterra Native Banner or Social Bar.
 * Renders the ad script inside the interstitial modal.
 */
export default function InterstitialAd() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create the script element for the ad
    // NOTE: This is a placeholder for Adsterra Native Banner or Social Bar.
    // The user can replace the key or the script structure as needed.
    const script = document.createElement('script');
    script.type = 'text/javascript';
    
    // Example for a Social Bar or Native Banner script
    // We'll use the key provided in the previous request as a fallback or placeholder
    script.src = '//www.highperformanceformat.com/7b956296dd611d148eef5572569c1535/invoke.js';
    script.async = true;

    // Some Adsterra formats require atOptions
    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      atOptions = {
        'key' : '7b956296dd611d148eef5572569c1535',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;

    containerRef.current.appendChild(optionsScript);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="w-full flex justify-center items-center min-h-[250px] bg-zinc-900/20 rounded-xl overflow-hidden border border-white/5">
      <div ref={containerRef} className="flex items-center justify-center" />
    </div>
  );
}
