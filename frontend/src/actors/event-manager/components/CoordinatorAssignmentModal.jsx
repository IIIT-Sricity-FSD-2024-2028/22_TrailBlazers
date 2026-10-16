import React, { useState, useEffect } from 'react';
import { X, Users, Check, ShieldCheck, CheckSquare, Square } from 'lucide-react';

export default function CoordinatorAssignmentModal({ eventsList, coordinatorsList, isOpen, onClose, onAssign }) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedCoordinatorIds, setSelectedCoordinatorIds] = useState([]);

  useEffect(() => {
    if (eventsList && eventsList.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsList[0].id);
    }
  }, [eventsList, selectedEventId]);

  // When selected event changes, initialize selected coordinators with any already assigned
  useEffect(() => {
    if (selectedEventId && eventsList) {
      const target = eventsList.find(e => e.id === selectedEventId);
      if (target) {
        const ids = Array.isArray(target.onsiteCoordinatorUserIds) && target.onsiteCoordinatorUserIds.length > 0
          ? target.onsiteCoordinatorUserIds
          : (target.onsiteCoordinatorUserId ? [target.onsiteCoordinatorUserId] : []);
        setSelectedCoordinatorIds(ids);
      }
    }
  }, [selectedEventId, eventsList]);

  if (!isOpen) return null;

  const toggleCoordinator = (coordId) => {
    setSelectedCoordinatorIds(prev =>
      prev.includes(coordId) ? prev.filter(id => id !== coordId) : [...prev, coordId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCoordinatorIds.length === coordinatorsList.length) {
      setSelectedCoordinatorIds([]);
    } else {
      setSelectedCoordinatorIds(coordinatorsList.map(c => c.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEventId || selectedCoordinatorIds.length === 0) return;
    onAssign(selectedEventId, selectedCoordinatorIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-[#0F172A]">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">Assign Onsite Coordinators</h3>
              <p className="text-[11px] text-slate-500 font-medium">Select 1 or more coordinators for this event</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-400 outline-none cursor-pointer"
            >
              {eventsList.map(evt => (
                <option key={evt.id} value={evt.id}>
                  {evt.eventName} ({evt.organizationName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Select Onsite Coordinators ({selectedCoordinatorIds.length} Selected)
              </label>
              {coordinatorsList.length > 1 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] text-purple-600 hover:text-purple-800 font-bold hover:underline cursor-pointer"
                >
                  {selectedCoordinatorIds.length === coordinatorsList.length ? 'Clear All' : 'Select All'}
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {coordinatorsList.map(coord => {
                const isSelected = selectedCoordinatorIds.includes(coord.id);
                return (
                  <div
                    key={coord.id}
                    onClick={() => toggleCoordinator(coord.id)}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-300 text-purple-950 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-xs block text-slate-900">{coord.name}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{coord.email}</span>
                    </div>

                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition ${
                      isSelected ? 'bg-purple-600 text-white' : 'border border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={selectedCoordinatorIds.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold shadow-sm active:scale-95 transition cursor-pointer"
            >
              Assign {selectedCoordinatorIds.length > 0 ? `${selectedCoordinatorIds.length} Coordinator(s)` : 'Coordinators'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
