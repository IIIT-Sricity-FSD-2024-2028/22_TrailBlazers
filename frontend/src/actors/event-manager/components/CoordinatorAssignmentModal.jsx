import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Users,
  UserCheck,
  Check,
  Search,
  Calendar,
  MapPin,
  Building,
  Clock,
  ShieldCheck,
  AlertCircle,
  CalendarOff,
  Loader2,
  ChevronDown
} from 'lucide-react';

const AVATAR_GRADIENTS = [
  'from-purple-500 to-indigo-600',
  'from-indigo-500 to-blue-600',
  'from-violet-500 to-fuchsia-600',
  'from-teal-500 to-emerald-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600'
];

function getInitials(name) {
  if (!name) return 'OC';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradient(name) {
  if (!name) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

export default function CoordinatorAssignmentModal({
  eventsList = [],
  coordinatorsList = [],
  isOpen,
  onClose,
  onAssign
}) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedCoordinatorIds, setSelectedCoordinatorIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out COMPLETED and CANCELLED events so only active/upcoming events can have coordinators assigned (calculated directly during render)
  const activeEventsList = Array.isArray(eventsList)
    ? eventsList.filter(
        (e) =>
          e.operationalStatus !== 'COMPLETED' &&
          e.operationalStatus !== 'CANCELLED' &&
          e.status !== 'COMPLETED' &&
          e.status !== 'CANCELLED'
      )
    : [];

  // Sync event and initial coordinators when opened or when activeEventsList changes
  useEffect(() => {
    if (isOpen) {
      if (activeEventsList && activeEventsList.length > 0) {
        const currentValid = selectedEventId && activeEventsList.some(e => e.id === selectedEventId);
        const activeId = currentValid ? selectedEventId : activeEventsList[0].id;
        setSelectedEventId(activeId);

        const target = activeEventsList.find(e => e.id === activeId);
        if (target) {
          const ids = Array.isArray(target.onsiteCoordinatorUserIds) && target.onsiteCoordinatorUserIds.length > 0
            ? target.onsiteCoordinatorUserIds
            : (target.onsiteCoordinatorUserId ? [target.onsiteCoordinatorUserId] : []);
          setSelectedCoordinatorIds(ids);
        }
      } else {
        setSelectedEventId('');
        setSelectedCoordinatorIds([]);
      }
      setSearchQuery('');
      setIsSubmitting(false);
    }
  }, [isOpen, eventsList]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const selectedEvent = activeEventsList.find(e => e.id === selectedEventId) || null;

  const handleEventChange = (newId) => {
    setSelectedEventId(newId);
    const target = activeEventsList.find(e => e.id === newId);
    if (target) {
      const ids = Array.isArray(target.onsiteCoordinatorUserIds) && target.onsiteCoordinatorUserIds.length > 0
        ? target.onsiteCoordinatorUserIds
        : (target.onsiteCoordinatorUserId ? [target.onsiteCoordinatorUserId] : []);
      setSelectedCoordinatorIds(ids);
    } else {
      setSelectedCoordinatorIds([]);
    }
  };

  const toggleCoordinator = (coordId) => {
    setSelectedCoordinatorIds(prev =>
      prev.includes(coordId) ? prev.filter(id => id !== coordId) : [...prev, coordId]
    );
  };

  const q = searchQuery.toLowerCase().trim();
  const filteredCoordinators = Array.isArray(coordinatorsList)
    ? (!q
        ? coordinatorsList
        : coordinatorsList.filter(
            (c) =>
              (c.name && c.name.toLowerCase().includes(q)) ||
              (c.email && c.email.toLowerCase().includes(q)) ||
              (c.organization && c.organization.toLowerCase().includes(q))
          ))
    : [];

  const handleSelectAll = () => {
    const visibleIds = filteredCoordinators.map(c => c.id);
    const allVisibleSelected = visibleIds.every(id => selectedCoordinatorIds.includes(id));

    if (allVisibleSelected) {
      // Unselect visible coordinators
      setSelectedCoordinatorIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible coordinators
      setSelectedCoordinatorIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventId || selectedCoordinatorIds.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onAssign) {
        await onAssign(selectedEventId, selectedCoordinatorIds);
      }
      onClose();
    } catch (err) {
      console.error('Assignment error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const hasEvents = activeEventsList && activeEventsList.length > 0;
  const isAllVisibleSelected =
    filteredCoordinators.length > 0 &&
    filteredCoordinators.every(c => selectedCoordinatorIds.includes(c.id));

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-purple-100/80 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Ribbon */}
        <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 shrink-0" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200/70 text-[10px] font-black uppercase tracking-wider text-purple-700 mb-1">
                <span>Staff Deployment</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                Assign Onsite Coordinators
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Assign field personnel to lead on-ground operations and attendee check-ins.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {!hasEvents ? (
          /* Empty Events State */
          <div className="p-8 text-center space-y-4 flex-1 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
              <CalendarOff className="w-7 h-7" />
            </div>
            <div className="max-w-xs space-y-1">
              <h4 className="text-sm font-bold text-slate-800">No Active Events Requiring Assignment</h4>
              <p className="text-xs text-slate-500">
                All events are either already completed or cancelled. You can assign coordinators once new upcoming events are approved.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">

              {/* 1. Event Selection Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <span>1. Target Active Event</span>
                  </label>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                    {activeEventsList.length} Active {activeEventsList.length === 1 ? 'Event' : 'Events'}
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={selectedEventId}
                    onChange={(e) => handleEventChange(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition cursor-pointer appearance-none"
                  >
                    {activeEventsList.map(evt => (
                      <option key={evt.id} value={evt.id}>
                        {evt.eventName} — {evt.organizationName || 'General'}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* Selected Event Preview Card */}
                {selectedEvent && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-slate-50/90 to-indigo-50/60 border border-purple-200/60 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-slate-900 block">
                          {selectedEvent.eventName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <Building className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>{selectedEvent.organizationName || 'No organization specified'}</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider shrink-0 border border-purple-200">
                        {selectedEvent.operationalStatus || 'IN_PREPARATION'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium text-slate-600 pt-1 border-t border-purple-100/60">
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{selectedEvent.eventDate || 'Date TBD'} {selectedEvent.startTime ? `(${selectedEvent.startTime})` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                        <span className="truncate">{selectedEvent.venue || 'Venue TBD'}</span>
                      </div>
                    </div>

                    {/* Current Coordinator Status on this Event */}
                    <div className="pt-2 border-t border-purple-100/60 flex items-center gap-2 text-[11px]">
                      {selectedEvent.coordinatorName ? (
                        <div className="flex items-center gap-1.5 text-purple-900 font-semibold bg-white/80 px-2.5 py-1 rounded-xl border border-purple-200/70 w-full">
                          <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="truncate">
                            <strong className="font-extrabold">Active Coordinator:</strong> {selectedEvent.coordinatorName}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-800 font-medium bg-amber-50/80 px-2.5 py-1 rounded-xl border border-amber-200/70 w-full">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>No coordinator currently assigned to this event</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Coordinator Selection Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                      2. Choose Onsite Coordinators
                    </label>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[10px]">
                      {selectedCoordinatorIds.length} Selected
                    </span>
                  </div>

                  {filteredCoordinators.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100/80 px-2.5 py-1 rounded-lg border border-purple-200/80 transition cursor-pointer"
                    >
                      {isAllVisibleSelected ? 'Clear All' : 'Select All'}
                    </button>
                  )}
                </div>

                {/* Search Bar for Coordinators */}
                {coordinatorsList && coordinatorsList.length > 3 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search coordinator by name, email..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Coordinators List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {coordinatorsList.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                      <p className="text-xs font-bold text-slate-700">No Onsite Coordinators Found</p>
                      <p className="text-[11px] text-slate-500">
                        Staff accounts registered with the Onsite Coordinator role will appear here.
                      </p>
                    </div>
                  ) : filteredCoordinators.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                      <p className="text-xs font-bold text-slate-700">No Matching Coordinators</p>
                      <p className="text-[11px] text-slate-500">
                        No coordinators match "{searchQuery}". Try a different search term.
                      </p>
                    </div>
                  ) : (
                    filteredCoordinators.map((coord) => {
                      const isSelected = selectedCoordinatorIds.includes(coord.id);
                      const isAlreadyAssigned =
                        selectedEvent &&
                        (Array.isArray(selectedEvent.onsiteCoordinatorUserIds)
                          ? selectedEvent.onsiteCoordinatorUserIds.includes(coord.id)
                          : selectedEvent.onsiteCoordinatorUserId === coord.id);

                      const initials = getInitials(coord.name);
                      const gradient = getGradient(coord.name);

                      return (
                        <div
                          key={coord.id}
                          onClick={() => toggleCoordinator(coord.id)}
                          className={`group p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between cursor-pointer select-none ${
                            isSelected
                              ? 'bg-purple-50/90 border-purple-400/90 shadow-2xs ring-1 ring-purple-300/40 text-purple-950'
                              : 'bg-white border-slate-200/90 hover:border-purple-200 hover:bg-purple-50/30 text-slate-700 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            {/* Avatar Badge */}
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${gradient} text-white font-extrabold text-xs flex items-center justify-center shadow-2xs shrink-0`}>
                              {initials}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900 truncate">
                                  {coord.name}
                                </span>
                                {isAlreadyAssigned && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-black text-[9px] uppercase tracking-wider shrink-0">
                                    Current
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium block truncate">
                                {coord.email}
                              </span>
                            </div>
                          </div>

                          {/* Checkbox indicator */}
                          <div
                            className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                              isSelected
                                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs scale-105'
                                : 'border-2 border-slate-200 bg-slate-50 group-hover:border-purple-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Informational Guidance Callout */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                  Assigned coordinators will immediately gain access to this event's real-time check-in scanner, attendee manifest, and operational incident log.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                {selectedCoordinatorIds.length === 0 ? (
                  <span className="text-amber-600 font-medium">Select at least 1 coordinator</span>
                ) : (
                  <span>
                    Ready to deploy <strong className="text-purple-700 font-bold">{selectedCoordinatorIds.length}</strong> coordinator{selectedCoordinatorIds.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-200/70 active:scale-95 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={selectedCoordinatorIds.length === 0 || isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>
                        Assign {selectedCoordinatorIds.length > 0 ? `${selectedCoordinatorIds.length} Coordinator${selectedCoordinatorIds.length > 1 ? 's' : ''}` : 'Coordinators'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>,
    document.body
  );
}