import { useState, useEffect } from 'react';

export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

export const isTabletDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

export const useDeviceDetection = () => {
  if (typeof window === 'undefined') return { isMobile: false, isTablet: false };
  
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const [isTablet, setIsTablet] = useState(isTabletDevice());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
      setIsTablet(isTabletDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isTablet };
}; 