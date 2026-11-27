import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createPortal } from 'react-dom';
import { X, XCircle, AlertTriangle, ShieldCheck, Calendar, MapPin, Ticket, Sparkles, Check, ArrowRight } from 'lucide-react';
import { claimTicketRefund } from '../../../store/tickets-actions';

const QUICK_REASONS = [
  'Personal schedule conflict',
  'Travel / Relocation issue',
  'Accidental / duplicate booking',
  'Medical emergency',
  'Other reasons',
];

export default function CancelTicketModal({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const [selectedQuickReason, setSelectedQuickReason] = useState(QUICK_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !ticket) return null;

  const totalAmount = Number(ticket.totalAmount || ticket.originalPaymentAmount || 0);
  const ticketQuantity = Number(ticket.quantity || ticket.ticketQuantity || 1);

  const handleSelectQuickReason = (reason) => {
    setSelectedQuickReason(reason);
    if (!customReason || QUICK_REASONS.includes(customReason)) {
      setCustomReason(reason);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const finalReason = customReason.trim() || selectedQuickReason || 'Attendee requested ticket cancellation';

    try {
      const res = await dispatch(claimTicketRefund(ticket.id, finalReason));
      if (!res.success) {
        throw new Error(res.error || 'Failed to cancel ticket.');
      }

      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Error occurred while submitting cancellation.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn text-[#26334A] overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        
        {/* Top Gradient Accent Ribbon */}
        <div className="h-2.5 bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 shrink-0" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <XCircle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/80 inline-block">
                Cancellation & 100% Refund Claim
              </span>
              <h3 className="text-xl font-extrabold text-[#26334A] tracking-tight">
                Cancel Ticket Pass
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Ticket Information Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-start gap-4">
              {ticket.bannerUrl ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-xs">
                  <img src={ticket.bannerUrl} alt={ticket.eventName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Ticket className="w-7 h-7" />
                </div>
              )}

              <div className="space-y-1 flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">
                  {ticket.organizationName || 'Wavevents Official Event'}
                </span>
                <h4 className="text-base font-extrabold text-[#26334A] leading-snug line-clamp-1">
                  {ticket.eventName}
                </h4>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
                  {(ticket.eventDate || ticket.date) && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{ticket.eventDate || ticket.date}</span>
                    </div>
                  )}
                  {ticket.venue && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate max-w-[200px]">{ticket.venue}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pill Highlights */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  Pass: {ticket.ticketNumber || ticket.id}
                </span>
                <span className="font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {ticketQuantity} Ticket{ticketQuantity > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600">Refundable:</span>
                <span className="font-mono font-black text-sm text-emerald-700">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 100% Refund Policy Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 flex items-start gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
            </div>
            <div className="space-y-0.5">
              <h5 className="font-extrabold text-amber-950">
                Wavevents 100% Refund Guarantee
              </h5>
              <p className="text-amber-900/90 leading-relaxed font-medium">
                Cancelling this pass will void your entry at the event check-in gates. A refund of <strong>₹{totalAmount.toLocaleString()}</strong> will be immediately queued for the <strong>REVENUE Department</strong> to process back to your original payment method.
              </p>
            </div>
          </div>

          {/* Anti-Abuse Booking & Cancellation Policy Limit */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-indigo-950">Fair Booking Policy:</span>
              <span className="text-indigo-800">Max 2 cancellations allowed per event</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full font-mono font-black text-xs ${
              (ticket.cancellationCountForEvent || 0) >= 2
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
            }`}>
              Cancellations: {ticket.cancellationCountForEvent || 0}/2
            </span>
          </div>

          {(ticket.maxCancellationsReached || (ticket.cancellationCountForEvent || 0) >= 2) && (
            <div className="p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                Cancellation limit reached (2/2) for this event. Further cancellations are blocked under the fair booking policy to prevent repeated booking and inventory abuse.
              </span>
            </div>
          )}

          {/* Quick Reasons Chips */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 block">
              Reason for Cancellation <span className="text-slate-400 font-normal">(Select or type below)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((reason) => (
                <button
                  type="button"
                  key={reason}
                  onClick={() => handleSelectQuickReason(reason)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedQuickReason === reason
                      ? 'bg-[#26334A] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {selectedQuickReason === reason && <Check className="w-3 h-3 text-white" />}
                  <span>{reason}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Reason Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">
              Additional Details / Comments <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Provide any additional context for the revenue team..."
              className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition bg-slate-50/50 hover:bg-white text-slate-800 font-medium"
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition border border-slate-200 shadow-2xs cursor-pointer"
          >
            Never Mind, Keep Ticket
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || ticket.maxCancellationsReached || (ticket.cancellationCountForEvent || 0) >= 2}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-extrabold text-xs transition shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Cancelling Pass...</span>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>Confirm Cancellation & Request Refund</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

