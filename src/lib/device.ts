// Device and platform detection utilities optimized for Blink / Android GPU constraints

export const isAndroidDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /android/i.test(ua);
};

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || isAndroidDevice() || /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
};
