import React from 'react';
import { UserPlus, Mail, FileText, ArrowRight } from 'lucide-react';

export default function QuickActions({ onAssignCoordinatorClick, onSendInvitationsClick, onViewReadinessClick }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
      <h4 className="text-base font-extrabold text-[#0F172A]">Quick Actions</h4>
      
      <div className="space-y-2.5">
        {/* Button 1: Assign Onsite Coordinator */}
        <button
          onClick={onAssignCoordinatorClick}
          className="w-full p-3 rounded-2xl bg-white hover:bg-purple-50/60 border border-slate-200/80 text-left transition flex items-center justify-between group shadow-2xs hover:border-purple-300 active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100/80 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition shadow-2xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold text-slate-800 group-hover:text-purple-900">
              Assign Onsite Coordinator
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition" />
        </button>

        {/* Button 2: Send Private Invitations */}
        <button
          onClick={onSendInvitationsClick}
          className="w-full p-3 rounded-2xl bg-white hover:bg-purple-50/60 border border-slate-200/80 text-left transition flex items-center justify-between group shadow-2xs hover:border-purple-300 active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100/80 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition shadow-2xs">
              <Mail className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold text-slate-800 group-hover:text-purple-900">
              Send Private Invitations
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition" />
        </button>

        {/* Button 3: View Readiness Reports */}
        <button
          onClick={onViewReadinessClick}
          className="w-full p-3 rounded-2xl bg-white hover:bg-purple-50/60 border border-slate-200/80 text-left transition flex items-center justify-between group shadow-2xs hover:border-purple-300 active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100/80 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition shadow-2xs">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold text-slate-800 group-hover:text-purple-900">
              View Readiness Reports
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition" />
        </button>
      </div>
    </div>
  );
}
