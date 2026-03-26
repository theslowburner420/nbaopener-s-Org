import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Crown } from 'lucide-react';

export default function AdBanner() {
  const { isPremium } = useGame();
  const [adFailed, setAdFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPremium || adFailed) return;

    const loadAd = () => {
      if (!containerRef.current) return;

      try {
        // Clear container
        containerRef.current.innerHTML = '';

        // Create the script element
        const script = document.createElement('script');
        
        // Use a dummy script or a real one if provided
        // For Adsterra, you usually have a specific URL
        // script.src = `//www.highperformanceformat.com/${YOUR_AD_KEY}/invoke.js`;
        
        // To test "failed to load", we can use a non-existent URL or a blocked one
        // script.src = 'https://blocked-by-adblocker.com/ad.js';

        script.async = true;
        script.onerror = () => {
          console.warn('Adsterra banner blocked or failed to load');
          setAdFailed(true);
        };

        // Check if the script is actually added and not immediately removed by an adblocker
        containerRef.current.appendChild(script);
        
        // Secondary check: if after 3 seconds the container is still empty or height is 0,
        // it might have been blocked silently.
        setTimeout(() => {
          if (containerRef.current && containerRef.current.offsetHeight < 10) {
            console.warn('Ad container height is too small, likely blocked');
            setAdFailed(true);
          }
        }, 3000);

      } catch (err) {
        console.error('Error loading ad:', err);
        setAdFailed(true);
      }
    };

    const timer = setTimeout(loadAd, 1000);
    return () => clearTimeout(timer);
  }, [isPremium, adFailed]);

  // If ad failed and not premium, hide the entire container to avoid "ugly white space"
  if (!isPremium && adFailed) {
    return null;
  }

  return (
    <div className="w-full flex justify-center py-4 px-4 z-[3000] pointer-events-auto transition-all duration-500">
      {isPremium ? (
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 rounded-lg px-6 py-2 flex items-center gap-2 backdrop-blur-sm">
          <Crown size={14} className="text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Premium Member</span>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="w-full max-w-[728px] min-h-[50px] md:min-h-[90px] bg-zinc-900/80 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden relative group backdrop-blur-md"
        >
          {/* Adsterra Placeholder / Loading State */}
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-[10px] font-bold uppercase tracking-widest pointer-events-none">
            Advertisement
          </div>
          
          {/* 
            To integrate real Adsterra banner:
            In the useEffect above, you can set the script.src to your Adsterra invoke.js URL.
            The container will then be populated by the ad.
          */}
          <div className="hidden md:flex items-center justify-center w-[728px] h-[90px] bg-zinc-800/20">
             <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">728x90 Banner Space</span>
          </div>
          <div className="flex md:hidden items-center justify-center w-[320px] h-[50px] bg-zinc-800/20">
             <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">320x50 Mobile Banner</span>
          </div>
        </div>
      )}
    </div>
  );
}
