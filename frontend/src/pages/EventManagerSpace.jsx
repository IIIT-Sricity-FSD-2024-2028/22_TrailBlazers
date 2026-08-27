import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Wrench, Search, Filter, BarChart3 } from 'lucide-react';
import EventManagerHero from '../components/event-manager/EventManagerHero';
import EventManagerKpis from '../components/event-manager/EventManagerKpis';
import EventManagerEventsTable from '../components/event-manager/EventManagerEventsTable';
import EventStatusChart from '../components/event-manager/EventStatusChart';
import ReadinessOverview from '../components/event-manager/ReadinessOverview';
import QuickActions from '../components/event-manager/QuickActions';
import EventPreparationWorkspace from '../components/event-manager/EventPreparationWorkspace';
import CoordinatorAssignmentModal from '../components/event-manager/CoordinatorAssignmentModal';
import ManagerChangeRequestsPanel from '../components/event-manager/ManagerChangeRequestsPanel';
import FeedbackPollsManager from '../components/FeedbackPollsManager';

export default function EventManagerSpace({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'events' | 'workspace'
  const [dashboardData, setDashboardData] = useState(null);
  const [eventsList, setEventsList] = useState([]);
  const [coordinatorsList, setCoordinatorsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state for My Events tab
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Workspace active event state
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [eventDetail, setEventDetail] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [loadingMarkReady, setLoadingMarkReady] = useState(false);

  // Quick Action modal state
  const [isCoordModalOpen, setIsCoordModalOpen] = useState(false);

  // Configuration Form State
  const [configForm, setConfigForm] = useState({
    registrationStatus: 'OPEN',
    registrationDeadline: '',
    expectedAttendance: 100
  });

  // Selected Coordinator state
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('');

  useEffect(() => {
    fetchDashboard();
    fetchEvents();
    fetchCoordinators();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('ffsd_token');
    return { 'Authorization': `Bearer ${token}` };
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/event-manager/dashboard', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error fetching event manager dashboard:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/event-manager/events', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const evts = data.events || [];
        setEventsList(evts);
        if (evts.length > 0 && !selectedReqId) {
          loadWorkspaceQuietly(evts[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceQuietly = async (reqId) => {
    setSelectedReqId(reqId);
    try {
      const res = await fetch(`/api/event-manager/events/${reqId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEventDetail(data);
        setConfigForm({
          registrationStatus: data.request.registrationStatus || 'OPEN',
          registrationDeadline: data.request.registrationDeadline || data.request.eventDate,
          expectedAttendance: data.request.expectedAttendance || 100
        });
        setSelectedCoordinatorId(data.request.onsiteCoordinatorUserId || '');
      }
    } catch (err) {
      console.error('Quiet workspace load error:', err);
    }
  };

  const fetchCoordinators = async () => {
    try {
      const res = await fetch('/api/event-manager/onsite-coordinators', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCoordinatorsList(data.coordinators || []);
      }
    } catch (err) {
      console.error('Error fetching coordinators:', err);
    }
  };

  const handleOpenWorkspace = async (reqId) => {
    setSelectedReqId(reqId);
    setActionMsg('');
    setActionError('');
    setWorkspaceLoading(true);
    setActiveTab('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await fetch(`/api/event-manager/events/${reqId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEventDetail(data);
        setConfigForm({
          registrationStatus: data.request.registrationStatus || 'OPEN',
          registrationDeadline: data.request.registrationDeadline || data.request.eventDate,
          expectedAttendance: data.request.expectedAttendance || 100
        });
        setSelectedCoordinatorId(data.request.onsiteCoordinatorUserId || '');
      } else {
        const errorData = await res.json();
        setActionError(errorData.error || 'Failed to load event workspace details.');
      }
    } catch (err) {
      setActionError('Failed to load event workspace details.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleSaveConfiguration = async (e) => {
    e.preventDefault();
    if (!selectedReqId) return;
    setActionMsg('');
    setActionError('');

    try {
      const res = await fetch(`/api/event-manager/events/${selectedReqId}/configuration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify(configForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update configuration.');

      setActionMsg(data.message);
      handleOpenWorkspace(selectedReqId);
      fetchDashboard();
      fetchEvents();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleAssignCoordinator = async (e) => {
    e.preventDefault();
    if (!selectedReqId || !selectedCoordinatorId) return;
    setActionMsg('');
    setActionError('');

    try {
      const res = await fetch(`/api/event-manager/events/${selectedReqId}/assign-coordinator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({ coordinatorUserId: selectedCoordinatorId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign coordinator.');

      setActionMsg(data.message);
      handleOpenWorkspace(selectedReqId);
      fetchDashboard();
      fetchEvents();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleQuickModalAssign = async (eventId, coordId) => {
    setActionMsg('');
    setActionError('');
    try {
      const res = await fetch(`/api/event-manager/events/${eventId}/assign-coordinator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({ coordinatorUserId: coordId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign coordinator.');

      handleOpenWorkspace(eventId);
      fetchDashboard();
      fetchEvents();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleMarkEventReady = async () => {
    if (!selectedReqId) return;
    setActionMsg('');
    setActionError('');
    setLoadingMarkReady(true);

    try {
      const res = await fetch(`/api/event-manager/events/${selectedReqId}/ready`, {
        method: 'POST',
        headers: getHeaders()
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Event is not ready yet.');

      setActionMsg(data.message);
      handleOpenWorkspace(selectedReqId);
      fetchDashboard();
      fetchEvents();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingMarkReady(false);
    }
  };

  const handleIssueInvitation = async ({ recipientEmail, recipientName }) => {
    if (!selectedReqId || !recipientEmail) return;
    setActionMsg('');
    setActionError('');

    try {
      const res = await fetch(`/api/event-manager/events/${selectedReqId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({ recipientEmail, recipientName })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue invitation.');

      setActionMsg(data.message);
      handleOpenWorkspace(selectedReqId);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleRevokeInvitation = async (invId) => {
    setActionMsg('');
    setActionError('');

    try {
      const res = await fetch(`/api/event-manager/invitations/${invId}/revoke`, {
        method: 'POST',
        headers: getHeaders()
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke invitation.');

      setActionMsg(data.message);
      handleOpenWorkspace(selectedReqId);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const filteredEvents = eventsList.filter(evt => {
    const matchesSearch = !searchTerm || (
      evt.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === 'ALL' || evt.operationalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const metrics = dashboardData?.metrics || {
    approvedEvents: eventsList.length,
    inPreparation: eventsList.filter(e => e.operationalStatus === 'IN_PREPARATION' || e.operationalStatus === 'COMMERCIAL_APPROVED').length,
    readyEvents: eventsList.filter(e => e.operationalStatus === 'READY').length,
    upcomingEvents: eventsList.length
  };

  return (
    <div className="space-y-7 pb-20 text-[#1E293B]">
      
      {/* 1. HERO BANNER */}
      <EventManagerHero user={user} onNavigate={onNavigate} />

      {/* 2. SUB-NAVIGATION PILLS BAR */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white shadow-2xs w-fit">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
            activeTab === 'events'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>My Events ({eventsList.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('workspace');
            if (eventsList.length > 0 && !selectedReqId) {
              handleOpenWorkspace(eventsList[0].id);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
            activeTab === 'workspace'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Event Preparation Workspace</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
            activeTab === 'feedback'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Feedback & Analytics Polls</span>
        </button>
      </div>

      {/* 3. TAB 1: DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-slide-up">
          {/* Top 4 KPI Cards */}
          <EventManagerKpis metrics={metrics} />

          {/* Pending Client Change Requests Panel */}
          <ManagerChangeRequestsPanel onReviewComplete={() => { fetchDashboard(); fetchEvents(); }} />

          {/* Two-Column Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Upcoming Approved Events Table (7 Cols) */}
            <div className="lg:col-span-7">
              <EventManagerEventsTable
                eventsList={eventsList}
                onPrepareEvent={handleOpenWorkspace}
                onViewAllEvents={() => setActiveTab('events')}
              />
            </div>

            {/* Right Column: Status Donut, Readiness Trend, Quick Actions (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <EventStatusChart eventsList={eventsList} />
              
              <ReadinessOverview eventsList={eventsList} />

              <QuickActions
                onAssignCoordinatorClick={() => setIsCoordModalOpen(true)}
                onSendInvitationsClick={() => {
                  const target = eventsList.find(e => e.eventType === 'CLOSED') || eventsList[0];
                  if (target) handleOpenWorkspace(target.id);
                  else setActiveTab('workspace');
                }}
                onViewReadinessClick={() => {
                  if (eventsList.length > 0) handleOpenWorkspace(eventsList[0].id);
                  else setActiveTab('workspace');
                }}
              />
            </div>

          </div>
        </div>
      )}

      {/* 4. TAB 2: MY EVENTS LIST VIEW */}
      {activeTab === 'events' && (
        <div className="space-y-5 animate-fade-slide-up">
          
          {/* Filter & Search Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search event title, client, or venue..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#0F172A] outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="ALL">All Operational Statuses</option>
                <option value="IN_PREPARATION">In Preparation</option>
                <option value="READY">Ready</option>
                <option value="LIVE">Live</option>
              </select>
            </div>
          </div>

          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-black uppercase">
                      {evt.category || 'Tech'}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-600">
                      {evt.readinessPercent || 80}% Readiness
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-[#0F172A] leading-tight">
                    {evt.eventName}
                  </h4>
                  
                  <p className="text-xs font-semibold text-slate-500">
                    {evt.organizationName} • {evt.venue}
                  </p>

                  <p className="text-[11px] font-medium text-slate-400">
                    Date: {evt.eventDate} ({evt.startTime})
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-purple-800">
                    {evt.operationalStatus || 'IN_PREPARATION'}
                  </span>

                  <button
                    onClick={() => handleOpenWorkspace(evt.id)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-2xs hover:shadow-xs active:scale-95 transition cursor-pointer"
                  >
                    Open Workspace
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 5. TAB 3: EVENT PREPARATION WORKSPACE */}
      {activeTab === 'workspace' && (
        <EventPreparationWorkspace
          eventDetail={eventDetail}
          coordinatorsList={coordinatorsList}
          configForm={configForm}
          setConfigForm={setConfigForm}
          selectedCoordinatorId={selectedCoordinatorId}
          setSelectedCoordinatorId={setSelectedCoordinatorId}
          onSaveConfig={handleSaveConfiguration}
          onAssignCoordinator={handleAssignCoordinator}
          onMarkEventReady={handleMarkEventReady}
          onIssueInvitation={handleIssueInvitation}
          onRevokeInvitation={handleRevokeInvitation}
          actionMsg={actionMsg}
          actionError={actionError}
          loadingMarkReady={loadingMarkReady}
        />
      )}

      {/* 6. TAB 4: FEEDBACK & ANALYTICS POLLS */}
      {activeTab === 'feedback' && (
        <FeedbackPollsManager user={user} events={eventsList} />
      )}

      {/* 7. QUICK ACTIONS MODAL */}
      <CoordinatorAssignmentModal
        eventsList={eventsList}
        coordinatorsList={coordinatorsList}
        isOpen={isCoordModalOpen}
        onClose={() => setIsCoordModalOpen(false)}
        onAssign={handleQuickModalAssign}
      />

    </div>
  );
}
