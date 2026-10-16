import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  X, 
  Check, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  Building, 
  Mail, 
  Lock, 
  ChevronLeft, 
  ChevronRight,
  Activity
} from 'lucide-react';

export default function UserManagementSection({ user, accentColor = 'sky' }) {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search, Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('roleHierarchy');
  const [sortAsc, setSortAsc] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [creationError, setCreationError] = useState('');
  const [creationResult, setCreationResult] = useState(null);

  // Form Fields
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('CLIENT');
  const [newUserOrg, setNewUserOrg] = useState('');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Determine allowed roles for creation based on current actor
  const actorRole = (user?.role || '').toUpperCase();
  const actorDept = (user?.department || '').toUpperCase();

  const isSuperAdminOrAdmin = actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN';
  const isITManager = actorRole === 'DEPARTMENT_MANAGER' && actorDept === 'IT_SUPPORT';
  const isITSupport = actorRole === 'IT_SUPPORT';

  const allowedCreationRoles = isSuperAdminOrAdmin
    ? ['CLIENT', 'ATTENDEE', 'EVENT_MANAGER', 'ONSITE_COORDINATOR', 'REVENUE', 'IT_SUPPORT', 'DEPARTMENT_MANAGER', 'SPEAKER', 'ADMIN']
    : isITManager
    ? ['CLIENT', 'ATTENDEE', 'EVENT_MANAGER', 'ONSITE_COORDINATOR', 'IT_SUPPORT', 'SPEAKER']
    : isITSupport
    ? ['CLIENT', 'ATTENDEE', 'EVENT_MANAGER', 'ONSITE_COORDINATOR', 'SPEAKER']
    : [];

  const canCreateUser = allowedCreationRoles.length > 0;

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('ffsd_token');
      if (!token) {
        setError('Authentication session not found. Please sign in again.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || `Unable to load users (HTTP ${res.status}).`);
      }

      const userList = Array.isArray(data.users) ? data.users : [];
      setUsers(userList);
      setTotalCount(typeof data.total === 'number' ? data.total : userList.length);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to retrieve user accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setCreationError('');
    setCreationResult(null);

    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
          organization: newUserOrg.trim() || undefined,
          department: newUserDept.trim() || (newUserRole === 'IT_SUPPORT' ? 'IT_SUPPORT' : undefined),
          password: newUserPassword.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create user account.');
      }

      setCreationResult(data);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserOrg('');
      setNewUserDept('');
      setNewUserPassword('');
      fetchUsers();
    } catch (err) {
      setCreationError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const ROLE_PRIORITY = {
    IT_SUPPORT: 1,
    DEPARTMENT_MANAGER: 2,
    EVENT_MANAGER: 3,
    ONSITE_COORDINATOR: 4,
    REVENUE: 5,
    CLIENT: 6,
    SPEAKER: 7,
    ADMIN: 8,
    SUPER_ADMIN: 9,
    ATTENDEE: 10,
  };

  const getRoleBadgeStyle = (role) => {
    switch ((role || '').toUpperCase()) {
      case 'IT_SUPPORT':
        return 'bg-cyan-50 text-cyan-800 border-cyan-300';
      case 'DEPARTMENT_MANAGER':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300';
      case 'EVENT_MANAGER':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'ONSITE_COORDINATOR':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'REVENUE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'CLIENT':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'SPEAKER':
        return 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300';
      case 'ATTENDEE':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  // Distinct roles and counts
  const distinctRoles = Array.from(new Set(users.map((u) => u.role).filter(Boolean)));

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term)) ||
      (u.organization && u.organization.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (selectedRoleFilter !== 'ALL' && (u.role || '').toUpperCase() !== selectedRoleFilter.toUpperCase()) {
      return false;
    }

    if (selectedStatusFilter !== 'ALL' && (u.status || 'ACTIVE').toUpperCase() !== selectedStatusFilter.toUpperCase()) {
      return false;
    }

    return true;
  });

  // Sort list
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'roleHierarchy') {
      const prioA = ROLE_PRIORITY[(a.role || '').toUpperCase()] || 99;
      const prioB = ROLE_PRIORITY[(b.role || '').toUpperCase()] || 99;
      cmp = prioA - prioB;
      if (cmp === 0) {
        cmp = (a.name || '').localeCompare(b.name || '');
      }
    } else if (sortField === 'name') {
      cmp = (a.name || '').localeCompare(b.name || '');
    } else if (sortField === 'email') {
      cmp = (a.email || '').localeCompare(b.email || '');
    } else if (sortField === 'role') {
      cmp = (a.role || '').localeCompare(b.role || '');
    } else if (sortField === 'organization') {
      cmp = (a.organization || '').localeCompare(b.organization || '');
    } else if (sortField === 'status') {
      const statA = (a.status || 'ACTIVE').toUpperCase();
      const statB = (b.status || 'ACTIVE').toUpperCase();
      cmp = statA.localeCompare(statB);
    }
    return sortAsc ? cmp : -cmp;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / pageSize) || 1;
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const primaryBtnClass = accentColor === 'teal'
    ? 'bg-teal-600 hover:bg-teal-700 text-white'
    : 'bg-[#26334A] hover:bg-slate-800 text-white';

  const iconColor = accentColor === 'teal' ? 'text-teal-600' : 'text-sky-600';

  return (
    <div className="space-y-4">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
          <Users className={`w-5 h-5 ${iconColor}`} />
          <span>User Management ({totalCount} Accounts)</span>
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            title="Refresh user directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          {canCreateUser && (
            <button
              onClick={() => {
                setIsModalOpen(true);
                setCreationResult(null);
                setCreationError('');
                setNewUserRole(allowedCreationRoles[0] || 'CLIENT');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer ${primaryBtnClass}`}
            >
              <UserPlus className="w-3.5 h-3.5 text-sky-400" />
              <span>Create New User</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK ROLE FILTER PILLS */}
      <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
        <button
          onClick={() => {
            setSelectedRoleFilter('ALL');
            setCurrentPage(1);
          }}
          className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
            selectedRoleFilter === 'ALL'
              ? 'bg-[#26334A] text-white border-[#26334A] shadow-xs'
              : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Roles ({users.length})
        </button>
        {distinctRoles.map((r) => {
          const count = users.filter((u) => u.role === r).length;
          const isSelected = selectedRoleFilter === r;
          return (
            <button
              key={r}
              onClick={() => {
                setSelectedRoleFilter(r);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition cursor-pointer border ${
                isSelected
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : `${getRoleBadgeStyle(r)} hover:opacity-85`
              }`}
            >
              {r.replace('_', ' ')} ({count})
            </button>
          );
        })}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl glass-light border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search accounts by name, email, role, or organization..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-[#26334A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter Dropdown */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => {
              setSelectedRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="ALL">All Roles ({users.length})</option>
            {distinctRoles.map((r) => {
              const count = users.filter((u) => u.role === r).length;
              return (
                <option key={r} value={r}>
                  {r.replace('_', ' ')} ({count})
                </option>
              );
            })}
          </select>

          {/* Status Filter Dropdown */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => {
              setSelectedStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Page Size Selector */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>All / page</option>
          </select>
        </div>
      </div>

      {/* USERS TABLE CONTAINER */}
      <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Activity className="w-6 h-6 text-sky-600 animate-spin" />
            <p className="text-xs text-slate-500 font-bold">Loading real-time user directory from server...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between gap-3">
            <span>⚠️ {error}</span>
            <button
              onClick={fetchUsers}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[11px] transition shadow-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#64748B] font-medium space-y-2">
            <p>No user accounts found matching your search or filter criteria.</p>
            {(searchTerm || selectedRoleFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRoleFilter('ALL');
                  setSelectedStatusFilter('ALL');
                  setCurrentPage(1);
                }}
                className="text-sky-600 hover:underline font-bold text-xs"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[#64748B] font-extrabold uppercase tracking-wider select-none">
                    <th 
                      onClick={() => handleSort('name')} 
                      className="pb-3 px-2 cursor-pointer hover:text-slate-900 transition"
                    >
                      <span className="flex items-center gap-1">
                        Name
                        {sortField === 'name' && (sortAsc ? ' ↑' : ' ↓')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleSort('email')} 
                      className="pb-3 px-2 cursor-pointer hover:text-slate-900 transition"
                    >
                      <span className="flex items-center gap-1">
                        Email
                        {sortField === 'email' && (sortAsc ? ' ↑' : ' ↓')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleSort('role')} 
                      className="pb-3 px-2 cursor-pointer hover:text-slate-900 transition"
                    >
                      <span className="flex items-center gap-1">
                        Role
                        {sortField === 'role' && (sortAsc ? ' ↑' : ' ↓')}
                        {sortField === 'roleHierarchy' && ' ★'}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleSort('organization')} 
                      className="pb-3 px-2 cursor-pointer hover:text-slate-900 transition"
                    >
                      <span className="flex items-center gap-1">
                        Organization
                        {sortField === 'organization' && (sortAsc ? ' ↑' : ' ↓')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleSort('status')} 
                      className="pb-3 px-2 cursor-pointer hover:text-slate-900 transition"
                    >
                      <span className="flex items-center gap-1">
                        Status
                        {sortField === 'status' && (sortAsc ? ' ↑' : ' ↓')}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[#26334A]">
                  {paginatedUsers.map((u) => {
                    const isActive = (u.status || '').toUpperCase() === 'ACTIVE' || u.emailVerified;
                    const roleBadgeClass = getRoleBadgeStyle(u.role);
                    return (
                      <tr key={u.id} className="hover:bg-white/60 transition">
                        <td className="py-3 px-2 font-bold text-[#26334A]">{u.name}</td>
                        <td className="py-3 px-2 text-slate-600 font-mono text-[11px]">{u.email}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${roleBadgeClass}`}>
                            {(u.role || '').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-600">
                          {u.organization ? (
                            <span className="font-medium text-slate-700">{u.organization}</span>
                          ) : (
                            <span className="text-slate-400 font-mono">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                : 'bg-amber-100 text-amber-900 border-amber-200'
                            }`}
                          >
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
              <div>
                Showing{' '}
                <strong className="text-slate-700">
                  {sortedUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-700">
                  {Math.min(currentPage * pageSize, sortedUsers.length)}
                </strong>{' '}
                of <strong className="text-slate-700">{sortedUsers.length}</strong> accounts
                {sortedUsers.length !== totalCount && ` (filtered from ${totalCount} total)`}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-2 text-xs font-bold text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* CREATE NEW USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-modal-light rounded-3xl p-6 sm:p-8 border border-white shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-900 border border-sky-200">
                  User Provisioning
                </span>
                <h3 className="text-xl font-extrabold text-[#26334A] mt-1">
                  Create New User Account
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {creationError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
                ✕ {creationError}
              </div>
            )}

            {creationResult ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>{creationResult.message}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs space-y-1 font-mono text-slate-800">
                  <div><strong>Email:</strong> {creationResult.user?.email}</div>
                  <div><strong>Role:</strong> {creationResult.user?.role}</div>
                  {creationResult.user?.organization && (
                    <div><strong>Organization:</strong> {creationResult.user?.organization}</div>
                  )}
                  <div><strong>Initial Password:</strong> <span className="font-extrabold text-indigo-700">{creationResult.initialPassword}</span></div>
                </div>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Provide these credentials to the user. The user can now sign in directly with their authorized role workflow.
                </p>
                <button
                  onClick={() => setCreationResult(null)}
                  className="w-full py-2 rounded-xl bg-emerald-700 text-white font-extrabold text-xs hover:bg-emerald-800 transition cursor-pointer"
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
                      {allowedCreationRoles.map((r) => (
                        <option key={r} value={r}>
                          {r.replace('_', ' ')}
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
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
