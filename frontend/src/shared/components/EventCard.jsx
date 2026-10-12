import React from 'react';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { EVENT_IMAGES } from '../utils/assets';

export default function EventCard({ event, onSelect }) {
  const isFree = Number(event.ticketPrice) === 0;

  // Fallback category images if bannerUrl is missing
  const getEventImage = () => {
    if (event.bannerUrl) return event.bannerUrl;
    const catKey = (event.category || '').toLowerCase();
    if (catKey.includes('tech')) return EVENT_IMAGES.categories.tech;
    if (catKey.includes('workshop')) return EVENT_IMAGES.categories.workshop;
    if (catKey.includes('academic')) return EVENT_IMAGES.categories.conference;
    if (catKey.includes('business')) return EVENT_IMAGES.categories.corporate;
    return EVENT_IMAGES.categories.community;
  };

  return (
    <div
      onClick={() => onSelect(event)}
      className="group relative rounded-3xl overflow-hidden border border-white/75 shadow-[0_15px_35px_rgba(6,182,212,0.10),_inset_0_1px_1px_rgba(255,255,255,0.85)] hover:shadow-[0_22px_45px_rgba(6,182,212,0.22)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between cursor-pointer h-full text-[#0F172A]"
      style={{
        background: 'linear-gradient(135deg, rgba(232, 248, 250, 0.82) 0%, rgba(221, 243, 246, 0.72) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div>
        {/* Crisp Banner Image Container */}
        <div className="relative h-56 w-full overflow-hidden bg-slate-900">
          <img
            src={getEventImage()}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          />
          
          {/* Subtle Bottom Image Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent pointer-events-none" />

          {/* Floating Badges */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2 flex-wrap z-10">
            <span className="px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-extrabold text-[#0F172A] shadow-md border border-white">
              {event.category}
            </span>
            <StatusBadge status={event.type} />
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-md border ${
              (event.registrationStatus || 'OPEN').toUpperCase() === 'OPEN'
                ? 'bg-emerald-500 text-white border-white/50'
                : (event.registrationStatus || 'OPEN').toUpperCase() === 'PAUSED'
                ? 'bg-amber-500 text-white border-white/50'
                : 'bg-slate-700 text-white border-white/30'
            }`}>
              Reg: {(event.registrationStatus || 'OPEN').toUpperCase()}
            </span>
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-3.5 right-3.5 z-10">
            <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold shadow-lg border ${
              isFree 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-white/50' 
                : 'bg-slate-950/85 backdrop-blur-md text-white border-white/30'
            }`}>
              {isFree ? 'FREE PASS' : `₹${Number(event.ticketPrice).toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* High-Contrast Light Sea-Blue Glass Body Content */}
        <div className="p-6 space-y-3.5 bg-[#E0F7FA]/30 backdrop-blur-md">
          {/* Organization Name Header */}
          <div className="text-[11px] font-extrabold text-[#0891B2] tracking-wider uppercase">
            {event.organizationName}
          </div>

          {/* Event Title */}
          <h3 className="text-lg font-bold text-[#0F172A] line-clamp-2 leading-snug group-hover:text-cyan-700 transition-colors">
            {event.name}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-[#334155] font-medium leading-relaxed line-clamp-2">
            {event.description}
          </p>

          {/* Information Rows: Date & Location */}
          <div className="space-y-2.5 pt-3 border-t border-cyan-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#CFFAFE]/80 text-[#0891B2] flex items-center justify-center shrink-0 border border-[#A5F3FC] shadow-2xs font-bold">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-[#1E293B]">
                {event.date} • {event.startTime}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#E0F2FE]/80 text-[#0284C7] flex items-center justify-center shrink-0 border border-[#BAE6FD] shadow-2xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-[#334155] truncate">
                {event.venue}, {event.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Bottom Footer: Ticket Count & Primary Action CTA */}
      <div className="p-6 pt-0 flex items-center justify-between gap-3 mt-auto bg-[#E0F7FA]/30 backdrop-blur-md">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200 text-[11px] font-bold text-emerald-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{event.availableTickets} tickets left</span>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-cyan-700 text-white text-xs font-extrabold transition-all duration-200 shadow-xs group-hover:shadow-md">
          <span>View Event</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
