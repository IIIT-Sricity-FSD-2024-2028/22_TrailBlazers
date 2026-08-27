import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Send, 
  Save, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  Building, 
  Calendar, 
  MapPin, 
  Layers, 
  ShieldAlert, 
  ChevronRight, 
  RefreshCw,
  Mail
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import AssignEventManagerModal from '../components/AssignEventManagerModal';

export default function RevenueSpace({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'event-requests' | 'builder' | 'analytics' | 'clients'
  const [dashboardData, setDashboardData] = useState(null);
  const [requestsList, setRequestsList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selected Request & Quotation Builder State
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [requestDetail, setRequestDetail] = useState(null);
  const [lineItems, setLineItems] = useState([
    { description: 'Venue Rental & Stage Setup Support', quantity: 1, unitPrice: 40000, subtotal: 40000 },
    { description: 'Audio/Visual & Projection Infrastructure', quantity: 1, unitPrice: 25000, subtotal: 25000 },
    { description: 'Digital Registration Desks & Badge Printing', quantity: 2, unitPrice: 5000, subtotal: 10000 }
  ]);
  const [discount, setDiscount] = useState(5000);
  const [taxPercent, setTaxPercent] = useState(18);
  const [notes, setNotes] = useState('Custom commercial proposal prepared for expected attendance and technical stage requirements.');
  const [terms, setTerms] = useState('1. 50% advance payment required upon acceptance.\n2. Proposal valid for 14 calendar days.');
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderMsg, setBuilderMsg] = useState('');
  const [builderError, setBuilderError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Event Manager Availability & Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetReq, setAssignTargetReq] = useState(null);

  // Pagination State (6 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const handleOpenAssignModal = (reqItem) => {
    setAssignTargetReq(reqItem);
    setAssignModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchDashboard();
    fetchRequests();
    fetchAnalytics();
    fetchClients();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('ffsd_token');
    const headers = { 'x-role': 'REVENUE' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/revenue/dashboard', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error fetching revenue dashboard:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/revenue/event-requests', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRequestsList(data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching event requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/revenue/analytics', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/revenue/clients', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setClientsList(data.clients || []);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleOpenBuilderForRequest = async (reqId) => {
    setSelectedReqId(reqId);
    setBuilderMsg('');
    setBuilderError('');
    setBuilderLoading(true);
    setActiveTab('builder');

    try {
      const res = await fetch(`/api/revenue/event-requests/${reqId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRequestDetail(data);

        // Pre-fill existing line items if available
        if (data.lineItems && data.lineItems.length > 0) {
          setLineItems(data.lineItems.map(i => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.subtotal
          })));
        } else {
          setLineItems([
            { description: `${data.request.eventName} - Core Venue & Operations`, quantity: 1, unitPrice: 45000, subtotal: 45000 },
            { description: 'Registration Desk & Badge Printing Stations', quantity: 2, unitPrice: 5000, subtotal: 10000 },
            { description: 'Stage Audio/Visual & Lighting Package', quantity: 1, unitPrice: 20000, subtotal: 20000 }
          ]);
        }

        if (data.activeVersion) {
          setDiscount(data.activeVersion.discount || 0);
          setTaxPercent(data.activeVersion.taxPercent || 18);
          setNotes(data.activeVersion.notes || '');
          setTerms(data.activeVersion.terms || '');
        }
      }
    } catch (err) {
      setBuilderError('Failed to load request details.');
    } finally {
      setBuilderLoading(false);
    }
  };

  // Financial calculations on frontend (revalidated on backend!)
  const calculateSubtotal = () => lineItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  const subtotal = calculateSubtotal();
  const taxableBase = Math.max(0, subtotal - Number(discount || 0));
  const taxAmount = Math.round((taxableBase * Number(taxPercent || 0)) / 100);
  const finalTotal = taxableBase + taxAmount;

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: 'Additional Commercial Service', quantity: 1, unitPrice: 5000, subtotal: 5000 }]);
  };

  const handleUpdateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Math.max(1, Number(updated[index].quantity || 1));
      const p = Math.max(0, Number(updated[index].unitPrice || 0));
      updated[index].subtotal = q * p;
    }
    setLineItems(updated);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSaveQuotationDraft = async () => {
    if (!selectedReqId) return;
    setBuilderLoading(true);
    setBuilderMsg('');
    setBuilderError('');

    try {
      const res = await fetch('/api/revenue/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({
          eventRequestId: selectedReqId,
          lineItems,
          discount: Number(discount),
          taxPercent: Number(taxPercent),
          notes,
          terms
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save quotation draft.');

      setBuilderMsg(data.message);
      handleOpenBuilderForRequest(selectedReqId);
      fetchDashboard();
      fetchRequests();
    } catch (err) {
      setBuilderError(err.message);
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleSendQuotationToClient = async () => {
    if (!requestDetail?.quotation?.id) {
      // Save first then send
      await handleSaveQuotationDraft();
    }
    setBuilderLoading(true);
    setBuilderMsg('');
    setBuilderError('');

    try {
      const qtnId = requestDetail?.quotation?.id;
      if (!qtnId) throw new Error('Please save quotation draft first before sending.');

      const res = await fetch(`/api/revenue/quotations/${qtnId}/send`, {
        method: 'POST',
        headers: getHeaders()
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send quotation.');

      setBuilderMsg(data.message);
      handleOpenBuilderForRequest(selectedReqId);
      fetchDashboard();
      fetchRequests();
      fetchAnalytics();
    } catch (err) {
      setBuilderError(err.message);
    } finally {
      setBuilderLoading(false);
    }
  };

  const filteredRequests = requestsList.filter(r => {
    const matchesSearch = !searchTerm || (
      r.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const metrics = dashboardData?.metrics || {
    newRequests: 0,
    underReview: 0,
    pendingQuotes: 0,
    acceptedQuotes: 0,
    totalQuotationValue: 0,
    acceptedQuotationValue: 0
  };

  return (
    <div className="space-y-8 pb-20 text-[#26334A]">
      
      {/* 1. REVENUE WORKSPACE HEADER RIBBON */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5] border border-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-purple-700 uppercase tracking-widest">
            <Building className="w-4 h-4" />
            <span>Wavevents Commercial & Revenue Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26334A] tracking-tight mt-0.5">
            Revenue Team Workspace
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-1">
            Quotation pricing, requirement analysis, client proposals, and commercial analytics.
          </p>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
          </div>
          <div>
            <div className="text-xs font-extrabold text-[#26334A]">{user?.name || 'Revenue Specialist'}</div>
            <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Role: Revenue Team</div>
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
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('event-requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'event-requests'
              ? 'bg-[#26334A] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-white/80 hover:text-[#26334A]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Event Requests ({requestsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('builder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'builder'
              ? 'bg-[#26334A] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-white/80 hover:text-[#26334A]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Quotation Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'analytics'
              ? 'bg-[#26334A] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-white/80 hover:text-[#26334A]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Commercial Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'clients'
              ? 'bg-[#26334A] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-white/80 hover:text-[#26334A]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clients Overview</span>
        </button>
      </div>

      {/* 3. TAB CONTENT VIEWS */}

      {/* ==================== TAB 1: REVENUE DASHBOARD ==================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Top 6 Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-3xl glass-light border border-white shadow-xs space-y-1">
              <div className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">New Requests</div>
              <div className="text-2xl font-extrabold text-indigo-900">{metrics.newRequests}</div>
            </div>

            <div className="p-4 rounded-3xl glass-light border border-white shadow-xs space-y-1">
              <div className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">Under Review</div>
              <div className="text-2xl font-extrabold text-amber-700">{metrics.underReview}</div>
            </div>

            <div className="p-4 rounded-3xl glass-light border border-white shadow-xs space-y-1">
              <div className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">Pending Quotes</div>
              <div className="text-2xl font-extrabold text-purple-700">{metrics.pendingQuotes}</div>
            </div>

            <div className="p-4 rounded-3xl glass-light border border-white shadow-xs space-y-1">
              <div className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">Accepted Quotes</div>
              <div className="text-2xl font-extrabold text-emerald-700">{metrics.acceptedQuotes}</div>
            </div>

            <div className="p-4 rounded-3xl glass-light border border-white shadow-xs space-y-1 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">Pipeline Value</div>
              <div className="text-xl font-extrabold text-[#26334A] font-mono">₹{metrics.totalQuotationValue.toLocaleString()}</div>
            </div>

            <div className="p-4 rounded-3xl glass-light border border-white shadow-xs space-y-1 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">Contracted Total</div>
              <div className="text-xl font-extrabold text-emerald-700 font-mono">₹{metrics.acceptedQuotationValue.toLocaleString()}</div>
            </div>
          </div>

          {/* Priority Requests Table */}
          <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#26334A]">Priority Commercial Event Requests</h3>
                <p className="text-xs text-[#64748B]">Click any request to analyze requirements and generate custom quotations.</p>
              </div>
              <button
                onClick={() => setActiveTab('event-requests')}
                className="text-xs font-extrabold text-indigo-700 hover:underline flex items-center gap-1"
              >
                View All Requests
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[#64748B] font-extrabold uppercase tracking-wider">
                    <th className="pb-3 px-3">Event Title</th>
                    <th className="pb-3 px-3">Organization / Client</th>
                    <th className="pb-3 px-3">Date & Venue</th>
                    <th className="pb-3 px-3">Capacity</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Quote Value</th>
                    <th className="pb-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[#26334A]">
                  {dashboardData?.priorityRequests?.map((req) => (
                    <tr key={req.id} className="hover:bg-white/60 transition">
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-[#26334A]">{req.eventName}</div>
                        <div className="text-[11px] text-[#64748B]">{req.category}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold">{req.organizationName}</div>
                        <div className="text-[11px] text-slate-500">{req.contactEmail}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div>{req.eventDate}</div>
                        <div className="text-[11px] text-slate-500">{req.venue}</div>
                      </td>
                      <td className="py-3.5 px-3 font-bold">{req.expectedAttendance} Passes</td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-indigo-900">
                        {req.quotationValue ? `₹${req.quotationValue.toLocaleString()}` : 'Not Priced'}
                      </td>
                      <td className="py-3.5 px-3 text-center flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenAssignModal(req)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition border border-indigo-200 flex items-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Assign</span>
                        </button>
                        <button
                          onClick={() => handleOpenBuilderForRequest(req.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-2xs"
                        >
                          {req.quotationId ? 'Edit Quotation' : 'Create Quotation'}
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

      {/* ==================== TAB 2: EVENT REQUESTS CATALOGUE ==================== */}
      {activeTab === 'event-requests' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-2xl glass-light border border-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search event, client, email, org..."
                className="w-full pl-10 pr-4 py-2 glass-input-light rounded-xl text-xs font-medium focus:border-indigo-400"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs font-bold text-[#26334A] focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="PRICING">PRICING</option>
                <option value="QUOTATION_SENT">QUOTATION_SENT</option>
                <option value="CHANGE_REQUESTED">CHANGE_REQUESTED</option>
                <option value="COMMERCIAL_APPROVED">COMMERCIAL_APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          {/* Requests Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedRequests.map((req) => (
              <div key={req.id} className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      {req.category}
                    </span>
                    <h4 className="text-lg font-extrabold text-[#26334A] mt-1.5">{req.eventName}</h4>
                    <p className="text-xs text-[#64748B] font-bold">{req.organizationName}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-2xl bg-white/70 border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[#64748B] text-[11px] block">Date & Venue</span>
                    <span className="font-bold text-[#26334A]">{req.eventDate}</span>
                    <span className="block text-slate-500 truncate">{req.venue}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[#64748B] text-[11px] block">Capacity & Type</span>
                    <span className="font-bold text-[#26334A]">{req.expectedAttendance} Attendees</span>
                    <span className="block text-slate-500 uppercase font-mono text-[10px]">{req.eventType} Event</span>
                  </div>
                </div>

                {req.additionalNotes && (
                  <p className="text-xs text-[#64748B] line-clamp-2 italic font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{req.additionalNotes}"
                  </p>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <span className="text-[11px] font-mono text-slate-500">{req.contactEmail}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAssignModal(req)}
                      className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition border border-indigo-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Assign Manager</span>
                    </button>
                    <button
                      onClick={() => handleOpenBuilderForRequest(req.id)}
                      className="px-4 py-2 rounded-xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Analyze & Quote</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl glass-light border border-white shadow-xs gap-3">
              <span className="text-xs text-[#64748B] font-semibold">
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} Event Requests
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer shadow-2xs"
                >
                  Previous
                </button>
                <span className="text-xs font-extrabold text-[#26334A] px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200 shadow-2xs">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer shadow-2xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==================== TAB 3: QUOTATION BUILDER & REQUIREMENT ANALYSIS ==================== */}
      {activeTab === 'builder' && (
        <div className="space-y-8 animate-fadeIn">
          
          {!selectedReqId || !requestDetail ? (
            <div className="p-12 rounded-3xl glass-light border border-white text-center space-y-4">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <h3 className="text-lg font-extrabold text-[#26334A]">No Event Request Selected</h3>
                <p className="text-xs text-[#64748B]">Please select an event request from the Dashboard or Event Requests list to begin requirement analysis and quote building.</p>
              </div>
              <button
                onClick={() => setActiveTab('event-requests')}
                className="px-5 py-2.5 rounded-xl bg-[#26334A] text-white font-extrabold text-xs hover:bg-slate-800 transition"
              >
                Browse Event Requests
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Col (2 Cols): Requirement Analysis & Quotation Form */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Client Specifications Banner */}
                <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">Requirement Workspace</span>
                      <h3 className="text-xl font-extrabold text-[#26334A]">{requestDetail.request.eventName}</h3>
                      <p className="text-xs text-[#64748B]">Submitted by {requestDetail.request.organizationName} ({requestDetail.request.contactEmail})</p>
                    </div>
                    <StatusBadge status={requestDetail.request.status} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-white/80 border border-slate-100">
                      <span className="text-[#64748B] text-[10px] block">Event Date</span>
                      <span className="font-extrabold text-[#26334A]">{requestDetail.request.eventDate}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/80 border border-slate-100">
                      <span className="text-[#64748B] text-[10px] block">Venue</span>
                      <span className="font-extrabold text-[#26334A] truncate block">{requestDetail.request.venue}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/80 border border-slate-100">
                      <span className="text-[#64748B] text-[10px] block">Expected Passes</span>
                      <span className="font-extrabold text-[#26334A]">{requestDetail.request.expectedAttendance} Attendees</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/80 border border-slate-100">
                      <span className="text-[#64748B] text-[10px] block">Access Type</span>
                      <span className="font-extrabold text-indigo-700 uppercase font-mono">{requestDetail.request.eventType}</span>
                    </div>
                  </div>

                  {/* READ ONLY BANNER: Client Agenda */}
                  <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-2 text-slate-700 font-extrabold">
                      <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Client Submitted Agenda — (READ ONLY: Revenue Team cannot modify agenda)</span>
                    </div>
                    <p className="text-[#64748B] font-mono text-[11px] whitespace-pre-line leading-relaxed pl-6">
                      {requestDetail.request.agenda || '09:00 AM - Opening Keynote & Technical Presentations\n01:00 PM - Buffet Lunch & Sponsor Showcase'}
                    </p>
                  </div>

                  {/* READ ONLY BANNER: Speaker Information */}
                  <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-2 text-slate-700 font-extrabold">
                      <Users className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Client Speaker Requirements — (READ ONLY: Revenue Team cannot manage speakers)</span>
                    </div>
                    <p className="text-[#64748B] text-[11px] pl-6 font-medium">
                      Featured Keynote Speakers & Technical Panelists (client-managed).
                    </p>
                  </div>

                  {requestDetail.request.additionalNotes && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <span className="font-extrabold block">Client Additional Service Requests</span>
                      <p className="text-amber-800 font-medium leading-relaxed">{requestDetail.request.additionalNotes}</p>
                    </div>
                  )}
                </div>

                {/* Quotation Line Items Editor */}
                <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-extrabold text-[#26334A]">Commercial Line Items</h4>
                      <p className="text-xs text-[#64748B]">Convert client requirements into billable services and equipment packages.</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs transition border border-indigo-200 flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Line Item</span>
                    </button>
                  </div>

                  {/* Line Items Input Rows */}
                  <div className="space-y-3">
                    {lineItems.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white/90 border border-slate-200 grid grid-cols-12 gap-3 items-center shadow-2xs">
                        <div className="col-span-6 sm:col-span-6">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Service Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                            className="w-full px-3 py-1.5 glass-input-light rounded-lg text-xs font-medium focus:border-indigo-400"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 text-center">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleUpdateLineItem(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 glass-input-light rounded-lg text-xs text-center font-bold"
                          />
                        </div>

                        <div className="col-span-3 sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 text-right">Unit Price (₹)</label>
                          <input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateLineItem(idx, 'unitPrice', e.target.value)}
                            className="w-full px-3 py-1.5 glass-input-light rounded-lg text-xs text-right font-mono font-bold"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-1 text-right pt-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            disabled={lineItems.length <= 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terms & Notes Editors */}
                <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
                  <h4 className="text-base font-extrabold text-[#26334A]">Proposal Notes & Commercial Terms</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                        Proposal Commercial Notes
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Custom notes regarding stage layout, live streaming bandwidth..."
                        className="w-full p-3 glass-input-light rounded-xl text-xs font-medium focus:border-indigo-400 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                        Payment & Validity Terms
                      </label>
                      <textarea
                        rows={3}
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                        placeholder="1. 50% advance payment...\n2. Valid for 14 days..."
                        className="w-full p-3 glass-input-light rounded-xl text-xs font-medium focus:border-indigo-400 resize-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Col (1 Col): Financial Calculations & Version Control Panel */}
              <div className="space-y-6">
                
                <div className="sticky top-24 p-6 rounded-3xl glass-light border border-white shadow-xl space-y-6">
                  
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest">Financial Calculation</span>
                    {requestDetail.quotation && (
                      <span className="text-xs font-extrabold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                        Active V{requestDetail.quotation.currentVersion}
                      </span>
                    )}
                  </div>

                  {builderMsg && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      ✓ {builderMsg}
                    </div>
                  )}

                  {builderError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                      ✕ {builderError}
                    </div>
                  )}

                  {/* Financial Math Summary */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-[#64748B]">
                      <span>Subtotal ({lineItems.length} items)</span>
                      <span className="font-mono font-bold text-[#26334A]">₹{subtotal.toLocaleString()}</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[#64748B]">
                        <span>Discount Amount (₹)</span>
                        <input
                          type="number"
                          min={0}
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          className="w-24 px-2 py-1 glass-input-light rounded text-right font-mono font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[#64748B]">
                        <span>GST / Tax Rate (%)</span>
                        <input
                          type="number"
                          min={0}
                          value={taxPercent}
                          onChange={(e) => setTaxPercent(e.target.value)}
                          className="w-20 px-2 py-1 glass-input-light rounded text-right font-mono font-bold text-xs"
                        />
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px] pl-2">
                        <span>Calculated Tax Amount</span>
                        <span className="font-mono">₹{taxAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-[#26334A]">
                      <span>Final Proposal Total</span>
                      <span className="text-xl font-mono text-indigo-700">₹{finalTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    {requestDetail?.quotation?.status === 'FINALIZED' ? (
                      <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold text-center space-y-1">
                        <span className="font-extrabold uppercase tracking-wider block">✓ Commercial Quotation Finalized</span>
                        <span className="text-[11px] text-indigo-700 block">This quotation is finalized and visible to the client in read-only mode.</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleSaveQuotationDraft}
                        disabled={builderLoading}
                        className="w-full py-3.5 px-4 rounded-2xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-emerald-400" />
                        <span>Generate Finalized Quotation</span>
                      </button>
                    )}
                  </div>

                  {/* Version History Drawer */}
                  {requestDetail.versionHistory && requestDetail.versionHistory.length > 0 && (
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <span className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider block">Quotation Version History</span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {requestDetail.versionHistory.map(v => (
                          <div key={v.id} className="p-2.5 rounded-xl bg-white/80 border border-slate-100 flex items-center justify-between text-xs font-mono">
                            <div>
                              <span className="font-bold text-indigo-900">V{v.versionNumber}</span>
                              <span className="text-slate-500 text-[10px] block">{v.createdAt}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold">₹{v.totalAmount.toLocaleString()}</span>
                              <span className="block text-[9px] font-sans font-bold uppercase text-purple-700">{v.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audit Log Drawer */}
                  {requestDetail.auditLogs && requestDetail.auditLogs.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <span className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider block">Audit Trail</span>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 text-[11px]">
                        {requestDetail.auditLogs.map(log => (
                          <div key={log.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                            <div className="flex justify-between font-bold text-[#26334A]">
                              <span>{log.actorName}</span>
                              <span className="text-[10px] text-slate-500">{log.action}</span>
                            </div>
                            <p className="text-slate-600 text-[10px]">{log.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ==================== TAB 4: COMMERCIAL ANALYTICS ==================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-2">
              <span className="text-xs font-extrabold text-[#64748B] uppercase">Quotes Sent</span>
              <div className="text-3xl font-extrabold text-indigo-900">{analyticsData?.quotesSent || 0}</div>
              <p className="text-[11px] text-[#64748B]">Issued to prospective client organizations</p>
            </div>

            <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-2">
              <span className="text-xs font-extrabold text-[#64748B] uppercase">Accepted Quotes</span>
              <div className="text-3xl font-extrabold text-emerald-600">{analyticsData?.acceptedQuotes || 0}</div>
              <p className="text-[11px] text-emerald-700 font-bold">COMMERCIAL_APPROVED handoffs</p>
            </div>

            <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-2">
              <span className="text-xs font-extrabold text-[#64748B] uppercase">Conversion Rate</span>
              <div className="text-3xl font-extrabold text-purple-700">{analyticsData?.conversionRate || 0}%</div>
              <p className="text-[11px] text-[#64748B]">Accepted vs. total proposals sent</p>
            </div>

            <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-2">
              <span className="text-xs font-extrabold text-[#64748B] uppercase">Avg Contract Size</span>
              <div className="text-2xl font-extrabold text-[#26334A] font-mono">₹{(analyticsData?.averageAcceptedValue || 0).toLocaleString()}</div>
              <p className="text-[11px] text-[#64748B]">Average value per contracted event</p>
            </div>
          </div>

          <div className="p-8 rounded-3xl glass-light border border-white shadow-xs space-y-6">
            <h3 className="text-lg font-extrabold text-[#26334A]">Commercial Proposal Lifecycle Funnel</h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                <span className="text-xs font-extrabold text-indigo-700 uppercase">Requests</span>
                <div className="text-2xl font-extrabold text-indigo-950 mt-1">{analyticsData?.totalRequests || 0}</div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                <span className="text-xs font-extrabold text-purple-700 uppercase">Drafts</span>
                <div className="text-2xl font-extrabold text-purple-950 mt-1">{analyticsData?.quotesCreated || 0}</div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <span className="text-xs font-extrabold text-blue-700 uppercase">Sent</span>
                <div className="text-2xl font-extrabold text-blue-950 mt-1">{analyticsData?.quotesSent || 0}</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <span className="text-xs font-extrabold text-amber-700 uppercase">Negotiations</span>
                <div className="text-2xl font-extrabold text-amber-950 mt-1">{analyticsData?.changeRequests || 0}</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 col-span-2 sm:col-span-1">
                <span className="text-xs font-extrabold text-emerald-700 uppercase">Accepted</span>
                <div className="text-2xl font-extrabold text-emerald-950 mt-1">{analyticsData?.acceptedQuotes || 0}</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==================== TAB 5: CLIENTS OVERVIEW ==================== */}
      {activeTab === 'clients' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-[#26334A]">Commercial Client Directory</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[#64748B] font-extrabold uppercase tracking-wider">
                    <th className="pb-3 px-3">Client Name</th>
                    <th className="pb-3 px-3">Organization</th>
                    <th className="pb-3 px-3">Email Address</th>
                    <th className="pb-3 px-3 text-center">Total Requests</th>
                    <th className="pb-3 px-3 text-center">Accepted Proposals</th>
                    <th className="pb-3 px-3 text-right">Contracted Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[#26334A]">
                  {clientsList.map((c) => (
                    <tr key={c.id} className="hover:bg-white/60 transition">
                      <td className="py-3.5 px-3 font-extrabold text-[#26334A]">{c.name}</td>
                      <td className="py-3.5 px-3 font-bold">{c.organization || 'Individual Client'}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-600">{c.email}</td>
                      <td className="py-3.5 px-3 text-center font-bold">{c.totalRequests}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-700">{c.acceptedQuotes}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-indigo-900">
                        ₹{c.totalContractValue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Event Manager Availability & Assignment Modal */}
      <AssignEventManagerModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        eventRequest={assignTargetReq}
        onAssignSuccess={() => {
          fetchRequests();
          fetchDashboard();
          if (assignTargetReq && selectedReqId === assignTargetReq.id) {
            handleOpenBuilderForRequest(assignTargetReq.id);
          }
        }}
      />

    </div>
  );
}
