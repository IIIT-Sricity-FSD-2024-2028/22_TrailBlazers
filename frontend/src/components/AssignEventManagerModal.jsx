import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';

export default function AssignEventManagerModal({ isOpen, onClose, eventRequest, onAssignSuccess }) {
  const [managersList, setManagersList] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  useEffect(() => {
    if (isOpen && eventRequest) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchManagerAvailability();
    }
  }, [isOpen, eventRequest]);

  if (!isOpen || !eventRequest) return null;

  const getHeaders = () => {
    const token = localStorage.getItem('ffsd_token');
    const headers = { 'x-role': 'REVENUE' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchManagerAvailability = async () => {
    setSelectedManagerId('');
    setModalError('');
    setModalSuccess('');
    setManagersLoading(true);

    try {
      const url = eventRequest.eventDate
        ? `/api/revenue/event-managers?eventDate=${encodeURIComponent(eventRequest.eventDate)}`
        : '/api/revenue/event-managers';
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setManagersList(data.managers || []);
      } else {
        setModalError('Failed to fetch Event Manager availability.');
      }
    } catch (err) {
      setModalError('Error connecting to backend.');
    } finally {
      setManagersLoading(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedManagerId || !eventRequest) return;
    setSubmitting(true);
    setModalError('');
    setModalSuccess('');

    try {
      const res = await fetch(`/api/revenue/event-requests/${eventRequest.id}/assign-manager`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ managerUserId: selectedManagerId })
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.message || 'Failed to assign Event Manager.');
      } else {
        setModalSuccess(data.message || 'Event Manager assigned successfully.');
        if (onAssignSuccess) onAssignSuccess(data);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setModalError('Network error submitting manager assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in text-[#26334A] overflow-hidden">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 overflow-hidden z-10 max-h-[85vh] flex flex-col">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">Revenue Team Operations</span>
            <h3 className="text-lg font-extrabold text-[#26334A]">Event Manager Availability & Assignment</h3>
            <p className="text-xs text-[#64748B]">
              Target Event: <span className="font-bold text-[#26334A]">{eventRequest.eventName}</span> ({eventRequest.eventDate})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-[#26334A] hover:bg-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {modalError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        {modalSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{modalSuccess}</span>
          </div>
        )}

        <div className="space-y-3 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="text-xs font-bold text-[#64748B] flex justify-between items-center shrink-0">
            <span>Select an Available Event Manager</span>
            <span className="text-[11px] text-slate-500 font-medium">Managers busy on {eventRequest.eventDate} are disabled</span>
          </div>

          {managersLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-2 flex-1">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
              Checking Event Manager schedules & availability...
            </div>
          ) : (
            <div className="overflow-y-auto border border-slate-200 rounded-2xl bg-white/80 flex-1 max-h-[35vh]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[#64748B] font-extrabold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Manager Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-center">Active Events</th>
                    <th className="py-2.5 px-3">Availability</th>
                    <th className="py-2.5 px-3 text-center">Assign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[#26334A]">
                  {managersList.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => m.isAvailable && setSelectedManagerId(m.id)}
                      className={`transition cursor-pointer ${
                        selectedManagerId === m.id
                          ? 'bg-indigo-50/80 border-indigo-200 font-bold'
                          : !m.isAvailable
                          ? 'opacity-60 bg-slate-50/50 cursor-not-allowed'
                          : 'hover:bg-white/90'
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-[#26334A]">
                        {m.name}
                        <span className="block text-[10px] text-slate-500 font-normal">{m.email}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{m.department}</td>
                      <td className="py-3 px-3 text-center font-bold">{m.activeAssignmentsCount}</td>
                      <td className="py-3 px-3">
                        {m.isAvailable ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                            Available
                          </span>
                        ) : (
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-200">
                              Busy
                            </span>
                            <span className="block text-[10px] text-rose-600 font-medium truncate max-w-[140px] mt-0.5" title={m.availabilityReason}>
                              {m.availabilityReason}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="radio"
                          name="sharedEventManagerSelect"
                          checked={selectedManagerId === m.id}
                          onChange={() => m.isAvailable && setSelectedManagerId(m.id)}
                          disabled={!m.isAvailable}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitAssignment}
            disabled={!selectedManagerId || submitting}
            className="px-5 py-2.5 rounded-xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {submitting ? 'Validating & Assigning...' : 'Confirm Manager Assignment'}
          </button>
        </div>

      </div>
    </div>
  );
}
