import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createPortal } from 'react-dom';
import { X, Send, AlertCircle, Sparkles, RefreshCw, Calendar, Tag, FileText, CheckCircle2 } from 'lucide-react';
import { submitChangeRequestAction } from '../../../store/requests-actions';

export default function ChangeRequestModal({ isOpen, onClose, eventRequest, onRequestSubmitted }) {
  const dispatch = useDispatch();
  const [changeType, setChangeType] = useState('Agenda Change');
  const [currentDetails, setCurrentDetails] = useState('');
  const [requestedChange, setRequestedChange] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Sync / reset form state whenever modal is opened
  useEffect(() => {
    if (isOpen && eventRequest) {
      setChangeType('Agenda Change');
      setCurrentDetails(eventRequest.agenda || 'Standard Agenda');
      setRequestedChange('');
      setReason('');
      setError('');
      setSuccess(false);
      setLoading(false);
    }
  }, [isOpen, eventRequest]);

  // Lock body scroll and support Escape key with reliable cleanup
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        // Check if any other modal is still mounted and active
        const activeModals = document.querySelectorAll('[data-wavevents-modal="true"]');
        if (activeModals.length <= 1) {
          document.body.style.overflow = '';
        }
      };
    }
  }, [isOpen, onClose]);

  // Unconditional hook execution: early return only after hooks
  if (!isOpen || !eventRequest) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!requestedChange.trim()) {
      setError('Please provide the details of your requested change.');
      return;
    }

    setLoading(true);
    try {
      const res = await dispatch(
        submitChangeRequestAction({
          eventRequestId: eventRequest.id,
          changeType,
          currentDetails,
          requestedChange: requestedChange.trim(),
          reason: reason.trim()
        })
      );

      if (!res.success) throw new Error(res.error || 'Failed to submit change request.');

      setSuccess(true);
      setTimeout(() => {
        if (onRequestSubmitted) onRequestSubmitted();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      data-wavevents-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden text-slate-800">
        
        {/* Top Brand Gradient Ribbon */}
        <div className="h-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Change Request Modal"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
          
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                Change Management
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Request Event Change</h3>
            <p className="text-xs text-slate-500 font-medium">
              Submit formal modifications for operational review by the assigned Event Manager.
            </p>
          </div>

          {/* Audited Notice Card */}
          <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-100 text-purple-950 text-xs font-medium space-y-1">
            <div className="font-black flex items-center gap-1.5 text-purple-900">
              <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Audited Operational Workflow</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Your change request will be recorded and sent to the assigned <strong>Event Manager</strong> for schedule and resource validation before event parameters are modified.
            </p>
          </div>

          {success ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h4 className="text-base font-extrabold text-slate-900">Change Request Submitted</h4>
              <p className="text-xs text-slate-500 font-medium">
                Your request has been logged. The Event Manager has been notified for review.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              
              {/* Target Event */}
              <div className="space-y-1">
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px]">
                  Target Event
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-extrabold flex items-center justify-between">
                  <span>{eventRequest.eventName}</span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {eventRequest.id}</span>
                </div>
              </div>

              {/* Change Type */}
              <div className="space-y-1">
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px]">
                  Change Classification
                </label>
                <select
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                >
                  <option value="Agenda Change">Agenda & Session Change</option>
                  <option value="Timing Adjustment">Schedule & Timing Adjustment</option>
                  <option value="Venue & Equipment Request">Venue & Technical Equipment Request</option>
                  <option value="General Request">General Logistical Modification</option>
                </select>
              </div>

              {/* Current Value / Agenda */}
              <div className="space-y-1">
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px]">
                  Current Schedule / Agenda Reference
                </label>
                <textarea
                  rows={2}
                  value={currentDetails}
                  onChange={(e) => setCurrentDetails(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                  placeholder="e.g. Keynote session scheduled at 10:00 AM"
                />
              </div>

              {/* Requested Change */}
              <div className="space-y-1">
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px]">
                  Proposed Modification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={requestedChange}
                  onChange={(e) => setRequestedChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                  placeholder="Describe your desired adjustments in detail (e.g., Extend keynote Q&A by 30 mins and shift lunch break to 1:00 PM)..."
                />
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px]">
                  Operational Reason / Justification (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                  placeholder="e.g. Accommodating delayed guest speaker travel schedule"
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs transition shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Change Request</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
