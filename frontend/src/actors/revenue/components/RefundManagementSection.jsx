import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  RotateCcw,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Users,
  Building,
  RefreshCw
} from 'lucide-react';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import RefundActionModal from './RefundActionModal';
import { fetchRefundMetrics, fetchRefundsList } from '../../../store/revenue-actions';

export default function RefundManagementSection({ user }) {
  const dispatch = useDispatch();
  const { refundMetrics: metrics, refundsList: refunds, loading: reduxLoading } = useSelector((state) => state.revenue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Refund Modal
  const [selectedRefundId, setSelectedRefundId] = useState(null);

  // Pagination (8 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      await dispatch(fetchRefundMetrics());
      await dispatch(
        fetchRefundsList({
          customerType: customerTypeFilter,
          status: statusFilter,
          eventId: eventFilter,
          search: searchTerm.trim(),
          startDate,
          endDate,
        })
      );
    } catch (err) {
      setError(err.message || 'Error loading refunds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customerTypeFilter, statusFilter, eventFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Derive unique event names for event dropdown
  const uniqueEvents = Array.from(
    new Set(refunds.map((r) => r.eventName).filter(Boolean)),
  );

  // Pagination calculations
  const totalPages = Math.ceil(refunds.length / itemsPerPage) || 1;
  const paginatedRefunds = refunds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-[#26334A]">
      {/* SECTION HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl glass-light border border-white shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 w-fit">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Revenue Operations Governance</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26334A] mt-2">
              Refund Management System
            </h1>
            <p className="text-xs text-[#64748B] font-medium">
              Review event cancellation refund eligibility, record verified deductions, and execute financial settlements.
            </p>
          </div>

          <button
            onClick={() => {
              fetchMetrics();
              fetchRefunds();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Desk</span>
          </button>
        </div>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Refunds */}
        <div className="p-4 rounded-2xl bg-white/90 border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
            Total Refunds
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-[#26334A]">
              {metrics?.totalRefunds || 0}
            </span>
            <RotateCcw className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">All recorded claims</span>
        </div>

        {/* 2. Pending Requests */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
            Pending Requests
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-amber-900">
              {metrics?.pendingRequests || 0}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[10px] text-amber-700 font-bold">New customer claims</span>
        </div>

        {/* 3. Under Review / Awaiting Approval */}
        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
            Awaiting Approval
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-indigo-950">
              {metrics?.awaitingApproval || 0}
            </span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-[10px] text-indigo-700 font-medium">In review by Revenue</span>
        </div>

        {/* 4. Being Processed */}
        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-purple-800 uppercase tracking-wider block">
            Being Processed
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-purple-900">
              {metrics?.processing || 0}
            </span>
            <RotateCcw className="w-4 h-4 text-purple-600 animate-spin" />
          </div>
          <span className="text-[10px] text-purple-700 font-bold">Payouts in flight</span>
        </div>

        {/* 5. Successfully Refunded Amount */}
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
            Refunded Amount
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-emerald-900 font-mono">
              ₹{(metrics?.totalRefundedAmount || 0).toLocaleString()}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">
            {metrics?.completed || 0} Settled
          </span>
        </div>

        {/* 6. Rejected Requests */}
        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider block">
            Rejected
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-rose-900">
              {metrics?.rejected || 0}
            </span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-[10px] text-rose-700 font-bold">Declined claims</span>
        </div>
      </div>

      {/* COMPREHENSIVE FILTER BAR */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Refund ID, customer, email, event, or reference..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          {/* Customer Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400">Type:</span>
            <select
              value={customerTypeFilter}
              onChange={(e) => {
                setCustomerTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="ATTENDEE">Attendee (B2C)</option>
              <option value="CLIENT">Client (B2B)</option>
            </select>
          </div>

          {/* Refund Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ELIGIBLE">ELIGIBLE</option>
              <option value="REQUESTED">REQUESTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          {/* Date Range: Start Date */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Date Range: End Date */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Reset Filters */}
          {(customerTypeFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm || startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCustomerTypeFilter('ALL');
                setStatusFilter('ALL');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* REFUND TABLE */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">
            Loading refund records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 font-bold">
            {error}
          </div>
        ) : paginatedRefunds.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <RotateCcw className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-extrabold text-slate-700">No refunds found</h4>
            <p className="text-xs text-slate-400">
              No refund requests matched your selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Refund ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4 text-right">Original Paid</th>
                  <th className="py-3 px-4 text-right">Refundable</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedRefunds.map((r) => {
                  const isAttendee = r.customerType === 'ATTENDEE';
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-amber-50/40 transition duration-150"
                    >
                      {/* Refund ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {r.refundNumber}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900 block">
                            {r.customerName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {r.customerEmail}
                          </span>
                        </div>
                      </td>

                      {/* Customer Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border ${
                            isAttendee
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                              : 'bg-purple-50 text-purple-900 border-purple-200'
                          }`}
                        >
                          {isAttendee ? 'Attendee' : 'Client'}
                        </span>
                      </td>

                      {/* Event Name */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 max-w-[200px]">
                          <span className="font-bold text-slate-800 truncate block">
                            {r.eventName}
                          </span>
                          {r.eventDate && (
                            <span className="text-[10px] text-slate-400">
                              {r.eventDate}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Original Payment Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                        ₹{Number(r.originalPaymentAmount || r.totalPaidAmount || 0).toLocaleString()}
                      </td>

                      {/* Refundable Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-extrabold text-emerald-700">
                          ₹{Number(r.refundableAmount || 0).toLocaleString()}
                        </span>
                        {r.deductionAmount > 0 && (
                          <span className="block text-[10px] text-rose-500 font-medium">
                            -₹{Number(r.deductionAmount).toLocaleString()} ded.
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Request Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium text-[11px]">
                        {(r.createdAt || '').substring(0, 10)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedRefundId(r.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold text-[11px] shadow-2xs transition cursor-pointer"
                        >
                          Review & Process
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION TOOLBAR */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({refunds.length} total refunds)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-bold disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-bold disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REFUND ACTION MODAL */}
      {selectedRefundId && (
        <RefundActionModal
          refundId={selectedRefundId}
          onClose={() => setSelectedRefundId(null)}
          onRefresh={() => {
            fetchMetrics();
            fetchRefunds();
          }}
        />
      )}
    </div>
  );
}
