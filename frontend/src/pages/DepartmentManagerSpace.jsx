import React, { useState, useEffect } from 'react';
import { Building, Users, AlertTriangle, CheckCircle2, ArrowUpRight, ShieldCheck, Layers, FileText, Send, LifeBuoy, Search, Activity, Clock, Radio, CheckCircle } from 'lucide-react';

export default function DepartmentManagerSpace({ user, onNavigate }) {
  const [overview, setOverview] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [escalatingIssue, setEscalatingIssue] = useState(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [resolutionMsg, setResolutionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Roster Filters
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, IN_PROGRESS, AVAILABLE, ESCALATED
  const [searchTerm, setSearchTerm] = useState('');

  const [apiError, setApiError] = useState('');

  const userDept = user?.department || 'EVENT_MANAGEMENT';

  useEffect(() => {
    fetchData();
  }, [user, userDept]);

  const fetchData = async () => {
    setLoading(true);
    setApiError('');
    try {
      const token = localStorage.getItem('ffsd_token');
      if (!token) {
        setApiError('Session token not found. Please sign in again.');
        setLoading(false);
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      const [resOverview, resTeam, resIssues] = await Promise.all([
        fetch('/api/hierarchy/overview', { headers }),
        fetch('/api/hierarchy/team', { headers }),
        fetch('/api/hierarchy/issues', { headers })
      ]);

      if (resOverview.ok) {
        const data = await resOverview.json();
        setOverview(data);
      }

      if (resTeam.ok) {
        const data = await resTeam.json();
        setTeamMembers(data.members || []);
      } else {
        const errData = await resTeam.json().catch(() => ({}));
        console.warn('GET /api/hierarchy/team status:', resTeam.status, errData);
        setApiError(errData.error || `Unable to load department team (HTTP ${resTeam.status}).`);
      }

      if (resIssues.ok) {
        const data = await resIssues.json();
        setIssues(data.issues || []);
      }
    } catch (err) {
      console.error('Error loading Department Manager data:', err);
      setApiError(`Network error loading department data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setActionLoading(true);
    setFeedbackMsg('');
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/hierarchy/issues/${selectedIssue.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resolutionDetails: resolutionMsg })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve issue.');

      setFeedbackMsg('Department issue resolved.');
      setSelectedIssue(null);
      setResolutionMsg('');
      fetchData();
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalateToAdmin = async (e) => {
    e.preventDefault();
    if (!escalatingIssue) return;
    setActionLoading(true);
    setFeedbackMsg('');
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/hierarchy/issues/${escalatingIssue.id}/escalate-to-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: escalateReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to escalate issue to Super Admin.');

      setFeedbackMsg('Issue escalated to Super Admin successfully.');
      setEscalatingIssue(null);
      setEscalateReason('');
      fetchData();
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const myDeptData = overview?.departments?.[userDept];
  const members = teamMembers.length > 0 ? teamMembers : (myDeptData?.members || []);
  const deptIssues = issues.filter(i => i.department === userDept || (userDept === 'IT_SUPPORT' && i.issueType === 'TECHNICAL'));

  // Summary Metrics
  const activeCount = members.filter(m => m.status === 'IN_PROGRESS' || m.status === 'ACTIVE').length;
  const availableCount = members.filter(m => m.status === 'AVAILABLE').length;
  const escalatedCount = members.filter(m => m.status === 'ESCALATED').length;

  // Filtered Roster
  const filteredMembers = members.filter(m => {
    const matchesSearch = !searchTerm || m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase()) || m.role.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === 'IN_PROGRESS') return m.status === 'IN_PROGRESS' || m.status === 'ACTIVE';
    if (filterStatus === 'AVAILABLE') return m.status === 'AVAILABLE';
    if (filterStatus === 'ESCALATED') return m.status === 'ESCALATED';
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12 text-[#26334A]">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-light border border-white shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Department Management & Workload Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26334A] mt-2">
              {myDeptData?.name || 'Department Manager'} Workspace
            </h1>
            <p className="text-xs text-[#64748B] font-medium">
              Monitor team activities ("Who is working on what right now?"), manage assigned workload, resolve team issues, and escalate critical problems to Super Admin.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50 to-indigo-50 border border-teal-100 text-center">
              <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider block">Department Team</span>
              <span className="text-xl font-extrabold text-teal-900">{members.length} Members</span>
            </div>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between gap-3">
          <span>⚠️ {apiError}</span>
          <button 
            onClick={fetchData}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[11px] transition shadow-xs"
          >
            Retry Loading Team
          </button>
        </div>
      )}

      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold">
          {feedbackMsg}
        </div>
      )}

      {/* DEPARTMENT SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/90 border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Total Members</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-[#26334A]">{members.length}</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">Active / In Progress</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-indigo-900">{activeCount}</span>
            <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Available</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-emerald-900">{availableCount}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider block">Escalated</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-rose-900">{escalatedCount}</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
        </div>
      </div>

      {/* DEPARTMENT TEAM ROSTER & WORKLOAD TRACKING */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>Team Activity & Workload Roster ({filteredMembers.length})</span>
          </h2>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search team member..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-[#26334A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'IN_PROGRESS', label: 'Active' },
                { id: 'AVAILABLE', label: 'Available' },
                { id: 'ESCALATED', label: 'Escalated' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${filterStatus === tab.id ? 'bg-white text-[#26334A] shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.length === 0 ? (
            <p className="text-xs text-[#64748B] col-span-full text-center py-8">No team members match selected filter criteria.</p>
          ) : (
            filteredMembers.map(m => {
              const isAvailable = m.status === 'AVAILABLE';
              const isEscalated = m.status === 'ESCALATED';

              return (
                <div key={m.id} className="p-5 rounded-3xl bg-white/95 border border-slate-200/90 shadow-xs space-y-3.5 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <h3 className="font-extrabold text-sm text-[#26334A]">{m.name}</h3>
                        <p className="text-[11px] text-teal-800 font-extrabold uppercase tracking-wider">{m.role.replace('_', ' ')}</p>
                      </div>
                      
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shrink-0 ${isAvailable ? 'bg-slate-100 text-slate-700 border-slate-200' : isEscalated ? 'bg-rose-100 text-rose-900 border-rose-200 animate-pulse' : 'bg-indigo-100 text-indigo-900 border-indigo-200'}`}>
                        {m.status === 'IN_PROGRESS' ? '● IN PROGRESS' : m.status}
                      </span>
                    </div>

                    {/* Member Details */}
                    <div className="space-y-1 pt-2 text-[11px]">
                      <p className="text-slate-500 font-mono">{m.email}</p>
                      <p className="text-slate-400 font-medium">{m.organization || 'Wavevents Operations'}</p>
                    </div>

                    {/* Current Activity Box ("Who is working on what right now?") */}
                    <div className={`mt-3 p-3.5 rounded-2xl border text-xs space-y-1.5 ${isAvailable ? 'bg-slate-50/80 border-slate-200 text-slate-600' : isEscalated ? 'bg-rose-50/80 border-rose-200 text-rose-900' : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-indigo-600" />
                          <span>Current Activity</span>
                        </span>
                        {m.priority && (
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${m.priority === 'Critical' || m.priority === 'High' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-900'}`}>
                            {m.priority}
                          </span>
                        )}
                      </div>

                      <p className="font-bold text-xs leading-snug">{m.currentActivity}</p>

                      {m.eventName && (
                        <div className="pt-1 flex items-center gap-1 text-[11px] font-semibold text-indigo-800">
                          <Building className="w-3 h-3 shrink-0 text-indigo-600" />
                          <span className="truncate">Event: {m.eventName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {m.lastActivityAt && (
                    <div className="pt-2 text-[10px] text-slate-400 flex items-center gap-1 border-t border-slate-100">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Updated: {m.lastActivityAt}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DEPARTMENT ISSUES & ESCALATION QUEUE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Department Issue Queue & Team Escalations</span>
          </h2>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            {deptIssues.filter(i => i.status !== 'RESOLVED').length} Active Issues
          </span>
        </div>

        <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
          {deptIssues.length === 0 ? (
            <p className="text-xs text-[#64748B] text-center py-6">No department issues reported.</p>
          ) : (
            <div className="space-y-3">
              {deptIssues.map(iss => {
                const isEscalatedToManager = iss.status === 'ESCALATED_TO_MANAGER';
                return (
                  <div key={iss.id} className={`p-4 rounded-2xl border transition ${isEscalatedToManager ? 'bg-amber-50/80 border-amber-200' : 'bg-white/80 border-slate-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${iss.issueType === 'TECHNICAL' ? 'bg-sky-100 text-sky-900 border border-sky-200' : 'bg-purple-100 text-purple-900 border border-purple-200'}`}>
                            {iss.issueType || 'OPERATIONAL'}
                          </span>
                          <span className="text-xs font-extrabold text-[#26334A]">{iss.category}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${iss.priority === 'Critical' || iss.priority === 'High' ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-900'}`}>
                            {iss.priority}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#26334A]">{iss.description}</p>
                        <p className="text-[10px] text-[#64748B]">Reported by: {iss.reporterName} • {iss.createdAt}</p>
                        {iss.escalationReason && (
                          <p className="text-[10px] text-amber-900 font-bold bg-amber-100/60 p-1.5 rounded-lg border border-amber-200">
                            Team Escalation Reason: {iss.escalationReason}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${iss.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-900' : iss.status === 'ESCALATED_TO_ADMIN' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-900'}`}>
                          {iss.status}
                        </span>
                        
                        {iss.status !== 'RESOLVED' && iss.status !== 'ESCALATED_TO_ADMIN' && (
                          <>
                            <button
                              onClick={() => setSelectedIssue(iss)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-2xs"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => setEscalatingIssue(iss)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition shadow-2xs flex items-center gap-1"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Escalate to Admin</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RESOLUTION MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-modal-light rounded-3xl p-6 border border-white shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-[#26334A]">Department Manager Resolution</h3>
            <p className="text-xs text-[#64748B]">Resolving issue reported by <strong>{selectedIssue.reporterName}</strong></p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#26334A] font-medium">
              "{selectedIssue.description}"
            </div>

            <form onSubmit={handleResolveIssue} className="space-y-3">
              <textarea
                required
                rows={3}
                value={resolutionMsg}
                onChange={(e) => setResolutionMsg(e.target.value)}
                placeholder="Enter departmental resolution details..."
                className="w-full p-3 glass-input-light rounded-xl text-xs resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Resolution'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-700 font-extrabold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESCALATE TO ADMIN MODAL */}
      {escalatingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-modal-light rounded-3xl p-6 border border-white shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-rose-900">Escalate Issue to Super Admin</h3>
            <p className="text-xs text-[#64748B]">Escalating unresolved departmental issue to Executive Super Admin</p>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-medium">
              "{escalatingIssue.description}"
            </div>

            <form onSubmit={handleEscalateToAdmin} className="space-y-3">
              <textarea
                required
                rows={3}
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="Provide reason for escalating to Super Admin (e.g. Requires executive budget approval / critical system outage)..."
                className="w-full p-3 glass-input-light rounded-xl text-xs resize-none border-rose-200"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs hover:bg-rose-700 transition"
                >
                  {actionLoading ? 'Escalating...' : 'Confirm Escalation to Super Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => setEscalatingIssue(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-700 font-extrabold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
