import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { LifeBuoy, AlertTriangle, CheckCircle2, ArrowUpRight, Users, Clock, ShieldCheck, Wrench, Send, UserPlus, X, Key, Check } from 'lucide-react';
import UserManagementSection from '../../../shared/components/UserManagementSection';
import {
  fetchIssuesData,
  assignIssueAction,
  resolveIssueAction,
  escalateIssueAction
} from '../../../store/issues-actions';

export default function ITSupportSpace({ user, onNavigate }) {
  const dispatch = useDispatch();
  const issues = useSelector((state) => state.issues.issues);
  const [loading, setLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [escalatingIssue, setEscalatingIssue] = useState(null);
  const [resolutionMsg, setResolutionMsg] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [issueFilterTab, setIssueFilterTab] = useState('ALL'); // 'ALL' | 'MY_ASSIGNED' | 'UNASSIGNED'

  const fetchIssues = () => dispatch(fetchIssuesData());

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleAssignToMe = async (issueId) => {
    setActionLoading(true);
    setFeedbackMsg('');
    try {
      const res = await dispatch(assignIssueAction(issueId, user.id));
      if (!res.success) throw new Error(res.error || 'Failed to assign issue.');

      setFeedbackMsg('Issue assigned to you.');
      fetchIssues();
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveIssue = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setActionLoading(true);
    setFeedbackMsg('');
    try {
      const res = await dispatch(resolveIssueAction(selectedIssue.id, resolutionMsg));
      if (!res.success) throw new Error(res.error || 'Failed to resolve technical issue.');

      setFeedbackMsg('Technical issue resolved.');
      setSelectedIssue(null);
      setResolutionMsg('');
      fetchIssues();
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalateToITManager = async (e) => {
    e.preventDefault();
    if (!escalatingIssue) return;
    setActionLoading(true);
    setFeedbackMsg('');
    try {
      const res = await dispatch(escalateIssueAction(escalatingIssue.id, escalateReason, 'manager'));
      if (!res.success) throw new Error(res.error || 'Failed to escalate to IT Support Manager.');

      setFeedbackMsg('Issue escalated to IT Support Manager.');
      setEscalatingIssue(null);
      setEscalateReason('');
      fetchIssues();
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const techIssues = issues.filter(i => i.department === 'IT_SUPPORT' || i.issueType === 'TECHNICAL');

  return (
    <div className="space-y-8 animate-fadeIn pb-12 text-[#26334A]">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-light border border-white shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Technical & System Support Services
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26334A] mt-2">
              IT Support Specialist Desk
            </h1>
            <p className="text-xs text-[#64748B] font-medium">
              First-level technical resolution desk for user login errors, system bugs, email issues, and user account creation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 text-center">
              <span className="text-[10px] font-extrabold text-sky-700 uppercase tracking-wider block">Technical Queue</span>
              <span className="text-xl font-extrabold text-sky-900">{techIssues.filter(i => i.status !== 'RESOLVED').length} Active Tickets</span>
            </div>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-semibold">
          {feedbackMsg}
        </div>
      )}

      {/* USER MANAGEMENT SECTION */}
      <UserManagementSection user={user} accentColor="sky" />

      {/* TECHNICAL TICKETS QUEUE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
            <Wrench className="w-5 h-5 text-sky-600" />
            <span>Technical Tickets Queue ({techIssues.length})</span>
          </h2>

          {/* Ticket Queue Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'ALL', label: `All Tickets (${techIssues.length})` },
              { id: 'MY_ASSIGNED', label: `Assigned to Me (${techIssues.filter(i => i.assignedUserId === user?.id && i.status !== 'RESOLVED').length})` },
              { id: 'UNASSIGNED', label: `Unassigned (${techIssues.filter(i => !i.assignedUserId && i.status !== 'RESOLVED').length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setIssueFilterTab(tab.id)}
                className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                  issueFilterTab === tab.id
                    ? 'bg-white text-[#26334A] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
          {(() => {
            const displayIssues = techIssues.filter(iss => {
              if (issueFilterTab === 'MY_ASSIGNED') return iss.assignedUserId === user?.id;
              if (issueFilterTab === 'UNASSIGNED') return !iss.assignedUserId;
              return true;
            });

            if (displayIssues.length === 0) {
              return (
                <p className="text-xs text-[#64748B] text-center py-6">
                  {issueFilterTab === 'MY_ASSIGNED'
                    ? 'No active tickets currently assigned to you.'
                    : issueFilterTab === 'UNASSIGNED'
                    ? 'No unassigned tickets in queue.'
                    : 'No technical issues logged.'}
                </p>
              );
            }

            return (
              <div className="space-y-3">
                {displayIssues.map(iss => {
                  const isMyAssigned = iss.assignedUserId === user?.id;
                  const isAssigned = !!iss.assignedUserId;

                  return (
                    <div
                      key={iss.id}
                      className={`p-4 rounded-2xl border transition ${
                        isMyAssigned
                          ? 'bg-sky-50/90 border-sky-300 ring-1 ring-sky-200'
                          : 'bg-white/80 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-sky-100 text-sky-900 border border-sky-200">
                              TECHNICAL
                            </span>
                            <span className="text-xs font-extrabold text-[#26334A]">{iss.category}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                iss.priority === 'Critical' || iss.priority === 'High'
                                  ? 'bg-rose-100 text-rose-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {iss.priority}
                            </span>

                            {/* Assignee Badge */}
                            {isMyAssigned ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Assigned to You</span>
                              </span>
                            ) : isAssigned ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-500" />
                                <span>Assignee: {iss.assignedUserName || 'Staff Member'}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Unassigned
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-[#26334A]">{iss.description}</p>
                          <p className="text-[10px] text-[#64748B]">
                            Reported by: {iss.reporterName} • Created: {iss.createdAt}
                            {iss.assignedAt && ` • Assigned: ${iss.assignedAt}`}
                          </p>
                          {iss.escalationReason && (
                            <p className="text-[10px] text-amber-900 font-bold bg-amber-100/60 p-1.5 rounded-lg border border-amber-200">
                              Escalation Rationale: {iss.escalationReason}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              iss.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-900'
                                : iss.status === 'ESCALATED_TO_MANAGER'
                                ? 'bg-amber-100 text-amber-900 font-bold'
                                : 'bg-sky-100 text-sky-900'
                            }`}
                          >
                            {iss.status}
                          </span>

                          {iss.status !== 'RESOLVED' && (
                            <>
                              {!iss.assignedUserId && (
                                <button
                                  onClick={() => handleAssignToMe(iss.id)}
                                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer"
                                >
                                  Take Ticket
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedIssue(iss)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer"
                              >
                                Resolve
                              </button>

                              {iss.status !== 'ESCALATED_TO_MANAGER' && iss.status !== 'ESCALATED_TO_ADMIN' && (
                                <button
                                  onClick={() => setEscalatingIssue(iss)}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs transition shadow-2xs flex items-center gap-1 cursor-pointer"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                  <span>Escalate to IT Manager</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* RESOLUTION MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-modal-light rounded-3xl p-6 border border-white shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-[#26334A]">Technical Ticket Resolution</h3>
            <p className="text-xs text-[#64748B]">Resolving technical issue reported by <strong>{selectedIssue.reporterName}</strong></p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#26334A] font-medium">
              "{selectedIssue.description}"
            </div>

            <form onSubmit={handleResolveIssue} className="space-y-3">
              <textarea
                required
                rows={3}
                value={resolutionMsg}
                onChange={(e) => setResolutionMsg(e.target.value)}
                placeholder="Enter technical fix / resolution details..."
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

      {/* ESCALATE TO IT MANAGER MODAL */}
      {escalatingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-modal-light rounded-3xl p-6 border border-white shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-amber-900">Escalate to IT Support Manager</h3>
            <p className="text-xs text-[#64748B]">Escalating unresolved technical ticket to IT Support Manager</p>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
              "{escalatingIssue.description}"
            </div>

            <form onSubmit={handleEscalateToITManager} className="space-y-3">
              <textarea
                required
                rows={3}
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="Provide reason for escalating (e.g. Needs system admin access / database config fix)..."
                className="w-full p-3 glass-input-light rounded-xl text-xs resize-none border-amber-200"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-extrabold text-xs hover:bg-amber-700 transition"
                >
                  {actionLoading ? 'Escalating...' : 'Confirm Escalation to IT Manager'}
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

