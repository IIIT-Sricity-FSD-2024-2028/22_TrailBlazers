import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, MapPin, QrCode, Download, Eye, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import TicketModal from '../components/TicketModal';

import AttendeeFeedbackPanel from '../components/AttendeeFeedbackPanel';

export default function MyTickets({ user, onExplore }) {
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'feedback'
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  useEffect(() => {
    fetchMyTickets();
  }, [user]);

  const fetchMyTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ffsd_token');
      if (!token) return;

      const res = await fetch('/api/tickets/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Error loading user tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseEventDateTime = (dateStr, timeStr, defaultTime) => {
    if (!dateStr) return new Date();
    const rawTime = (timeStr || defaultTime || '00:00').trim();
    const isPM = /pm/i.test(rawTime);
    const isAM = /am/i.test(rawTime);
    const cleanTime = rawTime.replace(/(am|pm)/i, '').trim();
    const parts = cleanTime.split(':');
    let hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');

    const dt = new Date(`${dateStr}T${hoursStr}:${minutesStr}:00`);
    return isNaN(dt.getTime()) ? new Date(dateStr) : dt;
  };

  const now = new Date();

  // 1. UPCOMING: Event end date is in the future or active registration
  const upcomingTickets = tickets.filter(t => {
    const eventDate = t.eventDate || t.date;
    const endDate = parseEventDateTime(eventDate, t.endTime, '23:59');
    return now <= endDate;
  });

  // 2. ONGOING: Event is running today
  const ongoingTickets = tickets.filter(t => {
    const eventDate = t.eventDate || t.date;
    const startDate = parseEventDateTime(eventDate, t.startTime, '00:00');
    const endDate = parseEventDateTime(eventDate, t.endTime, '23:59');
    return now >= startDate && now <= endDate;
  });

  // 3. PAST: Event end date has passed
  const pastTickets = tickets.filter(t => {
    const eventDate = t.eventDate || t.date;
    const endDate = parseEventDateTime(eventDate, t.endTime, '23:59');
    return now > endDate;
  });

  const displayedTickets = 
    activeTab === 'upcoming' ? upcomingTickets :
    activeTab === 'ongoing' ? ongoingTickets :
    pastTickets;

  const handleOpenTicket = (tkt) => {
    setSelectedTicket(tkt);
    setIsTicketModalOpen(true);
  };

  const getTicketCardBg = (id) => {
    const bgs = [
      'bg-gradient-to-br from-[#DAF0FB]/80 via-white to-[#EBF6FD]/80 border-[#B5E1F7]',
      'bg-gradient-to-br from-[#FBE9F9]/80 via-white to-[#FAF0FA]/80 border-[#F6CFF3]',
      'bg-gradient-to-br from-[#E8F9F5]/80 via-white to-[#EEFAF7]/80 border-[#C7F3EA]',
    ];
    return bgs[Number(id || 1) % bgs.length];
  };

  return (
    <div className="space-y-8 pb-16 text-[#26334A]">
      
      {/* Header Banner matching reference */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#26334A] tracking-tight">My Tickets</h1>
          <p className="text-xs text-[#64748B] font-medium mt-1">Manage your tickets and registrations</p>
        </div>

        <button
          onClick={onExplore}
          className="px-5 py-2.5 rounded-2xl bg-[#26334A] text-white font-extrabold text-xs hover:bg-slate-800 transition shadow-xs"
        >
          Explore More Events
        </button>
      </div>

      {/* Tabs Switcher matching reference */}
      <div className="flex bg-white/70 p-1.5 rounded-2xl border border-white w-fit backdrop-blur-md shadow-2xs">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'upcoming' ? 'bg-white text-[#26334A] shadow-xs border border-white' : 'text-[#64748B] hover:text-[#26334A]'
          }`}
        >
          Upcoming ({upcomingTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('ongoing')}
          className={`px-5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'ongoing' ? 'bg-white text-indigo-700 shadow-xs border border-white' : 'text-[#64748B] hover:text-[#26334A]'
          }`}
        >
          Ongoing ({ongoingTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'past' ? 'bg-white text-[#26334A] shadow-xs border border-white' : 'text-[#64748B] hover:text-[#26334A]'
          }`}
        >
          Past Events ({pastTickets.length})
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'feedback' ? 'bg-white text-[#26334A] shadow-xs border border-white' : 'text-[#64748B] hover:text-[#26334A]'
          }`}
        >
          Event Feedback 💬
        </button>
      </div>

      {/* Rich Horizontal Ticket Cards or Feedback Panel */}
      {activeTab === 'feedback' ? (
        <AttendeeFeedbackPanel user={user} />
      ) : loading ? (
        <div className="p-12 text-center text-[#64748B] font-medium text-sm">
          Loading your ticket passes...
        </div>
      ) : displayedTickets.length > 0 ? (
        <div className="space-y-4">
          {displayedTickets.map((tkt) => (
            <div
              key={tkt.id}
              className={`rounded-3xl border p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs hover:shadow-md transition duration-300 backdrop-blur-md ${getTicketCardBg(tkt.id)}`}
            >
              {/* Event Image + Details */}
              <div className="flex items-center gap-5 w-full md:w-auto">
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-white">
                  <img
                    src={tkt.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
                    alt={tkt.eventName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl text-center shadow-xs border border-white">
                    <div className="text-xs font-black text-[#26334A] leading-none">
                      {tkt.eventDate ? tkt.eventDate.split('-')[2] || '25' : '25'}
                    </div>
                    <div className="text-[9px] font-extrabold text-indigo-700 uppercase leading-none mt-0.5">AUG</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
                    {tkt.organizationName}
                  </div>
                  <h3 className="text-lg font-extrabold text-[#26334A] line-clamp-1">{tkt.eventName}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{tkt.venue}, {tkt.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{tkt.eventDate} • {tkt.startTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white/90 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {tkt.ticketNumber}
                    </span>
                    <span className="font-semibold text-[#26334A]">{tkt.quantity} Pass(es)</span>
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200">
                <StatusBadge status={tkt.registrationStatus || 'CONFIRMED'} />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenTicket(tkt)}
                    className="py-2.5 px-4 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs transition border border-purple-200 shadow-2xs flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Ticket</span>
                  </button>

                  <button
                    onClick={() => handleOpenTicket(tkt)}
                    className="p-2.5 rounded-xl bg-white text-[#26334A] hover:bg-slate-50 transition border border-slate-200 shadow-2xs"
                    title="Download Ticket"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl glass-light border border-white space-y-4">
          <Ticket className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-[#26334A]">No {activeTab} tickets found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            You don't have any {activeTab} event registrations under this account.
          </p>
          <button
            onClick={onExplore}
            className="px-5 py-2.5 rounded-xl bg-[#26334A] text-white font-bold text-xs hover:bg-slate-800 transition"
          >
            Explore Available Events
          </button>
        </div>
      )}

      {/* Ticket Modal */}
      <TicketModal
        ticket={selectedTicket}
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
      />

    </div>
  );
}
