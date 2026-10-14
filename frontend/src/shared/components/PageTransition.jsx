import React, { useState, useEffect } from 'react';

export default function PageTransition({ children, pageKey }) {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (pageKey) {
      setIsTransitioning(true);
      setDisplayChildren(children);

      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 550);

      return () => clearTimeout(timer);
    }
  }, [pageKey]);

  return (
    <div className="relative w-full min-h-full">
      {/* Lavender-Blue Gradient Transition Overlay */}
      {isTransitioning && (
        <div
          className="fixed inset-0 z-40 bg-gradient-to-br from-[#EEF2FF] via-[#F3E8FF] to-[#DAF0FB] pointer-events-none transition-opacity duration-500 ease-out"
          style={{
            animation: 'pageOverlayFade 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        />
      )}

      {/* Main Page Container with Smooth Scale & Fade Entrance */}
      <div
        key={pageKey}
        className="w-full transition-all duration-500 ease-out"
        style={{
          animation: 'pageContentEntrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {displayChildren}
      </div>
    </div>
  );
}
