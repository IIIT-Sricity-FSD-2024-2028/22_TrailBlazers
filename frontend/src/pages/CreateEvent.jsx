import React, { useState } from 'react';
import { PlusCircle, Building, Calendar, MapPin, DollarSign, Clock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Mail, HelpCircle, Layers, FileText } from 'lucide-react';
import RevenueModal from '../components/RevenueModal';
import { StatusBadge } from '../components/StatusBadge';

export default function CreateEvent({ user, onNavigate, onOpenAuth, onVerifyEmailPrompt }) {
  const [formData, setFormData] = useState({
    organizationName: user?.organization || '',
    contactEmail: user?.email || '',
    eventName: '',
    description: '',
    agenda: '',
    category: 'Tech Conference',
    eventDate: '',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    venue: '',
    location: '',
    eventType: 'OPEN', // 'OPEN' | 'CLOSED'
    expectedAttendance: 100,
    isPaid: false,
    ticketPrice: 0,
    frequency: 'One-time event',
    recurringPerWeek: 0,
    additionalNotes: '',
    bannerUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);

  const categories = ['Tech Conference', 'Workshop', 'Academic', 'Business', 'Cultural'];
  const frequencies = ['One-time event', 'Weekly', 'Multiple times per week', 'Monthly', 'Recurring'];

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setError('');
  };

  const handleBannerFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setBannerUploadError('Please select a valid image file (JPEG, PNG, WebP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setBannerUploadError('Image size exceeds 5MB limit.');
      return;
    }

    setBannerUploading(true);
    setBannerUploadError('');

    try {
      const token = localStorage.getItem('ffsd_token');
      const bodyData = new FormData();
      bodyData.append('file', file);

      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: bodyData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'File upload failed');
      }

      setFormData((prev) => ({ ...prev, bannerUrl: data.file.url }));
    } catch (err) {
      setBannerUploadError(err.message || 'Failed to upload event banner image.');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (!user.emailVerified) {
      onVerifyEmailPrompt();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/event-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit event organizing request.');
      }

      setSubmittedRequest(data.request);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 text-[#26334A]">
      
      {/* Revenue Support Top Ribbon */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5] border border-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white text-[#26334A] flex items-center justify-center font-bold shadow-xs border border-white shrink-0">
            <Mail className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-[#26334A] block">Need custom pricing or platform fee support?</span>
            <span className="text-[#64748B] font-medium">Discuss custom revenue sharing models or platform fee structures with our specialists.</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsRevenueModalOpen(true)}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 text-[#26334A] font-extrabold text-xs transition shadow-xs border border-white"
        >
          Talk to Revenue Team
        </button>
      </div>

      {!submittedRequest ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Form Header */}
          <div className="space-y-2 text-center max-w-2xl mx-auto">
            <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest">Event Organizer Space</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#26334A] tracking-tight">Organize Your Next Event</h1>
            <p className="text-sm text-[#64748B] font-medium">
              Submit your event specifications for review. Once approved by our team, your event will be published to the catalogue.
            </p>
          </div>

          {/* Workflow Step Indicator */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-2 bg-white/60 rounded-2xl border border-white shadow-2xs text-center text-xs font-extrabold">
            <div className="p-3 bg-white text-[#26334A] rounded-xl shadow-xs border border-slate-200">
              <span className="block text-[10px] text-indigo-600 uppercase tracking-wider">Step 01</span>
              <span>Organization</span>
            </div>
            <div className="p-3 bg-white/40 text-[#64748B] rounded-xl">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Step 02</span>
              <span>Event Details</span>
            </div>
            <div className="p-3 bg-white/40 text-[#64748B] rounded-xl">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Step 03</span>
              <span>Schedule & Location</span>
            </div>
            <div className="p-3 bg-white/40 text-[#64748B] rounded-xl">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Step 04</span>
              <span>Ticketing & Review</span>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Organization */}
          <div className="p-8 rounded-3xl glass-light border border-white shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              <span>1. Organization Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="organizationName"
                  required
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="Global Innovation Forum / University Department"
                  className="w-full px-4 py-3 glass-input-light rounded-xl text-sm font-medium focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                  Contact Email Address *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  required
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="events@organization.org"
                  className="w-full px-4 py-3 glass-input-light rounded-xl text-sm font-medium focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Event Details */}
          <div className="p-8 rounded-3xl glass-light border border-white shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>2. Event Details & Agenda</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="eventName"
                  required
                  value={formData.eventName}
                  onChange={handleChange}
                  placeholder="e.g. AI Ethics & Autonomous Systems Conference"
                  className="w-full px-4 py-3 glass-input-light rounded-xl text-sm font-medium focus:border-indigo-400"
                />
              </div>

              {/* Event Banner Upload */}
              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                  Event Banner Image
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white/80 rounded-2xl border border-slate-200">
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      onChange={handleBannerFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400 block">Supported: JPG, PNG, WEBP, GIF (Max 5MB)</span>
                  </div>

                  {bannerUploading && (
                    <span className="text-xs font-bold text-indigo-600 animate-pulse">Uploading banner...</span>
                  )}

                  {formData.bannerUrl && !bannerUploading && (
                    <div className="relative w-24 h-14 rounded-xl overflow-hidden border border-indigo-200 shadow-xs shrink-0">
                      <img src={formData.bannerUrl} alt="Event Banner Preview" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-tl">Uploaded</span>
                    </div>
                  )}
                </div>
                {bannerUploadError && (
                  <p className="text-xs text-rose-600 font-bold mt-1">{bannerUploadError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/90 border border-slate-200 rounded-xl text-sm font-bold text-[#26334A] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                    Proposed Date *
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    required
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 glass-input-light rounded-xl text-sm font-medium focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="text"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    placeholder="09:00 AM"
                    className="w-full px-4 py-3 glass-input-light rounded-xl text-sm font-medium focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                    End Time
                  </label>
                  <input
                    type="text"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    placeholder="05:00 PM"
                    className="w-full px-4 py-3 glass-input-light rounded-xl text-sm font-medium focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                  Event Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Overview of speakers, keynotes, topics, and objectives..."
                  className="w-full p-4 glass-input-light rounded-xl text-sm font-medium focus:border-indigo-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                  Event Timeline & Agenda
                </label>
                <textarea
                  name="agenda"
                  rows={3}
                  value={formData.agenda}
                  onChange={handleChange}
                  placeholder="09:00 AM - Opening Keynote&#10;11:00 AM - Technical Workshops..."
                  className="w-full p-4 glass-input-light rounded-xl text-sm font-mono focus:border-indigo-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Schedule & Location */}
          <div className="p-8 rounded-3xl glass-light border border-white shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-500" />
              <span>3. Location & Attendance</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                  Venue Name *
                </label>
                <input
                  type="text"
                  name="venue"
                  required
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="Convention Hall A / Auditorium"
                  className="w-full px-4 py-3 glass-input-light rounded-xl text-sm font-medium focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                  City / Location *
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Bengaluru, Karnataka"
                  className="w-full px-4 py-3 glass-input-light rounded-xl text-sm font-medium focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                  Access Type
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/90 border border-slate-200 rounded-xl text-sm font-bold text-[#26334A] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs"
                >
                  <option value="OPEN">Open Event (Public Registration)</option>
                  <option value="CLOSED">Closed Event (Invite Code Required)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                  Expected Attendance Capacity
                </label>
                <input
                  type="number"
                  name="expectedAttendance"
                  min={10}
                  value={formData.expectedAttendance}
                  onChange={handleChange}
                  className="w-full px-4 py-3 glass-input-light rounded-xl text-sm font-medium focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Ticketing & Frequency */}
          <div className="p-8 rounded-3xl glass-light border border-white shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-[#26334A] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>4. Ticketing & Frequency</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/70 border border-slate-200/80">
                <input
                  type="checkbox"
                  id="isPaid"
                  name="isPaid"
                  checked={formData.isPaid}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="isPaid" className="text-xs font-extrabold text-[#26334A] cursor-pointer">
                  Is this a Paid Event?
                </label>
              </div>

              {formData.isPaid && (
                <div>
                  <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                    Ticket Price per Pass (₹)
                  </label>
                  <input
                    type="number"
                    name="ticketPrice"
                    min={0}
                    value={formData.ticketPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-3 glass-input-light rounded-xl text-sm font-medium focus:border-indigo-400"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                  Event Frequency
                </label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/90 border border-slate-200 rounded-xl text-sm font-bold text-[#26334A] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs"
                >
                  {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#26334A] uppercase tracking-wider mb-1.5">
                  Special Requirements
                </label>
                <input
                  type="text"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  placeholder="Stage lighting, live streaming, catering..."
                  className="w-full px-4 py-3 glass-input-light rounded-xl text-sm font-medium focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-[#26334A] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-slate-800 transition shadow-md flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting Request...' : 'Submit Event Request'}
            {!loading && <ArrowRight className="w-4 h-4 text-white" />}
          </button>

        </form>
      ) : (

        /* Confirmation Receipt */
        <div className="p-8 sm:p-14 rounded-3xl glass-light border border-white text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-700">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <span className="text-xs font-extrabold text-amber-700 uppercase tracking-widest">Review Pending</span>
            <h2 className="text-3xl font-extrabold text-[#26334A] mt-1">Event Request Submitted</h2>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto mt-2">
              Our Event Management team will review your event requirements, venue capacity, and pricing structure.
            </p>
          </div>

          <div className="max-w-md mx-auto p-6 rounded-2xl bg-white/80 border border-slate-200/80 text-left space-y-3 text-xs shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Request ID</span>
              <span className="font-mono font-bold text-[#26334A] bg-white px-2 py-0.5 rounded border border-slate-200">
                {submittedRequest.requestId}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Status</span>
              <StatusBadge status={submittedRequest.status} />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Event Title</span>
              <span className="font-bold text-[#26334A]">{submittedRequest.eventName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Organization</span>
              <span className="font-medium text-[#26334A]">{submittedRequest.organizationName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Date</span>
              <span className="font-medium text-[#26334A]">{submittedRequest.eventDate}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-3 rounded-xl bg-[#26334A] text-white font-extrabold text-xs hover:bg-slate-800 transition"
            >
              Go to Your Space
            </button>

            <button
              onClick={() => setIsRevenueModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-white text-[#26334A] border border-slate-200 font-extrabold text-xs hover:bg-slate-50 transition shadow-2xs"
            >
              Discuss Pricing with Revenue Team
            </button>
          </div>
        </div>
      )}

      {/* Revenue Support Modal */}
      <RevenueModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        user={user}
        eventRequestId={submittedRequest?.id}
      />

    </div>
  );
}
