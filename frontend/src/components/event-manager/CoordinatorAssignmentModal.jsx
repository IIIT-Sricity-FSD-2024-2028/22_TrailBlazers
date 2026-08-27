import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck } from 'lucide-react';

export default function CoordinatorAssignmentModal({ eventsList, coordinatorsList, isOpen, onClose, onAssign }) {
  const [selectedEventId, setSelectedEventId] = useState(eventsList[0]?.id || '');
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState(coordinatorsList[0]?.id || '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEventId || !selectedCoordinatorId) return;
    onAssign(selectedEventId, selectedCoordinatorId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[#0F172A]">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold">Assign Onsite Coordinator</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Select Approved Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-400 outline-none"
            >
              {eventsList.map(evt => (
                <option key={evt.id} value={evt.id}>
                  {evt.eventName} ({evt.organizationName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Select Onsite Staff Member
            </label>
            <select
              value={selectedCoordinatorId}
              onChange={(e) => setSelectedCoordinatorId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-400 outline-none"
            >
              {coordinatorsList.map(coord => (
                <option key={coord.id} value={coord.id}>
                  {coord.name} ({coord.email})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold shadow-sm active:scale-95 transition cursor-pointer"
            >
              Assign Staff Member
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
