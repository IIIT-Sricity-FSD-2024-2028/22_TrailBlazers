import React from 'react';
import { Calendar, Star, BarChart3 } from 'lucide-react';

export default function WaveventsLogo({ size = 'md', showText = true, showSubtitle = true, dark = false, className = '' }) {
  const iconSizes = {
    sm: 'h-8 w-11',
    md: 'h-10 w-14',
    lg: 'h-14 w-20',
    xl: 'h-20 w-28'
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  const subtitleSizes = {
    sm: 'text-[7px] tracking-[0.2em]',
    md: 'text-[9px] sm:text-[10px] tracking-[0.25em]',
    lg: 'text-[11px] tracking-[0.3em]',
    xl: 'text-xs tracking-[0.35em]'
  };

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <div className="flex items-center gap-2.5">
        
        {/* 3D Liquid Wave Ribbon W Icon matching reference image */}
        <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
          <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_4px_16px_rgba(0,210,255,0.35)]">
            <defs>
              {/* Vibrant 3D Ribbon Liquid Wave Gradient */}
              <linearGradient id="waveRibbonGrad" x1="15" y1="120" x2="205" y2="35" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00D2FF" />
                <stop offset="25%" stopColor="#0077B6" />
                <stop offset="48%" stopColor="#3A0CA3" />
                <stop offset="70%" stopColor="#7209B7" />
                <stop offset="88%" stopColor="#B5179E" />
                <stop offset="100%" stopColor="#F72585" />
              </linearGradient>

              {/* Gloss Highlight Overlay */}
              <linearGradient id="waveGlossGrad" x1="50" y1="30" x2="170" y2="130" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="35%" stopColor="#E0E7FF" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#F72585" stopOpacity="0.0" />
              </linearGradient>

              {/* Inner Shadow Depth Gradient */}
              <linearGradient id="waveDepthGrad" x1="100" y1="140" x2="160" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1E0B40" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#7209B7" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Pixel Grid Blocks (Top Left Floating Pixels) */}
            <rect x="16" y="24" width="10" height="10" rx="2.5" fill="#00D2FF" />
            <rect x="30" y="24" width="10" height="10" rx="2.5" fill="#00B4D8" />
            <rect x="30" y="38" width="10" height="10" rx="2.5" fill="#7209B7" />
            <rect x="44" y="38" width="12" height="12" rx="3" fill="#B5179E" />
            <rect x="16" y="38" width="10" height="10" rx="2.5" fill="#00E5FF" opacity="0.9" />

            {/* Main Smooth 3D Liquid Wave Ribbon "W" */}
            <path
              d="M 42 50 C 48 50, 58 85, 82 108 C 104 128, 122 80, 136 58 C 150 36, 172 75, 192 78 C 205 80, 212 66, 206 52 C 196 32, 168 35, 148 58 C 130 80, 112 118, 88 102 C 68 90, 58 55, 42 50 Z"
              fill="url(#waveRibbonGrad)"
            />

            {/* 3D Depth Shadow Overlay */}
            <path
              d="M 88 102 C 112 118, 130 80, 148 58 C 160 44, 180 48, 198 68 C 185 76, 168 62, 154 74 C 136 90, 114 122, 88 102 Z"
              fill="url(#waveDepthGrad)"
            />

            {/* Gloss Highlight Overlay Ribbon */}
            <path
              d="M 44 51 C 50 51, 60 82, 84 104 C 102 120, 120 78, 134 58 C 146 40, 166 45, 184 62 C 172 52, 154 40, 140 58 C 124 78, 108 112, 86 98 C 68 86, 58 56, 44 51 Z"
              fill="url(#waveGlossGrad)"
            />
          </svg>
        </div>

        {/* Vertical Divider Line matching reference image */}
        <div className={`h-8 w-[1.5px] rounded-full mx-1 shrink-0 ${dark ? 'bg-white/40' : 'bg-purple-900/30'}`} />

        {/* Brand Typography matching reference image */}
        {showText && (
          <div className="flex flex-col justify-center">
            <span className={`font-extrabold tracking-tight leading-none bg-clip-text text-transparent drop-shadow-2xs ${
              dark 
                ? 'bg-gradient-to-r from-[#E9D5FF] via-[#F5D0FE] to-[#93C5FD]' 
                : 'bg-gradient-to-r from-[#4C1D95] via-[#6D28D9] to-[#BE185D]'
            } ${textSizes[size]}`}>
              Wavevents
            </span>

            {/* Tagline Subtitle: [Calendar] PLAN | [Star] EXPERIENCE | [BarChart] MEASURE */}
            {showSubtitle && (
              <div className={`mt-1 font-extrabold flex flex-wrap items-center gap-1.5 ${
                dark ? 'text-slate-100' : 'text-[#1E1B4B]'
              } ${subtitleSizes[size]}`}>
                <div className="inline-flex items-center gap-1 shrink-0">
                  <Calendar className={`w-3 h-3 stroke-[2.2] shrink-0 ${dark ? 'text-cyan-300' : 'text-[#0284C7]'}`} />
                  <span>PLAN</span>
                </div>
                <span className={`w-[1px] h-3 mx-0.5 shrink-0 ${dark ? 'bg-white/40' : 'bg-purple-900/30'}`} />
                <div className="inline-flex items-center gap-1 shrink-0">
                  <Star className={`w-3 h-3 stroke-[2.2] shrink-0 ${dark ? 'text-pink-300' : 'text-[#BE185D]'}`} />
                  <span>EXPERIENCE</span>
                </div>
                <span className={`w-[1px] h-3 mx-0.5 shrink-0 ${dark ? 'bg-white/40' : 'bg-purple-900/30'}`} />
                <div className="inline-flex items-center gap-1 shrink-0">
                  <BarChart3 className={`w-3 h-3 stroke-[2.2] shrink-0 ${dark ? 'text-purple-300' : 'text-[#6D28D9]'}`} />
                  <span>MEASURE</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

