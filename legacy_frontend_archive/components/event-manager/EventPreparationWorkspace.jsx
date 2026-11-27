import React from 'react';
import { Calendar, Building, DollarSign, UserCheck, ShieldCheck, Save, UserPlus, Clock } from 'lucide-react';
import ReadinessChecklist from './ReadinessChecklist';
import InvitationManager from './InvitationManager';

export default function EventPreparationWorkspace({
  eventDetail,
  coordinatorsList,
  configForm,
  setConfigForm,
  selectedCoordinatorId,
  setSelectedCoordinatorId,
  onSaveConfig,
  onAssignCoordinator,
  onMarkEventReady,
  onIssueInvitation,
  onRevokeInvitation,
  actionMsg,
  actionError,
  loadingMarkReady
}) {
  const { request, readiness, invitations = [] } = eventDetail || {};

  if (!request) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
        <Clock className="w-10 h-10 text-purple-400 mx-auto animate-pulse" />
        <h3 className="text-base font-extrabold text-[#0F172A]">No Event Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please select an event from the Dashboard or My Events list to open its operational workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-slide-up">
      
      {/* Notifications / Alerts */}
      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold shadow-2xs">
          {actionMsg}
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold shadow-2xs">
          {actionError}
        </div>
      )}

      {/* 1. TOP HEADER & EVENT OVERVIEW CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase border border-white/30 backdrop-blur-md">
                {request.category || 'Tech'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase border border-emerald-400/30">
                {request.operationalStatus || 'IN_PREPARATION'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {request.eventName}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300 pt-1">
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-purple-300" />
                <span>{request.organizationName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                <span>{request.eventDate} ({request.startTime} - {request.endTime})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
                <span>₹{request.ticketPrice || 0} / Ticket (Commercial Agreed)</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 pt-2 md:pt-0">
            <span className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 text-xs font-black text-white block text-center backdrop-blur-md">
              Venue: {request.venue}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN OPERATIONAL WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Read-Only Specs & Configuration Forms (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* READ-ONLY CLIENT SPECIFICATIONS */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#0F172A]">
              Client Event Specifications (Read-Only)
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="font-extrabold text-slate-900 block mb-0.5">Description:</span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium leading-relaxed">
                  {request.description || 'No detailed description provided.'}
                </p>
              </div>

              <div>
                <span className="font-extrabold text-slate-900 block mb-0.5">Agenda / Schedule:</span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium leading-relaxed">
                  {request.agenda || 'Standard keynote & technical breakout sessions.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Ticket Price</span>
                  <span className="text-sm font-extrabold text-slate-900">₹{request.ticketPrice || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Event Type</span>
                  <span className="text-sm font-extrabold text-purple-700">{request.eventType || 'OPEN'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* FORM 1: OPERATIONAL CONFIGURATION */}
          <form onSubmit={onSaveConfig} className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
              <Save className="w-4 h-4 text-purple-600" />
              <span>Configure Capacity & Registration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Registration Status
                </label>
                <select
                  value={configForm.registrationStatus}
                  onChange={(e) => setConfigForm({ ...configForm, registrationStatus: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Registration Deadline
                </label>
                <input
                  type="date"
                  value={configForm.registrationDeadline}
                  onChange={(e) => setConfigForm({ ...configForm, registrationDeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Expected Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  value={configForm.expectedAttendance}
                  onChange={(e) => setConfigForm({ ...configForm, expectedAttendance: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-xs active:scale-95 transition cursor-pointer"
            >
              Save Operational Configuration
            </button>
          </form>

          {/* FORM 2: ASSIGN ONSITE COORDINATOR */}
          <form onSubmit={onAssignCoordinator} className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-600" />
              <span>Assign Onsite Staff Coordinator</span>
            </h3>

            <div className="space-y-2 text-xs font-semibold">
              <label className="block text-[10px] font-extrabold uppercase text-slate-500">
                Select Coordinator (Staff with ONSITE_COORDINATOR role)
              </label>

              <select
                value={selectedCoordinatorId}
                onChange={(e) => setSelectedCoordinatorId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">-- Select Onsite Coordinator --</option>
                {coordinatorsList.map((coord) => (
                  <option key={coord.id} value={coord.id}>
                    {coord.name} ({coord.email})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedCoordinatorId}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs active:scale-95 transition cursor-pointer"
            >
              Assign Staff Member
            </button>
          </form>

        </div>

        {/* RIGHT COLUMN: Readiness Checklist & Private Invitation Manager (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <ReadinessChecklist
            readiness={readiness}
            onMarkEventReady={onMarkEventReady}
            loadingMarkReady={loadingMarkReady}
          />

          <InvitationManager
            invitations={invitations}
            onIssueInvitation={onIssueInvitation}
            onRevokeInvitation={onRevokeInvitation}
          />

        </div>

      </div>

    </div>
  );
}
