import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  Clock,
  RefreshCw,
  XCircle,
  CreditCard,
  Building2,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import PaymentTermsConfirmModal from './PaymentTermsConfirmModal';
import QuotationPaymentModal from './QuotationPaymentModal';
import {
  fetchQuotationByRequestId,
  acceptQuotationAction,
  negotiateQuotationAction,
  rejectQuotationAction
} from '../../../store/requests-actions';

export default function QuotationViewModal({ isOpen, onClose, eventRequestId, onQuotationUpdated }) {
  const dispatch = useDispatch();
  const quotationData = useSelector((state) => state.requests.activeQuotation);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Lock body scroll and support Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        const activeModals = document.querySelectorAll('[data-wavevents-modal="true"]');
        if (activeModals.length <= 1) {
          document.body.style.overflow = '';
        }
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && eventRequestId) {
      fetchQuotation();
    }
  }, [isOpen, eventRequestId]);

  const fetchQuotation = async () => {
    setLoading(true);
    setError('');
    setActionSuccess('');
    try {
      const data = await dispatch(fetchQuotationByRequestId(eventRequestId));
      if (!data) {
        throw new Error('Failed to load quotation details.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = () => {
    setIsTermsModalOpen(true);
  };

  const handleConfirmAccept = async (termsData) => {
    if (!quotationData?.quotation?.id) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await dispatch(acceptQuotationAction(quotationData.quotation.id, termsData || {}));
      if (!res.success) throw new Error(res.error || 'Failed to approve quotation.');
      setActionSuccess(res.data?.message || 'Quotation accepted and payment terms agreed.');
      setIsTermsModalOpen(false);
      await dispatch(fetchQuotationByRequestId(eventRequestId));
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestNegotiation = async (negotiationData) => {
    if (!quotationData?.quotation?.id) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await dispatch(negotiateQuotationAction(quotationData.quotation.id, negotiationData || {}));
      if (!res.success) throw new Error(res.error || 'Failed to submit negotiation request.');
      setActionSuccess(res.data?.message || 'Negotiation request submitted to Revenue Team.');
      setIsTermsModalOpen(false);
      await dispatch(fetchQuotationByRequestId(eventRequestId));
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!quotationData?.quotation?.id) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await dispatch(rejectQuotationAction(quotationData.quotation.id));
      if (!res.success) throw new Error(res.error || 'Failed to reject quotation.');
      setActionSuccess(res.data?.message || 'Quotation rejected.');
      await dispatch(fetchQuotationByRequestId(eventRequestId));
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const { quotation, activeVersion, lineItems = [], versionHistory = [], eventRequest, paymentSummary } = quotationData || {};

  // Dynamic milestone payment schedule breakdown
  const totalAmount = Number(activeVersion?.totalAmount || quotation?.totalAmount || 0);
  const totalPaid = Number(paymentSummary?.totalPaid || quotation?.totalPaid || 0);
  const remainingBalance = paymentSummary?.remainingBalance ?? Math.max(0, totalAmount - totalPaid);
  const nextInstallment = paymentSummary?.nextInstallment;
  const paymentStatus = paymentSummary?.paymentStatus || quotation?.paymentStatus || (totalPaid >= totalAmount ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID');

  const advanceAmount = Math.round(totalAmount * 0.35);
  const milestoneAmount = Math.round(totalAmount * 0.45);
  const finalAmount = totalAmount - advanceAmount - milestoneAmount;

  const isStage1Paid = totalPaid >= advanceAmount && totalPaid > 0;
  const isStage2Paid = totalPaid >= (advanceAmount + milestoneAmount) && totalPaid > 0;
  const isStage3Paid = totalPaid >= totalAmount && totalPaid > 0;

  const modalContent = (
    <>
      <div
        data-wavevents-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      >
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden text-[#26334A]">
          
          {/* Top Brand Gradient Ribbon */}
          <div className="h-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shrink-0" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close Quotation Modal"
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Scrollable Container */}
          <div className="p-5 sm:p-7 md:p-8 overflow-y-auto space-y-6">

            {loading ? (
              <div className="py-16 text-center text-xs font-bold text-slate-500 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-sm font-extrabold text-slate-700">Loading Commercial Quotation...</span>
                <span className="text-xs text-slate-400 font-medium">Fetching verified rate cards and terms</span>
              </div>
            ) : error && !quotation ? (
              <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-rose-900">Quotation Unavailable</h4>
                  <p className="text-xs text-rose-700">{error}</p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#26334A] text-white rounded-xl font-extrabold text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Close Modal
                </button>
              </div>
            ) : (
              <>
                {/* Header Information Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Commercial Proposal
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                        V{activeVersion?.versionNumber || 1}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {eventRequest?.eventName || 'Commercial Quotation'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                      <span>{eventRequest?.organizationName || 'Wavevents Client'}</span>
                      {eventRequest?.category && <span>• {eventRequest.category}</span>}
                      <span>• Issued by Revenue Operations</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <StatusBadge status={activeVersion?.status || quotation?.status || 'DRAFT'} />
                  </div>
                </div>

                {/* Notifications & Status Alerts */}
                {actionSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Itemized Services Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Itemized Services & Resources</span>
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">
                      {lineItems.length} {lineItems.length === 1 ? 'line item' : 'line items'}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Service Description</th>
                          <th className="py-3 px-3 text-center">Qty</th>
                          <th className="py-3 px-3 text-right">Unit Price</th>
                          <th className="py-3 px-4 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {lineItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                              No line items specified. Contact Revenue Operations.
                            </td>
                          </tr>
                        ) : (
                          lineItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-4 font-bold text-slate-900">{item.description}</td>
                              <td className="py-3 px-3 text-center font-bold text-slate-600">{item.quantity}</td>
                              <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">
                                ₹{Number(item.unitPrice || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-black text-indigo-700">
                                ₹{Number(item.subtotal || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pricing Totals Breakdown Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-slate-50 border border-indigo-100 space-y-2.5 text-xs shadow-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Subtotal Before Taxes</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{Number(activeVersion?.subtotal || 0).toLocaleString()}
                    </span>
                  </div>
                  {Number(activeVersion?.discount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <span>Commercial Discount</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">APPLIED</span>
                      </span>
                      <span className="font-mono font-bold">
                        -₹{Number(activeVersion?.discount || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Goods & Services Tax (GST {activeVersion?.taxPercent || 18}%)</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{Number(activeVersion?.taxAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-indigo-100 flex justify-between items-center text-sm font-black text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Final Total Contract Value</span>
                    </span>
                    <span className="text-xl font-mono font-black text-indigo-700">
                      ₹{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Structured Payment Milestones Preview */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Structured Payment Schedule (35% / 45% / 20%)</span>
                    </h4>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Standard Terms
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 space-y-1 relative">
                      <div className="flex justify-between items-center text-[11px] font-black text-purple-900">
                        <span>Stage 1: Advance</span>
                        <div className="flex items-center gap-1">
                          {isStage1Paid ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Paid ✓
                            </span>
                          ) : quotation?.status === 'ACCEPTED' ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              Due Now
                            </span>
                          ) : (
                            <span className="font-mono text-purple-700">35%</span>
                          )}
                        </div>
                      </div>
                      <div className="text-base font-mono font-black text-purple-950">
                        ₹{advanceAmount.toLocaleString()}
                      </div>
                      <p className="text-[10px] text-purple-700 font-medium">
                        Due upon quotation acceptance to lock staff & venue.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1 relative">
                      <div className="flex justify-between items-center text-[11px] font-black text-indigo-900">
                        <span>Stage 2: Milestone</span>
                        <div className="flex items-center gap-1">
                          {isStage2Paid ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Paid ✓
                            </span>
                          ) : isStage1Paid && quotation?.status === 'ACCEPTED' && remainingBalance > 0 ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              Due Now
                            </span>
                          ) : (
                            <span className="font-mono text-indigo-700">45%</span>
                          )}
                        </div>
                      </div>
                      <div className="text-base font-mono font-black text-indigo-950">
                        ₹{milestoneAmount.toLocaleString()}
                      </div>
                      <p className="text-[10px] text-indigo-700 font-medium">
                        Due prior to event execution & vendor finalization.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100 space-y-1 relative">
                      <div className="flex justify-between items-center text-[11px] font-black text-teal-900">
                        <span>Stage 3: Settlement</span>
                        <div className="flex items-center gap-1">
                          {isStage3Paid ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Paid ✓
                            </span>
                          ) : isStage2Paid && quotation?.status === 'ACCEPTED' && remainingBalance > 0 ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              Due Now
                            </span>
                          ) : (
                            <span className="font-mono text-teal-700">20%</span>
                          )}
                        </div>
                      </div>
                      <div className="text-base font-mono font-black text-teal-950">
                        ₹{finalAmount.toLocaleString()}
                      </div>
                      <p className="text-[10px] text-teal-700 font-medium">
                        Due upon successful event conclusion & handover.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Terms & Commercial Conditions */}
                {(activeVersion?.notes || activeVersion?.terms) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {activeVersion?.notes && (
                      <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1.5">
                        <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">Proposal Notes</span>
                        <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">{activeVersion.notes}</p>
                      </div>
                    )}
                    {activeVersion?.terms && (
                      <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1.5">
                        <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">Commercial Conditions</span>
                        <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">{activeVersion.terms}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Version History */}
                {versionHistory.length > 1 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                      Quotation Revision History
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      {versionHistory.map(v => (
                        <span
                          key={v.id}
                          className={`px-3 py-1 rounded-xl border text-xs font-bold transition ${
                            v.versionNumber === activeVersion?.versionNumber
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          V{v.versionNumber}: ₹{v.totalAmount?.toLocaleString()} ({v.status})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Decision / Action State Footer */}
                {quotation?.status === 'ACCEPTED' || activeVersion?.status === 'ACCEPTED' ? (
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-black block text-sm">Commercial Proposal Accepted</span>
                          <span className="text-[11px] text-emerald-700">
                            Payment schedule confirmed. Operations staff is assigned and event setup is active.
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shrink-0">
                          APPROVED
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          paymentStatus === 'PAID'
                            ? 'bg-emerald-700 text-white'
                            : paymentStatus === 'PARTIALLY_PAID'
                            ? 'bg-teal-700 text-white'
                            : 'bg-amber-600 text-white'
                        }`}>
                          {paymentStatus === 'PAID' ? 'FULLY PAID' : paymentStatus === 'PARTIALLY_PAID' ? 'PARTIALLY PAID' : 'PAYMENT DUE'}
                        </span>
                      </div>
                    </div>

                    {/* Payment Ledger & Action Box */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                        <div>
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                            Payment Ledger & Settlement Status
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            3-Stage Milestone Payment Schedule for {eventRequest?.eventName || 'Quotation'}
                          </span>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[11px] text-slate-500 block font-medium">Outstanding Balance</span>
                          <span className="text-sm font-black font-mono text-slate-900">
                            ₹{remainingBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Agreed</span>
                          <span className="text-xs font-mono font-black text-slate-800">₹{totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                          <span className="text-[10px] font-extrabold uppercase text-emerald-600 block">Total Paid</span>
                          <span className="text-xs font-mono font-black text-emerald-700">₹{totalPaid.toLocaleString()}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                          <span className="text-[10px] font-extrabold uppercase text-indigo-600 block">Balance Due</span>
                          <span className="text-xs font-mono font-black text-indigo-700">₹{remainingBalance.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Payment Link / Action Button */}
                      {remainingBalance > 0 && nextInstallment ? (
                        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="text-xs text-slate-600 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Next Installment: <strong>{nextInstallment.name}</strong> ({nextInstallment.percent}%)
                            </span>
                          </div>
                          <button
                            id="proceed-to-payment-btn"
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                          >
                            <span>Proceed to Payment (₹{nextInstallment.amount.toLocaleString()})</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Quotation is Fully Paid. All milestone payments have been confirmed!</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : quotation?.status === 'UNDER_NEGOTIATION' || activeVersion?.status === 'UNDER_NEGOTIATION' ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-black block text-sm">Terms Negotiation In Progress</span>
                        <span className="text-[11px] text-amber-700">
                          Your negotiation request has been submitted to Revenue Operations. A revised schedule is being prepared.
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shrink-0">
                      NEGOTIATING
                    </span>
                  </div>
                ) : quotation?.status === 'REJECTED' || activeVersion?.status === 'REJECTED' ? (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <div>
                        <span className="font-black block text-sm">Quotation Declined</span>
                        <span className="text-[11px] text-rose-700">
                          You declined this quotation version. Contact your representative to request a new quote.
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shrink-0">
                      REJECTED
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 text-xs font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        Please review the contract terms. Click <strong>Accept Quotation</strong> to confirm the 3-stage payment plan or <strong>Decline</strong> to reject.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleApproveClick}
                        disabled={actionLoading}
                        className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs transition shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Quotation & Confirm Terms</span>
                      </button>

                      <button
                        onClick={handleReject}
                        disabled={actionLoading}
                        className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{actionLoading ? 'Processing...' : 'Decline Quotation'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* Payment Terms & Commercial Confirmation Modal */}
      <PaymentTermsConfirmModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        quotation={quotation}
        activeVersion={activeVersion}
        eventName={eventRequest?.eventName || 'Event Request'}
        onConfirmAccept={handleConfirmAccept}
        onRequestNegotiation={handleRequestNegotiation}
      />

      {/* Quotation Milestone Payment Modal */}
      <QuotationPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        quotation={quotation}
        eventRequest={eventRequest}
        paymentSummary={paymentSummary}
        onPaymentSuccess={() => {
          fetchQuotation();
          if (onQuotationUpdated) onQuotationUpdated();
        }}
      />
    </>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
