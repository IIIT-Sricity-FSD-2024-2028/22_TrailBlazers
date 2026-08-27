import React, { useState } from 'react';
import { X, Mail, Building, MessageSquare, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function RevenueModal({ isOpen, onClose, user, eventRequestId }) {
  const [formData, setFormData] = useState({
    organizationName: user?.organization || '',
    contactEmail: user?.email || '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedInquiry, setSubmittedInquiry] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/revenue/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventRequestId,
          organizationName: formData.organizationName,
          contactEmail: formData.contactEmail,
          message: formData.message
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit revenue inquiry.');
      }

      setSubmittedInquiry(data.inquiry);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-[#26334A]">
      <div className="relative w-full max-w-md glass-modal-light rounded-3xl shadow-2xl border border-white overflow-hidden">
        
        <div className="h-2.5 bg-gradient-to-r from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5]" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-[#26334A] hover:bg-white/80 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">

          {!submittedInquiry ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center space-y-1.5 mb-4">
                <div className="inline-flex w-12 h-12 rounded-2xl bg-[#FBE9F9] border border-white text-purple-700 items-center justify-center mb-1 shadow-2xs">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-[#26334A]">Talk to Revenue Team</h3>
                <p className="text-xs text-[#64748B]">Need custom pricing, bulk registration rates, or platform fee adjustments?</p>
              </div>

              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#26334A] uppercase tracking-wider mb-1">
                  Organization Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    placeholder="Global Tech Forum"
                    className="w-full pl-10 pr-4 py-2.5 glass-input-light rounded-xl text-sm focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26334A] uppercase tracking-wider mb-1">
                  Contact Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="revenue@organization.com"
                    className="w-full pl-10 pr-4 py-2.5 glass-input-light rounded-xl text-sm focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26334A] uppercase tracking-wider mb-1">
                  Inquiry Message / Pricing Concern
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Explain your pricing structure, estimated attendees, or sponsorship requirements..."
                  className="w-full p-3 glass-input-light rounded-xl text-sm focus:border-indigo-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#26334A] text-white font-bold text-sm hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting Inquiry...' : 'Send Revenue Inquiry'}
                {!loading && <ArrowRight className="w-4 h-4 text-white" />}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Inquiry Received</span>
                <h3 className="text-xl font-extrabold text-[#26334A] mt-0.5">Revenue Request Submitted</h3>
                <p className="text-xs text-[#64748B] mt-1">Our financial planning specialists will review your submission and contact you within 24 hours.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200 text-xs text-[#26334A] space-y-1 shadow-2xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Inquiry Request ID</span>
                  <span className="font-mono font-bold text-indigo-700">{submittedInquiry.requestId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Contact Email</span>
                  <span className="font-medium text-[#26334A]">{submittedInquiry.contactEmail}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-[#26334A] text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
