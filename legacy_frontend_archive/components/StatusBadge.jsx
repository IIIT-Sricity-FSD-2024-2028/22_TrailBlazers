import React from 'react';
import { CheckCircle2, Clock, Lock, Unlock } from 'lucide-react';

export function StatusBadge({ status }) {
  const styles = {
    SUBMITTED: 'bg-[#DAF0FB]/90 text-indigo-900 border-white/90',
    UNDER_REVIEW: 'bg-amber-50/90 text-amber-900 border-amber-200',
    PRICING_DISCUSSION: 'bg-[#FBE9F9]/90 text-purple-900 border-white/90',
    APPROVED: 'bg-[#E8F9F5]/90 text-emerald-900 border-white/90',
    REJECTED: 'bg-rose-50/90 text-rose-900 border-rose-200',
    ACTIVE: 'bg-[#E8F9F5]/90 text-emerald-900 border-white/90',
    CONFIRMED: 'bg-[#E8F9F5]/90 text-emerald-900 border-white/90',
    OPEN: 'bg-white/90 text-[#0F172A] border-white/90',
    CLOSED: 'bg-[#FBE9F9]/90 text-purple-950 border-white/90',
  };

  const formattedLabel = {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    PRICING_DISCUSSION: 'Pricing Discussion',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    ACTIVE: 'Active Ticket',
    CONFIRMED: 'Confirmed',
    OPEN: 'Public Event',
    CLOSED: 'Invite Only',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-2xs backdrop-blur-md ${styles[status] || 'bg-white/90 text-slate-800 border-white/90'}`}>
      {status === 'UNDER_REVIEW' && <Clock className="w-3.5 h-3.5" />}
      {(status === 'ACTIVE' || status === 'CONFIRMED' || status === 'APPROVED') && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
      {status === 'CLOSED' && <Lock className="w-3 h-3 text-purple-700" />}
      {status === 'OPEN' && <Unlock className="w-3 h-3 text-indigo-600" />}
      <span>{formattedLabel[status] || status}</span>
    </span>
  );
}
