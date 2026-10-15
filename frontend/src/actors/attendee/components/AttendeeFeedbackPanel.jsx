import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Award,
  HelpCircle
} from 'lucide-react';

export default function AttendeeFeedbackPanel({ user }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePoll, setActivePoll] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMyPolls();
  }, []);

  const fetchMyPolls = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/feedback/polls/attendee/my-polls', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.polls)) {
        setPolls(data.polls);
        if (data.polls.length > 0) {
          selectPoll(data.polls[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching attendee polls:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectPoll = (poll) => {
    setActivePoll(poll);
    setAnswers({});
    setErrorMsg('');
    setSuccessMsg(poll.hasSubmitted ? '✓ You have already submitted feedback for this event.' : '');
  };

  const handleAnswerChange = (qId, val) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: val
    }));
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!activePoll || activePoll.hasSubmitted) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/feedback/polls/${activePoll.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('✓ Thank you for your feedback! Your response has been recorded.');
        // Update local poll submitted status
        setPolls(prev => prev.map(p => p.id === activePoll.id ? { ...p, hasSubmitted: true } : p));
        setActivePoll(prev => prev ? { ...prev, hasSubmitted: true } : null);
      } else {
        setErrorMsg(data.error || 'Failed to submit feedback response.');
      }
    } catch (err) {
      console.error('Error submitting response:', err);
      setErrorMsg('Network error. Unable to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading event feedback surveys...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 text-white border border-purple-500/30 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black">Event Feedback & Surveys</h2>
          </div>
          <p className="text-xs text-purple-200/80 mt-1 font-medium">
            Share your experience for events you attended to help us elevate future experiences.
          </p>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <Award className="w-12 h-12 text-purple-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Pending Event Surveys</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Feedback surveys for events you register for will appear here once published by the Event Manager.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: List of Events with Feedback Surveys */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Available Surveys ({polls.length})
            </h3>

            {polls.map(poll => (
              <div
                key={poll.id}
                onClick={() => selectPoll(poll)}
                className={`bg-white rounded-2xl p-4 border transition cursor-pointer shadow-xs hover:shadow-md ${
                  activePoll?.id === poll.id ? 'border-purple-500 ring-2 ring-purple-400/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{poll.eventName || poll.title}</h4>
                  {poll.hasSubmitted ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Submitted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black shrink-0">
                      Pending
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{poll.title}</p>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> {poll.eventDate || 'Recent Event'}
                  </span>
                  <span>{poll.questions?.length || 0} Questions</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Interactive Poll Form */}
          <div className="lg:col-span-2">
            {activePoll ? (
              <div className="bg-white rounded-3xl p-6 border border-purple-200 shadow-xl space-y-6">
                {/* Form Header */}
                <div className="border-b border-slate-100 pb-4 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-black text-purple-600 uppercase tracking-widest">
                      Event Survey
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-0.5">{activePoll.eventName}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{activePoll.title} — {activePoll.description}</p>
                  </div>

                  {activePoll.hasSubmitted && (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Response Submitted</span>
                    </div>
                  )}
                </div>

                {/* Status Messages */}
                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold">
                    {errorMsg}
                  </div>
                )}

                {/* Survey Questions Form */}
                <form onSubmit={handleSubmitResponse} className="space-y-6">
                  {activePoll.questions?.map((q, idx) => (
                    <div key={q.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {idx + 1}. {q.questionText}
                      </h4>

                      {/* 1. RATING 1-5 Stars */}
                      {q.questionType === 'RATING' && (
                        <div className="flex items-center gap-2 pt-1">
                          {[1, 2, 3, 4, 5].map(starVal => (
                            <button
                              key={starVal}
                              type="button"
                              disabled={activePoll.hasSubmitted}
                              onClick={() => handleAnswerChange(q.id, starVal)}
                              className={`p-2 rounded-xl transition flex items-center gap-1 ${
                                (answers[q.id] || 0) >= starVal
                                  ? 'bg-amber-100 text-amber-600 border border-amber-300'
                                  : 'bg-white text-slate-400 border border-slate-200 hover:border-amber-300'
                              }`}
                            >
                              <Star className={`w-5 h-5 ${
                                (answers[q.id] || 0) >= starVal ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                              }`} />
                              <span className="text-xs font-extrabold">{starVal}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* 2. MULTIPLE CHOICE */}
                      {q.questionType === 'CHOICE' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {q.options?.map(opt => (
                            <label
                              key={opt}
                              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                                answers[q.id] === opt
                                  ? 'bg-purple-100 border-purple-500 text-purple-900 ring-2 ring-purple-400/20'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                disabled={activePoll.hasSubmitted}
                                checked={answers[q.id] === opt}
                                onChange={() => handleAnswerChange(q.id, opt)}
                                className="accent-purple-600"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* 3. YES / NO */}
                      {q.questionType === 'YES_NO' && (
                        <div className="flex items-center gap-3 pt-1">
                          {['Yes', 'Maybe', 'No'].map(opt => (
                            <label
                              key={opt}
                              className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                                answers[q.id] === opt
                                  ? 'bg-indigo-100 border-indigo-500 text-indigo-900 ring-2 ring-indigo-400/20'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                disabled={activePoll.hasSubmitted}
                                checked={answers[q.id] === opt}
                                onChange={() => handleAnswerChange(q.id, opt)}
                                className="accent-indigo-600"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* 4. TEXT COMMENT */}
                      {q.questionType === 'TEXT' && (
                        <textarea
                          rows="3"
                          disabled={activePoll.hasSubmitted}
                          placeholder="Type your feedback or suggestions..."
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-purple-400 focus:outline-none"
                        />
                      )}
                    </div>
                  ))}

                  {/* Submit Button */}
                  {!activePoll.hasSubmitted && (
                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer hover:scale-102"
                      >
                        <Send className="w-4 h-4" />
                        <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
