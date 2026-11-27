import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, AlertTriangle, CheckCircle2, Building, Layers, LifeBuoy, ArrowUpRight, Search, FileText } from 'lucide-react';

export default function SuperAdminSpace({ user, onNavigate }) {
  const [overview, setOverview] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolutionMsg, setResolutionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ffsd_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resOverview, resIssues] = await Promise.all([
        fetch('/api/hierarchy/overview', { headers }),
        fetch('/api/hierarchy/issues', { headers })
      ]);

      if (resOverview.ok) {
        const data = await resOverview.json();
        setOverview(data);
      }

      if (resIssues.ok) {
        const data = await resIssues.json();
        setIssues(data.issues || []);
      }
    } catch (err) {
      console.error('Error loading Super Admin data:', err);
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

      setFeedbackMsg('Issue resolved successfully.');
      setSelectedIssue(null);
      setResolutionMsg('');
      fetchData();
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const escalatedToAdminCount = issues.filter(i => i.status === 'ESCALATED_TO_ADMIN').length;

  return (
    <div className="space-y-8 animate-fadeIn pb-12 text-[#26334A]">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-light border border-white shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Executive Oversight & Owner Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26334A] mt-2">
              Super Admin Executive Portal
            </h1>
            <p className="text-xs text-[#64748B] font-medium">
              System-wide 4-department hierarchy monitoring, department managers directory, and top-level issue escalation control.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 text-center">
              <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">Admin Escalations</span>
              <span className="text-xl font-extrabold text-indigo-900">{escalatedToAdminCount} Critical</span>
            </div>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
          {feedbackMsg}
        </div>
      )}

      {/* 4 DEPARTMENTS GRID */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-600" />
          <span>Organizational Departments (4 Departments)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { id: 'EVENT_MANAGEMENT', title: 'Event Management', color: 'from-purple-50 to-indigo-50', border: 'border-purple-200', icon: Layers, badge: 'purple' },
            { id: 'ONSITE_COORDINATION', title: 'Onsite Coordination', color: 'from-teal-50 to-emerald-50', border: 'border-teal-200', icon: Users, badge: 'teal' },
            { id: 'REVENUE', title: 'Revenue Operations', color: 'from-amber-50 to-orange-50', border: 'border-amber-200', icon: ShieldCheck, badge: 'amber' },
            { id: 'IT_SUPPORT', title: 'IT Support', color: 'from-blue-50 to-sky-50', border: 'border-blue-200', icon: LifeBuoy, badge: 'blue' }
          ].map(deptInfo => {
            const deptData = overview?.departments?.[deptInfo.id];
            const Icon = deptInfo.icon;
            const mgr = deptData?.manager;
            const members = deptData?.members || [];

            return (
              <div key={deptInfo.id} className={`p-5 rounded-3xl bg-gradient-to-br ${deptInfo.color} border ${deptInfo.border} shadow-xs space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-white shadow-2xs">
                    <Icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                    {members.length} Members
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-[#26334A]">{deptInfo.title}</h3>
                  <p className="text-[11px] text-[#64748B]">Manager: <strong>{mgr?.name || 'Assigned Manager'}</strong></p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Department Team & Current Activities</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-[11px]">
                    {members.map(m => {
                      const isAvailable = m.status === 'AVAILABLE';
                      const isEscalated = m.status === 'ESCALATED';
                      return (
                        <div key={m.id} className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-[#26334A]">{m.name}</span>
                            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${isAvailable ? 'bg-slate-100 text-slate-700' : isEscalated ? 'bg-rose-100 text-rose-900 animate-pulse' : 'bg-indigo-100 text-indigo-900'}`}>
                              {m.status === 'IN_PROGRESS' ? 'IN PROGRESS' : m.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 font-medium truncate">{m.currentActivity || 'No active assignment'}</p>
                          {m.eventName && <p className="text-[9px] text-indigo-700 font-semibold truncate">Event: {m.eventName}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOP-LEVEL ESCALATIONS QUEUE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Escalated Issues Queue (Super Admin Attention)</span>
          </h2>
          <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            {escalatedToAdminCount} Critical Escalations
          </span>
        </div>

        <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
          {issues.length === 0 ? (
            <p className="text-xs text-[#64748B] text-center py-6">No issues logged in system.</p>
          ) : (
            <div className="space-y-3">
              {issues.map(iss => {
                const isEscalatedToAdmin = iss.status === 'ESCALATED_TO_ADMIN';
                return (
                  <div key={iss.id} className={`p-4 rounded-2xl border transition ${isEscalatedToAdmin ? 'bg-rose-50/80 border-rose-200' : 'bg-white/80 border-slate-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                        <p className="text-[10px] text-[#64748B]">Reporter: {iss.reporterName} • Dept: {iss.department || 'GENERAL'} • Created: {iss.createdAt}</p>
                        {iss.escalationReason && (
                          <p className="text-[10px] text-rose-800 font-bold bg-rose-100/60 p-1.5 rounded-lg border border-rose-200/80">
                            Escalation Reason: {iss.escalationReason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${iss.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-900' : iss.status === 'ESCALATED_TO_ADMIN' ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-100 text-amber-900'}`}>
                          {iss.status}
                        </span>
                        {iss.status !== 'RESOLVED' && (
                          <button
                            onClick={() => setSelectedIssue(iss)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs transition shadow-2xs"
                          >
                            Resolve Issue
                          </button>
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
            <h3 className="text-lg font-extrabold text-[#26334A]">Super Admin Resolution</h3>
            <p className="text-xs text-[#64748B]">Resolving issue logged by <strong>{selectedIssue.reporterName}</strong> ({selectedIssue.department})</p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#26334A] font-medium">
              "{selectedIssue.description}"
            </div>

            <form onSubmit={handleResolveIssue} className="space-y-3">
              <textarea
                required
                rows={3}
                value={resolutionMsg}
                onChange={(e) => setResolutionMsg(e.target.value)}
                placeholder="Enter executive resolution instructions or details..."
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

      {/* USER ACCESS SIGN-IN REGISTER CARD */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>User Access & Sign-In Activity Register</span>
          </h2>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Persistent backend/logs/user_access.log
          </span>
        </div>

        <UserAccessRegisterList />
      </div>

    </div>
  );
}

function UserAccessRegisterList() {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    fetchAccessLogs();
  }, []);

  const fetchAccessLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/auth/access-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching access logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (loadingLogs) {
    return <div className="p-6 text-center text-slate-500 font-medium text-xs">Loading sign-in register entries...</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
      {logs.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">No recent sign-in log entries recorded yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                <th className="pb-3">Timestamp (IST)</th>
                <th className="pb-3">User / Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">IP / Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 text-slate-500 text-[11px] whitespace-nowrap font-mono">{log.timestamp}</td>
                  <td className="py-3">
                    <div className="font-extrabold text-slate-900">{log.name || log.email}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{log.email}</div>
                  </td>
                  <td className="py-3 font-extrabold text-slate-800 text-[11px]">{log.role || '-'}</td>
                  <td className="py-3 text-slate-600 text-[11px]">{log.department || '-'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      log.status === 'LOGIN_SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                      log.status === 'LOGIN_FAILED' ? 'bg-rose-100 text-rose-800' :
                      log.status === 'USER_CREATED' ? 'bg-purple-100 text-purple-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {log.status || log.action || 'ACCESS'}
                    </span>
                  </td>
                  <td className="py-3 text-[10px] text-slate-500">
                    <div>{log.ip || '127.0.0.1'}</div>
                    <div className="text-slate-400">{log.user_agent || log.user_agent}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
