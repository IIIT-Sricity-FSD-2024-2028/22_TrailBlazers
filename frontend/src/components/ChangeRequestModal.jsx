import React, { useState } from 'react';
import { X, Send, AlertCircle, Sparkles } from 'lucide-react';

export default function ChangeRequestModal({ isOpen, onClose, eventRequest, onRequestSubmitted }) {
  if (!isOpen || !eventRequest) return null;

  const [changeType, setChangeType] = useState('Agenda Change');
  const [currentDetails, setCurrentDetails] = useState(eventRequest.agenda || 'Standard Agenda');
  const [requestedChange, setRequestedChange] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!requestedChange.trim()) {
      setError('Please provide the details of your requested change.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/change-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventRequestId: eventRequest.id,
          changeType,
          currentDetails,
          requestedChange: requestedChange.trim(),
          reason: reason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit change request.');

      if (onRequestSubmitted) onRequestSubmitted();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white/95 border border-white rounded-3xl shadow-2xl max-w-lg w-full p-6 text-slate-800 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-extrabold text-slate-900">Request Event Change</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Alert */}
        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900 text-xs font-medium space-y-1">
          <div className="font-extrabold flex items-center gap-1.5 text-purple-900">
            <AlertCircle className="w-4 h-4 text-purple-600" />
            <span>Audited Event Change Request</span>
          </div>
          <p>
            Your request will be submitted to the assigned <strong>Event Manager</strong> for operational review before updating official event data.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          
          {/* Target Event */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Event</label>
            <input
              type="text"
              readOnly
              value={eventRequest.eventName}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 font-extrabold text-slate-800"
            />
          </div>

          {/* Change Type */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Change Type</label>
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 focus:border-purple-500"
            >
              <option value="Agenda Change">Agenda Change</option>
              <option value="Timing Adjustment">Timing Adjustment</option>
              <option value="Venue & Equipment Request">Venue & Equipment Request</option>
              <option value="General Request">General Schedule Request</option>
            </select>
          </div>

          {/* Current Agenda / Details */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Current Value / Agenda</label>
            <textarea
              rows={2}
              value={currentDetails}
              onChange={(e) => setCurrentDetails(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700"
              placeholder="e.g. Keynote — 10:00 AM"
            />
          </div>

          {/* Requested Change */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Requested Change <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={requestedChange}
              onChange={(e) => setRequestedChange(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 focus:border-purple-500"
              placeholder="e.g. Move Keynote to 11:00 AM and extend Q&A session by 30 mins."
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Change (Optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 focus:border-purple-500"
              placeholder="e.g. Client requested a schedule adjustment due to keynote speaker flight arrival."
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs">
              ✕ {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting...' : 'Submit Change Request'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
