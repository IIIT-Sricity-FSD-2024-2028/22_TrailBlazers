import React from 'react';
import { Building2, Plus } from 'lucide-react';

export default function EventManagerHero({ user, onNavigate }) {
  return (
    <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#EEF2FF] via-[#F3E8FF] to-[#F0FDFA] border border-white/90 shadow-sm overflow-hidden animate-hero-container">
      {/* Background 3D Glow Orbs */}
      <div className="absolute top-0 right-1/3 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left Text & CTA */}
        <div className="max-w-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-purple-700 uppercase tracking-widest bg-purple-100/70 px-3 py-1 rounded-full w-fit border border-purple-200">
            <Building2 className="w-3.5 h-3.5 text-purple-700" />
            <span>Wavevents Event Management & Operations</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Event Manager Workspace
          </h1>

          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Operational event preparation, readiness verification, onsite coordinator assignment, and private invitations – all in one place.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigate && onNavigate('create-event')}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] hover:from-[#4F46E5] hover:to-[#DB2777] text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          </div>
        </div>

        {/* Right Section: 3D Calendar Illustration & Profile Stats Card */}
        <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto shrink-0">
          
          {/* 3D Calendar Graphic */}
          <div className="relative w-44 h-36 flex items-center justify-center shrink-0">
            <img 
              src="/3d-calendar-illustration.png" 
              alt="3D Event Calendar & Analytics" 
              className="w-full h-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300 pointer-events-none"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Manager Profile & Stats Card */}
          <div className="w-full sm:w-64 p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-white shadow-sm space-y-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block font-extrabold text-xs text-[#0F172A] truncate">
                  {user?.name || 'Test Event Manager 1'}
                </span>
                <span className="inline-block px-2 py-0.5 rounded-md bg-purple-100 text-[9px] font-black uppercase text-purple-700 border border-purple-200 mt-0.5">
                  {user?.role ? user.role.replace('_', ' ') : 'EVENT MANAGER'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div>
                <span className="block font-black text-sm text-[#0F172A]">7</span>
                <span className="text-[9px] font-extrabold uppercase text-slate-400">MANAGED</span>
              </div>
              <div>
                <span className="block font-black text-sm text-emerald-600">98%</span>
                <span className="text-[9px] font-extrabold uppercase text-slate-400">SUCCESS</span>
              </div>
              <div>
                <span className="block font-black text-sm text-indigo-600">2.4k</span>
                <span className="text-[9px] font-extrabold uppercase text-slate-400">ATTENDEES</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
