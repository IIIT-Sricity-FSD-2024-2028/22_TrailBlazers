import React, { useEffect } from 'react';
import { X, Calendar, MapPin, Printer, Ticket, User, FileText } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import QrCodeGenerator from './QrCodeGenerator';

export default function TicketModal({ ticket, isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-fade-in print:bg-white print:p-0 print:static text-[#26334A] overflow-hidden">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] z-10 print:shadow-none print:border-none print:w-full print:bg-white print:text-black">
        
        {/* Header Ribbon & Close Control */}
        <div className="p-4 px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-700" />
            <span className="text-xs font-extrabold text-[#26334A] uppercase tracking-wider">BookMyShow Pass • Official Entry Ticket</span>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={ticket.registrationStatus || 'ACTIVE'} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-[#26334A] hover:bg-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Ticket Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Ticket Body Card (BookMyShow Style) */}
          <div className="bg-gradient-to-br from-[#DAF0FB]/60 via-white to-[#E8F9F5]/60 rounded-3xl border border-slate-200/80 p-0 overflow-hidden relative shadow-inner print:border-slate-300">
            
            {/* Event Banner Header */}
            {ticket.bannerUrl && (
              <div className="h-40 w-full relative overflow-hidden bg-slate-900">
                <img src={ticket.bannerUrl} alt={ticket.eventName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#26334A]/90 via-[#26334A]/30 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">{ticket.organizationName}</div>
                  <h3 className="text-lg font-extrabold line-clamp-1">{ticket.eventName}</h3>
                </div>
              </div>
            )}

            <div className="p-6 space-y-6 relative">

              {/* Event Title (if no banner) */}
              {!ticket.bannerUrl && (
                <div>
                  <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                    {ticket.organizationName}
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#26334A] leading-tight mt-0.5">
                    {ticket.eventName}
                  </h2>
                </div>
              )}

              {/* Attendee Info Box */}
              <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Attendee Name</span>
                    <span className="text-sm font-extrabold text-[#26334A]">{ticket.attendeeName || ticket.userName || 'Registered Attendee'}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                  {ticket.ticketNumber || ticket.id}
                </span>
              </div>

              {/* Date, Time & Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/90 border border-slate-100 shadow-2xs">
                  <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold text-[#26334A]">Date & Time</span>
                    <span className="text-[#64748B] font-medium">{ticket.eventDate}</span>
                    <span className="block text-slate-500 text-[11px]">{ticket.startTime} - {ticket.endTime || 'End of Day'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/90 border border-slate-100 shadow-2xs">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold text-[#26334A]">Venue & Location</span>
                    <span className="text-[#64748B] font-medium">{ticket.venue}</span>
                    <span className="block text-slate-500 text-[11px]">{ticket.location}</span>
                  </div>
                </div>
              </div>

              {/* Pass Metadata & Real QR Code */}
              <div className="pt-4 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                
                <div className="sm:col-span-2 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Ticket Number</span>
                    <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">{ticket.ticketNumber || ticket.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Quantity</span>
                    <span className="font-bold text-[#26334A]">{ticket.quantity} Pass(es)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Total Paid</span>
                    <span className="font-bold text-indigo-700">₹{ticket.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Check-in Status</span>
                    <span className="font-medium text-slate-700">
                      {ticket.checkedIn ? 'Checked In' : 'Not Checked In Yet'}
                    </span>
                  </div>
                </div>

                {/* Real SVG QR Code Container */}
                <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="p-1.5 bg-[#26334A] rounded-xl text-white flex items-center justify-center">
                    <QrCodeGenerator value={ticket.ticketNumber || ticket.id} size={76} fgColor="#FFFFFF" bgColor="#26334A" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-600 mt-1 font-bold">SCAN AT ENTRY</span>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 px-6 border-t border-slate-200 flex items-center gap-3 bg-slate-50 shrink-0 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#26334A] text-white font-bold text-xs hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white" />
            Print Ticket / Save as PDF
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white text-[#26334A] border border-slate-200 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
