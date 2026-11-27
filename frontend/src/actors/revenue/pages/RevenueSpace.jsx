import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createPortal } from 'react-dom';
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
  Mail,
  X,
  RotateCcw
} from 'lucide-react';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import RefundManagementSection from '../components/RefundManagementSection';
import {
  fetchRevenueDashboard,
  fetchRevenueRequests,
  fetchRevenueClients,
  fetchRevenueAnalytics,
  fetchRequestDetail,
  saveQuotationDraftAction,
  sendQuotationAction,
  escalateEventAction
} from '../../../store/revenue-actions';

export default function RevenueSpace({ user, onNavigate }) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'event-requests' | 'builder' | 'refunds' | 'analytics' | 'clients'
  
  // Read all server-backed revenue data from Redux Store
  const {
    dashboardData,
    requestsList,
    clientsList,
    analyticsData,
    requestDetail,
    loading: reduxLoading
  } = useSelector((state) => state.revenue);

  const [loading, setLoading] = useState(false);

  // Selected Request & Quotation Builder State
  const [selectedReqId, setSelectedReqId] = useState(null);
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

  // Escalation Modal State
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalateTargetEvent, setEscalateTargetEvent] = useState(null);
  const [escalateLoading, setEscalateLoading] = useState(false);
  const [escalateError, setEscalateError] = useState('');
  const [escalateSuccess, setEscalateSuccess] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination State (6 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchDashboard = () => dispatch(fetchRevenueDashboard());
  const fetchRequests = () => dispatch(fetchRevenueRequests());
  const fetchAnalytics = () => dispatch(fetchRevenueAnalytics());
  const fetchClients = () => dispatch(fetchRevenueClients());

  useEffect(() => {
    fetchDashboard();
    fetchRequests();
    fetchAnalytics();
    fetchClients();
  }, []);

  const handleOpenBuilderForRequest = async (reqId) => {
    setSelectedReqId(reqId);
    setBuilderMsg('');
    setBuilderError('');
    setBuilderLoading(true);
    setActiveTab('builder');

    try {
      const data = await dispatch(fetchRequestDetail(reqId));
      if (data) {
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
            { description: `${data.request?.eventName || 'Event'} - Core Venue & Operations`, quantity: 1, unitPrice: 45000, subtotal: 45000 },
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
      const q = Math.max(1, Number(updated[index].quantity) || 1);
      const p = Math.max(0, Number(updated[index].unitPrice) || 0);
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
      const sanitizedLineItems = lineItems.map((item, idx) => ({
        description: (item.description || '').trim() || `Service Item #${idx + 1}`,
        quantity: Math.max(1, Number(item.quantity) || 1),
        unitPrice: Math.max(0, Number(item.unitPrice) || 0)
      }));

      const res = await dispatch(
        saveQuotationDraftAction({
          eventRequestId: selectedReqId,
          lineItems: sanitizedLineItems,
          discount: Math.max(0, Number(discount) || 0),
          taxPercent: Math.max(0, Number(taxPercent) || 0),
          notes: notes || '',
          terms: terms || ''
        })
      );

      if (!res.success) {
        throw new Error(res.error || 'Failed to save quotation draft.');
      }

      setBuilderMsg(res.data?.message || 'Quotation draft saved successfully.');
      await handleOpenBuilderForRequest(selectedReqId);
      await fetchDashboard();
      await fetchRequests();
      return res.data;
    } catch (err) {
      setBuilderError(err.message || 'Error saving quotation draft.');
      throw err;
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleSendQuotationToClient = async () => {
    setBuilderLoading(true);
    setBuilderMsg('');
    setBuilderError('');

    try {
      const sanitizedLineItems = lineItems.map((item, idx) => ({
        description: (item.description || '').trim() || `Service Item #${idx + 1}`,
        quantity: Math.max(1, Number(item.quantity) || 1),
        unitPrice: Math.max(0, Number(item.unitPrice) || 0)
      }));

      const saveRes = await dispatch(
        saveQuotationDraftAction({
          eventRequestId: selectedReqId,
          lineItems: sanitizedLineItems,
          discount: Math.max(0, Number(discount) || 0),
          taxPercent: Math.max(0, Number(taxPercent) || 0),
          notes: notes || '',
          terms: terms || ''
        })
      );

      if (!saveRes.success) {
        throw new Error(saveRes.error || 'Failed to save quotation before sending.');
      }

      const qtnId = saveRes.data?.quotationId || requestDetail?.quotation?.id;
      if (!qtnId) throw new Error('Quotation ID not found after saving.');

      const sendRes = await dispatch(sendQuotationAction(qtnId));
      if (!sendRes.success) {
        throw new Error(sendRes.error || 'Failed to dispatch quotation to client.');
      }

      setBuilderMsg(sendRes.data?.message || 'Quotation successfully dispatched to client.');
      await handleOpenBuilderForRequest(selectedReqId);
      await fetchDashboard();
      await fetchRequests();
      await fetchAnalytics();
    } catch (err) {
      setBuilderError(err.message || 'Error processing quotation.');
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleOpenEscalateModal = (req) => {
    setEscalateTargetEvent(req);
    setEscalateError('');
    setEscalateSuccess('');
    setEscalateLoading(false);
    setEscalateModalOpen(true);
  };

  const handleCloseEscalateModal = () => {
    if (escalateLoading) return;
    setEscalateModalOpen(false);
    setEscalateTargetEvent(null);
    setEscalateError('');
    setEscalateSuccess('');
  };

  const handleConfirmEscalation = async () => {
    if (!escalateTargetEvent) return;
    setEscalateLoading(true);
    setEscalateError('');
    setEscalateSuccess('');

    try {
      const res = await dispatch(escalateEventAction(escalateTargetEvent.id));
      if (!res.success) {
        throw new Error(res.error || 'Failed to escalate event to Event Management.');
      }

      setEscalateSuccess(res.data?.message || 'Event escalated to Event Management Department Head successfully.');

      await fetchRequests();
      await fetchDashboard();
      await fetchAnalytics();

      if (selectedReqId === escalateTargetEvent.id) {
        await handleOpenBuilderForRequest(escalateTargetEvent.id);
      }

      setTimeout(() => {
        setEscalateModalOpen(false);
        setEscalateTargetEvent(null);
        setEscalateSuccess('');
      }, 1300);
    } catch (err) {
      setEscalateError(err.message);
    } finally {
      setEscalateLoading(false);
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
          onClick={() => setActiveTab('refunds')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'refunds'
              ? 'bg-[#26334A] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-white/80 hover:text-[#26334A]'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refund Management</span>
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
                    <th className="pb-3 px-3">Tickets Saled</th>
                    <th className="pb-3 px-3">Contract Quote</th>
                    <th className="pb-3 px-3">Ticket Revenue</th>
                    <th className="pb-3 px-3 text-right">Total Event Revenue</th>
                    <th className="pb-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[#26334A]">
                  {dashboardData?.priorityRequests?.map((req) => {
                    const quotationVal = Number(req.quotationValue) || 0;
                    const ticketRev = Number(req.ticketSalesRevenue) || 0;
                    const totalEvtRev = Number(req.totalEventRevenue) || (quotationVal + ticketRev);
                    const ticketsSold = Number(req.ticketsSold) || 0;
                    const totalCap = Number(req.totalCapacity || req.expectedAttendance) || 100;

                    return (
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
                          <div>
                            {req.startDate && req.endDate && req.startDate !== req.endDate
                              ? `${req.startDate} to ${req.endDate}`
                              : (req.startDate || req.eventDate)}
                          </div>
                          <div className="text-[11px] text-slate-500">{req.venue}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800">{ticketsSold} / {totalCap}</div>
                          <div className="text-[10px] text-emerald-700 font-semibold">{req.soldPercentage || 0}% Sold</div>
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-700">
                          {quotationVal > 0 ? `₹${quotationVal.toLocaleString()}` : 'Not Priced'}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-emerald-700">
                          ₹{ticketRev.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-black text-indigo-900 text-sm">
                          ₹{totalEvtRev.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 text-center flex items-center justify-center gap-1.5 flex-wrap">
                          {req.status === 'COMMERCIAL_APPROVED' && (
                            req.eventManagerUserId ? (
                              <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-extrabold flex items-center gap-1 whitespace-nowrap shadow-2xs">
                                <Users className="w-3 h-3 text-purple-600" />
                                <span>Manager: {req.eventManagerName || 'Assigned'}</span>
                              </span>
                            ) : req.escalatedToManagement ? (
                              <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200 text-[10px] font-extrabold flex items-center gap-1 whitespace-nowrap shadow-2xs">
                                <Clock className="w-3 h-3 text-indigo-600" />
                                <span>Escalated</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenEscalateModal(req)}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
                                title="Escalate to Event Management"
                              >
                                <Send className="w-3 h-3 text-white" />
                                <span>Escalate</span>
                              </button>
                            )
                          )}
                          <button
                            onClick={() => handleOpenBuilderForRequest(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer"
                          >
                            {req.status === 'COMMERCIAL_APPROVED' ? 'View Quote' : req.quotationId ? 'Edit Quote' : 'Create Quote'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
            {paginatedRequests.map((req) => {
              const quotationVal = Number(req.quotationValue) || 0;
              const ticketRev = Number(req.ticketSalesRevenue) || 0;
              const totalEvtRev = Number(req.totalEventRevenue) || (quotationVal + ticketRev);
              const ticketsSold = Number(req.ticketsSold) || 0;
              const totalCap = Number(req.totalCapacity || req.expectedAttendance) || 100;
              const soldPct = totalCap > 0 ? Math.min(100, Math.round((ticketsSold / totalCap) * 100)) : 0;
              const ticketPrice = Number(req.ticketPrice) || 0;

              return (
                <div key={req.id} className="p-6 rounded-3xl glass-light border border-white shadow-xs space-y-4 hover:shadow-md transition flex flex-col justify-between">
                  <div className="space-y-3.5">
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
                        <span className="text-[#64748B] text-[11px] block">Capacity & Ticket Price</span>
                        <span className="font-bold text-[#26334A]">{totalCap} Attendees</span>
                        <span className="block text-slate-500 font-mono text-[10px]">₹{ticketPrice} / ticket</span>
                      </div>
                    </div>

                    {/* Live Event Revenue & Ticket Sales Box */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 via-indigo-50/30 to-emerald-50/40 border border-amber-200/80 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
                        <div>
                          <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider block">Total Revenue of the Event</span>
                          <span className="text-xl font-black text-slate-900 font-mono">₹{totalEvtRev.toLocaleString()}</span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-800">
                          Contract + Tickets
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-white/80 border border-slate-100">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">Quotation Value</span>
                          <span className="font-bold text-slate-900 font-mono">₹{quotationVal.toLocaleString()}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200">
                          <span className="text-[9px] text-emerald-800 block uppercase font-bold flex items-center gap-1">
                            <span>Ticket Sales</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          </span>
                          <span className="font-bold text-emerald-950 font-mono">₹{ticketRev.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Ticket Sales Bar */}
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-700">{ticketsSold} / {totalCap} Saled Tickets</span>
                          <span className="font-bold text-indigo-900 font-mono">{soldPct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                            style={{ width: `${soldPct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {req.additionalNotes && (
                      <p className="text-xs text-[#64748B] line-clamp-2 italic font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        "{req.additionalNotes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500">{req.contactEmail}</span>
                      {req.status === 'COMMERCIAL_APPROVED' ? (
                        req.eventManagerUserId ? (
                          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                            <Users className="w-3 h-3 text-purple-600" />
                            <span>Event Manager Assigned: {req.eventManagerName || 'Assigned'}</span>
                          </span>
                        ) : req.escalatedToManagement ? (
                          <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200 text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                            <Clock className="w-3 h-3 text-indigo-600" />
                            <span>Escalated — Awaiting Event Management Assignment</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Quotation Accepted — Awaiting Escalation</span>
                          </span>
                        )
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {req.status === 'COMMERCIAL_APPROVED' && !req.escalatedToManagement && !req.eventManagerUserId && (
                        <button
                          onClick={() => handleOpenEscalateModal(req)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Escalate to Event Management</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenBuilderForRequest(req.id)}
                        className="px-4 py-2 rounded-xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{req.status === 'COMMERCIAL_APPROVED' ? 'View Quote' : 'Analyze & Quote'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                      <span className="font-extrabold text-[#26334A]">
                        {requestDetail.request.startDate && requestDetail.request.endDate && requestDetail.request.startDate !== requestDetail.request.endDate
                          ? `${requestDetail.request.startDate} to ${requestDetail.request.endDate}`
                          : (requestDetail.request.startDate || requestDetail.request.eventDate)}
                      </span>
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
                    {requestDetail.request.status === 'COMMERCIAL_APPROVED' || requestDetail.quotation?.status === 'ACCEPTED' ? (
                      requestDetail.request.eventManagerUserId ? (
                        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold text-center space-y-1">
                          <span className="font-extrabold uppercase tracking-wider block flex items-center justify-center gap-1.5">
                            <Users className="w-4 h-4 text-purple-600" />
                            <span>Event Manager Assigned</span>
                          </span>
                          <span className="text-[11px] text-purple-700 block">
                            Assigned Manager: {requestDetail.request.eventManagerName || 'Assigned'}. Operational preparation active.
                          </span>
                        </div>
                      ) : requestDetail.request.escalatedToManagement ? (
                        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold text-center space-y-1">
                          <span className="font-extrabold uppercase tracking-wider block flex items-center justify-center gap-1.5">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            <span>Escalated to Event Management</span>
                          </span>
                          <span className="text-[11px] text-indigo-700 block">
                            Escalated on {requestDetail.request.escalatedAt || 'N/A'}. Awaiting Event Manager assignment.
                          </span>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 border border-indigo-200 space-y-3">
                          <div className="flex items-center gap-2 text-indigo-950 font-extrabold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Quotation Accepted by Client</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            Client accepted this commercial quotation. Escalate this event to the Event Management Department Head for operational staff assignment.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenEscalateModal(requestDetail.request)}
                            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Send className="w-4 h-4 text-white" />
                            <span>Escalate to Event Management</span>
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="space-y-2.5">
                        {requestDetail?.request?.status === 'QUOTATION_SENT' && (
                          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold text-center space-y-0.5">
                            <span className="font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Quotation Dispatched to Client</span>
                            </span>
                            <span className="text-[11px] text-emerald-700 block">
                              Awaiting client review & approval from their dashboard.
                            </span>
                          </div>
                        )}

                        {requestDetail?.quotation?.id ? (
                          <>
                            <button
                              type="button"
                              onClick={handleSendQuotationToClient}
                              disabled={builderLoading}
                              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Send className="w-4 h-4 text-white" />
                              <span>
                                {builderLoading
                                  ? 'Dispatching...'
                                  : requestDetail?.request?.status === 'QUOTATION_SENT'
                                  ? 'Re-send Quotation to Client'
                                  : 'Send Quotation to Client'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={handleSaveQuotationDraft}
                              disabled={builderLoading}
                              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-extrabold text-xs uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5 text-indigo-600" />
                              <span>
                                {builderLoading ? 'Saving...' : 'Update Quotation (Save Changes)'}
                              </span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSaveQuotationDraft}
                            disabled={builderLoading}
                            className="w-full py-3.5 px-4 rounded-2xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Send className="w-4 h-4 text-emerald-400" />
                            <span>Generate Finalized Quotation</span>
                          </button>
                        )}
                      </div>
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

      {/* ==================== TAB 6: REFUND MANAGEMENT ==================== */}
      {activeTab === 'refunds' && (
        <RefundManagementSection user={user} />
      )}

      {/* ==================== 4. ESCALATION CONFIRMATION MODAL ==================== */}
      {escalateModalOpen && escalateTargetEvent && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6 my-auto animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#26334A]">Escalate to Event Management</h3>
                  <p className="text-xs text-[#64748B] font-medium">Handoff accepted event to Department Head</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEscalateModal}
                disabled={escalateLoading}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-30 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event & Quotation Details Grid */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Event Name</span>
                <span className="text-sm font-extrabold text-[#26334A]">{escalateTargetEvent.eventName}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Client / Organization</span>
                  <span className="font-bold text-[#26334A] block">{escalateTargetEvent.organizationName || 'Client'}</span>
                  <span className="text-[11px] text-slate-500 block truncate">{escalateTargetEvent.contactEmail}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Date & Venue</span>
                  <span className="font-bold text-[#26334A] block">
                    {escalateTargetEvent.startDate && escalateTargetEvent.endDate && escalateTargetEvent.startDate !== escalateTargetEvent.endDate
                      ? `${escalateTargetEvent.startDate} to ${escalateTargetEvent.endDate}`
                      : (escalateTargetEvent.startDate || escalateTargetEvent.eventDate)}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">{escalateTargetEvent.venue}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quotation Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Quotation Accepted</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contract Value</span>
                  <span className="font-mono font-extrabold text-indigo-900 text-sm">
                    ₹{Number(escalateTargetEvent.quotationValue || escalateTargetEvent.contractPrice || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Clear Explanation Box */}
            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-900 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 font-extrabold text-purple-950">
                <Building className="w-4 h-4 text-purple-700 shrink-0" />
                <span>Operational Assignment Handoff</span>
              </div>
              <p className="text-[11px] text-purple-800">
                This event will be sent to <strong>Devika Sharma (Event Management Department Head)</strong> for operational processing. It will appear in the Department Head's <em>"Events Awaiting Event Manager Assignment"</em> workbench.
              </p>
              <p className="text-[10px] text-purple-700 font-medium">
                Note: The Revenue Team retains complete commercial oversight but does not assign Event Managers.
              </p>
            </div>

            {/* Error Message */}
            {escalateError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{escalateError}</span>
              </div>
            )}

            {/* Success Message */}
            {escalateSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{escalateSuccess}</span>
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseEscalateModal}
                disabled={escalateLoading}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmEscalation}
                disabled={escalateLoading || !!escalateSuccess}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs transition disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-2"
              >
                {escalateLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Escalating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm Escalation</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
