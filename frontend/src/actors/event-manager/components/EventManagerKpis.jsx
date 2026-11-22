import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, CalendarRange } from 'lucide-react';

export default function EventManagerKpis({ metrics }) {
  const assigned = Number(metrics?.assignedEvents ?? metrics?.approvedEvents ?? 0);
  const completed = Number(metrics?.completedEvents ?? 0);
  const ongoing = Number(metrics?.ongoingEvents ?? metrics?.inPreparation ?? 0);
  // Pending events are events in the manager's queue awaiting completion (Total Assigned minus Completed)
  const pending = Number(
    metrics?.upcomingEvents !== undefined
      ? metrics.upcomingEvents
      : Math.max(0, assigned - completed)
  );

  const m = {
    assignedEvents: assigned,
    ongoingEvents: ongoing,
    completedEvents: completed,
    pendingEvents: pending
  };

  const kpis = [
    {
      title: 'ASSIGNED EVENTS',
      count: m.assignedEvents,
      subtitle: 'Assigned to your queue',
      badge: m.assignedEvents > 0 ? `${m.assignedEvents} Active` : '0 Active',
      badgeClass: m.assignedEvents > 0 ? 'bg-purple-100/80 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-500 border-slate-200',
      icon: CheckCircle2,
      iconClass: 'bg-purple-100 text-purple-600',
      lineColor: '#8B5CF6'
    },
    {
      title: 'ONGOING / IN PREPARATION',
      count: m.ongoingEvents,
      subtitle: 'Under active operations',
      badge: m.ongoingEvents > 0 ? `${m.ongoingEvents} In Progress` : '0 Ongoing',
      badgeClass: m.ongoingEvents > 0 ? 'bg-amber-100/80 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200',
      icon: Clock,
      iconClass: 'bg-amber-100 text-amber-600',
      lineColor: '#F59E0B'
    },
    {
      title: 'COMPLETED EVENTS',
      count: m.completedEvents,
      subtitle: 'Successfully executed',
      badge: m.completedEvents > 0 ? `${m.completedEvents} Completed` : '0 Completed',
      badgeClass: m.completedEvents > 0 ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200',
      icon: ShieldCheck,
      iconClass: 'bg-emerald-100 text-emerald-600',
      lineColor: '#10B981'
    },
    {
      title: 'PENDING EVENTS',
      count: m.pendingEvents,
      subtitle: 'Awaiting completion',
      badge: m.pendingEvents > 0 ? `${m.pendingEvents} Pending` : '0 Pending',
      badgeClass: m.pendingEvents > 0 ? 'bg-indigo-100/80 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200',
      icon: CalendarRange,
      iconClass: 'bg-indigo-100 text-indigo-600',
      lineColor: '#6366F1'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const IconComponent = kpi.icon;
        return (
          <div
            key={index}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${kpi.iconClass}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                  {kpi.title}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${kpi.badgeClass}`}>
                {kpi.badge}
              </span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <span className="text-3xl font-black text-[#0F172A] block leading-none">
                  {kpi.count}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  {kpi.subtitle}
                </span>
              </div>

              {/* Sparkline Graphic */}
              <div className="w-16 h-8">
                <svg viewBox="0 0 60 30" className="w-full h-full overflow-visible">
                  <path
                    d="M0 25 C15 25, 20 10, 35 18 C45 25, 50 5, 60 12"
                    fill="none"
                    stroke={kpi.lineColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="60" cy="12" r="3" fill={kpi.lineColor} />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
