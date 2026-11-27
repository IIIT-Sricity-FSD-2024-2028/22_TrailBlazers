import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createPortal } from 'react-dom';
import { X, Calendar, AlertCircle, Clock, Info } from 'lucide-react';
import { postponeEventAction } from '../../../store/operations-actions';

export default function PostponeEventModal({
  event,
  onClose,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [newStartTime, setNewStartTime] = useState(event?.startTime || '09:00 AM');
  const [newEndTime, setNewEndTime] = useState(event?.endTime || '05:00 PM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate) {
      setError('A new scheduled event date is required.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for postponing the event.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await dispatch(postponeEventAction(event.id, {
        newDate,
        reason: reason.trim(),
        newStartTime,
        newEndTime,
      }));

      if (!result.success) {
        throw new Error(result.error || 'Failed to postpone event.');
      }

      if (onSuccess) {
        onSuccess(result.data);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Error occurred while postponing event.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn text-[#26334A]">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Ribbon */}
        <div className="h-2.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 shrink-0" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                Event Schedule Modification
              </span>
              <h3 className="text-lg font-extrabold text-[#26334A]">
                Postpone Event (Retain or Refund)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Event Context */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Event</span>
            <div className="font-extrabold text-sm text-slate-900">{event?.eventName || event?.name}</div>
            <div className="text-slate-500 font-medium">
              Current Date: <strong className="text-slate-700">{event?.eventDate || event?.date}</strong>
            </div>
          </div>

          {/* Postponement Policy Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Attendee Retention Policy</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
              Postponing will NOT cancel the event. Ticket holders can retain their tickets for the new date or request a 100% refund.
            </p>
          </div>

          {/* New Date Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block">
              New Event Date (Required) <span className="text-rose-600">*</span>
            </label>
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          {/* Postpone Reason */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block">
              Reason for Postponement (Required) <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Keynote speaker flight rescheduled; venue hall maintenance..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newDate || !reason.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs cursor-pointer transition flex items-center gap-1.5"
            >
              {loading ? 'Rescheduling Event...' : 'Confirm Postponement'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

