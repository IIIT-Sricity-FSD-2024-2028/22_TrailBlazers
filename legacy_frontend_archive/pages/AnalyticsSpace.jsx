import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  HelpCircle, 
  Vote, 
  Star, 
  Download, 
  Calendar, 
  MapPin, 
  Info, 
  Award, 
  Layers, 
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Check,
  Building,
  UserCheck,
  Printer,
  Ticket,
  UserX,
  Zap,
  Activity
} from 'lucide-react';

export default function AnalyticsSpace({ user, onNavigate }) {
  const [eventsList, setEventsList] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Multi-event comparison state
  const [selectedCompareIds, setSelectedCompareIds] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [comparing, setComparing] = useState(false);

  // Attendee feedback form state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('');
  const [feedbackErrorMsg, setFeedbackErrorMsg] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAnalytics(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 403) {
        setError('Access Denied: Your account role does not have Post-Event Analytics permissions.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (res.ok) {
        if (!data.hasData || (data.events && data.events.length === 0)) {
          setEventsList([]);
          setAnalyticsData(null);
        } else {
          setEventsList(data.events || []);
          const defaultId = data.events[0]?.id;
          setSelectedEventId(defaultId);
          if (data.primaryAnalytics) {
            setAnalyticsData(data.primaryAnalytics);
          }
        }
      } else {
        setError(data.error || 'Failed to load analytics.');
      }
    } catch (err) {
      console.error('Error loading analytics events:', err);
      setError('Network error loading analytics dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (eventId) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/analytics/events/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAnalyticsData(data.analytics);
      } else {
        setError(data.error || 'Failed to load event analytics.');
      }
    } catch (err) {
      console.error('Error fetching event analytics:', err);
      setError('Network error fetching event analytics.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedEventId) return;
    const token = localStorage.getItem('ffsd_token');
    window.open(`/api/analytics/events/${selectedEventId}/report?format=csv&token=${token}`, '_blank');
  };

  const handleExportPDF = () => {
    if (!selectedEventId) return;
    window.print();
  };

  const handleToggleCompareId = (id) => {
    if (selectedCompareIds.includes(id)) {
      setSelectedCompareIds(selectedCompareIds.filter(i => i !== id));
    } else {
      if (selectedCompareIds.length >= 5) return;
      setSelectedCompareIds([...selectedCompareIds, id]);
    }
  };

  const handleRunComparison = async () => {
    if (selectedCompareIds.length < 2) return;
    try {
      setComparing(true);
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/analytics/compare?eventIds=${selectedCompareIds.join(',')}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setComparisonResults(data.comparisons);
      } else {
        alert(data.error || 'Failed to compare events.');
      }
    } catch (err) {
      console.error('Error running comparison:', err);
      alert('Network error while running comparison.');
    } finally {
      setComparing(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      setFeedbackSubmitting(true);
      setFeedbackSuccessMsg('');
      setFeedbackErrorMsg('');
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/events/${selectedEventId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackSuccessMsg('Feedback submitted successfully!');
        setFeedbackComment('');
        fetchAnalytics(selectedEventId);
      } else {
        setFeedbackErrorMsg(data.error || 'Failed to submit feedback.');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setFeedbackErrorMsg('Network error submitting feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading && !analyticsData) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500">Loading Wavevents Analytics Command Center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="text-base font-extrabold text-rose-900">Analytics Access Restricted</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => onNavigate && onNavigate('landing')}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const { event, attendance, engagement, feedback, performance, sessions, polls, questions } = analyticsData || {};

  return (
    <div className="space-y-6 pb-16 text-slate-800">
      
      {/* Print Styles Injection */}
      <style>{`
        @media print {
          header, nav, button:not(.print-btn), select, .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .printable-report {
            padding: 20px !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2A1B54] via-[#4C2882] to-[#1E1238] p-6 sm:p-8 text-white shadow-xl no-print">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-purple-200 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>WAVEVENTS MEASURE LAYER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Post-Event Analytics Command Center
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 font-medium max-w-2xl">
              Turn event attendance, session Q&A, live poll responses, and attendee ratings into actionable performance intelligence.
            </p>
          </div>

          {/* Event Selector & Export Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
            <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 space-y-1">
              <label className="block text-[10px] font-black text-purple-200 uppercase tracking-widest">
                SELECT COMPLETED EVENT
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full sm:w-64 bg-white text-slate-900 font-extrabold text-xs px-3 py-2 rounded-xl outline-none border border-purple-200/60 shadow-sm cursor-pointer"
              >
                {eventsList.map(evt => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name} ({evt.date || 'Completed'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportPDF}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer h-full"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>

        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200/80 no-print">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'attendance', label: 'Attendance', icon: Users },
          { id: 'engagement', label: 'Engagement', icon: TrendingUp },
          { id: 'sessions', label: 'Sessions & Speakers', icon: Layers },
          { id: 'polls-qa', label: 'Polls & Q&A', icon: Vote },
          { id: 'feedback', label: 'Feedback', icon: Star },
          { id: 'compare', label: 'Compare Events', icon: Award },
          { id: 'reports', label: 'Reports', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-purple-900/10'
                  : 'bg-white text-slate-600 hover:text-purple-900 hover:bg-purple-50/60 border border-slate-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && analyticsData && (
        <div className="space-y-6">
          
          {/* Circular Score Hero Card & Equalized Supporting Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Circular Score Ring Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-white via-purple-50/30 to-white p-6 rounded-3xl border border-purple-100 shadow-sm shadow-purple-900/5 flex flex-col items-center justify-between text-center space-y-4">
              <div className="relative w-36 h-36 flex items-center justify-center my-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-purple-600 stroke-current transition-all duration-1000 ease-out"
                    strokeDasharray={`${performance?.overallScore || 0}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-900">{performance?.overallScore || 0}%</span>
                  <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-purple-100/70 px-2 py-0.5 rounded-full mt-0.5">OVERALL SCORE</span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">{event?.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{event?.organizationName} • {event?.date}</p>
              </div>

              {/* Methodology Pill */}
              <div className="px-3 py-1.5 rounded-xl bg-purple-100/60 border border-purple-200/80 text-[11px] font-extrabold text-purple-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>{performance?.methodology}</span>
              </div>
            </div>

            {/* Equalized 3 Supporting Component Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
              
              {/* Card 1: Attendance */}
              <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm shadow-emerald-900/5 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ATTENDANCE</span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[10px]">
                    40%
                  </div>
                </div>

                <div>
                  <span className="text-2xl font-black text-slate-900 block">{attendance?.attendanceRate}%</span>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {attendance?.checkedInAttendees} checked in of {attendance?.confirmedRegistrations}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-400">
                    <span>TURN OUT</span>
                    <span className="text-emerald-700 font-extrabold">{attendance?.attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${attendance?.attendanceRate}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Card 2: Engagement */}
              <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm shadow-indigo-900/5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ENGAGEMENT</span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-[10px]">
                    30%
                  </div>
                </div>

                <div>
                  <span className="text-2xl font-black text-slate-900 block">{engagement?.engagementScore}%</span>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {engagement?.qaTotal} questions • {engagement?.pollResponsesCount} votes
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-400">
                    <span>ACTIVITY</span>
                    <span className="text-indigo-700 font-extrabold">{engagement?.engagementScore}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${engagement?.engagementScore}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Card 3: Satisfaction */}
              <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm shadow-purple-900/5 flex flex-col justify-between space-y-4 hover:border-purple-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <Star className="w-4 h-4 fill-purple-600 text-purple-600" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SATISFACTION</span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-black text-[10px]">
                    30%
                  </div>
                </div>

                <div>
                  <span className="text-2xl font-black text-slate-900 block">
                    {feedback?.hasFeedback ? `${feedback?.averageRating} / 5` : 'No Feedback'}
                  </span>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {feedback?.hasFeedback ? `${feedback?.totalCount} reviews received` : 'Awaiting attendee reviews'}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-400">
                    <span>RATING SCORE</span>
                    <span className="text-purple-700 font-extrabold">{feedback?.satisfactionPercent ? `${feedback?.satisfactionPercent}%` : '0%'}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: `${feedback?.satisfactionPercent || 0}%` }}></div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Core Highlights Grid with Icons & Colored Pill Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1 */}
            <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm shadow-purple-900/5 space-y-3 relative overflow-hidden group hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Ticket className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-100/70 text-purple-800 text-[10px] font-black uppercase">
                  Verified
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">CONFIRMED TICKETS</span>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{attendance?.confirmedRegistrations}</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm shadow-emerald-900/5 space-y-3 relative overflow-hidden group hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[10px] font-black uppercase">
                  {attendance?.attendanceRate}% Rate
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">CHECKED-IN ATTENDEES</span>
                <p className="text-2xl font-black text-emerald-700 mt-0.5">{attendance?.checkedInAttendees}</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm shadow-amber-900/5 space-y-3 relative overflow-hidden group hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <UserX className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-100/70 text-amber-800 text-[10px] font-black uppercase">
                  {attendance?.noShowCount} Absent
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">NO-SHOW RATE</span>
                <p className="text-2xl font-black text-amber-600 mt-0.5">{attendance?.noShowRate}%</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm shadow-indigo-900/5 space-y-3 relative overflow-hidden group hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-100/70 text-indigo-800 text-[10px] font-black uppercase">
                  {engagement?.qaAnswered} Answered
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Q&A ANSWER RATE</span>
                <p className="text-2xl font-black text-indigo-600 mt-0.5">{engagement?.qaAnswerRate}%</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === 'attendance' && analyticsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-2 text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CONFIRMED REGISTRATIONS</span>
              <p className="text-3xl font-black text-slate-900">{attendance?.confirmedRegistrations}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CHECKED-IN ATTENDEES</span>
              <p className="text-3xl font-black text-emerald-700">{attendance?.checkedInAttendees}</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                {attendance?.attendanceRate}% Attendance Rate
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-2 text-center">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NO-SHOW COUNT</span>
              <p className="text-3xl font-black text-amber-600">{attendance?.noShowCount}</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                {attendance?.noShowRate}% No-Show Rate
              </span>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Hourly Check-In Timeline</span>
            </h3>
            {attendance?.checkInTimeline && attendance.checkInTimeline.length > 0 ? (
              <div className="space-y-2">
                {attendance.checkInTimeline.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="w-36 font-bold text-slate-600">{item.hour}</span>
                    <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min(100, item.count * 10)}%` }}></div>
                    </div>
                    <span className="font-extrabold text-slate-900">{item.count} check-ins</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No timestamped check-in activity recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ENGAGEMENT */}
      {activeTab === 'engagement' && analyticsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
              <HelpCircle className="w-7 h-7 text-indigo-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Q&A PARTICIPATION</span>
              <p className="text-2xl font-black text-slate-900">{engagement?.qaTotal} Questions</p>
              <p className="text-xs text-slate-500">{engagement?.qaAnswered} answered ({engagement?.qaAnswerRate}% answer rate)</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
              <Vote className="w-7 h-7 text-purple-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">POLL RESPONSES</span>
              <p className="text-2xl font-black text-slate-900">{engagement?.pollResponsesCount} Votes</p>
              <p className="text-xs text-slate-500">Across {engagement?.pollsCount} live polls</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
              <MessageSquare className="w-7 h-7 text-teal-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">FEEDBACK RATE</span>
              <p className="text-2xl font-black text-slate-900">{engagement?.feedbackCount} Reviews</p>
              <p className="text-xs text-slate-500">{engagement?.feedbackParticipation}% attendee participation</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SESSIONS & SPEAKERS */}
      {activeTab === 'sessions' && analyticsData && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Session Performance Breakdown</h3>
              <p className="text-xs text-slate-500">Ranked by overall attendee Q&A and poll engagement activity.</p>
            </div>
          </div>

          {sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((sess, idx) => (
                <div key={sess.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black">
                        #{idx + 1} RANK
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm">{sess.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Speaker: <strong>{sess.speakerName}</strong> • {sess.hall} ({sess.startTime} - {sess.endTime})
                    </p>
                    <p className="text-[11px] text-amber-700 font-bold italic flex items-center gap-1 mt-1">
                      <Info className="w-3 h-3 shrink-0" />
                      <span>{sess.sessionAttendanceText}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold shrink-0">
                    <div className="text-center">
                      <span className="block text-slate-400 text-[10px] uppercase font-black">Q&A</span>
                      <span className="text-slate-900 font-extrabold">{sess.qaAnswered} / {sess.qaTotal}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-slate-400 text-[10px] uppercase font-black">POLL VOTES</span>
                      <span className="text-purple-700 font-extrabold">{sess.pollResponses}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No sessions created for this event yet.</p>
          )}
        </div>
      )}

      {/* TAB 5: POLLS & Q&A */}
      {activeTab === 'polls-qa' && analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Poll Insights */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Vote className="w-5 h-5 text-purple-600" />
              <span>Poll Insights</span>
            </h3>

            {polls && polls.length > 0 ? (
              <div className="space-y-4">
                {polls.map(p => (
                  <div key={p.id} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200/60 space-y-2">
                    <p className="font-extrabold text-slate-900 text-xs">{p.questionText}</p>
                    <div className="space-y-1.5">
                      {p.options.map(opt => (
                        <div key={opt.id} className="text-xs space-y-0.5">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>{opt.optionText}</span>
                            <span>{opt.percentage}% ({opt.count} votes)</span>
                          </div>
                          <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${opt.percentage}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-black text-purple-700 text-right uppercase pt-1">
                      WINNING OPTION: {p.winningOption}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No poll data recorded for this event.</p>
            )}
          </div>

          {/* Q&A Insights */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <span>Top Q&A Questions</span>
            </h3>

            {questions && questions.questions && questions.questions.length > 0 ? (
              <div className="space-y-3">
                {questions.questions.map(q => (
                  <div key={q.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{q.userName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[10px]">
                        ▲ {q.upvoteCount} Upvotes
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">{q.questionText}</p>
                    <span className="inline-block text-[9px] font-black uppercase text-slate-400 mt-1">
                      STATUS: {q.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No Q&A questions submitted.</p>
            )}
          </div>

        </div>
      )}

      {/* TAB 6: FEEDBACK */}
      {activeTab === 'feedback' && analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Feedback Summary & Rating Breakdown */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Attendee Satisfaction</h3>
            
            {feedback?.hasFeedback ? (
              <div className="space-y-4">
                <div className="text-center p-4 rounded-2xl bg-purple-50 border border-purple-200/70">
                  <span className="text-4xl font-black text-purple-900 block">{feedback.averageRating} / 5</span>
                  <div className="flex justify-center text-amber-400 gap-1 my-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`w-4 h-4 ${star <= Math.round(feedback.averageRating) ? 'fill-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-purple-700">{feedback.totalCount} total attendee reviews</span>
                </div>

                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(star => {
                    const cnt = feedback.ratingBreakdown[star] || 0;
                    const pct = feedback.totalCount > 0 ? Math.round((cnt / feedback.totalCount) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <span className="w-10">{star} ★</span>
                        <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="w-12 text-right">{cnt} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No attendee feedback has been submitted for this event yet.</p>
            )}

            {/* Attendee Submission Form */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Submit Attendee Review</h4>
              
              {feedbackSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  {feedbackSuccessMsg}
                </div>
              )}
              {feedbackErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
                  {feedbackErrorMsg}
                </div>
              )}

              <form onSubmit={handleSubmitFeedback} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">RATING (1-5 STARS)</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= feedbackRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">OPTIONAL COMMENT</label>
                  <textarea
                    rows="2"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600 font-medium"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="w-full py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-2xs transition cursor-pointer"
                >
                  {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>

          </div>

          {/* Recent Comments */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Recent Comments</h3>

            {feedback?.recentComments && feedback.recentComments.length > 0 ? (
              <div className="space-y-3">
                {feedback.recentComments.map((c, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex text-amber-400 gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`w-3 h-3 ${star <= c.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium italic">"{c.comment || 'No comment provided.'}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No comments available.</p>
            )}
          </div>

        </div>
      )}

      {/* TAB 7: COMPARE EVENTS */}
      {activeTab === 'compare' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Compare Completed Events</h3>
            <p className="text-xs text-slate-500 font-medium">Select 2 to 5 events from your scope to compare attendance, engagement, and overall performance.</p>
          </div>

          {/* Selector list */}
          <div className="flex flex-wrap gap-2">
            {eventsList.map(evt => {
              const isSelected = selectedCompareIds.includes(evt.id);
              return (
                <button
                  key={evt.id}
                  onClick={() => handleToggleCompareId(evt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isSelected
                      ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                  }`}
                >
                  {evt.name} {isSelected && '✓'}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleRunComparison}
            disabled={selectedCompareIds.length < 2 || comparing}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50 cursor-pointer"
          >
            {comparing ? 'Comparing...' : `Compare ${selectedCompareIds.length} Selected Events`}
          </button>

          {/* Results Table */}
          {comparisonResults && comparisonResults.length > 0 && (
            <div className="overflow-x-auto pt-4 border-t border-slate-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-2 px-3">EVENT NAME</th>
                    <th className="py-2 px-3 text-center">REGISTRATIONS</th>
                    <th className="py-2 px-3 text-center">CHECKED-IN</th>
                    <th className="py-2 px-3 text-center">ATTENDANCE %</th>
                    <th className="py-2 px-3 text-center">ENGAGEMENT %</th>
                    <th className="py-2 px-3 text-center">AVG RATING</th>
                    <th className="py-2 px-3 text-center">OVERALL SCORE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {comparisonResults.map(res => (
                    <tr key={res.eventId} className="hover:bg-purple-50/30">
                      <td className="py-3 px-3 text-slate-900">{res.eventName}</td>
                      <td className="py-3 px-3 text-center">{res.registrations}</td>
                      <td className="py-3 px-3 text-center text-emerald-700">{res.checkedIn}</td>
                      <td className="py-3 px-3 text-center text-emerald-800 font-extrabold">{res.attendanceRate}%</td>
                      <td className="py-3 px-3 text-center text-indigo-700">{res.engagementScore}%</td>
                      <td className="py-3 px-3 text-center text-purple-700">{res.averageRating ? `${res.averageRating} ★` : 'N/A'}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 font-black">
                          {res.overallScore}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: REPORTS */}
      {activeTab === 'reports' && analyticsData && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Executive Report Export</h3>
              <p className="text-xs text-slate-500">Generate and export formatted executive summary reports in vector PDF or raw CSV format.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Export Report (PDF)</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Raw Data (CSV)</span>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px]">Executive Report Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-medium text-slate-700">
              <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-black text-slate-400 block uppercase">EVENT TITLE</span>
                <span className="font-extrabold text-slate-900">{event?.name}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-black text-slate-400 block uppercase">OVERALL SCORE</span>
                <span className="font-extrabold text-purple-700">{performance?.overallScore}%</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-black text-slate-400 block uppercase">ATTENDANCE RATE</span>
                <span className="font-extrabold text-emerald-700">{attendance?.attendanceRate}% ({attendance?.checkedInAttendees}/{attendance?.confirmedRegistrations})</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-black text-slate-400 block uppercase">SATISFACTION RATING</span>
                <span className="font-extrabold text-amber-600">{feedback?.averageRating ? `${feedback?.averageRating} / 5` : 'Awaiting Reviews'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
