import React from 'react';
import { Activity } from 'lucide-react';

export default function ReadinessOverview({ eventsList }) {
  // Calculate average readiness percentage across all active events
  const totalReadiness = eventsList.reduce((acc, evt) => {
    const pct = evt.readinessPercent !== undefined ? evt.readinessPercent : (evt.operationalStatus === 'READY' || evt.operationalStatus === 'LIVE' ? 100 : 80);
    return acc + pct;
  }, 0);

  const avgReadiness = eventsList.length > 0 ? Math.round(totalReadiness / eventsList.length) : 92;

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-600" />
          <span>Readiness Overview</span>
        </h4>
        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          AVG {avgReadiness}%
        </span>
      </div>

      <div className="pt-2">
        <div className="h-28 w-full relative">
          <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="50" x2="300" y2="50" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2="300" y2="80" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />

            {/* Gradient Fill */}
            <path
              d="M0,70 Q50,40 100,55 T200,25 T300,15 L300,100 L0,100 Z"
              fill="url(#readinessGrad)"
            />

            {/* Smooth Line */}
            <path
              d="M0,70 Q50,40 100,55 T200,25 T300,15"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Data points */}
            <circle cx="100" cy="55" r="4" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="200" cy="25" r="4" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="300" cy="15" r="5" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-100">
          <span>Week 1</span>
          <span>Week 2</span>
          <span>Week 3</span>
          <span className="text-purple-700 font-extrabold">Current ({avgReadiness}%)</span>
        </div>
      </div>
    </div>
  );
}
