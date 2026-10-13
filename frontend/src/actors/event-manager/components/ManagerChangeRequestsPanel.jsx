import React, { useState, useEffect } from 'react';
import { MessageSquare, Check, X, Sparkles, User, Calendar, AlertCircle } from 'lucide-react';

export default function ManagerChangeRequestsPanel({ onReviewComplete }) {
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  useEffect(() => {
    fetchManagerChangeRequests();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('ffsd_token');
    return { 'Authorization': `Bearer ${token}` };
  };

  const fetchManagerChangeRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/change-requests/manager', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setChangeRequests(data.changeRequests || []);
      }
    } catch (err) {
      console.error('Error fetching manager change requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, action) => {
    setSubmittingId(id);
    setActionMsg('');
    setActionErr('');

    try {
      const reviewComment = comments[id] || '';
      const res = await fetch(`/api/change-requests/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({ action, reviewComment })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review decision.');

      setActionMsg(data.message);
      fetchManagerChangeRequests();
      if (onReviewComplete) onReviewComplete();
    } catch (err) {
      setActionErr(err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-3xl glass-light border border-white text-center text-xs font-bold text-slate-500">
        Loading client change requests...
      </div>
    );
  }

  if (changeRequests.length === 0) {
    return (
      <div className="p-6 rounded-3xl glass-light border border-white text-center space-y-2">
        <Sparkles className="w-6 h-6 text-purple-600 mx-auto" />
        <h4 className="text-xs font-extrabold text-slate-800">No Pending Client Change Requests</h4>
        <p className="text-[11px] text-slate-500 font-medium">All client-submitted event changes have been reviewed and processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#26334A] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <span>Client Event Change Requests ({changeRequests.length})</span>
        </h3>
        <span className="text-xs font-extrabold text-purple-900 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
          Pending Operational Review
        </span>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
          ✓ {actionMsg}
        </div>
      )}
      {actionErr && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold">
          ✕ {actionErr}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {changeRequests.map((cr) => (
          <div key={cr.id} className="p-5 rounded-3xl bg-white/90 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            
            {/* Request Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#26334A] text-sm">{cr.eventName}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black uppercase border border-purple-200">
                    {cr.changeType}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 font-medium mt-0.5 text-[11px]">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <strong>Client:</strong> {cr.clientName}
                  </span>
                  <span>•</span>
                  <span><strong>Org:</strong> {cr.organizationName}</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold self-start sm:self-auto">
                Status: PENDING MANAGER REVIEW
              </span>
            </div>

            {/* Current vs Requested Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">CURRENT EVENT PLAN</span>
                <p className="font-medium text-slate-800 break-words">{cr.currentDetails || 'Standard Event Agenda'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1">
                <span className="font-extrabold text-purple-900 uppercase tracking-wider text-[10px]">REQUESTED CHANGE</span>
                <p className="font-extrabold text-purple-950 break-words">{cr.requestedChange}</p>
              </div>
            </div>

            {cr.reason && (
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 text-amber-900 font-medium">
                <strong>Client Reason:</strong> {cr.reason}
              </div>
            )}

            {/* Manager Review Action Form */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="block font-bold text-slate-700 text-xs">
                Event Manager Review Comment / Operational Feedback (Optional for approval, recommended for rejection):
              </label>
              <input
                type="text"
                value={comments[cr.id] || ''}
                onChange={(e) => setComments({ ...comments, [cr.id]: e.target.value })}
                placeholder="e.g. Approved and synchronized with coordinator & venue schedule. / Rejected due to speaker availability."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 focus:border-purple-500"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={submittingId === cr.id}
                  onClick={() => handleReview(cr.id, 'REJECT')}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-extrabold transition border border-rose-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>

                <button
                  type="button"
                  disabled={submittingId === cr.id}
                  onClick={() => handleReview(cr.id, 'APPROVE')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Update Official Plan</span>
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
