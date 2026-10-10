import React from 'react';

export default function GlassCard({ children, className = '', hover = true, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass-light rounded-3xl p-6 transition-all duration-300 ${
        hover ? 'glass-light-hover cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
