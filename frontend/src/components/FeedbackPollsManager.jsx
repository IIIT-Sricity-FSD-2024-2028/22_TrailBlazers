import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Plus, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Star, 
  HelpCircle, 
  FileText, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Sparkles,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Trash2,
  Lock,
  Edit3
} from 'lucide-react';

export default function FeedbackPollsManager({ user, events }) {
  const [selectedEventId, setSelectedEventId] = useState(events && events.length > 0 ? events[0].id : '');
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePollAnalytics, setActivePollAnalytics] = useState(null);
  const [alertNotice, setAlertNotice] = useState('');

  // Unified Poll Creation & Editing Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPollId, setEditingPollId] = useState(null);
  const [pollTitle, setPollTitle] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [questions, setQuestions] = useState([
    { questionText: 'How would you rate the overall event?', questionType: 'RATING', required: true, options: [] },
    { questionText: 'How was the venue & arrangement?', questionType: 'CHOICE', required: true, options: ['Excellent', 'Good', 'Average', 'Poor'] },
    { questionText: 'Would you attend another Wavevents event?', questionType: 'YES_NO', required: true, options: ['Yes', 'Maybe', 'No'] },
    { questionText: 'Additional comments or suggestions:', questionType: 'TEXT', required: false, options: [] }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events]);

  useEffect(() => {
    if (selectedEventId) {
      fetchPolls(selectedEventId);
      setAlertNotice('');
    } else {
      setPolls([]);
      setActivePollAnalytics(null);
    }
  }, [selectedEventId]);

  const fetchPolls = async (eventId) => {
    if (!eventId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/feedback/polls/event/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPolls(data.polls || []);
        setActivePollAnalytics(null);
      }
    } catch (err) {
      console.error('Error fetching polls:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPollAnalytics = async (pollId) => {
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/feedback/polls/${pollId}/results`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setActivePollAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching poll analytics:', err);
    }
  };

  const handleOpenCreateModal = () => {
    if (!selectedEventId) {
      setAlertNotice('Please select an event from the dropdown menu first.');
      return;
    }
    setEditingPollId(null);
    setPollTitle('Post-Event Feedback Survey');
    setPollDescription('Help us understand your overall experience to improve future Wavevents events.');
    setQuestions([
      { questionText: 'How would you rate the overall event?', questionType: 'RATING', required: true, options: [] },
      { questionText: 'How was the venue & organization?', questionType: 'CHOICE', required: true, options: ['Excellent', 'Good', 'Average', 'Poor'] },
      { questionText: 'Would you attend another Wavevents event?', questionType: 'YES_NO', required: true, options: ['Yes', 'Maybe', 'No'] },
      { questionText: 'Additional comments or suggestions:', questionType: 'TEXT', required: false, options: [] }
    ]);
    setModalError('');
    setIsCreateModalOpen(true);
  };

  const handlePublishPoll = async (pollId) => {
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/feedback/polls/${pollId}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        fetchPolls(selectedEventId);
      } else {
        alert(data.error || 'Unable to publish poll.');
      }
    } catch (err) {
      console.error('Error publishing poll:', err);
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/feedback/polls/${pollId}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPolls(selectedEventId);
      }
    } catch (err) {
      console.error('Error closing poll:', err);
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this draft poll?')) return;
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/feedback/polls/${pollId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPolls(selectedEventId);
      }
    } catch (err) {
      console.error('Error deleting poll:', err);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: 'New Question', questionType: 'CHOICE', required: true, options: ['Option 1', 'Option 2', 'Option 3'] }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleMoveQuestion = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setQuestions(updated);
  };

  const handleQuestionChange = (index, field, val) => {
    const updated = [...questions];
    updated[index][field] = val;
    if (field === 'questionType') {
      if (val === 'CHOICE') updated[index].options = ['Excellent', 'Good', 'Average', 'Poor'];
      else if (val === 'YES_NO') updated[index].options = ['Yes', 'Maybe', 'No'];
      else updated[index].options = [];
    }
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = val;
    setQuestions(updated);
  };

  const handleAddOption = (qIdx) => {
    const updated = [...questions];
    updated[qIdx].options.push(`Option ${updated[qIdx].options.length + 1}`);
    setQuestions(updated);
  };

  const handleRemoveOption = (qIdx, optIdx) => {
    const updated = [...questions];
    updated[qIdx].options = updated[qIdx].options.filter((_, i) => i !== optIdx);
    setQuestions(updated);
  };

  const handleSavePollForm = async (e, publishImmediately = false) => {
    e.preventDefault();
    setModalError('');

    if (!pollTitle.trim()) {
      setModalError('Poll title is required.');
      return;
    }
    if (!selectedEventId) {
      setModalError('Please select an event.');
      return;
    }
    if (questions.length === 0) {
      setModalError('Please add at least one question to the poll.');
      return;
    }

    // Validate question texts
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        setModalError(`Question ${i + 1} cannot have an empty question text.`);
        return;
      }
      if (questions[i].questionType === 'CHOICE' && (!questions[i].options || questions[i].options.length === 0)) {
        setModalError(`Question ${i + 1} (Multiple Choice) must have at least one option.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/feedback/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: selectedEventId,
          title: pollTitle.trim(),
          description: pollDescription.trim(),
          status: publishImmediately ? 'PUBLISHED' : 'DRAFT',
          questions
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsCreateModalOpen(false);
        fetchPolls(selectedEventId);
      } else {
        setModalError(data.error || 'Failed to save poll.');
      }
    } catch (err) {
      console.error('Error saving poll:', err);
      setModalError('Network error. Unable to save poll.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEvent = events?.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-6">
      {/* 1. Header Bar & Event Selector */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/30 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-pink-400" />
            <h2 className="text-xl font-black">Post-Event Feedback & Analytics Polls</h2>
          </div>
          <p className="text-xs text-purple-200/80 mt-1 font-medium">
            Create attendee feedback surveys and review real-time post-event satisfaction analytics.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Event Picker Dropdown */}
          <div className="w-full md:w-72">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-2xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer w-full"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                -- Select Event --
              </option>
              {events?.map(evt => (
                <option key={evt.id} value={evt.id} className="bg-slate-900 text-white font-semibold">
                  {evt.eventName || evt.name || `Event #${evt.id}`}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0 hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Create Poll</span>
          </button>
        </div>
      </div>

      {alertNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{alertNotice}</span>
        </div>
      )}

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Poll List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span>Event Polls</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px]">{polls.length}</span>
            </h3>
            {selectedEvent && (
              <span className="text-[11px] font-bold text-slate-500 truncate max-w-[150px]">
                {selectedEvent.eventName || selectedEvent.name}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading polls...</div>
          ) : !selectedEventId ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xs">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Event Selected</h4>
              <p className="text-xs text-slate-500 mt-1">Please pick an event from the top dropdown menu to manage its feedback surveys.</p>
            </div>
          ) : polls.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xs space-y-3">
              <BarChart3 className="w-10 h-10 text-purple-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Feedback Polls Yet</h4>
              <p className="text-xs text-slate-500">Create a short survey to collect attendee ratings & post-event feedback.</p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs transition cursor-pointer"
              >
                + Create First Poll
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {polls.map(poll => (
                <div
                  key={poll.id}
                  className={`bg-white rounded-3xl p-5 border transition shadow-xs hover:shadow-md cursor-pointer ${
                    activePollAnalytics?.pollId === poll.id ? 'border-purple-500 ring-2 ring-purple-400/20' : 'border-slate-200'
                  }`}
                  onClick={() => fetchPollAnalytics(poll.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{poll.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                      poll.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' :
                      poll.status === 'CLOSED' ? 'bg-slate-100 text-slate-700' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {poll.status}
                    </span>
                  </div>

                  {poll.description && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{poll.description}</p>
                  )}

                  {/* Real Metrics Line */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span>{poll.questions?.length || 0} Questions</span>
                    <span>{poll.responseCount || 0} Responses ({poll.responseRate || 0}%)</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-slate-100/60">
                    {poll.status === 'DRAFT' && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePoll(poll.id); }}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); handlePublishPoll(poll.id); }}
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publish</span>
                        </button>
                      </>
                    )}

                    {poll.status === 'PUBLISHED' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleClosePoll(poll.id); }}
                        className="px-3 py-1 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-[11px] transition flex items-center gap-1 cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Close Poll</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); fetchPollAnalytics(poll.id); }}
                      className="px-3 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-extrabold text-[11px] transition cursor-pointer"
                    >
                      Analytics 📊
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Real Aggregated Post Event Analytics Display */}
        <div className="lg:col-span-2">
          {activePollAnalytics ? (
            <div className="bg-white rounded-3xl p-6 border border-purple-200 shadow-xl space-y-6 animate-fade-slide-up">
              {/* Analytics Header Summary */}
              <div className="border-b border-slate-100 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">
                      Post-Event Analytics
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-0.5">
                      {activePollAnalytics.pollTitle}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">{activePollAnalytics.eventName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    activePollAnalytics.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {activePollAnalytics.status}
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-100 text-center">
                    <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <div className="text-2xl font-black text-purple-950">
                      {activePollAnalytics.totalResponses} / {activePollAnalytics.totalAttendees}
                    </div>
                    <div className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">Responses Submitted</div>
                  </div>

                  <div className="bg-pink-50/80 p-4 rounded-2xl border border-pink-100 text-center">
                    <TrendingUp className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                    <div className="text-2xl font-black text-pink-950">{activePollAnalytics.responseRate}%</div>
                    <div className="text-[10px] font-extrabold text-pink-700 uppercase tracking-wider">Response Rate</div>
                  </div>

                  <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-100 text-center">
                    <Star className="w-5 h-5 text-amber-500 mx-auto mb-1 fill-amber-400" />
                    <div className="text-2xl font-black text-amber-950">{activePollAnalytics.overallAverageRating} / 5</div>
                    <div className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Average Rating</div>
                  </div>
                </div>
              </div>

              {/* Question Breakdown Details */}
              <div className="space-y-5">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Detailed Question Analytics
                </h4>

                {activePollAnalytics.questions?.map((q, idx) => (
                  <div key={q.questionId || idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-900 text-sm">{idx + 1}. {q.questionText}</h5>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{q.questionType}</span>
                    </div>

                    {/* Rating Breakdown */}
                    {q.questionType === 'RATING' && (
                      <div className="space-y-2 pt-2">
                        <div className="text-xs font-bold text-slate-700">Average Score: <span className="text-amber-600 font-extrabold">{q.averageRating} / 5 Stars</span> ({q.totalAnswers} ratings)</div>
                        {q.breakdown?.map(item => (
                          <div key={item.star} className="flex items-center gap-3 text-xs">
                            <span className="w-12 font-bold text-slate-600 flex items-center gap-1 shrink-0">
                              {item.star} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            </span>
                            <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="w-16 text-right font-extrabold text-slate-700 shrink-0">{item.count} ({item.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Choice / Yes-No Breakdown */}
                    {(q.questionType === 'CHOICE' || q.questionType === 'YES_NO') && (
                      <div className="space-y-2 pt-2">
                        {q.optionBreakdown?.map(item => (
                          <div key={item.option} className="flex items-center gap-3 text-xs">
                            <span className="w-24 font-bold text-slate-700 truncate shrink-0">{item.option}</span>
                            <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="w-16 text-right font-extrabold text-slate-700 shrink-0">{item.count} ({item.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Text Comments */}
                    {q.questionType === 'TEXT' && (
                      <div className="space-y-2 pt-2">
                        <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                          <span>Submitted Comments ({q.comments?.length || 0})</span>
                        </div>
                        {q.comments?.length === 0 ? (
                          <div className="text-xs text-slate-400 italic">No text comments submitted yet.</div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {q.comments?.map((cmt, cIdx) => (
                              <div key={cIdx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-800 italic shadow-2xs">
                                "{cmt}"
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-xs space-y-3">
              <BarChart3 className="w-12 h-12 text-purple-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">Select a Poll to View Analytics</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "Analytics 📊" on any poll card to view real post-event satisfaction ratings and response statistics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Unified Poll Builder */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-purple-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Create Event Feedback Poll</h3>
                <p className="text-xs text-slate-500 font-bold">{selectedEvent?.eventName || selectedEvent?.name}</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs font-bold">
                {modalError}
              </div>
            )}

            <form className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Poll Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Post-Event Feedback Survey"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Instructions
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Help us evaluate your overall event experience."
                  value={pollDescription}
                  onChange={(e) => setPollDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Question Builder List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Questions ({questions.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-xs font-extrabold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                  >
                    + Add Question
                  </button>
                </div>

                {questions.map((q, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-purple-800">Q{idx + 1}</span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveQuestion(idx, -1)}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === questions.length - 1}
                          onClick={() => handleMoveQuestion(idx, 1)}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700 ml-1"
                            title="Remove Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Enter question text..."
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-600">Type:</label>
                        <select
                          value={q.questionType}
                          onChange={(e) => handleQuestionChange(idx, 'questionType', e.target.value)}
                          className="px-3 py-1 rounded-lg border border-slate-300 text-xs font-bold bg-white focus:outline-none"
                        >
                          <option value="RATING">Rating (1 - 5 Stars)</option>
                          <option value="CHOICE">Multiple Choice</option>
                          <option value="YES_NO">Yes / No</option>
                          <option value="TEXT">Text Comment</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(q.required)}
                          onChange={(e) => handleQuestionChange(idx, 'required', e.target.checked)}
                          className="accent-purple-600"
                        />
                        <span>Required</span>
                      </label>
                    </div>

                    {/* Options list for Multiple Choice */}
                    {q.questionType === 'CHOICE' && (
                      <div className="space-y-2 pt-2 border-t border-slate-200/80">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span>Options ({q.options?.length || 0})</span>
                          <button
                            type="button"
                            onClick={() => handleAddOption(idx)}
                            className="text-purple-700 hover:underline cursor-pointer"
                          >
                            + Add Option
                          </button>
                        </div>
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                              className="flex-1 px-3 py-1 rounded-lg border border-slate-300 text-xs font-medium bg-white"
                            />
                            {q.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(idx, optIdx)}
                                className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={(e) => handleSavePollForm(e, false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={(e) => handleSavePollForm(e, true)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  {submitting ? 'Publishing...' : 'Publish Poll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
