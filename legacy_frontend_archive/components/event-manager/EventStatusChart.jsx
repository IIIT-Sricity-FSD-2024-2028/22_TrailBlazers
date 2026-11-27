import React from 'react';
import { PieChart } from 'lucide-react';

export default function EventStatusChart({ eventsList }) {
  // Calculate status counts dynamically from real event list
  const total = eventsList.length || 1;
  const liveCount = eventsList.filter(e => e.operationalStatus === 'LIVE').length;
  const readyCount = eventsList.filter(e => e.operationalStatus === 'READY').length;
  const prepCount = eventsList.filter(e => !e.operationalStatus || e.operationalStatus === 'IN_PREPARATION' || e.operationalStatus === 'COMMERCIAL_APPROVED').length;
  const approvedCount = eventsList.filter(e => e.status === 'COMMERCIAL_APPROVED' || e.status === 'ACCEPTED').length;

  const livePct = Math.round((liveCount / total) * 100);
  const readyPct = Math.round((readyCount / total) * 100);
  const prepPct = Math.round((prepCount / total) * 100);

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
          <PieChart className="w-4 h-4 text-purple-600" />
          <span>Events by Status</span>
        </h4>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {eventsList.length} TOTAL
        </span>
      </div>

      <div className="flex items-center gap-6 pt-2">
        {/* SVG Donut Chart */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="4"
            />
            {/* Live Segment */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#6366F1"
              strokeWidth="4.5"
              strokeDasharray={`${livePct || 15}, 100`}
            />
            {/* Ready Segment */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#10B981"
              strokeWidth="4.5"
              strokeDasharray={`${readyPct || 35}, 100`}
              strokeDashoffset={`-${livePct || 15}`}
            />
            {/* Preparation Segment */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="4.5"
              strokeDasharray={`${prepPct || 50}, 100`}
              strokeDashoffset={`-${(livePct || 15) + (readyPct || 35)}`}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black text-[#0F172A] leading-none">{eventsList.length}</span>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase mt-0.5">Events</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="font-bold text-slate-700">Live</span>
            </div>
            <span className="font-black text-slate-900">{liveCount} ({livePct}%)</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-700">Ready</span>
            </div>
            <span className="font-black text-slate-900">{readyCount} ({readyPct}%)</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="font-bold text-slate-700">In Preparation</span>
            </div>
            <span className="font-black text-slate-900">{prepCount} ({prepPct}%)</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="font-bold text-slate-700">Approved Total</span>
            </div>
            <span className="font-black text-slate-900">{approvedCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
