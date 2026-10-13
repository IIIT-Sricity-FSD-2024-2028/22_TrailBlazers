import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  DollarSign,
  ArrowRight,
  Sparkles,
  Send,
  MessageSquare,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

export default function PaymentTermsConfirmModal({
  isOpen,
  onClose,
  quotation,
  activeVersion,
  eventName = 'Event Proposal',
  onConfirmAccept,
  onRequestNegotiation,
}) {
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Negotiation Drawer State
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [negotiationType, setNegotiationType] = useState('Payment Schedule Adjustment');
  const [negotiationNotes, setNegotiationNotes] = useState('');
  const [negotiationSubmitting, setNegotiationSubmitting] = useState(false);

  if (!isOpen) return null;

  // 1. Dynamic 35% / 45% / 20% calculation with rounding safeguard
  const totalAmount = Number(activeVersion?.totalAmount || quotation?.totalAmount || 0);
  const advanceAmount = Math.round(totalAmount * 0.35);
  const milestoneAmount = Math.round(totalAmount * 0.45);
  const finalAmount = totalAmount - advanceAmount - milestoneAmount;

  const handleProceed = async () => {
    if (!termsAgreed) {
      setErrorMessage('Please confirm that you agree to the payment terms.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      if (onConfirmAccept) {
        await onConfirmAccept({
          termsAccepted: true,
          paymentSchedule: {
            advancePercent: 35,
            advanceAmount,
            milestonePercent: 45,
            milestoneAmount,
            finalPercent: 20,
            finalAmount,
          },
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to accept quotation.');
      setIsSubmitting(false);
    }
  };

  const handleNegotiationSubmit = async (e) => {
    e.preventDefault();
    if (!negotiationNotes.trim()) {
      setErrorMessage('Please describe what terms you would like to negotiate.');
      return;
    }

    setErrorMessage('');
    setNegotiationSubmitting(true);
    try {
      if (onRequestNegotiation) {
        await onRequestNegotiation({
          changeType: negotiationType,
          requestedChanges: negotiationNotes.trim(),
          reason: negotiationNotes.trim(),
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit negotiation request.');
      setNegotiationSubmitting(false);
    }
  };

  const commercialConditions = [
    'The event is confirmed only after the required advance payment is received/recorded according to the agreed process.',
    'The payment schedule applies to the accepted quotation amount.',
    'Additional services or scope changes requested after acceptance may result in additional charges.',
    'Any changes to event requirements should be communicated to the Revenue Team.',
    'Cancellation/refund conditions are governed by the agreed quotation/contract terms.',
    'Payment records and receipts should be maintained against the event.',
    'The client should contact the Revenue Team if they require changes to the payment schedule or commercial conditions.',
    'Acceptance of the quotation indicates agreement with the displayed payment schedule and commercial terms.',
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in text-[#26334A]"
      style={{ zIndex: 100 }}
    >
      <div className="relative w-full max-w-2xl bg-white/95 rounded-3xl shadow-2xl border border-white overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Top Gradient Ribbon */}
        <div className="h-3 bg-gradient-to-r from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5] shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting || negotiationSubmitting}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">

          {/* Header */}
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Commercial Terms Confirmation</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#26334A]">
              Confirm Quotation & Payment Terms
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Please review the payment schedule and commercial conditions before officially accepting the quotation for{' '}
              <strong className="text-slate-800 font-bold">{eventName}</strong>.
            </p>
          </div>

          {/* Contract Amount Summary Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#DAF0FB]/70 via-indigo-50/40 to-[#E8F9F5]/70 border border-[#B5E1F7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider block">
                Total Contract Amount (V{activeVersion?.versionNumber || 1})
              </span>
              <span className="text-2xl font-extrabold text-[#26334A] font-mono">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200 text-slate-700 text-xs font-extrabold shadow-sm">
                3-Stage Payment Plan
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!showNegotiation ? (
            <>
              {/* Payment Schedule (35% - 45% - 20%) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#26334A] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Payment Schedule</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    35% + 45% + 20% = 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* 1st Payment: 35% Advance */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-50/70 to-white border border-indigo-100 flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider inline-block">
                        1st Payment — 35%
                      </span>
                      <h5 className="font-extrabold text-xs text-slate-900">Advance Deposit</h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Payable at confirmation. Confirms the event and allows preparation to begin.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-indigo-100/80">
                      <span className="text-base font-extrabold text-indigo-900 font-mono">
                        ₹{advanceAmount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">35% of quotation</span>
                    </div>
                  </div>

                  {/* 2nd Payment: 45% Milestone */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-50/70 to-white border border-purple-100 flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-extrabold text-[10px] uppercase tracking-wider inline-block">
                        2nd Payment — 45%
                      </span>
                      <h5 className="font-extrabold text-xs text-slate-900">Milestone Payment</h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Payable during the agreed event preparation milestone.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-purple-100/80">
                      <span className="text-base font-extrabold text-purple-900 font-mono">
                        ₹{milestoneAmount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">45% of quotation</span>
                    </div>
                  </div>

                  {/* 3rd Payment: 20% Final */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50/70 to-white border border-emerald-100 flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider inline-block">
                        3rd Payment — 20%
                      </span>
                      <h5 className="font-extrabold text-xs text-slate-900">Final Settlement</h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Remaining balance payable as final settlement per agreed terms.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-emerald-100/80">
                      <span className="text-base font-extrabold text-emerald-900 font-mono">
                        ₹{finalAmount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">20% of quotation</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Commercial Conditions */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-[#26334A] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Commercial Conditions & Rules</span>
                </h4>
                
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600 max-h-48 overflow-y-auto">
                  <ol className="list-decimal list-inside space-y-1.5 font-medium leading-relaxed">
                    {commercialConditions.map((condition, idx) => (
                      <li key={idx} className="text-slate-700">
                        {condition}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Negotiation Secondary Prompt */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-amber-900 font-medium">
                    Don't agree with these payment terms or need schedule adjustments?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNegotiation(true);
                    setErrorMessage('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition shrink-0 cursor-pointer shadow-sm"
                >
                  Request Negotiation
                </button>
              </div>

              {/* Agreement Checkbox */}
              <div className="p-4 rounded-2xl bg-white border-2 border-indigo-100 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => {
                      setTermsAgreed(e.target.checked);
                      if (e.target.checked) setErrorMessage('');
                    }}
                    className="w-5 h-5 mt-0.5 rounded-lg border-2 border-indigo-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition"
                  />
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-900 block">
                      I have read and agree to the above payment terms and conditions.
                    </span>
                    <span className="text-slate-500 font-medium">
                      By checking this, you confirm acceptance of the 35% / 45% / 20% payment schedule.
                    </span>
                  </div>
                </label>

                {!termsAgreed && (
                  <p className="text-[11px] font-semibold text-amber-700 pl-8 flex items-center gap-1">
                    <span>* Please confirm that you agree to the payment terms before proceeding.</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={!termsAgreed || isSubmitting}
                  className={`px-6 py-2.5 rounded-2xl font-extrabold text-xs transition shadow-md flex items-center gap-2 cursor-pointer ${
                    termsAgreed && !isSubmitting
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-500/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording Acceptance...' : 'Proceed to Accept Quotation'}</span>
                </button>
              </div>
            </>
          ) : (
            /* Negotiation Form Drawer */
            <form onSubmit={handleNegotiationSubmit} className="space-y-4 text-xs font-medium">
              
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span>Request Negotiation with Revenue Team</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your quotation will remain unaccepted while our Revenue Team reviews your requested adjustments to formulate a revised commercial agreement.
                </p>
              </div>

              {/* Negotiation Topic */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Negotiation Topic</label>
                <select
                  value={negotiationType}
                  onChange={(e) => setNegotiationType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 focus:border-indigo-500"
                >
                  <option value="Payment Schedule Adjustment">Payment Schedule Adjustment</option>
                  <option value="Advance Amount Revision">Advance Amount Revision</option>
                  <option value="Milestone Payment Terms">Milestone Payment Terms</option>
                  <option value="Scope & Pricing Discussion">Scope & Pricing Discussion</option>
                  <option value="Commercial Terms Negotiation">General Commercial Terms</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Proposed Adjustments / Comments <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={negotiationNotes}
                  onChange={(e) => setNegotiationNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 focus:border-indigo-500 leading-relaxed"
                  placeholder="e.g. We would like to request a 25% Advance and 50% Milestone structure to align with our corporate fiscal cycle."
                />
              </div>

              {/* Negotiation Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNegotiation(false);
                    setErrorMessage('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  ← Back to Payment Terms
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={negotiationSubmitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{negotiationSubmitting ? 'Submitting...' : 'Send to Revenue Team'}</span>
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
