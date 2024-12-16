import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children }: { children: React.ReactNode }) => {
  const elRef = useRef<HTMLDivElement | null>(null);

  if (!elRef.current) {
    elRef.current = document.createElement('div');
  }

  useEffect(() => {
    const portalRoot = document.getElementById('portal-root');
    if (portalRoot && elRef.current) {
      portalRoot.appendChild(elRef.current);
    }
    return () => {
      if (portalRoot && elRef.current) {
        portalRoot.removeChild(elRef.current);
      }
    };
  }, []);

  return createPortal(children, elRef.current);
};

export default Portal;