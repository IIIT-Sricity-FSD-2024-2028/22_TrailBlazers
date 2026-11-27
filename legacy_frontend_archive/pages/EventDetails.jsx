import React, { useState } from 'react';
import { Calendar, MapPin, Users, Ticket, ArrowLeft, ShieldCheck, Building2, Clock, Lock, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import InvitationModal from '../components/InvitationModal';
import { EVENT_IMAGES } from '../utils/assets';

export default function EventDetails({ event, onBack, onAttend, onAttendClick, user, onOpenAuth, onVerifyEmailPrompt }) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  if (!event) return null;

  const isFree = Number(event.ticketPrice) === 0;
  const regStatus = (event.registrationStatus || 'OPEN').toUpperCase();
  const isRegistrationAllowed = regStatus === 'OPEN' && Number(event.availableTickets) > 0;

  const handleAttend = () => {
    const attendHandler = onAttend || onAttendClick;
    if (!user) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    if (!user.emailVerified) {
      if (onVerifyEmailPrompt) onVerifyEmailPrompt();
      return;
    }

    if (event.type === 'CLOSED' || event.requiresInvitation) {
      setIsInviteModalOpen(true);
      return;
    }

    if (attendHandler) attendHandler(event);
  };

  const handleInviteModalContinue = (inviteCode) => {
    setIsInviteModalOpen(false);
    const attendHandler = onAttend || onAttendClick;
    if (attendHandler) {
      attendHandler(event, { inviteCode });
    }
  };

  // Parse agenda string lines into structured timeline items
  const parseAgendaTimeline = (agendaText) => {
    if (!agendaText) {
      return [
        { time: '09:00 AM', title: 'Registration & Welcome', desc: 'Check-in, badge collection, and morning networking.', color: 'powder' },
        { time: '10:00 AM', title: 'Opening Keynote Address', desc: 'Featured industry presentation and strategic roadmap.', color: 'lavender' },
        { time: '11:30 AM', title: 'Technology Session', desc: 'Deep dive into emerging tech architectures & frameworks.', color: 'mint' },
        { time: '01:00 PM', title: 'Lunch & Peer Networking', desc: 'Buffet lunch, showcase exhibition, and partner demos.', color: 'softLavender' },
        { time: '02:30 PM', title: 'Panel Discussion & Closing', desc: 'Q&A session with industry pioneers and concluding remarks.', color: 'powder' }
      ];
    }

    const lines = agendaText.split('\n').filter(l => l.trim().length > 0);
    const colors = ['powder', 'lavender', 'mint', 'softLavender'];

    return lines.map((line, idx) => {
      const parts = line.split('-');
      if (parts.length >= 2) {
        return {
          time: parts[0].trim(),
          title: parts[1].trim(),
          desc: parts.slice(2).join('-').trim() || 'Session presentation and discussions.',
          color: colors[idx % colors.length]
        };
      }
      return {
        time: `Step ${idx + 1}`,
        title: line.trim(),
        desc: 'Detailed agenda topic session.',
        color: colors[idx % colors.length]
      };
    });
  };

  const timelineItems = parseAgendaTimeline(event.agenda);

  const getEventImage = () => {
    if (event.bannerUrl) return event.bannerUrl;
    return EVENT_IMAGES.categories.tech;
  };

  return (
    <div className="space-y-10 pb-20 text-[#26334A]">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-extrabold text-[#64748B] hover:text-indigo-700 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Explore Events</span>
      </button>

      {/* Main Banner Hero with Soft Pastel Frame */}
      <div className="relative rounded-3xl overflow-hidden h-80 sm:h-[450px] w-full shadow-xl bg-[#DAF0FB] border border-white p-2">
        <div className="relative w-full h-full rounded-2xl overflow-hidden">
          <img
            src={getEventImage()}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#26334A]/90 via-[#26334A]/40 to-transparent" />

          {/* Overlay Badges */}
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <span className="px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-extrabold text-[#26334A] shadow-xs">
              {event.category}
            </span>
            <StatusBadge status={event.type} />
          </div>

          {/* Overlay Title */}
          <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
            <div className="text-xs font-bold text-powder-200 uppercase tracking-widest">
              {event.organizationName}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {event.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: About & Vertical Timeline Agenda */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About Section */}
          <div className="p-8 rounded-3xl glass-light border border-white shadow-xs space-y-4">
            <h2 className="text-2xl font-extrabold text-[#26334A]">About This Event</h2>
            <p className="text-sm text-[#64748B] leading-relaxed font-medium whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* VERTICAL PASTEL TIMELINE AGENDA REDESIGN */}
          <div className="p-8 rounded-3xl glass-light border border-white shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <h2 className="text-2xl font-extrabold text-[#26334A] flex items-center gap-2.5">
                <Clock className="w-6 h-6 text-indigo-600" />
                <span>Event Timeline & Agenda</span>
              </h2>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {timelineItems.length} Sessions
              </span>
            </div>

            {/* Glowing Vertical Timeline Line & Cards */}
            <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-1 before:bg-gradient-to-b before:from-indigo-400 before:via-purple-400 before:to-emerald-400 before:rounded-full">
              {timelineItems.map((item, idx) => {
                const colorMap = {
                  powder: 'bg-[#DAF0FB]/80 border-[#B5E1F7] text-indigo-950',
                  lavender: 'bg-[#FBE9F9]/80 border-[#F6CFF3] text-purple-950',
                  mint: 'bg-[#E8F9F5]/80 border-[#C7F3EA] text-emerald-950',
                  softLavender: 'bg-[#E9E1FA]/80 border-[#DCE5FF] text-indigo-950'
                };

                const nodeBorder = idx % 4 === 0 ? 'border-indigo-600' : idx % 4 === 1 ? 'border-purple-600' : idx % 4 === 2 ? 'border-emerald-600' : 'border-blue-600';

                return (
                  <div key={idx} className="relative flex items-start gap-4 group">
                    {/* Glowing Bullet Node */}
                    <div className={`absolute -left-[37px] top-4 w-5 h-5 rounded-full bg-white border-2 ${nodeBorder} shadow-xs group-hover:scale-125 transition-transform`} />

                    <div className={`p-6 rounded-2xl border w-full space-y-2 shadow-2xs backdrop-blur-md ${colorMap[item.color]}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-extrabold tracking-wider px-2.5 py-0.5 bg-white/90 rounded-md border border-white">
                          {item.time}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-70">Session {idx + 1}</span>
                      </div>
                      <h4 className="font-extrabold text-base text-[#26334A]">{item.title}</h4>
                      <p className="text-xs text-[#64748B] font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Organizer Info */}
          <div className="p-8 rounded-3xl glass-light border border-white shadow-xs space-y-4">
            <h2 className="text-xl font-extrabold text-[#26334A] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Organizer Information</span>
            </h2>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5] flex items-center justify-center font-extrabold text-[#26334A] text-lg shadow-2xs border border-white">
                {event.organizationName.charAt(0)}
              </div>
              <div>
                <div className="font-extrabold text-[#26334A] text-sm">{event.organizationName}</div>
                <div className="text-xs text-emerald-700 font-bold">Verified Event Host</div>
              </div>
            </div>
          </div>

          {/* Registration Terms */}
          <div className="p-6 rounded-3xl bg-white/60 border border-white text-xs text-[#64748B] space-y-2">
            <h4 className="font-extrabold text-[#26334A] uppercase tracking-wider">Registration Policy</h4>
            <ul className="list-disc list-inside space-y-1 font-medium">
              <li>Digital ticket passes are non-transferable unless requested 48 hours prior to the event.</li>
              <li>Official digital pass with QR code must be presented at entry check-in.</li>
              <li>Organizers reserve the right to verify entry pass credentials.</li>
            </ul>
          </div>

        </div>

        {/* Right Col: Sticky Registration Panel */}
        <div className="space-y-6">
          <div className="sticky top-24 p-8 rounded-3xl glass-light border border-white shadow-xl space-y-6">
            
            {/* Ticket Price */}
            <div className="flex justify-between items-baseline pb-4 border-b border-slate-200/80">
              <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider">Pass Pricing</span>
              <span className="text-3xl font-extrabold text-[#26334A]">
                {isFree ? 'FREE' : `₹${event.ticketPrice.toLocaleString()}`}
              </span>
            </div>

            {/* Quick Metadata */}
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center gap-3 text-[#26334A]">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-extrabold block text-[#26334A]">{event.date}</span>
                  <span className="text-[#64748B]">{event.startTime} - {event.endTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#26334A]">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <span className="font-extrabold block text-[#26334A]">{event.venue}</span>
                  <span className="text-[#64748B]">{event.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#26334A]">
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold block text-[#26334A]">{event.availableTickets} Tickets Remaining</span>
                  <span className="text-[#64748B]">Out of {event.totalTickets || event.expectedAttendance || 100} total capacity</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/80 border border-slate-100">
                <span className="text-slate-500 font-bold">Registration Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  regStatus === 'OPEN'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : regStatus === 'PAUSED'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  Registration: {regStatus}
                </span>
              </div>
            </div>

            {/* Closed Event Invitation Warning */}
            {event.type === 'CLOSED' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Invitation code required for closed event registration.</span>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleAttend}
              disabled={!isRegistrationAllowed}
              className={`w-full py-4 px-6 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md border border-white flex items-center justify-center gap-2 ${
                isRegistrationAllowed
                  ? 'bg-gradient-to-r from-[#B5E1F7] via-[#DAF0FB] to-[#C7F3EA] text-[#26334A] hover:opacity-95'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed border-slate-300'
              }`}
            >
              <Ticket className="w-5 h-5 text-indigo-700" />
              <span>
                {regStatus === 'PAUSED'
                  ? 'Registration Paused'
                  : regStatus === 'CLOSED'
                  ? 'Registration Closed'
                  : Number(event.availableTickets) <= 0
                  ? 'Sold Out'
                  : 'Register Now'}
              </span>
            </button>

            {!user && (
              <p className="text-[11px] text-center text-[#64748B] font-medium">
                Sign in or register to complete your registration.
              </p>
            )}

          </div>
        </div>

      </div>

      {/* Invitation Code Required Modal */}
      <InvitationModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onContinue={handleInviteModalContinue}
        eventName={event.name}
      />

    </div>
  );
}
