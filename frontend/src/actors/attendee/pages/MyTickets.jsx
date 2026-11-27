import React, { useState, useEffect, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Ticket, Calendar, MapPin, QrCode, Download, Eye, Sparkles, AlertCircle, Clock, CheckCircle2, MessageSquare, RotateCcw, Check, ShieldCheck, XCircle, X } from 'lucide-react';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import TicketModal from '../components/TicketModal';
import CancelTicketModal from '../components/CancelTicketModal';
import AttendeeFeedbackPanel from '../components/AttendeeFeedbackPanel';
import { fetchMyTickets, fetchMyRefunds, claimTicketRefund, retainTicket } from '../../../store/tickets-actions';
import { UIContext } from '../../../context/UIContext';

const isTicketCheckedIn = (tkt) => {
  if (!tkt) return false;
  return Boolean(
    tkt.checkedIn === 1 ||
    tkt.checkedIn === true ||
    tkt.checkedInAt ||
    tkt.entryStatus === 'FULLY_CHECKED_IN' ||
    tkt.entryStatus === 'PARTIALLY_CHECKED_IN' ||
    tkt.entryStatus === 'ENTERED'
  );
};

export default function MyTickets({ user: propsUser, onExplore: propOnExplore, onNavigate: propOnNavigate }) {
  const dispatch = useDispatch();
  const ui = useContext(UIContext);
  const onExplore = propOnExplore || propOnNavigate || (() => ui?.navigate && ui.navigate('explore'));
  const reduxUser = useSelector((state) => state.auth.user);
  const user = propsUser || reduxUser;
  const { tickets, refunds, loading } = useSelector((state) => state.tickets);

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'ongoing' | 'past' | 'feedback' | 'refunds'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchMyTickets());
    dispatch(fetchMyRefunds());
  }, [user, dispatch]);

  const handleClaimRefund = async (ticketId, refundId) => {
    setActionLoading(true);
    setActionMsg('');
    setActionError('');
    try {
      const res = await dispatch(claimTicketRefund(ticketId, 'Attendee requested 100% ticket refund'));
      if (!res.success) {
        throw new Error(res.error || 'Failed to submit refund claim.');
      }
      setActionMsg('100% ticket refund request submitted successfully to the Revenue Team.');
    } catch (err) {
      setActionError(err.message || 'Error claiming refund.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetainTicket = async (refundId) => {
    setActionLoading(true);
    setActionMsg('');
    setActionError('');
    try {
      const res = await dispatch(retainTicket(refundId));
      if (!res.success) {
        throw new Error(res.error || 'Failed to retain ticket.');
      }
      setActionMsg('You have elected to retain your ticket for the rescheduled date. Your registration remains active!');
    } catch (err) {
      setActionError(err.message || 'Error retaining ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCancelModal = (tkt) => {
    setTicketToCancel(tkt);
    setIsCancelModalOpen(true);
  };

  const parseEventDateTime = (dateStr, timeStr, defaultTime) => {
    if (!dateStr) return new Date();
    const rawTime = (timeStr || defaultTime || '00:00').trim();
    const isPM = /pm/i.test(rawTime);
    const isAM = /am/i.test(rawTime);
    const cleanTime = rawTime.replace(/(am|pm)/i, '').trim();
    const parts = cleanTime.split(':');
    let hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');

    const dt = new Date(`${dateStr}T${hoursStr}:${minutesStr}:00`);
    return isNaN(dt.getTime()) ? new Date(dateStr) : dt;
  };

  const now = new Date();

  // Helper: check if ticket has been cancelled or has an active refund in progress
  const isTicketCancelledOrRefunded = (t) => {
    if (t.registrationStatus === 'CANCELLED' || t.registrationStatus === 'REFUNDED') return true;
    if (t.paymentStatus === 'REFUNDED') return true;
    const hasActiveRefund = refunds.some(
      (r) => r.ticketId === t.id && r.status !== 'REJECTED'
    );
    return hasActiveRefund;
  };

  // 1. UPCOMING: Event end date is in the future AND ticket is active (not cancelled/refunded)
  const upcomingTickets = tickets.filter(t => {
    if (isTicketCancelledOrRefunded(t)) return false;
    const eventDate = t.eventDate || t.date;
    const endDate = parseEventDateTime(eventDate, t.endTime, '23:59');
    return now <= endDate;
  });

  // 2. ONGOING: Event is running today AND ticket is active
  const ongoingTickets = tickets.filter(t => {
    if (isTicketCancelledOrRefunded(t)) return false;
    const eventDate = t.eventDate || t.date;
    const startDate = parseEventDateTime(eventDate, t.startTime, '00:00');
    const endDate = parseEventDateTime(eventDate, t.endTime, '23:59');
    return now >= startDate && now <= endDate;
  });

  // 3. PAST: Event end date has passed AND ticket is not cancelled/refunded
  const pastTickets = tickets.filter(t => {
    if (isTicketCancelledOrRefunded(t)) return false;
    const eventDate = t.eventDate || t.date;
    const endDate = parseEventDateTime(eventDate, t.endTime, '23:59');
    return now > endDate;
  });

  const displayedTickets = 
    activeTab === 'upcoming' ? upcomingTickets :
    activeTab === 'ongoing' ? ongoingTickets :
    pastTickets;

  const handleOpenTicket = (tkt) => {
    setSelectedTicket(tkt);
    setIsTicketModalOpen(true);
  };

  const getTicketCardBg = (id) => {
    const bgs = [
      'bg-gradient-to-br from-[#DAF0FB]/80 via-white to-[#EBF6FD]/80 border-[#B5E1F7]',
      'bg-gradient-to-br from-[#FBE9F9]/80 via-white to-[#FAF0FA]/80 border-[#F6CFF3]',
      'bg-gradient-to-br from-[#E8F9F5]/80 via-white to-[#EEFAF7]/80 border-[#C7F3EA]',
    ];
    return bgs[Number(id || 1) % bgs.length];
  };

  return (
    <div className="space-y-8 pb-16 text-[#26334A]">
      
      {/* Header Banner matching reference */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#26334A] tracking-tight">My Tickets</h1>
          <p className="text-xs text-[#64748B] font-medium mt-1">Manage your tickets and registrations</p>
        </div>

        <button
          onClick={onExplore}
          className="px-5 py-2.5 rounded-2xl bg-[#26334A] text-white font-extrabold text-xs hover:bg-slate-800 transition shadow-xs"
        >
          Explore More Events
        </button>
      </div>

      {/* Tabs Switcher matching reference */}
      <div className="flex bg-white/70 p-1.5 rounded-2xl border border-white w-fit backdrop-blur-md shadow-2xs">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'upcoming' ? 'bg-white text-[#26334A] shadow-xs border border-white' : 'text-[#64748B] hover:text-[#26334A]'
          }`}
        >
          Upcoming ({upcomingTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('ongoing')}
          className={`px-5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'ongoing' ? 'bg-white text-indigo-700 shadow-xs border border-white' : 'text-[#64748B] hover:text-[#26334A]'
          }`}
        >
          Ongoing ({ongoingTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'past' ? 'bg-white text-[#26334A] shadow-xs border border-white' : 'text-[#64748B] hover:text-[#26334A]'
          }`}
        >
          Past Events ({pastTickets.length})
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'feedback' ? 'bg-white text-[#26334A] shadow-xs border border-white' : 'text-[#64748B] hover:text-[#26334A]'
          }`}
        >
          Event Feedback 💬
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'refunds' ? 'bg-white text-amber-900 shadow-xs border border-white font-extrabold' : 'text-[#64748B] hover:text-[#26334A]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
          <span>Refunds & Cancellations ({refunds.length})</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-bold text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Rich Horizontal Ticket Cards, Feedback Panel, or Refunds Panel */}
      {activeTab === 'feedback' ? (
        <AttendeeFeedbackPanel user={user} />
      ) : activeTab === 'refunds' ? (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-black uppercase tracking-wider text-amber-900 text-[10px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Wavevents Attendee 100% Refund Guarantee</span>
              </span>
              <p className="text-amber-900/90 font-medium">
                When an event is cancelled by the organizer, attendees are guaranteed a 100% refund covering the full ticket price and platform booking fees.
              </p>
            </div>
            <button
              onClick={fetchMyRefunds}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-900 font-extrabold text-xs shrink-0 cursor-pointer shadow-2xs hover:bg-amber-100/50"
            >
              Refresh Status
            </button>
          </div>

          {refunds.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
              <RotateCcw className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">No Refunds or Cancellations</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                None of your registered events have active cancellations or refund claims.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {refunds.map((ref) => (
                <div
                  key={ref.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition space-y-4"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                          {ref.refundNumber}
                        </span>
                        <StatusBadge status={ref.status} />
                        {ref.isPostponedEvent && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-200">
                            Rescheduled Event
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-extrabold text-[#26334A]">{ref.eventName}</h3>
                      <div className="text-xs text-slate-500 font-medium">
                        Scheduled Date: <strong className="text-slate-700">{ref.eventDate || 'N/A'}</strong>
                        {ref.ticketNumber && (
                          <span> • Ticket: <strong className="font-mono text-slate-700">{ref.ticketNumber}</strong> ({ref.ticketQuantity || 1} pass)</span>
                        )}
                      </div>
                    </div>

                    <div className="text-left md:text-right space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Guaranteed Refund
                      </span>
                      <div className="text-2xl font-black text-emerald-700 font-mono">
                        ₹{Number(ref.refundableAmount || ref.originalPaymentAmount || 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Original Paid: ₹{Number(ref.originalPaymentAmount || ref.totalPaidAmount || 0).toLocaleString()} (100% Refundable)
                      </span>
                    </div>
                  </div>

                  {/* Context & Reason Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Cancellation / Postponement Reason
                      </span>
                      <p className="text-slate-800 font-medium">
                        "{ref.cancellationReason || 'Event cancelled by organizer per Wavevents terms.'}"
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Settlement Details
                      </span>
                      {ref.refundTransactionId ? (
                        <div className="space-y-0.5">
                          <div className="text-emerald-800 font-bold">
                            Settlement Ref: <span className="font-mono">{ref.refundTransactionId}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Disbursed via {ref.refundMethod || 'UPI/Card'} on {ref.refundedAt}
                          </div>
                        </div>
                      ) : ref.status === 'REJECTED' ? (
                        <div className="text-rose-700 font-medium">
                          Rejected: {ref.rejectionReason || 'Claim declined per policy terms.'}
                        </div>
                      ) : (
                        <p className="text-slate-500 font-medium">
                          Managed by REVENUE Department. Transaction reference will appear here upon completion.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for Attendee */}
                  {ref.status === 'ELIGIBLE' && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      {ref.isPostponedEvent && (
                        <button
                          type="button"
                          onClick={() => handleRetainTicket(ref.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition cursor-pointer"
                        >
                          Retain Ticket for New Date
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleClaimRefund(ref.ticketId, ref.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white font-extrabold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request 100% Refund (₹{Number(ref.refundableAmount).toLocaleString()})</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-[#64748B] font-medium text-sm">
          Loading your ticket passes...
        </div>
      ) : displayedTickets.length > 0 ? (
        <div className="space-y-4">
          {displayedTickets.map((tkt) => (
            <div
              key={tkt.id}
              className={`rounded-3xl border p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs hover:shadow-md transition duration-300 backdrop-blur-md ${getTicketCardBg(tkt.id)}`}
            >
              {/* Event Image + Details */}
              <div className="flex items-center gap-5 w-full md:w-auto">
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-white">
                  <img
                    src={tkt.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
                    alt={tkt.eventName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl text-center shadow-xs border border-white">
                    <div className="text-xs font-black text-[#26334A] leading-none">
                      {tkt.eventDate ? tkt.eventDate.split('-')[2] || '25' : '25'}
                    </div>
                    <div className="text-[9px] font-extrabold text-indigo-700 uppercase leading-none mt-0.5">AUG</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
                    {tkt.organizationName}
                  </div>
                  <h3 className="text-lg font-extrabold text-[#26334A] line-clamp-1">{tkt.eventName}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{tkt.venue}, {tkt.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{tkt.eventDate} • {tkt.startTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white/90 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {tkt.ticketNumber}
                    </span>
                    <span className="font-semibold text-[#26334A]">{tkt.quantity} Pass(es)</span>
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200">
                <div className="flex items-center gap-2">
                  <StatusBadge status={tkt.registrationStatus || 'CONFIRMED'} />
                  {tkt.hasFeedbackSubmitted && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Feedback Submitted
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Cancel Ticket Option / Checked In Status for active upcoming tickets */}
                  {activeTab === 'upcoming' && tkt.registrationStatus !== 'REFUNDED' && tkt.registrationStatus !== 'CANCELLED' && (
                    isTicketCheckedIn(tkt) ? (
                      <span
                        className="py-2 px-2.5 rounded-xl bg-amber-50 text-amber-800 font-extrabold text-[11px] border border-amber-300 flex items-center gap-1 shadow-2xs"
                        title="This ticket has already been used for event entry and cannot be cancelled."
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Checked In – Cancellation Unavailable</span>
                      </span>
                    ) : tkt.maxCancellationsReached ? (
                      <span
                        className="py-2 px-2.5 rounded-xl bg-slate-100 text-slate-500 font-extrabold text-[10px] border border-slate-200 flex items-center gap-1"
                        title="Cancellation limit reached. Max 2 cancellations allowed per event."
                      >
                        <AlertCircle className="w-3 h-3 text-slate-400" />
                        <span>Cancel Limit (2/2)</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenCancelModal(tkt)}
                        className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs transition border border-rose-200 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        title="Cancel this ticket pass and request refund"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancel Ticket</span>
                      </button>
                    )
                  )}

                  {activeTab === 'past' && !tkt.hasFeedbackSubmitted && (
                    <button
                      onClick={() => setActiveTab('feedback')}
                      className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs transition border border-amber-200 shadow-2xs flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                      <span>Leave Feedback</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenTicket(tkt)}
                    className="py-2.5 px-4 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs transition border border-purple-200 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Ticket</span>
                  </button>

                  <button
                    onClick={() => handleOpenTicket(tkt)}
                    className="p-2.5 rounded-xl bg-white text-[#26334A] hover:bg-slate-50 transition border border-slate-200 shadow-2xs cursor-pointer"
                    title="Download Ticket"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl glass-light border border-white space-y-4">
          <Ticket className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-[#26334A]">No {activeTab} tickets found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            You don't have any {activeTab} event registrations under this account.
          </p>
          <button
            onClick={onExplore}
            className="px-5 py-2.5 rounded-xl bg-[#26334A] text-white font-bold text-xs hover:bg-slate-800 transition"
          >
            Explore Available Events
          </button>
        </div>
      )}

      {/* Ticket Modal */}
      <TicketModal
        ticket={selectedTicket}
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onCancelTicket={selectedTicket?.registrationStatus !== 'REFUNDED' && selectedTicket?.registrationStatus !== 'CANCELLED' && !isTicketCheckedIn(selectedTicket) ? () => {
          setIsTicketModalOpen(false);
          handleOpenCancelModal(selectedTicket);
        } : null}
      />

      {/* Cancel Ticket Confirmation Modal */}
      <CancelTicketModal
        ticket={ticketToCancel}
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setTicketToCancel(null);
        }}
        onSuccess={async () => {
          setActionMsg('Ticket pass successfully cancelled. Your 100% refund claim is now queued with the Revenue Team.');
          await fetchMyRefunds();
          await fetchMyTickets();
          setActiveTab('refunds');
        }}
      />

    </div>
  );
}
