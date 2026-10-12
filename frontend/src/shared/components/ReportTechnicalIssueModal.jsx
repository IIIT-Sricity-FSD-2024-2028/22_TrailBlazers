import React, { useState } from 'react';
import { Wrench, X, Send, AlertCircle } from 'lucide-react';

export default function ReportTechnicalIssueModal({ isOpen, onClose, onSubmitted }) {
  if (!isOpen) return null;

  const [category, setCategory] = useState('Login / Password Access Problem');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Please enter a description of your technical problem.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/hierarchy/issues/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          priority,
          description: description.trim(),
          issueType: 'TECHNICAL'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit technical issue.');

      setDescription('');
      if (onSubmitted) onSubmitted(data.issue);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg glass-modal-light rounded-3xl p-6 border border-white shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#26334A]">Report Technical / System Issue</h3>
              <p className="text-[11px] text-[#64748B]">Routes directly to IT Support Team Queue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          
          <div className="space-y-1.5">
            <label className="font-extrabold text-[#26334A]">Issue Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 glass-input-light rounded-xl font-semibold text-xs text-[#26334A]"
            >
              <option value="Login / Password Access Problem">Login / Password Access Problem</option>
              <option value="Email & Notification Delivery Issue">Email & Notification Delivery Issue</option>
              <option value="Application UI / Module Error">Application UI / Module Error</option>
              <option value="System Outage / Slow Performance">System Outage / Slow Performance</option>
              <option value="User Account Permissions Issue">User Account Permissions Issue</option>
              <option value="Other Technical Malfunction">Other Technical Malfunction</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-extrabold text-[#26334A]">Priority Level</label>
            <div className="grid grid-cols-4 gap-2">
              {['Low', 'Medium', 'High', 'Critical'].map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition ${priority === p ? 'bg-sky-600 text-white border-sky-600 shadow-2xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-extrabold text-[#26334A]">Detailed Problem Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the error, step to reproduce, or technical problem in detail..."
              className="w-full p-3 glass-input-light rounded-xl text-xs resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting to IT...' : 'Submit Technical Issue'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition"
            >
              Cancel
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
