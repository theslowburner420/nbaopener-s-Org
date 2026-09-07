import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

interface StaticAdProps {
  position?: 'header' | 'footer';
}

/**
 * StaticAd component - Banner estático de Adsterra (728x90) para hoopscollector.com
 * Se inserta de manera nativa y directa en el DOM para asegurar la carga del anuncio,
 * con escala responsiva para que el contenedor superior quede fino, limpio y bien integrado.
 */
const StaticAd: React.FC<StaticAdProps> = React.memo(({ position = 'header' }) => {
  const { isPremium } = useGame();
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si el usuario es Premium o el contenedor no está montado, no cargar el anuncio
    if (isPremium || !bannerRef.current) return;
    const container = bannerRef.current;

    // Limpieza previa del contenedor para evitar duplicados
    container.innerHTML = '';

    // Asignar atOptions en el objeto global window
    try {
      (window as unknown as { atOptions?: unknown }).atOptions = {
        key: '24642ebb773eab2a07a24f632b74042d',
        format: 'iframe',
        height: 90,
        width: 728,
        params: {}
      };
    } catch {
      // ignore
    }

    // 1. Script de configuración atOptions
    const confScript = document.createElement('script');
    confScript.type = 'text/javascript';
    confScript.text = `
      atOptions = {
        'key' : '24642ebb773eab2a07a24f632b74042d',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;

    // 2. Script invoke.js de Adsterra para hoopscollector.com
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highrevenueformat.com/24642ebb773eab2a07a24f632b74042d/invoke.js';

    container.appendChild(confScript);
    container.appendChild(invokeScript);

    // Cleanup al desmontar
    return () => {
      container.innerHTML = '';
      try {
        delete (window as unknown as { atOptions?: unknown }).atOptions;
      } catch {
        // ignore
      }
    };
  }, [isPremium]);

  // Si el usuario tiene membresía Premium / Ad-Free, no renderizar nada
  if (isPremium) return null;

  const borderClass = position === 'footer' ? 'border-t border-zinc-900' : 'border-b border-zinc-900';

  return (
    <div 
      className={`w-full bg-zinc-950 ${borderClass} flex justify-center items-center shrink-0 z-20 overflow-hidden relative select-none h-[48px] sm:h-[60px] md:h-[72px]`}
    >
      <div
        id="ad-banner-hoopscollector"
        ref={bannerRef}
        className="ad-banner-hoopscollector flex items-center justify-center pointer-events-auto"
        style={{
          width: '728px',
          height: '90px',
          minWidth: '728px',
          minHeight: '90px',
        }}
      />
    </div>
  );
});

export default StaticAd;


