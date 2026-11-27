import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, AlertCircle, Clock, Info, ArrowRight } from 'lucide-react';

export default function CancelEventModal({
  event,
  onClose,
  onSuccess,
}) {
  const [cancellationReason, setCancellationReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      if (!event?.id) return;
      try {
        const token = localStorage.getItem('ffsd_token');
        const res = await fetch(`/api/refunds/cancellation-preview/${event.id}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPreviewData(data);
          }
        }
      } catch (err) {
        console.error('Failed to load cancellation preview:', err);
      } finally {
        if (isMounted) {
          setPreviewLoading(false);
        }
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [event?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) {
      setError('A cancellation reason is required.');
      return;
    }

    if (previewData && previewData.isPermitted === false) {
      setError(previewData.restrictionReason || 'Cancellation is not permitted for this event.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/refunds/cancel-event/${event.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          cancellationReason: cancellationReason.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to cancel event.');
      }

      const data = await res.json();
      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Error occurred while cancelling event.');
    } finally {
      setLoading(false);
    }
  };

  const policyTiers = previewData?.policyTiers || [
    { period: 'More than 30 days before event', refundPercent: 90, deductionPercent: 10, description: '90% Refund' },
    { period: '15–30 days before event', refundPercent: 75, deductionPercent: 25, description: '75% Refund' },
    { period: '7–14 days before event', refundPercent: 50, deductionPercent: 50, description: '50% Refund' },
    { period: '3–6 days before event', refundPercent: 25, deductionPercent: 75, description: '25% Refund' },
    { period: 'Less than 72 hours', refundPercent: 0, deductionPercent: 100, description: '0% Refund' },
    { period: 'Event already started', refundPercent: 0, deductionPercent: 100, description: 'Cancellation not permitted' },
  ];

  const totalPaid = Number(previewData?.totalPaidAmount || 0);
  const deductionAmount = Number(previewData?.deductionAmount || 0);
  const refundableAmount = Number(previewData?.refundableAmount || 0);
  const isNotPermitted = previewData && previewData.isPermitted === false;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fadeIn text-[#26334A]">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Warning Ribbon */}
        <div className="h-2.5 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-600 shrink-0" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                Client Event Cancellation & Refund Review
              </span>
              <h3 className="text-lg font-extrabold text-[#26334A]">
                Cancellation Policy & Settlement Details
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Event Context Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Event</span>
              <div className="font-extrabold text-sm text-slate-900">{event?.eventName || event?.name}</div>
            </div>
            <div className="text-slate-600 font-medium text-right sm:text-right">
              <span>Date: <strong className="text-slate-800">{event?.eventDate || event?.startDate || event?.date}</strong></span>
              {previewData?.startTime && <span className="ml-2 text-slate-500 font-normal">({previewData.startTime})</span>}
            </div>
          </div>

          {/* Block banner if not permitted */}
          {isNotPermitted && (
            <div className="p-4 rounded-2xl bg-rose-100/90 border border-rose-300 text-rose-950 space-y-1">
              <div className="flex items-center gap-2 font-black text-sm text-rose-900">
                <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0" />
                <span>Cancellation Not Permitted</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-900/90 font-medium">
                {previewData?.restrictionReason || 'This event cannot be cancelled because it has already started or has been completed.'}
              </p>
            </div>
          )}

          {/* Refund Calculation Breakdown Cards */}
          <div>
            <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider block mb-2">
              Automated Refund Calculation (Backend Verified)
            </span>

            {previewLoading ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 animate-pulse">
                Calculating refund settlement breakdown...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Original Paid Amount</span>
                  <div className="text-lg font-black text-slate-900">
                    ₹{totalPaid.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">Total milestone payments</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                  <span className="text-[10px] font-bold text-rose-700 uppercase block">
                    Policy Deduction ({previewData?.deductionPercentage ?? 0}%)
                  </span>
                  <div className="text-lg font-black text-rose-600">
                    - ₹{deductionAmount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-rose-500">Non-refundable charges</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                    Final Refundable Amount ({previewData?.refundPercentage ?? 0}%)
                  </span>
                  <div className="text-lg font-black text-emerald-700">
                    ₹{refundableAmount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Subject to admin review</span>
                </div>
              </div>
            )}
          </div>

          {/* Cancellation Policy Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider block">
                Client Event Cancellation Policy
              </span>
              {previewData?.tierName && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                  Active: {previewData.tierName}
                </span>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-3">Cancellation Period</th>
                    <th className="py-2.5 px-3 text-center">Refund %</th>
                    <th className="py-2.5 px-3 text-center">Deduction %</th>
                    <th className="py-2.5 px-3">Policy Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policyTiers.map((tier, idx) => {
                    const isActive = tier.isActive;
                    return (
                      <tr
                        key={idx}
                        className={`transition ${
                          isActive
                            ? 'bg-purple-50/80 font-bold text-purple-900 border-l-4 border-l-purple-600'
                            : 'hover:bg-slate-50/60 text-slate-700'
                        }`}
                      >
                        <td className="py-2.5 px-3 flex items-center gap-1.5">
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                          <span>{tier.period}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-emerald-600">
                          {tier.refundPercent}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-rose-500">
                          {tier.deductionPercent}%
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500">
                          {tier.description || `${tier.refundPercent}% refund applicable`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cancellation Reason Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block">
              Cancellation Reason (Required) <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              disabled={isNotPermitted || loading}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="State the reason for cancelling this event (e.g. Schedule postponement, budget reallocation, internal organizational decision)..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-400">
              The cancellation reason and calculated refund figures will be recorded for organization and revenue administration audit.
            </p>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading || isNotPermitted || !cancellationReason.trim()}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs cursor-pointer transition flex items-center gap-1.5"
            >
              {loading ? 'Cancelling Event...' : 'Confirm Event Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
