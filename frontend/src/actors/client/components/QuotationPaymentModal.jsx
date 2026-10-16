import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  CreditCard,
  QrCode,
  Building2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Loader2,
  Clock,
  Sparkles,
  FileText
} from 'lucide-react';

export default function QuotationPaymentModal({
  isOpen,
  onClose,
  quotation,
  eventRequest,
  paymentSummary,
  onPaymentSuccess
}) {
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoading(false);
      setPaymentResult(null);
    }
  }, [isOpen]);

  if (!isOpen || !quotation) return null;

  const eventName = eventRequest?.eventName || 'Corporate Event';
  const orgName = eventRequest?.organizationName || 'Client';
  const totalAmount = paymentSummary?.totalAmount || quotation?.totalAmount || 0;
  const totalPaid = paymentSummary?.totalPaid || 0;
  const remainingBalance = paymentSummary?.remainingBalance ?? Math.max(0, totalAmount - totalPaid);
  const nextInstallment = paymentSummary?.nextInstallment;
  const dueAmount = nextInstallment ? nextInstallment.amount : remainingBalance;
  const stageName = nextInstallment ? nextInstallment.name : 'Outstanding Balance';

  const handleProcessPayment = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('ffsd_token');
      if (!token) {
        throw new Error('Authentication session not found. Please sign in again.');
      }

      const res = await fetch(`/api/client/quotations/${quotation.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod,
          amount: dueAmount,
          notes: `${stageName} payment for ${eventName}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Payment transaction failed.');
      }

      setPaymentResult(data);
      if (onPaymentSuccess) {
        onPaymentSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setPaymentResult(null);
    onClose();
  };

  const modalContent = (
    <div
      data-wavevents-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 text-[#26334A]"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Brand Gradient Ribbon */}
        <div className="h-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 shrink-0" />

        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close Payment Modal"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">

          {!paymentResult ? (
            <div className="space-y-6">

              {/* Title Section */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Client Quotation Payment</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1 line-clamp-1 leading-snug">
                  {eventName}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {orgName} • Quotation ref: <span className="font-mono font-bold text-slate-700">{quotation.id}</span>
                </p>
              </div>

              {/* Installment Milestone Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/50 to-slate-50 border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{stageName}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 font-mono">
                    {nextInstallment?.percentage || 35}% DUE
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs text-slate-600 font-medium">Scheduled Amount Due:</span>
                  <span className="text-2xl font-mono font-black text-emerald-800">
                    ₹{dueAmount.toLocaleString()}
                  </span>
                </div>

                {nextInstallment?.description && (
                  <p className="text-[11px] text-slate-600 font-medium">
                    {nextInstallment.description}
                  </p>
                )}

                {/* Contract Balance Context */}
                <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Total Contract Value</span>
                    <strong className="font-mono text-slate-800">₹{totalAmount.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Remaining Balance</span>
                    <strong className="font-mono text-emerald-700">₹{remainingBalance.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'UPI'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs">UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'CARD'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('NET_BANKING')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'NET_BANKING'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs">Net Banking</span>
                  </button>
                </div>
              </div>

              {/* Simulated Gateway Info */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Demo Mode: Instant payment simulation with automated cryptographic transaction confirmation.
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Payment Action Button */}
              <button
                onClick={handleProcessPayment}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Pay ₹{dueAmount.toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* PAYMENT SUCCESS CONFIRMATION SCREEN */
            <div className="text-center space-y-5 py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black text-emerald-700 tracking-wider uppercase">
                  Transaction Confirmed
                </span>
                <h3 className="text-2xl font-black text-slate-900">Payment Successful</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Commercial milestone payment received for <strong>{eventName}</strong>
                </p>
              </div>

              {/* Structured Success Details Breakdown */}
              <div className="p-5 rounded-2xl bg-[#E8F9F5]/80 border border-[#C7F3EA] text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Event</span>
                  <span className="font-extrabold text-slate-800 text-right">{eventName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Quotation Reference</span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {quotation.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-mono font-bold text-slate-700">
                    {paymentResult.payment?.transactionId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-extrabold text-slate-800">{paymentResult.payment?.paymentMethod || paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Installment Stage</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                    {paymentResult.payment?.installmentStage || stageName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Date & Time</span>
                  <span className="font-mono text-slate-700">{paymentResult.payment?.createdAt || new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Status</span>
                  <span className="font-black text-emerald-700">
                    {paymentResult.summary?.paymentStatus === 'PAID' ? 'FULLY PAID (100%)' : 'SUCCESS (PARTIALLY PAID)'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#C7F3EA]">
                  <span className="text-slate-600 font-bold">Amount Paid (This Transaction)</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    ₹{paymentResult.payment?.amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">Total Paid to Date</span>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{paymentResult.summary?.totalPaid?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">Remaining Balance</span>
                  <span className="font-mono font-black text-indigo-700">
                    ₹{paymentResult.summary?.remainingBalance?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleClose}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#26334A] text-white font-extrabold text-xs hover:bg-slate-800 transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Return to Quotation</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
