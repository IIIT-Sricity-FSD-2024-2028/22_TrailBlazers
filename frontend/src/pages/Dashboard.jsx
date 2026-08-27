import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, PlusCircle, ArrowRight, ShieldCheck, Clock, Layers, Sparkles, Building2, Heart, BarChart3, MapPin, Eye, Mail, Trash2, CheckCircle2, FileText, DollarSign, MessageSquare, Users, Radio, X, CheckSquare, Plus, HelpCircle } from 'lucide-react';
import EventCard from '../components/EventCard';
import { StatusBadge } from '../components/StatusBadge';
import QuotationViewModal from '../components/QuotationViewModal';
import ChangeRequestModal from '../components/ChangeRequestModal';
import TicketModal from '../components/TicketModal';

export default function Dashboard({ user, events = [], onNavigate, onSelectEvent, onVerifyEmailPrompt }) {
  const [myTickets, setMyTickets] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myChangeRequests, setMyChangeRequests] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [newInvEmail, setNewInvEmail] = useState('');
  const [newInvName, setNewInvName] = useState('');
  const [invSuccessMsg, setInvSuccessMsg] = useState('');
  const [invErrorMsg, setInvErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Ticket Modal State for Registered Event Cards
  const [selectedTicketForModal, setSelectedTicketForModal] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Quotation Modal State
  const [selectedQuotationReqId, setSelectedQuotationReqId] = useState(null);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

  // Change Request Modal State
  const [selectedChangeReq, setSelectedChangeReq] = useState(null);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  // Client Event Workspace Modal State
  const [selectedWorkspaceReq, setSelectedWorkspaceReq] = useState(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  // Session Poll Modal State
  const [activePollSession, setActivePollSession] = useState(null);
  const [sessionPolls, setSessionPolls] = useState([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['Very useful', 'Useful', 'Neutral', 'Not useful']);
  const [pollLoading, setPollLoading] = useState(false);
  const [pollFeedback, setPollFeedback] = useState('');

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  const fetchSessionPolls = async (eventId, sessionId) => {
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/events/${eventId}/sessions/${sessionId}/polls`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessionPolls(data.polls || []);
      }
    } catch (err) {
      console.error('Error fetching session polls:', err);
    }
  };

  const handleCreateSessionPoll = async (e) => {
    e.preventDefault();
    if (!selectedWorkspaceReq || !activePollSession) return;
    setPollLoading(true);
    setPollFeedback('');
    try {
      const token = localStorage.getItem('ffsd_token');
      const validOpts = pollOptions.map(o => o.trim()).filter(o => o.length > 0);
      if (validOpts.length < 2) {
        throw new Error('A poll requires at least 2 non-empty options.');
      }
      const res = await fetch('/api/events/polls/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: selectedWorkspaceReq.id,
          sessionId: activePollSession.id,
          questionText: pollQuestion,
          options: validOpts,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to create session poll.');

      setPollFeedback('✓ Session poll created and published successfully!');
      setPollQuestion('');
      fetchSessionPolls(selectedWorkspaceReq.id, activePollSession.id);
    } catch (err) {
      setPollFeedback(`✕ ${err.message}`);
    } finally {
      setPollLoading(false);
    }
  };


  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ffsd_token');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch user's tickets
      const resTickets = await fetch('/api/tickets/my', { headers });
      if (resTickets.ok) {
        const data = await resTickets.json();
        setMyTickets(data.tickets || []);
      }

      // Fetch user's event requests
      const resReqs = await fetch('/api/event-requests/my', { headers });
      if (resReqs.ok) {
        const data = await resReqs.json();
        setMyRequests(data.requests || []);
      }

      // Fetch user's change requests
      const resCR = await fetch('/api/change-requests/my', { headers });
      if (resCR.ok) {
        const data = await resCR.json();
        setMyChangeRequests(data.changeRequests || []);
      }

      // Fetch invitations for private event
      const resInvs = await fetch('/api/invitations/event/evt-4', { headers });
      if (resInvs.ok) {
        const data = await resInvs.json();
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (e) => {
    e.preventDefault();
    setInvSuccessMsg('');
    setInvErrorMsg('');
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: 'evt-4',
          recipientEmail: newInvEmail,
          recipientName: newInvName,
          expiresInDays: 7
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue invitation.');

      setInvSuccessMsg(`Invitation issued! Code: ${data.invitation.inviteCode} | Token: ${data.invitation.invitationToken}`);
      setNewInvEmail('');
      setNewInvName('');
      fetchDashboardData();
    } catch (err) {
      setInvErrorMsg(err.message);
    }
  };

  const handleRevokeInvitation = async (invId) => {
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/invitations/${invId}/revoke`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error revoking invitation:', err);
    }
  };

  const upcomingTickets = myTickets.filter(t => t.eventDate >= new Date().toISOString().split('T')[0]);
  const primaryUpcomingTicket = upcomingTickets[0] || myTickets[0];

  return (
    <div className="space-y-10 pb-20 text-[#26334A]">
      
      {/* 1. TOP WELCOME HEADER MATCHING REFERENCE IMAGE ("Welcome back, Vipul! 👋") */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#26334A] tracking-tight flex items-center gap-2">
            <span>Welcome back, {firstName}!</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-1">
            Here's what's happening with your events.
          </p>
        </div>

        {/* Profile Pill */}
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5] text-[#26334A] font-extrabold flex items-center justify-center text-xs border border-white">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-extrabold text-[#26334A]">{user?.name}</div>
            <div className="text-[10px] text-[#64748B] font-medium">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* 2. FOUR METRIC CARDS TOP ROW MATCHING REFERENCE IMAGE */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Upcoming Events */}
        <div className="p-5 rounded-3xl glass-light border border-white shadow-xs flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#26334A]">{upcomingTickets.length}</div>
            <div className="text-xs text-[#64748B] font-semibold">Upcoming Events</div>
          </div>
        </div>

        {/* Metric 2: Tickets */}
        <div className="p-5 rounded-3xl glass-light border border-white shadow-xs flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#26334A]">{myTickets.length}</div>
            <div className="text-xs text-[#64748B] font-semibold">Total Tickets</div>
          </div>
        </div>

        {/* Metric 3: Saved Events */}
        <div className="p-5 rounded-3xl glass-light border border-white shadow-xs flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#26334A]">{myTickets.filter(t => !t.checkedIn).length}</div>
            <div className="text-xs text-[#64748B] font-semibold">Pending Check-in</div>
          </div>
        </div>

        {/* Metric 4: Events Attended */}
        <div className="p-5 rounded-3xl glass-light border border-white shadow-xs flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#26334A]">{myTickets.filter(t => t.checkedIn === 1 || t.checkedIn === true).length}</div>
            <div className="text-xs text-[#64748B] font-semibold">Events Attended</div>
          </div>
        </div>

      </section>

      {/* 3. YOUR REGISTERED EVENT PASSES CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#26334A]">Your Registered Event Passes</h3>
          {myTickets.length > 0 && (
            <button 
              onClick={() => onNavigate('my-tickets')}
              className="text-xs font-extrabold text-indigo-700 hover:underline"
            >
              View All ({myTickets.length})
            </button>
          )}
        </div>

        {myTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTickets.map((t) => (
              <div 
                key={t.id || t.ticketNumber}
                onClick={() => {
                  setSelectedTicketForModal(t);
                  setIsTicketModalOpen(true);
                }}
                className="p-5 rounded-3xl glass-light border border-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5 hover:shadow-md transition cursor-pointer group"
              >
                
                {/* Event Thumbnail with Date Badge */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-white">
                    <img
                      src={t.bannerUrl || events[0]?.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
                      alt="Event Banner"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-1.5 left-1.5 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg text-center shadow-xs border border-white">
                      <div className="text-xs font-black text-[#26334A] leading-none">
                        {t.eventDate ? t.eventDate.split('-')[2] || '25' : '25'}
                      </div>
                      <div className="text-[8px] font-extrabold text-indigo-700 uppercase leading-none mt-0.5">
                        {t.eventDate ? new Date(t.eventDate).toLocaleString('default', { month: 'short' }).toUpperCase() : 'AUG'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-[#26334A] line-clamp-1 group-hover:text-indigo-700 transition">
                      {t.eventName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate max-w-[180px]">{t.venue || 'Chennai Trade Centre'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{t.startTime || '09:00 AM'} - {t.endTime || '05:00 PM'}</span>
                    </div>
                  </div>
                </div>

                {/* Status & View Ticket Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                  <StatusBadge status={t.registrationStatus || 'CONFIRMED'} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTicketForModal(t);
                      setIsTicketModalOpen(true);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs transition border border-purple-200 shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Ticket className="w-3.5 h-3.5 text-purple-700" />
                    <span>View Ticket</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl glass-light border border-white text-center space-y-3">
            <Ticket className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-base font-extrabold text-[#26334A]">No Registered Event Passes</h4>
            <p className="text-xs text-[#64748B] font-medium">You haven't registered for any events yet.</p>
            <button
              onClick={() => onNavigate('explore')}
              className="px-5 py-2.5 rounded-xl bg-[#26334A] text-white text-xs font-extrabold hover:bg-slate-800 transition shadow-xs"
            >
              Explore Events
            </button>
          </div>
        )}
      </section>

      {/* 4. QUICK ACTIONS SECTION MATCHING REFERENCE IMAGE */}
      <section className="space-y-4">
        <h3 className="text-base font-extrabold text-[#26334A]">Quick Actions</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Explore Events (Blue Tint) */}
          <div 
            onClick={() => onNavigate('explore')}
            className="p-6 rounded-3xl bg-gradient-to-br from-white/90 via-[#DAF0FB] to-[#EBF6FD] border border-white shadow-xs hover:shadow-md hover:-translate-y-1 transition duration-300 cursor-pointer space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-xs border border-white">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-[#26334A]">Explore Events</h4>
              <p className="text-xs text-[#64748B] font-medium">Discover and register for amazing events</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-700 pt-1">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: My Tickets (Mint Tint) */}
          <div 
            onClick={() => onNavigate('my-tickets')}
            className="p-6 rounded-3xl bg-gradient-to-br from-white/90 via-[#E8F9F5] to-[#EEFAF7] border border-white shadow-xs hover:shadow-md hover:-translate-y-1 transition duration-300 cursor-pointer space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-xs border border-white">
              <Ticket className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-[#26334A]">My Tickets</h4>
              <p className="text-xs text-[#64748B] font-medium">View and manage your event tickets</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 pt-1">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Create Event (Pink Tint) */}
          <div 
            onClick={() => onNavigate('create-event')}
            className="p-6 rounded-3xl bg-gradient-to-br from-white/90 via-[#FBE9F9] to-[#FAF0FA] border border-white shadow-xs hover:shadow-md hover:-translate-y-1 transition duration-300 cursor-pointer space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-white text-pink-600 flex items-center justify-center shadow-xs border border-white">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-[#26334A]">Create Event</h4>
              <p className="text-xs text-[#64748B] font-medium">Bring your event idea to life</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-pink-700 pt-1">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

        </div>
      </section>

      {/* 5. PRIVATE EVENT INVITATION SECURITY MANAGEMENT PANEL */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#26334A] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span>Private Event Invitation Management</span>
          </h3>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            {invitations.length} Issued Invitations
          </span>
        </div>

        <div className="p-6 rounded-3xl glass-light border border-white shadow-sm space-y-6">
          
          {/* Issue New Invitation Form */}
          <form onSubmit={handleCreateInvitation} className="space-y-3 p-4 rounded-2xl bg-white/70 border border-slate-200/80">
            <div className="text-xs font-extrabold text-[#26334A] flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Issue Recipient-Bound Invitation (Private Event: Private Executive Leadership Roundtable)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="email"
                required
                value={newInvEmail}
                onChange={(e) => setNewInvEmail(e.target.value)}
                placeholder="Recipient Email (e.g. attendee@company.com)"
                className="px-3.5 py-2 glass-input-light rounded-xl text-xs font-medium focus:border-indigo-400"
              />
              <input
                type="text"
                value={newInvName}
                onChange={(e) => setNewInvName(e.target.value)}
                placeholder="Recipient Name (Optional)"
                className="px-3.5 py-2 glass-input-light rounded-xl text-xs font-medium focus:border-indigo-400"
              />
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Issue Invitation Token</span>
              </button>
            </div>

            {invSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold break-all">
                ✓ {invSuccessMsg}
              </div>
            )}
            {invErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                ✕ {invErrorMsg}
              </div>
            )}
          </form>

          {/* Invitation Tracking Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#64748B] font-extrabold uppercase tracking-wider">
                  <th className="pb-3 px-2">Recipient Email</th>
                  <th className="pb-3 px-2">Invite Code</th>
                  <th className="pb-3 px-2">Token</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Expires At</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-[#26334A]">
                {invitations.map((inv) => {
                  const statusColors = {
                    pending: 'bg-amber-100 text-amber-900 border-amber-200',
                    accepted: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                    revoked: 'bg-rose-100 text-rose-900 border-rose-200',
                    expired: 'bg-slate-100 text-slate-700 border-slate-200'
                  };
                  return (
                    <tr key={inv.id} className="hover:bg-white/50 transition">
                      <td className="py-3 px-2 font-bold">{inv.recipientEmail}</td>
                      <td className="py-3 px-2 font-mono font-bold text-indigo-700">{inv.inviteCode}</td>
                      <td className="py-3 px-2 font-mono text-[11px] text-slate-500 max-w-[140px] truncate" title={inv.invitationToken}>
                        {inv.invitationToken}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${statusColors[inv.status] || 'bg-slate-100'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-500 text-[11px]">{inv.expiresAt}</td>
                      <td className="py-3 px-2 text-right">
                        {inv.status === 'pending' && (
                          <button
                            onClick={() => handleRevokeInvitation(inv.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-[11px] transition border border-rose-200 flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* 6. CLIENT COMMERCIAL PROPOSALS & QUOTATIONS SECTION */}
      {myRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#26334A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Commercial Proposals & Quotations</span>
            </h3>
            <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              {myRequests.length} Event Requests
            </span>
          </div>

          <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
            <div className="grid grid-cols-1 gap-6">
              {myRequests.map((req) => {
                const isQuotationSent = req.quotationStatus === 'SENT' || req.status === 'COMMERCIAL_APPROVED' || req.status === 'ACCEPTED';
                const isQuotationAccepted = req.status === 'COMMERCIAL_APPROVED' || req.status === 'ACCEPTED';
                const isManagerAssigned = Boolean(req.eventManagerUserId || req.eventManagerName);
                const isCoordinatorAssigned = Boolean(req.onsiteCoordinatorUserId || req.onsiteCoordinatorName);
                const isOperational = req.operationalStatus === 'READY' || req.operationalStatus === 'LIVE' || req.operationalStatus === 'COMPLETED';

                return (
                  <div key={req.id} className="p-5 rounded-3xl bg-white/90 border border-slate-200/80 shadow-xs space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-extrabold text-[#26334A] text-base">{req.eventName}</h4>
                        <p className="text-xs text-[#64748B] font-medium">{req.organizationName} • {req.eventDate} • {req.venue}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={req.operationalStatus || req.status} />
                        <button
                          onClick={() => {
                            setSelectedWorkspaceReq(req);
                            setIsWorkspaceOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Event Workspace</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedQuotationReqId(req.id);
                            setIsQuotationModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review Quotation</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedChangeReq(req);
                            setIsChangeModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Request Change</span>
                        </button>
                      </div>
                    </div>

                    {/* Grid: Event Team & Recent Activity Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      
                      {/* Event Team Box */}
                      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                        <div className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>ASSIGNED EVENT TEAM</span>
                        </div>
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 border border-white">
                            <span className="font-semibold text-slate-600">Event Manager:</span>
                            <span className={`font-extrabold ${req.eventManagerName ? 'text-purple-900' : 'text-slate-400 font-normal italic'}`}>
                              {req.eventManagerName || 'Pending Assignment'} {req.eventManagerEmail ? `(${req.eventManagerEmail})` : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 border border-white">
                            <span className="font-semibold text-slate-600">Onsite Coordinator:</span>
                            <span className={`font-extrabold ${req.onsiteCoordinatorName ? 'text-teal-900' : 'text-slate-400 font-normal italic'}`}>
                              {req.onsiteCoordinatorName || 'Pending Assignment'} {req.onsiteCoordinatorEmail ? `(${req.onsiteCoordinatorEmail})` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity Timeline Box */}
                      <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
                        <div className="font-extrabold text-purple-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-purple-600" />
                          <span>EVENT PROGRESS TIMELINE</span>
                        </div>
                        <div className="space-y-1 text-[11px] font-semibold">
                          <div className="flex items-center gap-2 text-emerald-800 font-bold">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] shrink-0">✓</span>
                            <span>Event Request Submitted</span>
                          </div>
                          <div className={`flex items-center gap-2 ${isQuotationSent ? 'text-emerald-800 font-bold' : 'text-slate-400'}`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${isQuotationSent ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-400'}`}>
                              {isQuotationSent ? '✓' : '○'}
                            </span>
                            <span>Commercial Quotation Prepared</span>
                          </div>
                          <div className={`flex items-center gap-2 ${isQuotationAccepted ? 'text-emerald-800 font-bold' : 'text-slate-400'}`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${isQuotationAccepted ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-400'}`}>
                              {isQuotationAccepted ? '✓' : '○'}
                            </span>
                            <span>Quotation Accepted & Approved</span>
                          </div>
                          <div className={`flex items-center gap-2 ${isManagerAssigned ? 'text-emerald-800 font-bold' : 'text-slate-400'}`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${isManagerAssigned ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-400'}`}>
                              {isManagerAssigned ? '✓' : '○'}
                            </span>
                            <span>Event Manager Assigned</span>
                          </div>
                          <div className={`flex items-center gap-2 ${isCoordinatorAssigned ? 'text-emerald-800 font-bold' : 'text-slate-400'}`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${isCoordinatorAssigned ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-400'}`}>
                              {isCoordinatorAssigned ? '✓' : '○'}
                            </span>
                            <span>Onsite Coordinator Assigned</span>
                          </div>
                          <div className={`flex items-center gap-2 ${isOperational ? 'text-emerald-800 font-bold' : 'text-slate-400'}`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${isOperational ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-400'}`}>
                              {isOperational ? '✓' : '○'}
                            </span>
                            <span>Event Execution Ready / Live</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Submitted Change Requests Section for this event */}
                    {myChangeRequests.filter(cr => cr.eventRequestId === req.id).length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                          <span>Submitted Change Requests ({myChangeRequests.filter(cr => cr.eventRequestId === req.id).length})</span>
                        </div>
                        <div className="space-y-2">
                          {myChangeRequests.filter(cr => cr.eventRequestId === req.id).map(cr => {
                            const statusBadges = {
                              PENDING: 'bg-amber-100 text-amber-900 border-amber-200',
                              APPROVED: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                              REJECTED: 'bg-rose-100 text-rose-900 border-rose-200'
                            };
                            return (
                              <div key={cr.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-slate-900">{cr.changeType}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadges[cr.status] || 'bg-slate-100'}`}>
                                    {cr.status}
                                  </span>
                                </div>
                                <p className="text-slate-700 font-medium"><strong className="text-slate-900">Requested:</strong> {cr.requestedChange}</p>
                                {cr.reason && <p className="text-slate-500 text-[11px]"><strong>Reason:</strong> {cr.reason}</p>}
                                {cr.reviewComment && (
                                  <div className="mt-1 p-2 rounded-xl bg-white border border-slate-200 text-purple-900 font-semibold text-[11px]">
                                    💬 <strong>Event Manager Comment:</strong> {cr.reviewComment}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CLIENT EVENT WORKSPACE MODAL */}
      {isWorkspaceOpen && selectedWorkspaceReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-modal-light rounded-3xl p-6 sm:p-8 border border-white shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-900 border border-indigo-200">
                    Client Event Workspace
                  </span>
                  <StatusBadge status={selectedWorkspaceReq.operationalStatus || selectedWorkspaceReq.status} />
                </div>
                <h2 className="text-2xl font-extrabold text-[#26334A] mt-2">
                  {selectedWorkspaceReq.eventName}
                </h2>
                <p className="text-xs text-[#64748B] font-medium">
                  {selectedWorkspaceReq.organizationName} • {selectedWorkspaceReq.category}
                </p>
              </div>

              <button
                onClick={() => setIsWorkspaceOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION A: EVENT INFORMATION */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>A. Event Details & Profile</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Date & Time</span>
                  <span className="font-extrabold text-[#26334A]">{selectedWorkspaceReq.eventDate}</span>
                  <span className="text-[11px] text-slate-500 block">{selectedWorkspaceReq.startTime} - {selectedWorkspaceReq.endTime}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Venue & Location</span>
                  <span className="font-extrabold text-[#26334A]">{selectedWorkspaceReq.venue}</span>
                  <span className="text-[11px] text-slate-500 block">{selectedWorkspaceReq.location}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Expected Capacity</span>
                  <span className="font-extrabold text-[#26334A]">{selectedWorkspaceReq.expectedAttendance} Attendees</span>
                  <span className="text-[11px] text-slate-500 block">{selectedWorkspaceReq.eventType}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Commercial Status</span>
                  <span className="font-extrabold text-indigo-700">{selectedWorkspaceReq.status}</span>
                  <span className="text-[11px] text-slate-500 block">Quotation: {selectedWorkspaceReq.quotationStatus || 'FINALIZED'}</span>
                </div>
              </div>
              {selectedWorkspaceReq.description && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-[#26334A]">
                  <strong className="font-extrabold">Description:</strong> {selectedWorkspaceReq.description}
                </div>
              )}
            </div>

            {/* SECTION B: EVENT TEAM */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-extrabold text-purple-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>B. Assigned Operations Team</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                  <div className="font-extrabold text-purple-950 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-purple-700" />
                    <span>Event Manager</span>
                  </div>
                  <div className="font-bold text-[#26334A]">
                    {selectedWorkspaceReq.eventManagerName || 'Pending Assignment'}
                  </div>
                  {selectedWorkspaceReq.eventManagerEmail && (
                    <div className="text-[11px] text-purple-800 font-medium">
                      Email: {selectedWorkspaceReq.eventManagerEmail}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-1">
                  <div className="font-extrabold text-teal-950 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-teal-700" />
                    <span>Onsite Coordinator</span>
                  </div>
                  <div className="font-bold text-[#26334A]">
                    {selectedWorkspaceReq.onsiteCoordinatorName || 'Pending Assignment'}
                  </div>
                  {selectedWorkspaceReq.onsiteCoordinatorEmail && (
                    <div className="text-[11px] text-teal-800 font-medium">
                      Email: {selectedWorkspaceReq.onsiteCoordinatorEmail}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION C: EVENT AGENDA & SESSIONS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>C. Event Agenda & Sessions</span>
                </h3>
              </div>

              {/* Sessions list */}
              {(() => {
                const sessionsList = (selectedWorkspaceReq.sessions && selectedWorkspaceReq.sessions.length > 0)
                  ? selectedWorkspaceReq.sessions
                  : [
                      {
                        id: `sess_default_1_${selectedWorkspaceReq.id}`,
                        title: `${selectedWorkspaceReq.eventName} — Opening Keynote & Workshop`,
                        hall: selectedWorkspaceReq.venue || 'Main Auditorium',
                        startTime: selectedWorkspaceReq.startTime || '09:00 AM',
                        endTime: selectedWorkspaceReq.endTime || '12:00 PM',
                        speakerName: 'Lead Keynote Speaker',
                        status: 'SCHEDULED',
                      },
                      {
                        id: `sess_default_2_${selectedWorkspaceReq.id}`,
                        title: `${selectedWorkspaceReq.eventName} — Technical Deep Dive & Interactive Q&A`,
                        hall: 'Seminar Hall B',
                        startTime: '01:30 PM',
                        endTime: '05:00 PM',
                        speakerName: 'Industry Panel Speaker',
                        status: 'SCHEDULED',
                      }
                    ];

                return (
                  <div className="space-y-3">
                    {sessionsList.map((sess, idx) => (
                      <div key={sess.id || idx} className="p-4 rounded-2xl bg-white/90 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-purple-100 text-purple-900">
                              SESSION #{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-500">{sess.startTime} - {sess.endTime}</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-900 uppercase">
                              {sess.status || 'SCHEDULED'}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-[#26334A]">{sess.title}</h4>
                          <p className="text-xs text-[#64748B] font-medium">
                            📍 {sess.hall || sess.venue || 'Main Hall'} • 🎤 Speaker: {sess.speakerName || sess.speaker || 'Assigned Expert'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setActivePollSession(sess);
                              fetchSessionPolls(selectedWorkspaceReq.id, sess.id);
                              setPollFeedback('');
                            }}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Session Polls</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer Close */}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsWorkspaceOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-extrabold text-xs hover:bg-slate-300 transition"
              >
                Close Workspace
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SESSION POLL CREATION & RESULTS MODAL */}
      {activePollSession && selectedWorkspaceReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-modal-light rounded-3xl p-6 sm:p-8 border border-white shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-900 border border-purple-200">
                  Session Poll Management
                </span>
                <h3 className="text-xl font-extrabold text-[#26334A] mt-1">
                  {activePollSession.title}
                </h3>
                <p className="text-xs text-[#64748B] font-medium">
                  Event: {selectedWorkspaceReq.eventName}
                </p>
              </div>

              <button
                onClick={() => setActivePollSession(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pollFeedback && (
              <div className={`p-3.5 rounded-2xl text-xs font-extrabold ${pollFeedback.startsWith('✓') ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
                {pollFeedback}
              </div>
            )}

            {/* Existing Polls List & Results */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Active & Past Polls for this Session ({sessionPolls.length})
              </h4>

              {sessionPolls.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-50 border border-slate-200">
                  No polls created for this session yet. Create a poll below.
                </p>
              ) : (
                <div className="space-y-3">
                  {sessionPolls.map((poll) => (
                    <div key={poll.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#26334A] text-xs">{poll.questionText}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-900">
                          {poll.status || 'LAUNCHED'} • {poll.totalResponses || 0} Votes
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {poll.options && poll.options.map((opt) => (
                          <div key={opt.id} className="space-y-0.5">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                              <span>{opt.optionText}</span>
                              <span>{opt.count || 0} votes ({opt.percentage || 0}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${opt.percentage || 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CREATE POLL FORM */}
            <form onSubmit={handleCreateSessionPoll} className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-4">
              <h4 className="text-xs font-extrabold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-purple-700" />
                <span>Create New Session Poll</span>
              </h4>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-purple-900 block">Poll Question *</label>
                <input
                  type="text"
                  required
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="e.g. How useful was this session?"
                  className="w-full p-2.5 glass-input-light rounded-xl text-xs font-medium focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-purple-900 block">Poll Option Choices (Min 2) *</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-purple-700 w-16">Option {idx + 1}:</span>
                    <input
                      type="text"
                      required={idx < 2}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...pollOptions];
                        updated[idx] = e.target.value;
                        setPollOptions(updated);
                      }}
                      placeholder={`Enter option choice ${idx + 1}`}
                      className="flex-1 p-2 glass-input-light rounded-xl text-xs font-medium"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={pollLoading}
                className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {pollLoading ? 'Publishing Poll...' : 'Publish Session Poll'}
              </button>
            </form>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActivePollSession(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 text-slate-700 font-extrabold text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Client Quotation Review Modal */}
      <QuotationViewModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        eventRequestId={selectedQuotationReqId}
        onQuotationUpdated={() => fetchDashboardData()}
      />

      {/* Client Request Change Modal */}
      <ChangeRequestModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        eventRequest={selectedChangeReq}
        onRequestSubmitted={() => fetchDashboardData()}
      />

      {/* Ticket Modal for Registered Event Pass Popup */}
      <TicketModal
        ticket={selectedTicketForModal}
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
      />

      {/* 7. RECOMMENDED FOR YOU CAROUSEL MATCHING REFERENCE IMAGE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#26334A]">Recommended for You</h3>
          <button onClick={() => onNavigate('explore')} className="text-xs font-extrabold text-indigo-700 hover:underline">
            See All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.slice(0, 3).map((evt) => (
            <EventCard key={evt.id} event={evt} onSelect={onSelectEvent} />
          ))}
        </div>
      </section>

    </div>
  );
}

