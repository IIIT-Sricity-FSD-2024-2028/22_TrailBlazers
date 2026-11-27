import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, DollarSign, FileText, CheckCircle2, AlertCircle, ArrowRight, MessageSquare, Clock, RefreshCw, XCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export default function QuotationViewModal({ isOpen, onClose, eventRequestId, onQuotationUpdated }) {
  const [quotationData, setQuotationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMode, setActionMode] = useState(null); // 'change_request' | 'reject'
  const [changeMsg, setChangeMsg] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

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
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/client/quotations/request/${eventRequestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load quotation details.');
      }
      setQuotationData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!quotationData?.quotation?.id) return;
    setActionLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/client/quotations/${quotationData.quotation.id}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve quotation.');
      setActionSuccess(data.message);
      fetchQuotation();
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!quotationData?.quotation?.id) return;
    setActionLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/client/quotations/${quotationData.quotation.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject quotation.');
      setActionSuccess(data.message);
      fetchQuotation();
      if (onQuotationUpdated) onQuotationUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const { quotation, activeVersion, lineItems = [], versionHistory = [], changeRequests = [] } = quotationData || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-[#26334A]">
      <div className="relative w-full max-w-2xl glass-modal-light rounded-3xl shadow-2xl border border-white overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Top Header Ribbon */}
        <div className="h-2.5 bg-gradient-to-r from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5] shrink-0" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-[#26334A] hover:bg-white/80 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">

          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-[#64748B] flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Loading Commercial Quotation Details...</span>
            </div>
          ) : error && !quotation ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p>{error}</p>
              <button onClick={onClose} className="px-4 py-2 bg-[#26334A] text-white rounded-xl font-extrabold">Close</button>
            </div>
          ) : (
            <>
              {/* Top Quotation Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Commercial Quotation — Version V{activeVersion?.versionNumber}</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#26334A] leading-snug">Commercial Proposal</h2>
                  <p className="text-xs text-[#64748B]">Issued by Wavevents Revenue Operations Team</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900">
                    V{activeVersion?.versionNumber}
                  </span>
                  <StatusBadge status={activeVersion?.status || 'DRAFT'} />
                </div>
              </div>

              {actionSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Line Items Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#26334A] uppercase tracking-wider">Itemized Services & Resources</h4>
                
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/80">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[#64748B] font-extrabold uppercase tracking-wider">
                        <th className="py-2.5 px-4">Service Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-[#26334A]">
                      {lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 px-4 font-bold">{item.description}</td>
                          <td className="py-3 px-3 text-center">{item.quantity}</td>
                          <td className="py-3 px-3 text-right font-mono">₹{item.unitPrice.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-indigo-900">₹{item.subtotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Totals Breakdown Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#DAF0FB]/60 via-white to-[#E8F9F5]/60 border border-[#B5E1F7] space-y-2 text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold text-[#26334A]">₹{activeVersion?.subtotal?.toLocaleString()}</span>
                </div>
                {Number(activeVersion?.discount) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount Applied</span>
                    <span className="font-mono font-bold">-₹{activeVersion?.discount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#64748B]">
                  <span>GST / Tax ({activeVersion?.taxPercent}%)</span>
                  <span className="font-mono font-semibold text-[#26334A]">₹{activeVersion?.taxAmount?.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-[#B5E1F7] flex justify-between items-center text-sm font-extrabold text-[#26334A]">
                  <span>Final Total Contract Amount</span>
                  <span className="text-lg font-mono text-indigo-700">₹{activeVersion?.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Terms & Conditions / Commercial Notes */}
              {(activeVersion?.notes || activeVersion?.terms) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {activeVersion?.notes && (
                    <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 space-y-1">
                      <span className="font-extrabold text-[#26334A] block">Proposal Notes</span>
                      <p className="text-[#64748B] font-medium leading-relaxed whitespace-pre-line">{activeVersion.notes}</p>
                    </div>
                  )}
                  {activeVersion?.terms && (
                    <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 space-y-1">
                      <span className="font-extrabold text-[#26334A] block">Terms & Commercial Conditions</span>
                      <p className="text-[#64748B] font-medium leading-relaxed whitespace-pre-line">{activeVersion.terms}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Version History & Change Requests List */}
              {versionHistory.length > 1 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider">Quotation Version History</span>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    {versionHistory.map(v => (
                      <span key={v.id} className={`px-3 py-1 rounded-xl border ${v.versionNumber === activeVersion.versionNumber ? 'bg-indigo-600 text-white font-bold border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                        V{v.versionNumber}: ₹{v.totalAmount.toLocaleString()} ({v.status})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Actions for Client: Exactly Approve and Reject */}
              {quotation?.status === 'ACCEPTED' || activeVersion?.status === 'ACCEPTED' ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-extrabold block">Commercial Proposal Approved</span>
                      <span className="text-[11px] text-emerald-700">You have approved this quotation. Event preparation is in progress.</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                    APPROVED
                  </span>
                </div>
              ) : quotation?.status === 'REJECTED' || activeVersion?.status === 'REJECTED' ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-extrabold block">Commercial Proposal Rejected</span>
                      <span className="text-[11px] text-rose-700">You have rejected this quotation.</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                    REJECTED
                  </span>
                </div>
              ) : (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>This commercial quotation is finalized and read-only. Choose <strong>Approve</strong> or <strong>Reject</strong> below.</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoading ? 'Processing...' : 'Approve'}</span>
                    </button>

                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{actionLoading ? 'Processing...' : 'Reject'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
