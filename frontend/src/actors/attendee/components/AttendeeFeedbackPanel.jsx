import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Star, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Award, 
  HelpCircle, 
  BarChart3, 
  Check, 
  Vote 
} from 'lucide-react';
import { fetchActiveFeedbackPolls, submitPollResponse } from '../../../store/analytics-actions';

export default function AttendeeFeedbackPanel({ user }) {
  const dispatch = useDispatch();
  const sessionPolls = useSelector((state) => state.analytics.activePolls || []);
  const [activeMode, setActiveMode] = useState('surveys'); // 'surveys' | 'session-polls'
  
  // Surveys State
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePoll, setActivePoll] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Live Session Polls State
  const [sessionPollsLoading, setSessionPollsLoading] = useState(false);
  const [selectedSessionOptions, setSelectedSessionOptions] = useState({});
  const [submittingVoteId, setSubmittingVoteId] = useState(null);
  const [voteFeedback, setVoteFeedback] = useState({});

  useEffect(() => {
    fetchMyPolls();
    fetchMySessionPolls();
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

  const fetchMySessionPolls = async () => {
    setSessionPollsLoading(true);
    try {
      await dispatch(fetchActiveFeedbackPolls());
    } catch (err) {
      console.error('Error fetching live session polls:', err);
    } finally {
      setSessionPollsLoading(false);
    }
  };

  const selectPoll = (poll) => {
    setActivePoll(poll);
    setAnswers({});
    setErrorMsg('');
    setSuccessMsg(poll.hasSubmitted ? 'Thank you! Your feedback has been submitted.' : '');
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
        setSuccessMsg('Thank you! Your feedback has been submitted.');
        setPolls(prev => prev.map(p => p.id === activePoll.id ? { ...p, hasSubmitted: true } : p));
        setActivePoll(prev => prev ? { ...prev, hasSubmitted: true } : null);
      } else if (res.status === 409 || (data.message && data.message.includes('already submitted'))) {
        setPolls(prev => prev.map(p => p.id === activePoll.id ? { ...p, hasSubmitted: true } : p));
        setActivePoll(prev => prev ? { ...prev, hasSubmitted: true } : null);
        setSuccessMsg('Thank you! Your feedback has been submitted.');
      } else {
        setErrorMsg(data.message || data.error || 'Failed to submit feedback response.');
      }
    } catch (err) {
      console.error('Error submitting response:', err);
      setErrorMsg('Network error. Unable to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectSessionOption = (pollId, optionId) => {
    setSelectedSessionOptions(prev => ({ ...prev, [pollId]: optionId }));
  };

  const handleVoteSessionPoll = async (pollId) => {
    const optionId = selectedSessionOptions[pollId];
    if (!optionId) return;

    setSubmittingVoteId(pollId);
    setVoteFeedback(prev => ({ ...prev, [pollId]: null }));

    try {
      const res = await dispatch(submitPollResponse(pollId, optionId, true));
      if (res.success) {
        setVoteFeedback(prev => ({ ...prev, [pollId]: { type: 'success', text: '✓ Your vote was recorded successfully!' } }));
        await fetchMySessionPolls();
      } else {
        setVoteFeedback(prev => ({ ...prev, [pollId]: { type: 'error', text: res.error || 'Error submitting vote.' } }));
      }
    } catch (err) {
      setVoteFeedback(prev => ({ ...prev, [pollId]: { type: 'error', text: 'Network error submitting vote.' } }));
    } finally {
      setSubmittingVoteId(null);
    }
  };

  if (loading && sessionPollsLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading event feedback surveys & polls...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 text-white border border-purple-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black">Attendee Feedback & Polls</h2>
          </div>
          <p className="text-xs text-purple-200/80 mt-1 font-medium">
            Vote on live session polls and share post-event feedback surveys for your registered events.
          </p>
        </div>

        {/* Mode Switcher Pill */}
        <div className="flex bg-white/10 p-1 rounded-2xl border border-white/20 backdrop-blur-md shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode('surveys')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'surveys'
                ? 'bg-white text-purple-950 shadow-md font-extrabold'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Event Surveys ({polls.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('session-polls')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'session-polls'
                ? 'bg-white text-purple-950 shadow-md font-extrabold'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Live Session Polls ({sessionPolls.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: LIVE SESSION POLLS */}
      {activeMode === 'session-polls' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Vote className="w-4 h-4 text-purple-600" />
              <span>Active Session Polls ({sessionPolls.length})</span>
            </h3>
            <button
              type="button"
              onClick={fetchMySessionPolls}
              className="text-xs font-bold text-purple-600 hover:text-purple-800 transition cursor-pointer"
            >
              Refresh Polls
            </button>
          </div>

          {sessionPolls.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <BarChart3 className="w-12 h-12 text-purple-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Active Session Polls</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When organizers publish live polls for workshops or keynotes during an event, they will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessionPolls.map((poll) => {
                const isSelected = selectedSessionOptions[poll.id];
                const isSubmittingVote = submittingVoteId === poll.id;
                const feedback = voteFeedback[poll.id];

                return (
                  <div
                    key={poll.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200">
                          {poll.sessionTitle || 'Session Poll'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {poll.totalResponses || 0} Votes
                        </span>
                      </div>

                      <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                        {poll.questionText}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        📍 Event: {poll.eventName}
                      </p>
                    </div>

                    {feedback && (
                      <div className={`p-3 rounded-xl text-xs font-bold ${
                        feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
                      }`}>
                        {feedback.text}
                      </div>
                    )}

                    {/* Poll Options */}
                    <div className="space-y-2 pt-2">
                      {poll.options && poll.options.map((opt) => {
                        if (poll.hasSubmitted) {
                          // Display Results Bar
                          return (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                <span className="flex items-center gap-1.5">
                                  {poll.submittedOptionId === opt.id && (
                                    <Check className="w-3.5 h-3.5 text-purple-600 font-bold" />
                                  )}
                                  <span>{opt.optionText}</span>
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  {opt.count || 0} votes ({opt.percentage || 0}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className={`h-2.5 rounded-full transition-all duration-500 ${
                                    poll.submittedOptionId === opt.id ? 'bg-purple-600' : 'bg-slate-400'
                                  }`}
                                  style={{ width: `${opt.percentage || 0}%` }}
                                />
                              </div>
                            </div>
                          );
                        }

                        // Display Radio Selection Card
                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleSelectSessionOption(poll.id, opt.id)}
                            className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                              isSelected === opt.id
                                ? 'bg-purple-50/80 border-purple-400 text-purple-950 ring-2 ring-purple-300/30 shadow-2xs'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span>{opt.optionText}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected === opt.id ? 'border-purple-600 bg-purple-600' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action */}
                    {!poll.hasSubmitted ? (
                      <button
                        type="button"
                        disabled={!isSelected || isSubmittingVote}
                        onClick={() => handleVoteSessionPoll(poll.id)}
                        className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                          isSelected && !isSubmittingVote
                            ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-md'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isSubmittingVote ? 'Submitting Vote...' : 'Submit Vote'}
                      </button>
                    ) : (
                      <div className="pt-2 text-center text-[11px] font-extrabold text-emerald-700 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>You voted on this session poll</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: POST-EVENT FEEDBACK SURVEYS */}
      {activeMode === 'surveys' && (
        <>
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
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Submitted
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
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {poll.eventDate || 'Recent Event'}
                      </span>
                      <span>{poll.questions?.length || 0} Questions</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Interactive Poll Form or Feedback Submitted Confirmation */}
              <div className="lg:col-span-2">
                {activePoll ? (
                  activePoll.hasSubmitted ? (
                    <div className="bg-white rounded-3xl p-8 border border-emerald-200/90 shadow-xl text-center space-y-5 animate-fade-in">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>

                      <div className="space-y-2">
                        <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Feedback Submitted
                        </span>
                        <h3 className="text-2xl font-black text-slate-900 pt-1">
                          Thank you! Your feedback has been submitted.
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
                          Your response for <strong>{activePoll.eventName}</strong> ({activePoll.title}) has been safely recorded. You cannot submit feedback more than once for this event.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left space-y-2 text-xs text-slate-600 font-medium">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Event Survey Details
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>Date: {activePoll.eventDate || 'Completed Event'}</span>
                        </div>
                        {activePoll.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>Venue: {activePoll.venue}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1.5 text-[11px] text-emerald-700 font-bold border-t border-slate-200/80">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{activePoll.questions?.length || 0} Questions Completed</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-6 border border-purple-200 shadow-xl space-y-6">
                      <div className="border-b border-slate-100 pb-4 flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs font-black text-purple-600 uppercase tracking-widest">
                            Event Survey
                          </span>
                          <h3 className="text-xl font-black text-slate-900 mt-0.5">{activePoll.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {activePoll.eventName} • {activePoll.eventDate || 'Recent Event'}
                          </p>
                        </div>
                      </div>

                      {errorMsg && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                          {errorMsg}
                        </div>
                      )}

                      {successMsg && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                          {successMsg}
                        </div>
                      )}

                      <form onSubmit={handleSubmitResponse} className="space-y-6">
                        {activePoll.questions && activePoll.questions.map((q, idx) => (
                          <div key={q.id || idx} className="space-y-2 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-800">
                                Question {idx + 1}
                              </span>
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {q.questionType?.replace('_', ' ') || 'QUESTION'}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-slate-700">{q.questionText}</p>

                            {/* 1. RATING 1-5 */}
                            {q.questionType === 'RATING_1_5' && (
                              <div className="flex items-center gap-2 pt-1">
                                {[1, 2, 3, 4, 5].map((val) => (
                                  <button
                                    key={val}
                                    type="button"
                                    disabled={activePoll.hasSubmitted}
                                    onClick={() => handleAnswerChange(q.id, val)}
                                    className={`w-10 h-10 rounded-xl font-black text-xs transition flex items-center justify-center gap-1 cursor-pointer ${
                                      answers[q.id] === val
                                        ? 'bg-amber-400 text-amber-950 shadow-md scale-105'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300'
                                    }`}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${answers[q.id] === val ? 'fill-amber-950' : 'fill-none'}`} />
                                    <span>{val}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* 2. MULTIPLE CHOICE */}
                            {q.questionType === 'MULTIPLE_CHOICE' && (
                              <div className="space-y-2 pt-1">
                                {(q.options || ['Excellent', 'Good', 'Average', 'Poor']).map((opt) => (
                                  <label
                                    key={opt}
                                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                                      answers[q.id] === opt
                                        ? 'bg-purple-100 border-purple-500 text-purple-900 ring-2 ring-purple-400/20'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    <input
                                      type="radio"
                                      name={`q_${q.id}`}
                                      disabled={activePoll.hasSubmitted}
                                      checked={answers[q.id] === opt}
                                      onChange={() => handleAnswerChange(q.id, opt)}
                                      className="accent-purple-600"
                                    />
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* 3. YES / NO / MAYBE */}
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
                      </form>
                    </div>
                  )
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}