/* ==============================
   SESSIONS PAGE — sessions.js
   ============================== */

let editIdx  = -1;
let editType = 'active';

/* Track per-session state for poll & Q&A panels */
const sessionState = {}; // { [id]: { pollLaunched: bool, qaOpen: bool } }

function getState(id) {
  if (!sessionState[id]) sessionState[id] = { pollLaunched: false, qaOpen: false };
  return sessionState[id];
}

let activeSessions = [
  { id:1, title:'AI & Machine Learning in Indian Industries', speaker:'Prof. Rajesh Kumar', time:'11:00 AM – 12:30 PM', location:'Workshop Hall 1',    status:'live', attendees:234, capacity:250 },
  { id:2, title:'Cloud Solutions for Bharat: Best Practices', speaker:'Anjali Deshmukh',    time:'11:00 AM – 12:00 PM', location:'Conference Room B',  status:'live', attendees:189, capacity:200 },
  { id:3, title:'Cybersecurity in Digital India',             speaker:'Vikram Singh',        time:'1:00 PM – 2:00 PM',   location:'Main Auditorium',    status:'live', attendees:312, capacity:400 }
];

let upcomingSessions = [
  { id:4, title:'Building India Stack: Modern Web Dev', speaker:'Meera Patel',      time:'2:30 PM – 4:00 PM', location:'Workshop Hall 2',   capacity:300 },
  { id:5, title:'Data Science for Social Impact',       speaker:'Panel Discussion', time:'4:30 PM – 5:30 PM', location:'Conference Room C', capacity:200 },
  { id:6, title:'Blockchain & Crypto: India Perspective',speaker:'Arjun Malhotra', time:'2:30 PM – 3:30 PM', location:'Workshop Hall 1',   capacity:250 },
  { id:7, title:'Networking & Chai Session',             speaker:'All Participants',time:'6:00 PM – 8:00 PM', location:'Grand Foyer',       capacity:850 }
];

/* ---- POLL SAMPLE DATA ---- */
const pollQuestions = [
  'How would you rate this session so far?',
  'Which topic should we deep-dive next?',
  'Would you recommend this event to your colleagues?'
];

/* ---- RENDER ACTIVE ---- */
function renderActive() {
  const c = document.getElementById('active-container');
  if (!activeSessions.length) { c.innerHTML = '<p style="color:#64748b;padding:12px 0">No active sessions.</p>'; return; }
  c.innerHTML = activeSessions.map((s, i) => {
    const st = getState(s.id);
    const pollPanel = st.pollLaunched ? `
      <div class="panel-launched poll-panel">
        <span class="panel-icon"><i class="fa-solid fa-chart-bar"></i></span>
        <div class="panel-body">
          <strong>Poll Active — "${pollQuestions[s.id % pollQuestions.length]}"</strong>
          <p>Poll is now live for attendees in <em>${s.location}</em>. Results update in real-time on the Poll Activity page.</p>
        </div>
        <button class="panel-close" onclick="closePoll(${i})" title="Close poll">✕</button>
      </div>` : '';

    const qaPanel = st.qaOpen ? `
      <div class="panel-launched qa-panel">
        <span class="panel-icon"><i class="fa-solid fa-comments"></i></span>
        <div class="panel-body">
          <strong>Live Q&A Open for "${s.title}"</strong>
          <p>Attendees can now submit questions. Manage them from the <a href="liveQA.html" style="color:#059669;font-weight:600">Live Q&A</a> page.</p>
        </div>
        <button class="panel-close" onclick="closeQA(${i})" title="Close Q&A">✕</button>
      </div>` : '';

    return `<div class="s-card-session">
      <div class="s-header">
        <div class="s-left">
          <span class="badge live">Live</span>
          <span style="color:#64748b;font-size:13px">${s.attendees} attendees</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-edit" onclick="openModal(${i},'active')"><i class="fa-solid fa-pen"></i>Edit</button>
          <button class="btn btn-danger" onclick="deleteSession(${i},'active')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="s-title" style="font-size:18px;font-weight:600;margin:8px 0 6px">${s.title}</div>
      <div class="s-details">
        <div class="s-detail"><i class="fa-regular fa-user"></i>${s.speaker}</div>
        <div class="s-detail"><i class="fa-regular fa-clock"></i>${s.time}</div>
        <div class="s-detail"><i class="fa-solid fa-location-dot"></i>${s.location}</div>
      </div>
      <div class="stat-row">
        <div class="stat-box"><div class="stat-icon blue"><i class="fa-solid fa-users"></i></div><div><div style="font-size:12px;color:#64748b">Attendees</div><div style="font-weight:700;font-size:18px">${s.attendees}</div></div></div>
        <div class="stat-box"><div class="stat-icon green"><i class="fa-solid fa-check-circle"></i></div><div><div style="font-size:12px;color:#64748b">Capacity</div><div style="font-weight:700;font-size:18px">${s.capacity}</div></div></div>
        <div class="stat-box"><div class="stat-icon orange"><i class="fa-solid fa-percent"></i></div><div><div style="font-size:12px;color:#64748b">Fill Rate</div><div style="font-weight:700;font-size:18px">${Math.round(s.attendees / s.capacity * 100)}%</div></div></div>
      </div>
      <div class="s-actions">
        <button class="btn btn-pause" onclick="pauseSession(${i})"><i class="fa-solid fa-pause"></i>Pause</button>
        <button class="btn btn-end"   onclick="endSession(${i})"><i class="fa-regular fa-square"></i>End Session</button>
        <button class="btn btn-primary ${st.qaOpen ? 'btn-end' : ''}" onclick="openQA(${i})">
          <i class="fa-solid fa-comments"></i>${st.qaOpen ? 'Q&A Active' : 'Open Q&A'}
        </button>
        <button class="btn ${st.pollLaunched ? 'btn-end' : 'btn-orange'}" onclick="launchPoll(${i})">
          <i class="fa-solid fa-chart-bar"></i>${st.pollLaunched ? 'Poll Live' : 'Launch Poll'}
        </button>
      </div>
      ${pollPanel}
      ${qaPanel}
    </div>`;
  }).join('');
}

