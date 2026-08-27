import React, { useState, useEffect } from 'react';
import { LifeBuoy, AlertTriangle, CheckCircle2, ArrowUpRight, Users, Clock, ShieldCheck, Wrench, Send, UserPlus, X, Key, Check } from 'lucide-react';

export default function ITSupportSpace({ user, onNavigate }) {
  const [issues, setIssues] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [escalatingIssue, setEscalatingIssue] = useState(null);
  const [resolutionMsg, setResolutionMsg] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // User Management State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('CLIENT');
  const [newUserOrg, setNewUserOrg] = useState('');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userCreationResult, setUserCreationResult] = useState(null);
  const [userCreationError, setUserCreationError] = useState('');

  const VALID_ROLES_LIST = [
    'CLIENT',
    'ATTENDEE',
    'EVENT_MANAGER',
    'ONSITE_COORDINATOR',
    'REVENUE',
    'IT_SUPPORT',
    'DEPARTMENT_MANAGER',
    'SUPER_ADMIN',
    'ADMIN',
  ];

  useEffect(() => {
    fetchIssues();
    fetchUsers();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/hierarchy/issues', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
      }
    } catch (err) {
      console.error('Error fetching IT Support issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserList(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users list:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setUserCreationError('');
    setUserCreationResult(null);

    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          organization: newUserOrg || undefined,
          department: newUserDept || undefined,
          password: newUserPassword || undefined,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create user account.');
      }

      setUserCreationResult(data);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserOrg('');
      setNewUserDept('');
      setNewUserPassword('');
      fetchUsers();
    } catch (err) {
      setUserCreationError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignToMe = async (issueId) => {
    setActionLoading(true);
    setFeedbackMsg('');
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/hierarchy/issues/${issueId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignedUserId: user.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign issue.');

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
      if (!res.ok) throw new Error(data.error || 'Failed to resolve technical issue.');

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
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/hierarchy/issues/${escalatingIssue.id}/escalate-to-manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: escalateReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to escalate to IT Support Manager.');

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
            <button
              onClick={() => {
                setIsAddUserOpen(true);
                setUserCreationResult(null);
                setUserCreationError('');
              }}
              className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span>User Management ({userList.length} Accounts)</span>
          </h2>
          <button
            onClick={() => {
              setIsAddUserOpen(true);
              setUserCreationResult(null);
              setUserCreationError('');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-sky-400" />
            <span>Create New User</span>
          </button>
        </div>

        <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#64748B] font-extrabold uppercase tracking-wider">
                  <th className="pb-3 px-2">Name</th>
                  <th className="pb-3 px-2">Email</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 px-2">Organization</th>
                  <th className="pb-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-[#26334A]">
                {userList.slice(0, 10).map((u) => (
                  <tr key={u.id} className="hover:bg-white/50 transition">
                    <td className="py-3 px-2 font-bold">{u.name}</td>
                    <td className="py-3 px-2 text-slate-600">{u.email}</td>
                    <td className="py-3 px-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-900 border border-sky-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-500">{u.organization || 'N/A'}</td>
                    <td className="py-3 px-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TECHNICAL TICKETS QUEUE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
            <Wrench className="w-5 h-5 text-sky-600" />
            <span>Technical Tickets Queue ({techIssues.length})</span>
          </h2>
        </div>

        <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
          {techIssues.length === 0 ? (
            <p className="text-xs text-[#64748B] text-center py-6">No technical issues logged.</p>
          ) : (
            <div className="space-y-3">
              {techIssues.map(iss => {
                const isMyAssigned = iss.assignedUserId === user?.id;
                return (
                  <div key={iss.id} className={`p-4 rounded-2xl border transition ${isMyAssigned ? 'bg-sky-50/90 border-sky-200' : 'bg-white/80 border-slate-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-sky-100 text-sky-900 border border-sky-200">
                            TECHNICAL
                          </span>
                          <span className="text-xs font-extrabold text-[#26334A]">{iss.category}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${iss.priority === 'Critical' || iss.priority === 'High' ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-900'}`}>
                            {iss.priority}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#26334A]">{iss.description}</p>
                        <p className="text-[10px] text-[#64748B]">Reported by: {iss.reporterName} • Created: {iss.createdAt}</p>
                        {iss.escalationReason && (
                          <p className="text-[10px] text-amber-900 font-bold bg-amber-100/60 p-1.5 rounded-lg border border-amber-200">
                            Escalation Rationale: {iss.escalationReason}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${iss.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-900' : iss.status === 'ESCALATED_TO_MANAGER' ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-sky-100 text-sky-900'}`}>
                          {iss.status}
                        </span>

                        {iss.status !== 'RESOLVED' && (
                          <>
                            {!iss.assignedUserId && (
                              <button
                                onClick={() => handleAssignToMe(iss.id)}
                                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition shadow-2xs"
                              >
                                Take Ticket
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedIssue(iss)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-2xs"
                            >
                              Resolve
                            </button>

                            {iss.status !== 'ESCALATED_TO_MANAGER' && (
                              <button
                                onClick={() => setEscalatingIssue(iss)}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs transition shadow-2xs flex items-center gap-1"
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
          )}
        </div>
      </div>

      {/* IT SUPPORT USER CREATION MODAL */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-modal-light rounded-3xl p-6 sm:p-8 border border-white shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-900 border border-sky-200">
                  IT Support User Provisioning
                </span>
                <h3 className="text-xl font-extrabold text-[#26334A] mt-1">
                  Create New User Account
                </h3>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userCreationError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
                ✕ {userCreationError}
              </div>
            )}

            {userCreationResult ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>{userCreationResult.message}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs space-y-1 font-mono text-slate-800">
                  <div><strong>Email:</strong> {userCreationResult.user?.email}</div>
                  <div><strong>Role:</strong> {userCreationResult.user?.role}</div>
                  <div><strong>Initial Password:</strong> <span className="font-extrabold text-indigo-700">{userCreationResult.initialPassword}</span></div>
                </div>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Provide these credentials to the user. The user can now sign in directly with their authorized role workflow.
                </p>
                <button
                  onClick={() => setUserCreationResult(null)}
                  className="w-full py-2 rounded-xl bg-emerald-700 text-white font-extrabold text-xs hover:bg-emerald-800 transition"
                >
                  Create Another User
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full p-2.5 glass-input-light rounded-xl text-xs font-medium focus:border-sky-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. sarah@company.com"
                    className="w-full p-2.5 glass-input-light rounded-xl text-xs font-medium focus:border-sky-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 block">Application Role *</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full p-2.5 glass-input-light rounded-xl text-xs font-bold focus:border-sky-400 text-slate-900 bg-white"
                    >
                      {VALID_ROLES_LIST.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 block">Organization (Optional)</label>
                    <input
                      type="text"
                      value={newUserOrg}
                      onChange={(e) => setNewUserOrg(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full p-2.5 glass-input-light rounded-xl text-xs font-medium focus:border-sky-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 block">Initial Password (Optional)</label>
                  <input
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Leave empty to auto-generate secure password"
                    className="w-full p-2.5 glass-input-light rounded-xl text-xs font-medium focus:border-sky-400"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {actionLoading ? 'Creating User Account...' : 'Create User Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-700 font-extrabold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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

