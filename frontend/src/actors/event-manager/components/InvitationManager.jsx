import React, { useState } from 'react';
import { Mail, Key, UserCheck, ShieldAlert, Send } from 'lucide-react';

export default function InvitationManager({ invitations, onIssueInvitation, onRevokeInvitation }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    onIssueInvitation({ recipientEmail: email, recipientName: name });
    setEmail('');
    setName('');
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
      
      {/* Header */}
      <div>
        <h3 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
          <Mail className="w-5 h-5 text-purple-600" />
          <span>Private Event Invitations & Token Management</span>
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Issue cryptographically signed invitation tokens for restricted executive confections and closed events.
        </p>
      </div>

      {/* Form: Issue Private Token */}
      <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
        <span className="text-xs font-black uppercase text-purple-900 tracking-wider block">
          Issue Private Invitation Token
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
              Recipient Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vipul@example.com"
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#0F172A] focus:ring-2 focus:ring-purple-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
              Recipient Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vipul Chetan"
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#0F172A] focus:ring-2 focus:ring-purple-400 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#9333EA] hover:from-[#4F46E5] hover:to-[#7E22CE] text-white font-extrabold text-xs shadow-xs hover:shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Issue Private Token</span>
        </button>
      </form>

      {/* Invitations List */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Issued Invitations ({invitations.length})
        </h4>

        {invitations.length === 0 ? (
          <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-400">
            No private invitations issued yet for this event.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="py-2.5 px-3">RECIPIENT EMAIL</th>
                  <th className="py-2.5 px-3">INVITE CODE</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block">{inv.recipientEmail}</span>
                      {inv.recipientName && (
                        <span className="text-[10px] text-slate-400 block">{inv.recipientName}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-700">
                      {inv.inviteCode}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        inv.status === 'used' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'revoked' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => onRevokeInvitation(inv.id)}
                          className="px-2 py-1 rounded-md text-[10px] font-extrabold text-rose-600 hover:bg-rose-50 border border-rose-200 transition active:scale-95 cursor-pointer"
                        >
                          Revoke Token
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
