import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  CheckCircle2 as CheckIcon,
  AlertCircle as AlertIcon,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  MapPin as MapPinIcon,
  Users as UsersIcon,
  Building as BuildingIcon,
  ShieldCheck as ShieldCheckIcon,
  ShieldAlert as ShieldAlertIcon,
  UserCheck as UserCheckIcon,
  Send as SendIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  ChevronRight as ChevronRightIcon,
  RefreshCw as RefreshCwIcon,
  FileText as FileTextIcon,
  Lock as LockIcon,
  BarChart2 as BarChartIcon,
  AlertTriangle as AlertTriangleIcon,
  QrCode as QrCodeIcon,
  ThumbsUp as ThumbsUpIcon,
  MessageSquare as MessageSquareIcon,
  AlertOctagon as AlertOctagonIcon,
  Play as PlayIcon,
  CheckSquare as CheckSquareIcon,
  XCircle as XCircleIcon
} from 'lucide-react';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import {
  fetchCoordinatorDashboard,
  fetchCoordinatorEvents,
  verifyTicketOnsite,
  checkInAttendee
} from '../../../store/operations-actions';

export default function OnsiteCoordinatorSpace({ user, onNavigate }) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'events' | 'checkin' | 'attendance' | 'qa' | 'issues'
  
  // Read coordinator state from Redux Store
  const {
    coordinatorDashboard: dashboardData,
    coordinatorEvents: eventsList,
    loading: reduxLoading
  } = useSelector((state) => state.operations);

  const [loading, setLoading] = useState(false);

  // Selected Event & Workspace Details
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [eventWorkspace, setEventWorkspace] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Check-In Scanner State
  const [scanInput, setScanInput] = useState('');
  const [checkInResult, setCheckInResult] = useState(null);
  const [checkInError, setCheckInError] = useState('');

  // Attendee Search State
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [attendeesList, setAttendeesList] = useState([]);

  // Issues State
  const [issuesList, setIssuesList] = useState([]);
  const [issueCategory, setIssueCategory] = useState('Technical');
  const [issuePriority, setIssuePriority] = useState('Medium');
  const [issueDescription, setIssueDescription] = useState('');

  // Status Action Message
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Search & Filters for Events
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('ALL');

  // Group Ticket Verification & Entry Management State
  const [verifiedTicket, setVerifiedTicket] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  const fetchDashboard = () => dispatch(fetchCoordinatorDashboard());
  const fetchEvents = () => dispatch(fetchCoordinatorEvents());

  useEffect(() => {
    fetchDashboard();
    fetchEvents();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('ffsd_token');
    return { 'Authorization': `Bearer ${token}` };
  };

  const handleOpenWorkspace = async (reqId, targetSubTab = 'checkin') => {
    setSelectedReqId(reqId);
    setActionMsg('');
    setActionError('');
    setCheckInResult(null);
    setCheckInError('');
    setWorkspaceLoading(true);
    setActiveTab(targetSubTab);

    try {
      const res = await fetch(`/api/onsite-coordinator/events/${reqId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEventWorkspace(data);
      } else {
        const errData = await res.json();
        setActionError(errData.error || 'Failed to load assigned event workspace.');
      }
    } catch (err) {
      setActionError('Failed to load event workspace.');
    } finally {
      setWorkspaceLoading(false);
    }

    fetchAttendees(reqId);
    fetchIssues(reqId);
  };

  const fetchAttendees = async (reqId, search = '') => {
    if (!reqId) return;
    try {
      const res = await fetch(`/api/onsite-coordinator/events/${reqId}/attendees?search=${encodeURIComponent(search)}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAttendeesList(data.attendees || []);
      }
    } catch (err) {
      console.error('Error fetching attendees:', err);
    }
  };

  const fetchIssues = async (reqId) => {
    if (!reqId) return;
    try {
      const res = await fetch(`/api/onsite-coordinator/events/${reqId}/issues`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setIssuesList(data.issues || []);
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
    }
  };

  const handleCheckInSubmit = async (e, customCode = null) => {
    if (e) e.preventDefault();
    const code = customCode || scanInput;
    if (!selectedReqId || !code) return;

    setCheckInResult(null);
    setCheckInError('');
    setActionMsg('');

    try {
      const res = await dispatch(checkInAttendee(selectedReqId, code));
      const data = res.data;

      if (!res.success) {
        setCheckInError(data?.error || res.error || 'Check-in failed.');
        if (data?.isDuplicate) {
          setCheckInResult(data);
        }
        return;
      }

      setCheckInResult(data);
      setScanInput('');
      fetchAttendees(selectedReqId, attendeeSearch);
      handleOpenWorkspace(selectedReqId, activeTab);
      fetchDashboard();
    } catch (err) {
      setCheckInError('Network error during check-in.');
    }
  };

  const handleVerifyTicket = async (customCode = null) => {
    const code = (customCode || scanInput || '').trim();
    if (!selectedReqId || !code) return;

    setVerifying(true);
    setCheckInError('');
    setActionError('');
    setActionMsg('');

    try {
      const res = await dispatch(verifyTicketOnsite(selectedReqId, code));
      const data = res.data;

      if (!res.success) {
        setCheckInError(data?.message || data?.error || res.error || 'Ticket verification failed.');
        setVerifiedTicket(null);
        return;
      }

      setVerifiedTicket(data);
      setCheckInResult(null);
    } catch (err) {
      setCheckInError('Network error while verifying ticket.');
    } finally {
      setVerifying(false);
    }
  };

  const handleMemberAction = async (memberId, action, notes = '') => {
    if (!selectedReqId || !verifiedTicket?.ticket?.id || !memberId) return;

    setMemberActionLoading(true);
    setActionError('');
    setActionMsg('');

    try {
      const res = await fetch(`/api/onsite-coordinator/events/${selectedReqId}/member-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(),
        },
        body: JSON.stringify({
          ticketId: verifiedTicket.ticket.id,
          memberId,
          action,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.message || data.error || `Failed to record ${action}.`);
        return;
      }

      setActionMsg(data.message);
      // Re-verify to refresh members list and ticket status
      await handleVerifyTicket(verifiedTicket.ticket.ticketNumber || verifiedTicket.ticket.id);
      fetchAttendees(selectedReqId, attendeeSearch);
      handleOpenWorkspace(selectedReqId, activeTab);
      fetchDashboard();
    } catch (err) {
      setActionError(`Network error while performing ${action}.`);
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedReqId) return;
    setActionMsg('');
    setActionError('');

    try {
      const res = await fetch(`/api/onsite-coordinator/events/${selectedReqId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({ operationalStatus: newStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status.');

      setActionMsg(data.message);
      handleOpenWorkspace(selectedReqId, activeTab);
      fetchDashboard();
      fetchEvents();
    } catch (err) {
      setActionError(err.message);
    }
  };



  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!selectedReqId || !issueDescription) return;
    setActionMsg('');
    setActionError('');

    try {
      const res = await fetch(`/api/onsite-coordinator/events/${selectedReqId}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({
          category: issueCategory,
          priority: issuePriority,
          description: issueDescription
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to report issue.');

      setActionMsg(data.message);
      setIssueDescription('');
      fetchIssues(selectedReqId);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleUpdateIssueStatus = async (issueId, status) => {
    setActionMsg('');
    setActionError('');

    try {
      const res = await fetch(`/api/onsite-coordinator/issues/${issueId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update issue status.');

      setActionMsg(data.message);
      fetchIssues(selectedReqId);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const filteredEvents = eventsList.filter(evt => {
    const matchesSearch = !eventSearchTerm || (
      evt.eventName.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
      evt.organizationName.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
      evt.venue.toLowerCase().includes(eventSearchTerm.toLowerCase())
    );
    const matchesStatus = eventStatusFilter === 'ALL' || evt.operationalStatus === eventStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const metrics = dashboardData?.metrics || {
    todaysEvents: 0,
    assignedEvents: 0,
    checkedInAttendees: 0,
    upcomingEventName: 'None'
  };

  const eventReq = eventWorkspace?.event || {};
  const eventStats = eventWorkspace?.stats || { registered: 0, checkedIn: 0, notArrived: 0, attendancePercent: 0 };

  return (
    <div className="space-y-8 pb-20 text-[#26334A]">
      
      {/* 1. HEADER RIBBON */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#DAF0FB] via-[#E8F9F5] to-[#FBE9F9] border border-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-teal-700 uppercase tracking-widest">
            <QrCodeIcon className="w-4 h-4" />
            <span>Wavevents Event-Day Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26334A] tracking-tight mt-0.5">
            Onsite Coordinator Workspace
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-1">
            Live event check-in, attendance monitoring, Q&A moderation, and operational issue tracking.
          </p>
        </div>

        {/* User Identity Pill */}
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div className="text-xs font-extrabold text-[#26334A]">{user?.name || 'Onsite Coordinator'}</div>
            <div className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">Role: Onsite Coordinator</div>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TAB PILLS */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/70 border border-white shadow-2xs backdrop-blur-md">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'dashboard'
              ? 'bg-[#26334A] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-white/80 hover:text-[#26334A]'
          }`}
        >
          <BarChartIcon className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'events'
              ? 'bg-[#26334A] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-white/80 hover:text-[#26334A]'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>My Events ({eventsList.length})</span>
        </button>

        {selectedReqId && (
          <>
            <button
              onClick={() => setActiveTab('checkin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                activeTab === 'checkin'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-teal-800 hover:bg-teal-50'
              }`}
            >
              <QrCodeIcon className="w-4 h-4" />
              <span>Check-In</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                activeTab === 'attendance'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-teal-800 hover:bg-teal-50'
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              <span>Live Attendance ({eventStats.checkedIn}/{eventStats.registered})</span>
            </button>



            <button
              onClick={() => setActiveTab('issues')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                activeTab === 'issues'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-teal-800 hover:bg-teal-50'
              }`}
            >
              <AlertOctagonIcon className="w-4 h-4" />
              <span>Issues ({issuesList.filter(i => i.status !== 'RESOLVED').length})</span>
            </button>
          </>
        )}
      </div>

      {/* GLOBAL NOTIFICATION MESSAGES */}
      {actionMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-fadeIn">
          ✓ {actionMsg}
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-fadeIn">
          ✕ {actionError}
        </div>
      )}

      {/* ==================== TAB 1: DASHBOARD ==================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* 7 Core Operational Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-white/95 to-slate-50 border border-white shadow-xs space-y-1.5">
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block">Total Tickets Sold</span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {metrics.totalTicketsSold ?? metrics.assignedEvents}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Confirmed orders</span>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-white/95 to-indigo-50/50 border border-white shadow-xs space-y-1.5">
              <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">Registered Members</span>
              <div className="text-2xl font-black text-indigo-950 tracking-tight">
                {metrics.totalRegisteredMembers ?? metrics.checkedInAttendees}
              </div>
              <span className="text-[10px] text-indigo-600/80 font-medium">All pass holders</span>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-white/95 to-emerald-50/60 border border-white shadow-xs space-y-1.5">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Inside Venue</span>
              <div className="text-2xl font-black text-emerald-700 tracking-tight">
                {metrics.totalMembersInside ?? metrics.checkedInAttendees}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">Currently admitted</span>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-white/95 to-amber-50/60 border border-white shadow-xs space-y-1.5">
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">Outside Venue</span>
              <div className="text-2xl font-black text-amber-700 tracking-tight">
                {metrics.totalMembersOutside ?? 0}
              </div>
              <span className="text-[10px] text-amber-600 font-medium">Temporary exit</span>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-white/95 to-slate-100/60 border border-white shadow-xs space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Not Entered</span>
              <div className="text-2xl font-black text-slate-700 tracking-tight">
                {metrics.totalMembersNotEntered ?? 0}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Yet to arrive</span>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-white/95 to-purple-50/60 border border-white shadow-xs space-y-1.5">
              <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block">Group Tickets</span>
              <div className="text-2xl font-black text-purple-900 tracking-tight">
                {metrics.totalGroupTickets ?? 0}
              </div>
              <span className="text-[10px] text-purple-600 font-medium">Multi-pass orders</span>
            </div>
          </div>

          {/* Assigned Events List */}
          <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#26334A]">My Assigned Operational Events</h3>
                <p className="text-xs text-[#64748B]">Events assigned for event-day check-in, Q&A moderation, and attendance tracking.</p>
              </div>
              <button
                onClick={() => setActiveTab('events')}
                className="text-xs font-extrabold text-teal-700 hover:underline flex items-center gap-1"
              >
                View Catalog
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[#64748B] font-extrabold uppercase tracking-wider">
                    <th className="pb-3 px-3">Event Title</th>
                    <th className="pb-3 px-3">Client</th>
                    <th className="pb-3 px-3">Date & Venue</th>
                    <th className="pb-3 px-3 text-center">Attendance</th>
                    <th className="pb-3 px-3">Operational Status</th>
                    <th className="pb-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[#26334A]">
                  {eventsList.map((evt) => (
                    <tr key={evt.id} className="hover:bg-white/60 transition">
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-[#26334A]">{evt.eventName}</div>
                        <div className="text-[11px] text-[#64748B]">{evt.category}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold">{evt.organizationName}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div>{evt.eventDate}</div>
                        <div className="text-[11px] text-slate-500">{evt.venue}</div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="font-mono font-bold text-teal-800">
                          {evt.checkedIn} / {evt.registered} ({evt.attendancePercent}%)
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={evt.operationalStatus || evt.status} />
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleOpenWorkspace(evt.id, 'checkin')}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs transition shadow-2xs flex items-center gap-1 mx-auto"
                        >
                          <QrCodeIcon className="w-3.5 h-3.5" />
                          <span>Start Check-In</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== TAB 2: MY EVENTS CATALOG ==================== */}
      {activeTab === 'events' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="p-4 rounded-2xl glass-light border border-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={eventSearchTerm}
                onChange={(e) => setEventSearchTerm(e.target.value)}
                placeholder="Search event name, organization, venue..."
                className="w-full pl-10 pr-4 py-2 glass-input-light rounded-xl text-xs font-medium focus:border-teal-400"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <FilterIcon className="w-4 h-4 text-slate-400" />
              <select
                value={eventStatusFilter}
                onChange={(e) => setEventStatusFilter(e.target.value)}
                className="px-3.5 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs font-bold text-[#26334A] cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Operational Statuses</option>
                <option value="READY">READY</option>
                <option value="CHECK_IN_OPEN">CHECK_IN_OPEN</option>
                <option value="LIVE">LIVE</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((evt) => (
              <div key={evt.id} className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                      {evt.category}
                    </span>
                    <h4 className="text-lg font-extrabold text-[#26334A] mt-1.5">{evt.eventName}</h4>
                    <p className="text-xs text-[#64748B] font-bold">{evt.organizationName}</p>
                  </div>
                  <StatusBadge status={evt.operationalStatus || evt.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-2xl bg-white/70 border border-slate-100">
                  <div>
                    <span className="text-[#64748B] text-[11px] block">Date & Venue</span>
                    <span className="font-bold text-[#26334A]">{evt.eventDate}</span>
                    <span className="block text-slate-500 truncate">{evt.venue}</span>
                  </div>

                  <div>
                    <span className="text-[#64748B] text-[11px] block">Attendance Status</span>
                    <span className="font-bold text-teal-800 block">
                      {evt.checkedIn} / {evt.registered} Checked In
                    </span>
                    <span className="text-[11px] font-bold font-mono text-indigo-700">
                      {evt.attendancePercent}% Arrived
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <span className="text-[11px] font-mono text-slate-500">{evt.expectedAttendance} Capacity</span>
                  <button
                    onClick={() => handleOpenWorkspace(evt.id, 'checkin')}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs transition shadow-xs flex items-center gap-1.5"
                  >
                    <span>Open Event Workspace</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ==================== TAB 3: CHECK-IN WORKSPACE ==================== */}
      {activeTab === 'checkin' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header Banner */}
          <div className="p-6 rounded-3xl glass-light border border-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700">Live Ticket Scanner</span>
              <h2 className="text-xl font-extrabold text-[#26334A]">{eventReq.eventName}</h2>
              <p className="text-xs text-[#64748B]">{eventReq.venue} ({eventReq.eventDate})</p>
            </div>
            <StatusBadge status={eventReq.operationalStatus || eventReq.status} />
          </div>

          {/* CHECK-IN BANNER RESULTS */}

          {/* DUPLICATE CHECK-IN WARNING BANNER */}
          {checkInResult?.isDuplicate && (
            <div className="p-6 rounded-3xl bg-rose-500 text-white shadow-xl space-y-2 animate-bounceIn border-2 border-rose-600">
              <div className="flex items-center gap-3">
                <AlertTriangleIcon className="w-8 h-8 text-amber-200 shrink-0" />
                <div>
                  <h3 className="text-xl font-extrabold">⚠ ALREADY CHECKED IN</h3>
                  <p className="text-xs text-rose-100 font-medium mt-0.5">
                    This ticket has already been used for entry. Do NOT issue another pass.
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md text-xs font-mono grid grid-cols-2 gap-2 mt-2">
                <div>Attendee: <strong>{checkInResult.attendeeName}</strong></div>
                <div>Ticket: <strong>{checkInResult.ticketNumber}</strong></div>
                <div>Checked In At: <strong>{checkInResult.checkedInAt}</strong></div>
              </div>
            </div>
          )}

          {/* CHECK-IN SUCCESS BANNER */}
          {checkInResult && !checkInResult.isDuplicate && (
            <div className="p-6 rounded-3xl bg-emerald-600 text-white shadow-xl space-y-2 animate-fadeIn border-2 border-emerald-700">
              <div className="flex items-center gap-3">
                <CheckIcon className="w-8 h-8 text-emerald-200 shrink-0" />
                <div>
                  <h3 className="text-xl font-extrabold">{checkInResult.message}</h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    Attendee verified and admitted to venue.
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md text-xs font-mono flex items-center justify-between mt-2">
                <div>Attendee: <strong>{checkInResult.attendeeName}</strong></div>
                <div>Ticket: <strong>{checkInResult.ticketNumber}</strong></div>
                <div>Time: <strong>{checkInResult.checkedInAt}</strong></div>
              </div>
            </div>
          )}

          {/* CHECK-IN ERROR BANNER */}
          {checkInError && !checkInResult?.isDuplicate && (
            <div className="p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
              <XCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{checkInError}</span>
            </div>
          )}

          {/* Scanner Input Form & Manual Search Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Scanner Input Form */}
            <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-teal-800 font-extrabold text-sm border-b border-slate-200 pb-3">
                <QrCodeIcon className="w-5 h-5 text-teal-600" />
                <span>Verify Ticket & Group Passes</span>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-2">
                  Ticket Number, Pass ID, or QR Scan
                </label>
                <input
                  type="text"
                  autoFocus
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleVerifyTicket(scanInput);
                    }
                  }}
                  placeholder="e.g. EVT-2026-..., tkt_..."
                  className="w-full px-4 py-3 glass-input-light rounded-2xl text-sm font-extrabold font-mono focus:border-teal-500 shadow-2xs"
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleVerifyTicket(scanInput)}
                  disabled={verifying || !scanInput.trim()}
                  className="w-full py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <SearchIcon className="w-4 h-4" />
                  <span>{verifying ? 'Verifying Pass...' : 'Verify Ticket & Load Members'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleCheckInSubmit(e, scanInput)}
                  disabled={!scanInput.trim()}
                  className="w-full py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckIcon className="w-4 h-4 text-teal-600" />
                  <span>Quick Pass Check-In</span>
                </button>
              </div>
            </div>

            {/* Manual Attendee Search Table */}
            <div className="lg:col-span-2 p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-base font-extrabold text-[#26334A]">Attendee Check-In Directory</h4>
                  <p className="text-xs text-[#64748B]">Search registered tickets to manage group entries and exit tracking.</p>
                </div>
                <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  {attendeesList.filter(a => a.checkedIn === 1).length} / {attendeesList.length} Arrived
                </span>
              </div>

              <div className="relative">
                <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={attendeeSearch}
                  onChange={(e) => {
                    setAttendeeSearch(e.target.value);
                    fetchAttendees(selectedReqId, e.target.value);
                  }}
                  placeholder="Search attendee name, email, or ticket number..."
                  className="w-full pl-10 pr-4 py-2 glass-input-light rounded-xl text-xs font-medium"
                />
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#64748B] font-extrabold uppercase tracking-wider">
                      <th className="pb-2 px-2">Attendee / Pass</th>
                      <th className="pb-2 px-2">Ticket ID</th>
                      <th className="pb-2 px-2 text-center">Members</th>
                      <th className="pb-2 px-2">Status</th>
                      <th className="pb-2 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-[#26334A]">
                    {attendeesList.map((att) => (
                      <tr key={att.id} className="hover:bg-white/60">
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-slate-900">{att.attendeeName || 'Attendee'}</div>
                          <div className="text-[10px] text-slate-500">{att.attendeeEmail}</div>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-indigo-700 font-bold">{att.ticketNumber}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            att.totalMembers > 1
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {att.totalMembers > 1 ? `Group (${att.totalMembers})` : 'Single (1)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            att.entryStatus === 'FULLY_CHECKED_IN'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : att.entryStatus === 'PARTIALLY_CHECKED_IN'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {att.entryStatus || (att.checkedIn === 1 ? 'FULLY_CHECKED_IN' : 'NOT_ENTERED')}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setScanInput(att.ticketNumber);
                              handleVerifyTicket(att.ticketNumber);
                            }}
                            className="px-3 py-1 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-[11px] transition shadow-2xs cursor-pointer"
                          >
                            Manage Members
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* VERIFIED TICKET & GROUP PASS MEMBER MANAGEMENT STATION */}
          {verifiedTicket && (
            <div className="p-6 rounded-3xl glass-light border-2 border-teal-500/40 shadow-lg space-y-6 animate-fadeIn">
              
              {/* Header Box */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                      <ShieldCheckIcon className="w-3.5 h-3.5 text-teal-600" />
                      Verified Pass Roster
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      verifiedTicket.status === 'FULLY_CHECKED_IN'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : verifiedTicket.status === 'PARTIALLY_CHECKED_IN'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}>
                      Status: {verifiedTicket.status}
                    </span>
                    {verifiedTicket.isValid ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ Valid Ticket
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        ✕ {verifiedTicket.validityReason || 'Invalid Pass'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {verifiedTicket.attendeeName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pass Ref: <strong className="font-mono text-indigo-700">{verifiedTicket.ticket.ticketNumber}</strong> • Type: <strong className="text-slate-800">{verifiedTicket.ticket.ticketType || (verifiedTicket.totalMembers > 1 ? 'Group Pass' : 'Standard Pass')}</strong> • Contact: {verifiedTicket.attendeeEmail}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setVerifiedTicket(null)}
                  className="self-start md:self-auto px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer"
                >
                  Close Roster
                </button>
              </div>

              {/* Group Ticket Statistics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Members</span>
                  <div className="text-xl font-black text-slate-900">{verifiedTicket.totalMembers}</div>
                  <span className="text-[10px] text-slate-500 font-medium">Covered by pass</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Checked In</span>
                  <div className="text-xl font-black text-emerald-800">{verifiedTicket.checkedInMembers}</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Entered venue</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Remaining</span>
                  <div className="text-xl font-black text-amber-800">{verifiedTicket.remainingMembers}</div>
                  <span className="text-[10px] text-amber-600 font-medium">Waiting to enter</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-0.5">
                  <span className="text-[10px] font-bold text-teal-700 uppercase block">Inside Venue</span>
                  <div className="text-xl font-black text-teal-800">{verifiedTicket.membersInside}</div>
                  <span className="text-[10px] text-teal-600 font-medium">Currently admitted</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Outside Venue</span>
                  <div className="text-xl font-black text-slate-700">{verifiedTicket.membersOutside}</div>
                  <span className="text-[10px] text-slate-500 font-medium">Temporary exit</span>
                </div>
              </div>

              {/* Individual Members Management Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-[#26334A] uppercase tracking-wider flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-teal-700" />
                    <span>Individual Members Access Control</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    Manage entry, temporary exit, and re-entry individually for each member
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                        <th className="py-3 px-3"># Member</th>
                        <th className="py-3 px-3">Member Name</th>
                        <th className="py-3 px-3 text-center">Current Status</th>
                        <th className="py-3 px-3">First Entry</th>
                        <th className="py-3 px-3">Last Movement</th>
                        <th className="py-3 px-3 text-right">Access Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-[#26334A]">
                      {verifiedTicket.members.map((m) => {
                        const isInside = m.entryStatus === 'INSIDE';
                        const isOutside = m.entryStatus === 'OUTSIDE';
                        const isNotEntered = m.entryStatus === 'NOT_ENTERED';
                        const isPermanentlyExited = m.entryStatus === 'EXITED_PERMANENTLY';

                        return (
                          <tr key={m.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-3 font-mono font-bold text-slate-400">
                              #{m.memberIndex}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-extrabold text-slate-900">{m.memberName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {m.id}</div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${
                                isInside
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : isOutside
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : isPermanentlyExited
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}>
                                {m.entryStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                              {m.firstEnteredAt ? m.firstEnteredAt.split(' ')[1] : '—'}
                            </td>
                            <td className="py-3 px-3 text-[11px] text-slate-600">
                              {m.lastAction ? (
                                <div>
                                  <span className="font-bold">{m.lastAction}</span>
                                  <span className="text-slate-400 block text-[10px]">
                                    {m.lastActionAt ? m.lastActionAt.split(' ')[1] : ''}
                                  </span>
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {isNotEntered && (
                                  <button
                                    type="button"
                                    onClick={() => handleMemberAction(m.id, 'ENTRY')}
                                    disabled={memberActionLoading || !verifiedTicket.isValid}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1"
                                  >
                                    <CheckIcon className="w-3.5 h-3.5" />
                                    <span>Check In</span>
                                  </button>
                                )}

                                {isInside && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleMemberAction(m.id, 'EXIT')}
                                      disabled={memberActionLoading}
                                      className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer"
                                    >
                                      Record Exit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMemberAction(m.id, 'PERMANENT_EXIT')}
                                      disabled={memberActionLoading}
                                      className="px-2 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-[10px] transition cursor-pointer"
                                    >
                                      Exit Permanently
                                    </button>
                                  </>
                                )}

                                {isOutside && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleMemberAction(m.id, 'RE_ENTRY')}
                                      disabled={memberActionLoading}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1"
                                    >
                                      <RefreshCwIcon className="w-3.5 h-3.5" />
                                      <span>Re-Entry</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMemberAction(m.id, 'PERMANENT_EXIT')}
                                      disabled={memberActionLoading}
                                      className="px-2 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-[10px] transition cursor-pointer"
                                    >
                                      Exit Permanently
                                    </button>
                                  </>
                                )}

                                {isPermanentlyExited && (
                                  <span className="text-[10px] font-bold text-rose-500 px-2 py-1 rounded bg-rose-50 border border-rose-200">
                                    Permanently Exited
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ticket Entry/Exit Audit Trail */}
              {verifiedTicket.logs && verifiedTicket.logs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>Pass Entry & Exit Verification Log</span>
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/70 p-2">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[10px] font-black uppercase text-slate-400">
                          <th className="py-1 px-2">Timestamp</th>
                          <th className="py-1 px-2">Member</th>
                          <th className="py-1 px-2">Action</th>
                          <th className="py-1 px-2">Transition</th>
                          <th className="py-1 px-2">Coordinator</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 font-medium">
                        {verifiedTicket.logs.map((log) => (
                          <tr key={log.id} className="text-[11px]">
                            <td className="py-1.5 px-2 font-mono text-slate-500">{log.timestamp}</td>
                            <td className="py-1.5 px-2 font-bold text-slate-800">{log.memberName}</td>
                            <td className="py-1.5 px-2">
                              <span className="font-extrabold text-teal-800 uppercase">{log.action}</span>
                            </td>
                            <td className="py-1.5 px-2 font-mono text-slate-500">
                              {log.previousStatus} → <strong className="text-slate-800">{log.newStatus}</strong>
                            </td>
                            <td className="py-1.5 px-2 text-slate-500">{log.coordinatorName || 'Onsite Team'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ==================== TAB 4: LIVE ATTENDANCE ANALYTICS ==================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header & Controls */}
          <div className="p-6 rounded-3xl glass-light border border-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700">Attendance Monitoring & Controls</span>
              <h3 className="text-xl font-extrabold text-[#26334A]">{eventReq.eventName}</h3>
              <p className="text-xs text-[#64748B]">{eventReq.venue}</p>
            </div>

            {/* Operational Event Status Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleUpdateStatus('CHECK_IN_OPEN')}
                className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition shadow-2xs ${eventReq.operationalStatus === 'CHECK_IN_OPEN' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
              >
                Open Check-in
              </button>

              <button
                onClick={() => handleUpdateStatus('LIVE')}
                className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition shadow-2xs ${eventReq.operationalStatus === 'LIVE' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
              >
                Start Event (LIVE)
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`End ${eventReq.eventName}? Current Attendance: ${eventStats.checkedIn}/${eventStats.registered}`)) {
                    handleUpdateStatus('COMPLETED');
                  }
                }}
                className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition shadow-2xs ${eventReq.operationalStatus === 'COMPLETED' ? 'bg-slate-800 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'}`}
              >
                End Event
              </button>
            </div>
          </div>

          {/* Attendance Overview Cards & Progress */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-5 rounded-3xl glass-light border border-white shadow-xs space-y-1">
              <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider block">Total Registered</span>
              <span className="text-3xl font-extrabold text-indigo-900">{eventStats.registered} Passes</span>
            </div>

            <div className="p-5 rounded-3xl glass-light border border-white shadow-xs space-y-1">
              <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider block">Checked-In Attendees</span>
              <span className="text-3xl font-extrabold text-emerald-700">{eventStats.checkedIn} Arrived</span>
            </div>

            <div className="p-5 rounded-3xl glass-light border border-white shadow-xs space-y-1">
              <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider block">Not Arrived</span>
              <span className="text-3xl font-extrabold text-amber-700">{eventStats.notArrived} Remaining</span>
            </div>

            <div className="p-5 rounded-3xl glass-light border border-white shadow-xs space-y-1">
              <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider block">Attendance Rate</span>
              <span className="text-3xl font-extrabold text-teal-800">{eventStats.attendancePercent}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-3">
            <div className="flex justify-between text-xs font-extrabold text-[#26334A]">
              <span>Live Venue Capacity Fill</span>
              <span>{eventStats.checkedIn} / {eventStats.registered} ({eventStats.attendancePercent}%)</span>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-200 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${eventStats.attendancePercent}%` }}
              />
            </div>
          </div>

          {/* Recent Check-Ins Activity Stream */}
          <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
            <h4 className="text-base font-extrabold text-[#26334A]">Recent Venue Entry Stream</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[#64748B] font-extrabold uppercase tracking-wider">
                    <th className="pb-2 px-2">Timestamp</th>
                    <th className="pb-2 px-2">Attendee Name</th>
                    <th className="pb-2 px-2">Ticket Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[#26334A]">
                  {(eventWorkspace?.recentCheckIns || []).map(log => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-2 font-mono text-slate-500">{log.checkedInAt}</td>
                      <td className="py-2.5 px-2 font-bold">{log.attendeeName}</td>
                      <td className="py-2.5 px-2 font-mono text-indigo-700 font-bold">{log.ticketNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== TAB 6: OPERATIONAL ISSUES TRACKER ==================== */}
      {activeTab === 'issues' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header Banner */}
          <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-700">Operational Issue Reporting</span>
            <h3 className="text-xl font-extrabold text-[#26334A]">{eventReq.eventName}</h3>
            <p className="text-xs text-[#64748B]">Report and track technical, venue, safety, or registration issues on event day.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Report Form */}
            <form onSubmit={handleReportIssue} className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
              <h4 className="text-base font-extrabold text-[#26334A] border-b border-slate-200 pb-2">Report Operational Issue</h4>

              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/90 border border-slate-200 rounded-xl text-xs font-bold text-[#26334A]"
                >
                  <option value="Technical">Technical (AV/Audio/Projector)</option>
                  <option value="Venue">Venue (HVAC/Seating/Facilities)</option>
                  <option value="Registration">Registration (Check-in/Passes)</option>
                  <option value="Attendee">Attendee Assistance</option>
                  <option value="Safety">Safety & Security</option>
                  <option value="Other">Other Operational Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1">
                  Priority
                </label>
                <select
                  value={issuePriority}
                  onChange={(e) => setIssuePriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/90 border border-slate-200 rounded-xl text-xs font-bold text-[#26334A]"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1">
                  Issue Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe operational issue..."
                  className="w-full px-3.5 py-2.5 glass-input-light rounded-xl text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md"
              >
                Submit Issue Report
              </button>
            </form>

            {/* Issues Management List */}
            <div className="lg:col-span-2 p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
              <h4 className="text-base font-extrabold text-[#26334A] border-b border-slate-200 pb-2">Reported Operational Issues</h4>

              <div className="space-y-3">
                {issuesList.map(iss => (
                  <div key={iss.id} className="p-4 rounded-2xl bg-white/80 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-rose-900 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        {iss.category} ({iss.priority} Priority)
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{iss.createdAt}</span>
                    </div>

                    <p className="text-xs font-semibold text-[#26334A]">
                      {iss.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${iss.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
                        {iss.status}
                      </span>
                      <div className="flex gap-1">
                        {iss.status !== 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleUpdateIssueStatus(iss.id, 'IN_PROGRESS')}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-bold"
                          >
                            Mark In Progress
                          </button>
                        )}
                        {iss.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleUpdateIssueStatus(iss.id, 'RESOLVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