/* ---- RENDER UPCOMING ---- */
function renderUpcoming() {
  const c = document.getElementById('upcoming-container');
  if (!upcomingSessions.length) { c.innerHTML = '<p style="color:#64748b;padding:12px 0">No upcoming sessions.</p>'; return; }
  c.innerHTML = upcomingSessions.map((s, i) => `
    <div class="u-card">
      <span class="badge upcoming">Upcoming</span>
      <h2>${s.title}</h2>
      <p>${s.speaker} · ${s.time}</p>
      <div class="s-detail" style="color:#64748b;font-size:13px;margin-bottom:14px"><i class="fa-solid fa-location-dot"></i>${s.location}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="startSession(${i})"><i class="fa-solid fa-play"></i>Start Session</button>
        <button class="btn btn-edit"    onclick="openModal(${i},'upcoming')"><i class="fa-solid fa-pen"></i>Edit</button>
        <button class="btn btn-danger"  onclick="deleteSession(${i},'upcoming')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join('');
}

/* ---- SESSION ACTIONS ---- */
function launchPoll(i) {
  const s = activeSessions[i];
  const st = getState(s.id);
  if (st.pollLaunched) { toast('Poll already live for this session', '#f97316'); return; }
  st.pollLaunched = true;
  render();
  toast(`Poll launched for "${s.title.substring(0, 30)}..." ✅`, '#f97316');
}

function closePoll(i) {
  const s = activeSessions[i];
  getState(s.id).pollLaunched = false;
  render();
  toast('Poll closed', '#64748b');
}

function openQA(i) {
  const s = activeSessions[i];
  const st = getState(s.id);
  if (st.qaOpen) { toast('Q&A already open', '#f97316'); return; }
  st.qaOpen = true;
  render();
  toast(`Live Q&A opened for "${s.title.substring(0, 30)}..." ✅`, '#2563eb');
}

function closeQA(i) {
  const s = activeSessions[i];
  getState(s.id).qaOpen = false;
  render();
  toast('Q&A closed', '#64748b');
}

function startSession(i) {
  const s = upcomingSessions[i];
  s.attendees = 0; s.status = 'live';
  activeSessions.push(s);
  upcomingSessions.splice(i, 1);
  render();
  toast('Session started ✅', '#10b981');
}

function pauseSession(i) { toast('Session paused ⏸️', '#f97316'); }

function endSession(i) {
  if (!confirm('End this session?')) return;
  activeSessions.splice(i, 1);
  render();
  toast('Session ended', '#64748b');
}

function deleteSession(i, type) {
  if (!confirm('Delete this session?')) return;
  if (type === 'active') activeSessions.splice(i, 1); else upcomingSessions.splice(i, 1);
  render();
  toast('Deleted', '#ef4444');
}

/* ---- MODAL ---- */
function openModal(i, type) {
  editIdx = i; editType = type;
  const src = type === 'active' ? activeSessions : upcomingSessions;
  const s = i < 0 ? {} : src[i];
  document.getElementById('sm-title').textContent   = i < 0 ? 'Add Session' : 'Edit Session';
  document.getElementById('s-title').value          = s.title    || '';
  document.getElementById('s-speaker').value        = s.speaker  || '';
  document.getElementById('s-location').value       = s.location || '';
  document.getElementById('s-time').value           = s.time     || '';
  document.getElementById('s-capacity').value       = s.capacity || '';
  document.getElementById('s-status').value         = s.status   || type;
  document.getElementById('s-attendees').value      = s.attendees|| '';
  document.getElementById('session-modal').classList.add('open');
}

function saveSession() {
  const title = v('s-title').trim();
  if (!title) { toast('Title required', '#ef4444'); return; }
  const obj = {
    title, speaker: v('s-speaker'), location: v('s-location'),
    time: v('s-time'), capacity: parseInt(v('s-capacity')) || 0,
    status: v('s-status'), attendees: parseInt(v('s-attendees')) || 0,
    id: Date.now()
  };
  const src = editType === 'active' ? activeSessions : upcomingSessions;
  if (editIdx >= 0) src[editIdx] = obj; else src.push(obj);
  closeModal('session-modal');
  render();
  toast(editIdx >= 0 ? 'Session updated ✅' : 'Session added ✅');
}

function render() { renderActive(); renderUpcoming(); }

initNav();
render();