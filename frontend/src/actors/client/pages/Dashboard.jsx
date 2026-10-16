import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Ticket, Calendar, PlusCircle, ArrowRight, ShieldCheck, Clock, Layers, Sparkles, Building2, Heart, BarChart3, MapPin, Eye, Mail, Trash2, CheckCircle2, FileText, DollarSign, MessageSquare, Users, Radio, X, CheckSquare, Plus, HelpCircle, UserCheck, RefreshCw, Download, AlertCircle } from 'lucide-react';
import EventCard from '../../../shared/components/EventCard';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import QuotationViewModal from '../components/QuotationViewModal';
import ChangeRequestModal from '../components/ChangeRequestModal';
import TicketModal from '../../attendee/components/TicketModal';

export default function Dashboard({ user, events = [], onNavigate, onSelectEvent, onVerifyEmailPrompt }) {
  const [myTickets, setMyTickets] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myChangeRequests, setMyChangeRequests] = useState([]);
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

  // Live Event Statistics State (Tickets Sold & Check-ins)
  const [selectedStats, setSelectedStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const fetchEventStats = async (eventId) => {
    if (!eventId) return;
    setStatsLoading(true);
    setStatsError('');
    setSelectedStats(null); // Clear previous event stats immediately to prevent stale cross-event display
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/event-requests/${eventId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to load event statistics');
      }
      const data = await res.json();
      if (selectedWorkspaceReq?.id === eventId) {
        setSelectedStats(data);
      }
    } catch (err) {
      setStatsError(err.message || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Event Analytics Report Status State
  const [reportStatus, setReportStatus] = useState(null);
  const [reportStatusLoading, setReportStatusLoading] = useState(false);

  const fetchReportStatus = async (eventId) => {
    if (!eventId) return;
    setReportStatusLoading(true);
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/event-requests/${eventId}/report-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReportStatus(data);
      } else {
        setReportStatus(null);
      }
    } catch (err) {
      console.error('Failed to fetch report status', err);
      setReportStatus(null);
    } finally {
      setReportStatusLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWorkspaceReq && isWorkspaceOpen) {
      document.body.style.overflow = 'hidden';
      fetchEventStats(selectedWorkspaceReq.id);
      fetchReportStatus(selectedWorkspaceReq.id);
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setIsWorkspaceOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        const activeModals = document.querySelectorAll('[data-wavevents-modal="true"]');
        if (activeModals.length <= 1) {
          document.body.style.overflow = '';
        }
      };
    } else {
      setSelectedStats(null);
      setStatsError('');
      setReportStatus(null);
    }
    setExportLoading(false);
    setExportError('');
    setExportSuccess('');
  }, [selectedWorkspaceReq?.id, isWorkspaceOpen]);

  // Event Analytics Export State
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState('');

  const handleExportAnalytics = async (eventId, eventName) => {
    if (!eventId || exportLoading) return;
    setExportLoading(true);
    setExportError('');
    setExportSuccess('');

    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/event-requests/${eventId}/export-analytics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        let errMsg = 'Failed to export event analytics report';
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch {
          // not json
        }
        throw new Error(errMsg);
      }

      const disposition = res.headers.get('Content-Disposition') || '';
      let filename = '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      } else {
        const cleanName = (eventName || 'Event')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        filename = `Wavevents_Event_Analytics_${cleanName}_${eventId}.pdf`;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess(`Analytics report downloaded successfully: ${filename}`);
      setTimeout(() => setExportSuccess(''), 6000);
    } catch (err) {
      setExportError(err.message || 'Error downloading analytics report');
    } finally {
      setExportLoading(false);
    }
  };

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
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
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

      {/* 5. CLIENT COMMERCIAL PROPOSALS & QUOTATIONS SECTION */}
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
                        <p className="text-xs text-[#64748B] font-medium">
                          {req.organizationName} • {req.startDate && req.endDate && req.startDate !== req.endDate ? `${req.startDate} to ${req.endDate}` : (req.startDate || req.eventDate)} • {req.venue}
                        </p>
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
                      
                      {/* Event Team & Attendance Statistics Box */}
                      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                        <div className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>ASSIGNED EVENT TEAM & ATTENDANCE</span>
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

                          {/* Tickets Sold & Check-ins Statistics */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-100">
                            <div className="flex items-center justify-between p-2 rounded-xl bg-white/90 border border-white shadow-2xs">
                              <span className="font-semibold text-slate-600 flex items-center gap-1">
                                <Ticket className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Tickets Sold:</span>
                              </span>
                              <span className="font-extrabold text-indigo-900 text-sm">
                                {req.ticketsSold != null ? req.ticketsSold.toLocaleString() : '0'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-xl bg-white/90 border border-white shadow-2xs">
                              <span className="font-semibold text-slate-600 flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Attendee Check-ins:</span>
                              </span>
                              <span className="font-extrabold text-emerald-900 text-sm">
                                {req.attendeeCheckIns != null ? req.attendeeCheckIns.toLocaleString() : '0'}
                              </span>
                            </div>
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
      {isWorkspaceOpen && selectedWorkspaceReq && typeof document !== 'undefined' && createPortal(
        <div
          data-wavevents-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsWorkspaceOpen(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden text-[#26334A]">
            
            {/* Top Brand Gradient Ribbon */}
            <div className="h-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 shrink-0" />

            {/* Close Button */}
            <button
              onClick={() => setIsWorkspaceOpen(false)}
              aria-label="Close Workspace Modal"
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Modal Body */}
            <div className="p-5 sm:p-7 md:p-8 overflow-y-auto space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-600" />
                      Client Event Workspace
                    </span>
                    <StatusBadge status={selectedWorkspaceReq.operationalStatus || selectedWorkspaceReq.status} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedWorkspaceReq.eventName}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedWorkspaceReq.organizationName} • {selectedWorkspaceReq.category}
                  </p>
                </div>
              </div>

              {/* SECTION A: EVENT INFORMATION */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>A. Event Details & Profile</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Date & Time</span>
                    <span className="font-extrabold text-slate-900 block">
                      {selectedWorkspaceReq.startDate && selectedWorkspaceReq.endDate && selectedWorkspaceReq.startDate !== selectedWorkspaceReq.endDate
                        ? `${selectedWorkspaceReq.startDate} to ${selectedWorkspaceReq.endDate}`
                        : (selectedWorkspaceReq.startDate || selectedWorkspaceReq.eventDate)}
                    </span>
                    <span className="text-[11px] text-slate-500 block">{selectedWorkspaceReq.startTime} - {selectedWorkspaceReq.endTime}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Venue & Location</span>
                    <span className="font-extrabold text-slate-900 block truncate">{selectedWorkspaceReq.venue}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{selectedWorkspaceReq.location}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Expected Capacity</span>
                    <span className="font-extrabold text-slate-900 block">{selectedWorkspaceReq.expectedAttendance} Attendees</span>
                    <span className="text-[11px] text-slate-500 block">{selectedWorkspaceReq.eventType}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Commercial Status</span>
                    <span className="font-extrabold text-indigo-700 block">{selectedWorkspaceReq.status}</span>
                    <span className="text-[11px] text-slate-500 block">Quotation: {selectedWorkspaceReq.quotationStatus || 'FINALIZED'}</span>
                  </div>
                </div>
                {selectedWorkspaceReq.description && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-800">
                    <strong className="font-black text-indigo-950">Description: </strong>
                    <span className="font-medium text-slate-700">{selectedWorkspaceReq.description}</span>
                  </div>
                )}
              </div>

              {/* SECTION B: EVENT TEAM */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>B. Assigned Operations Team</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1.5">
                    <div className="font-black text-purple-950 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-700" />
                      <span>Event Manager</span>
                    </div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {selectedWorkspaceReq.eventManagerName || 'Pending Assignment'}
                    </div>
                    {selectedWorkspaceReq.eventManagerEmail ? (
                      <div className="text-[11px] text-purple-800 font-medium font-mono">
                        {selectedWorkspaceReq.eventManagerEmail}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 font-medium">Assigned upon quotation approval</div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-1.5">
                    <div className="font-black text-teal-950 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-teal-700" />
                      <span>Onsite Coordinator</span>
                    </div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {selectedWorkspaceReq.onsiteCoordinatorName || 'Pending Assignment'}
                    </div>
                    {selectedWorkspaceReq.onsiteCoordinatorEmail ? (
                      <div className="text-[11px] text-teal-800 font-medium font-mono">
                        {selectedWorkspaceReq.onsiteCoordinatorEmail}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 font-medium">Assigned prior to event execution</div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION C: LIVE ATTENDANCE & TICKETING METRICS */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>C. Real-Time Ticketing & Attendance</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      fetchEventStats(selectedWorkspaceReq.id);
                      fetchReportStatus(selectedWorkspaceReq.id);
                    }}
                    disabled={statsLoading || reportStatusLoading}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${statsLoading || reportStatusLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh Metrics</span>
                  </button>
                </div>

                {statsError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                    <span>⚠️ {statsError}</span>
                    <button
                      type="button"
                      onClick={() => fetchEventStats(selectedWorkspaceReq.id)}
                      className="font-bold underline cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider">Tickets Sold</span>
                      <Ticket className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-black text-indigo-950">
                      {statsLoading ? (
                        <span className="text-slate-400 text-base font-normal animate-pulse">Loading...</span>
                      ) : (
                        (selectedStats?.ticketsSold != null ? selectedStats.ticketsSold : (selectedWorkspaceReq.ticketsSold ?? 0)).toLocaleString()
                      )}
                    </div>
                    <div className="text-[11px] text-indigo-700 font-medium">
                      Confirmed tickets issued
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider">Checked In</span>
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-emerald-950">
                      {statsLoading ? (
                        <span className="text-slate-400 text-base font-normal animate-pulse">Loading...</span>
                      ) : (
                        (selectedStats?.attendeeCheckIns != null ? selectedStats.attendeeCheckIns : (selectedWorkspaceReq.attendeeCheckIns ?? 0)).toLocaleString()
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      Verified onsite arrivals
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-purple-900 uppercase tracking-wider">Attendance Rate</span>
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-black text-purple-950">
                      {(() => {
                        const t = selectedStats?.ticketsSold ?? selectedWorkspaceReq.ticketsSold ?? 0;
                        const c = selectedStats?.attendeeCheckIns ?? selectedWorkspaceReq.attendeeCheckIns ?? 0;
                        return t > 0 ? `${((c / t) * 100).toFixed(1)}%` : '0.0%';
                      })()}
                    </div>
                    <div className="text-[11px] text-purple-700 font-medium">
                      Onsite turnout percentage
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION D: EXECUTIVE ANALYTICS REPORT (COMPLETION-BASED EXPORT) */}
              {(() => {
                const isCompleted = reportStatus?.isCompleted ?? (
                  selectedWorkspaceReq.operationalStatus === 'COMPLETED' ||
                  selectedWorkspaceReq.status === 'COMPLETED'
                );
                const reportExists = Boolean(reportStatus?.reportExists);
                const reportData = reportStatus?.report;

                return (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>D. Executive Analytics Report</span>
                    </h3>

                    <div className="p-4 sm:p-5 rounded-2xl border bg-slate-50/80 border-slate-200/90 space-y-3">
                      {/* Case A: Event Not Completed */}
                      {!isCompleted ? (
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900">
                            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-xs block">Analytics Report Available Post-Completion</span>
                              <p className="text-xs text-amber-800">
                                The analytics report will be available after the event is completed.
                              </p>
                              <p className="text-[11px] text-amber-700">
                                Current operational status: <strong>{selectedWorkspaceReq.operationalStatus || selectedWorkspaceReq.status || 'IN_PROGRESS'}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                            <div className="text-xs text-slate-500 font-medium">
                              Official post-event performance, attendance rates, and revenue audit require final event completion.
                            </div>
                            <button
                              type="button"
                              disabled
                              title="The analytics report will be available after the event is completed."
                              className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Export Analytics PDF</span>
                            </button>
                          </div>
                        </div>
                      ) : !reportExists ? (
                        /* Case B: Event Completed, But Report Not Yet Generated */
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 text-sky-900">
                            <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-xs block">Event Completed — Awaiting Event Manager Report</span>
                              <p className="text-xs text-sky-800">
                                The event is completed. The Event Manager's analytics report is not available yet.
                              </p>
                              <p className="text-[11px] text-sky-700">
                                The assigned Event Manager ({selectedWorkspaceReq.eventManagerName || 'Operations Team'}) is preparing the formal audit report.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                            <div className="text-xs text-slate-500 font-medium">
                              Report compilation in progress. Please check back shortly or refresh status.
                            </div>
                            <button
                              type="button"
                              disabled
                              title="The Event Manager's analytics report is not available yet."
                              className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed shrink-0"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Report Pending Review</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Case C: Event Completed And Report Generated */
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-xs block">Official Event Manager Analytics Report Ready</span>
                              <p className="text-xs text-emerald-800">
                                Persisted executive analytics report generated by <strong>{reportData?.generatedByName || selectedWorkspaceReq.eventManagerName || 'Event Manager'}</strong> on {reportData?.generatedAt || 'recent audit'}.
                              </p>
                              <p className="text-[11px] text-emerald-700">
                                Verified metrics: {selectedStats?.ticketsSold ?? selectedWorkspaceReq.ticketsSold ?? 0} tickets sold • {selectedStats?.attendeeCheckIns ?? selectedWorkspaceReq.attendeeCheckIns ?? 0} attendees checked in.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                            <div className="text-xs text-slate-500 font-medium">
                              Official PDF report ready for download with audit stamp and performance metrics.
                            </div>
                            <button
                              type="button"
                              onClick={() => handleExportAnalytics(selectedWorkspaceReq.id, selectedWorkspaceReq.eventName)}
                              disabled={exportLoading}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                            >
                              {exportLoading ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Downloading Official PDF...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Export Analytics PDF</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {exportSuccess && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{exportSuccess}</span>
                        </div>
                      )}

                      {exportError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{exportError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* SECTION E: EVENT AGENDA & SESSIONS */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>E. Event Agenda & Sessions</span>
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
                        <div key={sess.id || idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-900 font-mono">
                                SESSION #{idx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-500">{sess.startTime} - {sess.endTime}</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-900 uppercase">
                                {sess.status || 'SCHEDULED'}
                              </span>
                            </div>
                            <h4 className="text-sm font-extrabold text-slate-900">{sess.title}</h4>
                            <p className="text-xs text-slate-500 font-medium">
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
                              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
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
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsWorkspaceOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs hover:bg-slate-200 transition cursor-pointer"
                >
                  Close Workspace
                </button>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SESSION POLL CREATION & RESULTS MODAL */}
      {activePollSession && selectedWorkspaceReq && typeof document !== 'undefined' && createPortal(
        <div
          data-wavevents-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActivePollSession(null);
          }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xl space-y-6">
            
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
        </div>,
        document.body
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
