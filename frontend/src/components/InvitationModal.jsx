import React, { useState } from 'react';
import { X, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';

export default function InvitationModal({ isOpen, onClose, onContinue, eventName }) {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inviteCode || !inviteCode.trim()) {
      setError('Please enter the invitation code to proceed.');
      return;
    }
    setError('');
    onContinue(inviteCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-[#26334A]">
      <div className="relative w-full max-w-md glass-modal-light rounded-3xl shadow-2xl border border-white p-6 space-y-6 overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#26334A]">Invitation Required</h3>
              {eventName && <p className="text-[11px] text-[#64748B] font-medium truncate max-w-[220px]">{eventName}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-[#26334A] hover:bg-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-[#64748B] leading-relaxed font-medium">
            This event requires a valid invitation code to continue registration. Please enter your code below.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider">
              Invitation Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setError('');
              }}
              placeholder="e.g. INV-2026-XXXX"
              autoFocus
              className="w-full px-4 py-3 glass-input-light rounded-xl text-sm font-mono font-bold tracking-wider uppercase focus:border-indigo-400 focus:outline-none"
            />

            {/* In-Modal Validation Error Message */}
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 mt-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#26334A] hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <span>Continue</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
