import React from 'react';
import { ShieldCheck, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export default function ReadinessChecklist({ readiness, onMarkEventReady, loadingMarkReady }) {
  const { percent = 0, isReady = false, items = [], missingItems = [] } = readiness || {};

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
      
      {/* Title & Readiness Progress Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span>Operational Readiness Checklist</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Automated verification of venue, registration, onsite staff, and invitation conditions.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <div className="text-right">
            <span className="block text-2xl font-black text-slate-900 leading-none">
              {percent}%
            </span>
            <span className="text-[10px] font-extrabold uppercase text-slate-400">
              Readiness Score
            </span>
          </div>

          <button
            onClick={onMarkEventReady}
            disabled={!isReady || loadingMarkReady}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs shadow-xs transition flex items-center gap-2 ${
              isReady 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white cursor-pointer active:scale-95' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{loadingMarkReady ? 'Verifying...' : 'Mark Event READY'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 rounded-full ${
            percent === 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Missing Requirements Alert Banner */}
      {!isReady && missingItems.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Missing Prerequisites for Event Readiness:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
              {missingItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Checklist Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {items.map((item) => (
          <div 
            key={item.id}
            className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
              item.passed 
                ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {item.passed ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-extrabold text-xs block leading-tight">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                {item.passed ? 'Requirement satisfied & verified.' : 'Action required by Event Manager.'}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
