import React from 'react';
import { Calendar, ChevronRight, UserPlus, UserCheck, MoreVertical, ArrowRight } from 'lucide-react';

export default function EventManagerEventsTable({ eventsList, onPrepareEvent, onViewAllEvents }) {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
            <span>Upcoming Approved Events</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black">
              {eventsList.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Commercially approved client requests awaiting operational setup.
          </p>
        </div>

        <button
          onClick={onViewAllEvents}
          className="flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline transition cursor-pointer"
        >
          <span>View All Events</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Operations Row List (Zero Overlap & Zero Side-scroll) */}
      <div className="space-y-3 pt-1">
        {eventsList.slice(0, 7).map(evt => {
          const readinessPct = evt.readinessPercent !== undefined ? evt.readinessPercent : (evt.operationalStatus === 'READY' || evt.operationalStatus === 'LIVE' ? 100 : 80);
          const coordinator = evt.coordinatorName || evt.onsiteCoordinatorName;

          return (
            <div
              key={evt.id}
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-purple-50/50 hover:border-purple-200/90 transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 group"
            >
              {/* Left Side: Event Details */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-2xs">
                  <Calendar className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs truncate">
                      {evt.eventName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100/70 text-purple-700 text-[9px] font-extrabold uppercase shrink-0">
                      {evt.category || 'Tech'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 font-medium">
                    <span className="font-bold text-slate-800">{evt.organizationName}</span>
                    <span>•</span>
                    <span>{evt.eventDate}</span>
                    <span>•</span>
                    <span className="truncate">{evt.venue}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Operational Status & Prepare CTA */}
              <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                
                {/* Readiness Score Badge */}
                <span
                  onClick={() => onPrepareEvent(evt.id)}
                  title="Readiness Score"
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer shadow-2xs transition ${
                    readinessPct === 100 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {readinessPct}%
                </span>

                {/* Coordinator Pill */}
                {coordinator ? (
                  <div className="flex items-center gap-1.5 text-purple-700 font-extrabold text-[11px] bg-purple-100/60 px-2.5 py-1 rounded-xl border border-purple-200/70 max-w-[130px]">
                    <UserCheck className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                    <span className="truncate">{coordinator}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onPrepareEvent(evt.id)}
                    className="flex items-center gap-1 text-rose-600 hover:text-purple-700 font-extrabold text-[11px] bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200/70 transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                    <span>Unassigned</span>
                  </button>
                )}

                {/* Prepare Event Button */}
                <button
                  onClick={() => onPrepareEvent(evt.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#9333EA] hover:from-[#4F46E5] hover:to-[#7E22CE] text-white font-extrabold text-xs shadow-2xs hover:shadow-xs transition whitespace-nowrap active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span>Prepare Event</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
