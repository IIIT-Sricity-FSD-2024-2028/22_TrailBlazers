import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  User,
  Building,
  Calendar,
  FileText,
  CreditCard,
  Hash,
  AlertTriangle,
  Send,
  History,
  Check
} from 'lucide-react';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import {
  approveRefundAction,
  rejectRefundAction,
  fetchRefundDetailsAction,
  startRefundReviewAction,
  saveRefundDeductionsAction,
  processRefundAction,
  completeRefundAction
} from '../../../store/revenue-actions';

export default function RefundActionModal({
  refundId,
  onClose,
  onRefresh,
}) {
  const dispatch = useDispatch();
  const detail = useSelector((state) => state.revenue.activeRefundDetail);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  // Form states
  const [deductionAmount, setDeductionAmount] = useState(0);
  const [deductionReason, setDeductionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCompleteInput, setShowCompleteInput] = useState(false);
  const [settlementReference, setSettlementReference] = useState('');
  const [settlementMethod, setSettlementMethod] = useState('UPI');

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dispatch(fetchRefundDetailsAction(refundId));
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch refund details.');
      }
      setDeductionAmount(res.data?.refund?.deductionAmount || 0);
      setDeductionReason(res.data?.refund?.deductionReason || '');
    } catch (err) {
      setError(err.message || 'Error loading refund details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (refundId) {
      fetchDetails();
    }
  }, [refundId]);

  const handleStartReview = async () => {
    setActionLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await dispatch(startRefundReviewAction(refundId));
      if (!res.success) {
        throw new Error(res.error || 'Failed to update review status.');
      }
      setFeedback({ text: 'Refund status updated to UNDER_REVIEW.', type: 'success' });
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDeductions = async () => {
    if (deductionAmount > (detail?.refund?.totalPaidAmount || 0)) {
      setFeedback({
        text: 'Deductions cannot exceed the total paid amount.',
        type: 'error',
      });
      return;
    }
    if (deductionAmount > 0 && !deductionReason.trim()) {
      setFeedback({
        text: 'Please document the contractual or verified expense reason for this deduction.',
        type: 'error',
      });
      return;
    }

    setActionLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await dispatch(saveRefundDeductionsAction(refundId, {
        deductionAmount: Number(deductionAmount),
        deductionReason: deductionReason.trim(),
      }));
      if (!res.success) {
        throw new Error(res.error || 'Failed to save deductions.');
      }
      setFeedback({ text: 'Deductions recorded and refundable balance calculated.', type: 'success' });
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await dispatch(
        approveRefundAction(refundId, {
          deductionAmount: Number(deductionAmount),
          deductionReason: deductionReason.trim(),
          notes: 'Approved by Revenue Department',
        })
      );
      if (!res.success) {
        throw new Error(res.error || 'Failed to approve refund.');
      }
      setFeedback({ text: 'Refund approved successfully. Ready for payout processing.', type: 'success' });
      await fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setFeedback({ text: 'Mandatory rejection reason is required.', type: 'error' });
      return;
    }

    setActionLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await dispatch(
        rejectRefundAction(refundId, { rejectionReason: rejectionReason.trim() })
      );
      if (!res.success) {
        throw new Error(res.error || 'Failed to reject refund.');
      }
      setFeedback({ text: 'Refund rejected.', type: 'success' });
      setShowRejectInput(false);
      await fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcess = async () => {
    setActionLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await dispatch(processRefundAction(refundId));
      if (!res.success) {
        throw new Error(res.error || 'Failed to mark as processing.');
      }
      setFeedback({ text: 'Refund status set to PROCESSING.', type: 'success' });
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!settlementReference.trim()) {
      setFeedback({ text: 'Please enter the transaction reference / UTR / settlement ID.', type: 'error' });
      return;
    }

    setActionLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await dispatch(completeRefundAction(refundId, {
        refundTransactionId: settlementReference.trim(),
        refundMethod: settlementMethod,
        actualRefundedAmount: Number(calculatedRefundable),
        notes: 'Settlement confirmed',
      }));
      if (!res.success) {
        throw new Error(res.error || 'Failed to complete refund.');
      }
      setFeedback({ text: 'Refund successfully completed and recorded as REFUNDED!', type: 'success' });
      setShowCompleteInput(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const refund = detail?.refund;
  const payments = detail?.payments || [];
  const quotationDetails = detail?.quotationDetails;
  const ticketDetails = detail?.ticketDetails;
  const auditLogs = detail?.auditLogs || [];

  const totalPaid = refund?.totalPaidAmount || 0;
  const calculatedRefundable = Math.max(0, totalPaid - Number(deductionAmount || 0));

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/70 backdrop-blur-md animate-fadeIn text-[#26334A]">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Gradient Ribbon */}
        <div className="h-3 bg-gradient-to-r from-amber-200 via-indigo-200 to-emerald-200 shrink-0" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {refund?.refundNumber || 'Refund Record'}
              </span>
              {refund && <StatusBadge status={refund.status} />}
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                refund?.customerType === 'CLIENT'
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
              }`}>
                {refund?.customerType}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#26334A]">
              Refund Settlement & Approval Desk
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-bold">
              Loading refund details...
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold">
              {error}
            </div>
          ) : refund ? (
            <>
              {/* Feedback Alert */}
              {feedback.text && (
                <div
                  className={`p-3.5 rounded-2xl font-bold flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border border-rose-200 text-rose-900'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              {/* SECTION 1: CUSTOMER & EVENT CANCELLATION OVERVIEW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    Customer Information
                  </span>
                  <div className="space-y-1">
                    <div className="font-extrabold text-sm text-[#26334A]">
                      {refund.customerName}
                    </div>
                    <div className="text-slate-500 font-medium">
                      Email: <strong className="text-slate-700">{refund.customerEmail}</strong>
                    </div>
                    {refund.organizationName && (
                      <div className="text-slate-500 font-medium">
                        Org: <strong className="text-slate-700">{refund.organizationName}</strong>
                      </div>
                    )}
                    <div className="text-slate-500 font-medium">
                      Customer Type: <strong className="text-indigo-700">{refund.customerType}</strong>
                    </div>
                  </div>
                </div>

                {/* Event & Cancellation Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    Event Cancellation Context
                  </span>
                  <div className="space-y-1">
                    <div className="font-extrabold text-sm text-[#26334A]">
                      {refund.eventName}
                    </div>
                    <div className="text-slate-500 font-medium">
                      Event Date: <strong className="text-slate-700">{refund.eventDate || 'N/A'}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 font-medium">
                      <strong className="font-bold">Cancellation Reason:</strong> "{refund.cancellationReason || 'N/A'}"
                    </div>
                    {refund.cancellationInitiatorName && (
                      <div className="text-[11px] text-slate-500">
                        Initiator: <strong>{refund.cancellationInitiatorName}</strong> ({refund.cancellationInitiatorRole}) at {refund.cancellationTimestamp}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: ORIGINAL PAYMENTS VERIFICATION */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Verified Original Payment Transactions</span>
                  </span>
                  <span className="text-xs font-black text-emerald-800 font-mono">
                    Total Paid: ₹{totalPaid.toLocaleString()}
                  </span>
                </div>

                {payments.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 italic">
                    No individual payment records linked. Initial recorded payment: ₹{refund.originalPaymentAmount.toLocaleString()}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {payments.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">
                              {p.transactionId || p.id}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-900">
                              {p.status}
                            </span>
                            {p.installmentStage && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-900">
                                {p.installmentStage} ({p.installmentPercent}%)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Method: {p.paymentMethod} • Date: {p.createdAt}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-extrabold text-sm text-slate-900">
                            ₹{Number(p.amount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: B2B CLIENT CONTRACT & 3-STAGE PAYMENT SCHEDULE (If applicable) */}
              {refund.customerType === 'CLIENT' && quotationDetails && (
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
                  <span className="text-[11px] font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-700" />
                    <span>B2B Contract & Payment Schedule Alignment</span>
                  </span>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white border border-purple-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Quotation</span>
                      <span className="text-sm font-black text-purple-950 font-mono">
                        ₹{Number(quotationDetails.version?.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-purple-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Amount Paid</span>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        ₹{totalPaid.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-purple-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Agreed Schedule</span>
                      <span className="text-xs font-black text-indigo-700">
                        35% Advance • 45% Milestone • 20% Final
                      </span>
                    </div>
                  </div>

                  {refund.cancellationTerms && (
                    <div className="p-2.5 rounded-xl bg-white/80 border border-purple-100 text-[11px] text-purple-900 font-medium">
                      <strong>Applicable Cancellation Terms:</strong> {refund.cancellationTerms}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: B2C ATTENDEE TICKET DETAILS (If applicable) */}
              {refund.customerType === 'ATTENDEE' && ticketDetails && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-2">
                  <span className="text-[11px] font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-indigo-700" />
                    <span>Attendee Ticket Purchase Details (100% Policy)</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Ticket #</span>
                      <span className="font-mono font-bold text-slate-800">{ticketDetails.ticketNumber}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Quantity</span>
                      <span className="font-bold text-slate-800">{ticketDetails.quantity} Ticket(s)</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Unit Price</span>
                      <span className="font-mono font-bold text-slate-800">₹{Number(ticketDetails.unitPrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Platform Fee (Included)</span>
                      <span className="font-mono font-bold text-slate-800">₹{Number(ticketDetails.platformFee || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: FINANCIAL CALCULATIONS & DEDUCTION MANAGEMENT */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/60 via-slate-50 to-emerald-50/60 border border-slate-200 space-y-4">
                <span className="text-[11px] font-black uppercase text-[#26334A] tracking-wider block">
                  Refund Calculation & Verified Deductions
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Amount Paid</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      ₹{totalPaid.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-500 uppercase block">Verified Deductions</span>
                    <span className="text-lg font-black text-rose-700 font-mono">
                      - ₹{Number(deductionAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300">
                    <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">Final Refundable Amount</span>
                    <span className="text-xl font-black text-emerald-900 font-mono">
                      ₹{calculatedRefundable.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Deductions Input form (For Revenue Team Members) */}
                {['ELIGIBLE', 'REQUESTED', 'UNDER_REVIEW'].includes(refund.status) && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Edit Verified Expenses or Contractual Deductions
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                          Deduction Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={totalPaid}
                          value={deductionAmount}
                          onChange={(e) => setDeductionAmount(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-200"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                          Documented Explanation / Contractual Reason
                        </label>
                        <input
                          type="text"
                          value={deductionReason}
                          onChange={(e) => setDeductionReason(e.target.value)}
                          placeholder="e.g. Non-recoverable venue advance per clause 4.2"
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-amber-200"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveDeductions}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition"
                      >
                        Save Deductions & Recalculate
                      </button>
                    </div>
                  </div>
                )}

                {/* Display recorded deduction reason if existing */}
                {refund.deductionReason && (
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs">
                    <strong className="text-slate-900">Recorded Deduction Reason:</strong> {refund.deductionReason}
                  </div>
                )}
              </div>

              {/* SECTION 6: SETTLEMENT TRANSACTION REFERENCE (If Completed or Settling) */}
              {refund.status === 'REFUNDED' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Refund Successfully Settled and Disbursed</span>
                  </div>
                  <div className="text-xs text-emerald-950 font-medium">
                    Transaction / Settlement Reference ID:{' '}
                    <strong className="font-mono font-black text-emerald-950">{refund.refundTransactionId}</strong>
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    Disbursed Amount: <strong>₹{Number(refund.actualRefundedAmount || refund.refundableAmount).toLocaleString()}</strong> via {refund.refundMethod || 'UPI'} on {refund.refundedAt}
                  </div>
                </div>
              )}

              {refund.status === 'REJECTED' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 space-y-1">
                  <div className="flex items-center gap-2 text-rose-900 font-extrabold">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span>Refund Request Rejected</span>
                  </div>
                  <div className="text-xs text-rose-950 font-medium">
                    Reason: <strong>{refund.rejectionReason}</strong>
                  </div>
                </div>
              )}

              {/* INPUT FORM: REJECT REFUND */}
              {showRejectInput && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                  <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider block">
                    Enter Rejection Reason (Mandatory)
                  </span>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide detailed explanation for rejecting this refund request..."
                    className="w-full p-2.5 rounded-xl bg-white border border-rose-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={actionLoading || !rejectionReason.trim()}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(false)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* INPUT FORM: COMPLETE SETTLEMENT (Transaction reference) */}
              {showCompleteInput && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider block">
                    Record Actual Payment Settlement Reference ID
                  </span>
                  <p className="text-[11px] text-emerald-800">
                    Record the bank transfer, UPI, or payment gateway reference ID to mark money as officially disbursed.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Transaction / Reference ID
                      </label>
                      <input
                        type="text"
                        value={settlementReference}
                        onChange={(e) => setSettlementReference(e.target.value)}
                        placeholder="e.g. REF-TXN-2026-89412034"
                        className="w-full p-2.5 rounded-xl bg-white border border-emerald-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Disbursement Method
                      </label>
                      <select
                        value={settlementMethod}
                        onChange={(e) => setSettlementMethod(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="UPI">UPI Payout</option>
                        <option value="NEFT">NEFT / RTGS Bank Transfer</option>
                        <option value="CARD">Credit/Debit Card Reversal</option>
                        <option value="NET_BANKING">Net Banking Refund</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleComplete}
                      disabled={actionLoading || !settlementReference.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                    >
                      Confirm Settlement & Mark REFUNDED
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCompleteInput(false)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 7: AUDIT HISTORY TRAIL */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Audit History & State Transitions</span>
                </span>

                {auditLogs.length === 0 ? (
                  <div className="text-slate-400 italic">No audit records logged yet.</div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-start justify-between gap-3 text-[11px]"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{log.action}</span>
                            <span className="text-slate-400 font-medium">by</span>
                            <span className="font-bold text-indigo-700">{log.actorName} ({log.actorRole})</span>
                          </div>
                          {log.notes && (
                            <p className="text-slate-600 font-medium">{log.notes}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {log.createdAt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer / Action Toolbar */}
        {refund && !['REFUNDED', 'REJECTED'].includes(refund.status) && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-slate-500 font-medium">
              Current Stage: <strong className="text-slate-800">{refund.status}</strong>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* If ELIGIBLE or REQUESTED: can move to UNDER_REVIEW */}
              {(refund.status === 'ELIGIBLE' || refund.status === 'REQUESTED') && (
                <button
                  type="button"
                  onClick={handleStartReview}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition"
                >
                  Start Review
                </button>
              )}

              {/* If UNDER_REVIEW, REQUESTED, or ELIGIBLE: can Approve or Reject */}
              {['ELIGIBLE', 'REQUESTED', 'UNDER_REVIEW'].includes(refund.status) && (
                <>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Refund (₹{calculatedRefundable.toLocaleString()})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRejectInput(!showRejectInput)}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs cursor-pointer transition"
                  >
                    Reject
                  </button>
                </>
              )}

              {/* If APPROVED: can Mark as Processing */}
              {refund.status === 'APPROVED' && (
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition"
                >
                  Mark as PROCESSING
                </button>
              )}

              {/* If PROCESSING or APPROVED: can Mark as Refunded */}
              {['APPROVED', 'PROCESSING'].includes(refund.status) && (
                <button
                  type="button"
                  onClick={() => setShowCompleteInput(!showCompleteInput)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as REFUNDED</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

