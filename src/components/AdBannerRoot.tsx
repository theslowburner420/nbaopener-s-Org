/**
 * SOLUCIÓ: Banner d'Adsterra fix a l'arrel de l'app, muntat una sola vegada.
 *
 * Basat en el patró que SÍ funciona a mynbacareer.com:
 * 1. Es munta UN COP a App.tsx, fora de qualsevol condicional de vista.
 * 2. S'amaga amb CSS (display:none) quan isPremium===true, MAI es desmunta.
 * 3. S'injecta dins d'un <iframe> propi via document.write, aïllat del cicle
 *    de vida de React, en lloc d'anexar <script> directament al DOM principal.
 */

import React, { useEffect, useRef, useState } from 'react';

interface AdBannerRootProps {
  isPremium: boolean;
  adKey?: string;
  width?: number;
  height?: number;
}

export const AdBannerRoot: React.FC<AdBannerRootProps> = ({
  isPremium,
  adKey = '24642ebb773eab2a07a24f632b74042d',
  width = 728,
  height = 90,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedOnceRef = useRef(false);
  const [hasError, setHasError] = useState(false);

  // Aquest efecte NOMÉS s'executa una vegada durant tota la sessió,
  // independentment de quantes vegades canviï isPremium o la vista activa.
  useEffect(() => {
    if (mountedOnceRef.current) return;
    if (!containerRef.current) return;
    mountedOnceRef.current = true;

    const container = containerRef.current;

    try {
      const iframe = document.createElement('iframe');
      iframe.style.width = `${width}px`;
      iframe.style.height = `${height}px`;
      iframe.style.border = '0';
      iframe.style.overflow = 'hidden';
      iframe.setAttribute('scrolling', 'no');
      container.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) {
        setHasError(true);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8" /></head>
          <body style="margin:0;padding:0;">
            <script type="text/javascript">
              atOptions = {
                'key' : '${adKey}',
                'format' : 'iframe',
                'height' : ${height},
                'width' : ${width},
                'params' : {}
              };
            </script>
            <script type="text/javascript" src="https://www.highperformanceformat.com/${adKey}/invoke.js"></script>
          </body>
        </html>
      `);
      iframeDoc.close();
    } catch (err) {
      console.warn('[AdBannerRoot] Initialization exception:', err);
      setHasError(true);
    }
    // Sense array de dependències variable a propòsit: volem que s'executi
    // NOMÉS al primer muntatge real del component arrel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (hasError) return null;

  return (
    <div
      // Clau: MAI desmuntar amb {condició && <AdBannerRoot/>}.
      // Amagar sempre amb CSS, per mantenir l'script viu al DOM.
      className="w-full bg-zinc-950 border-b border-zinc-900 flex justify-center items-center shrink-0 z-50 overflow-hidden relative select-none h-[48px] sm:h-[60px] md:h-[90px]"
      style={{
        display: isPremium ? 'none' : 'flex',
      }}
    >
      <div className="scale-[0.5] sm:scale-[0.62] md:scale-100 origin-center transition-transform flex items-center justify-center">
        <div
          id="ad-banner-hoopscollector-root"
          ref={containerRef}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            minWidth: `${width}px`,
            minHeight: `${height}px`,
          }}
          className="ad-banner-hoopscollector-root pointer-events-auto"
        />
      </div>
    </div>
  );
};

export default AdBannerRoot;
