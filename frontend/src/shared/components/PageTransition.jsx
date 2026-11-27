import React, { useState, useEffect } from 'react';

export default function PageTransition({ children, pageKey }) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (pageKey) {
      setIsTransitioning(true);

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
          className="fixed inset-0 z-40 bg-gradient-to-br from-[#EEF2FF] via-[#F3E8FF] to-[#DAF0FB] pointer-events-none transition-opacity duration-500 ease-out page-transition-overlay"
        />
      )}

      {/* Main Page Container with Smooth Scale & Fade Entrance */}
      <div
        key={pageKey}
        className="w-full transition-all duration-500 ease-out page-transition-content"
      >
        {children}
      </div>
    </div>
  );
}
