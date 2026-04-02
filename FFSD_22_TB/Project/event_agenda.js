/* ==============================
   EVENT AGENDA PAGE — event_agenda.js
   ============================== */

let editIdx = -1;
let filterState = 'all';

let sessions = [
  { status:'completed', title:'Inaugural Keynote: Future of Indian Tech Ecosystem', speaker:'Dr. Priya Sharma',  time:'9:00 AM – 10:30 AM', location:'Main Auditorium',    attendees:542 },
  { status:'live',      title:'AI & Machine Learning in Indian Industries',          speaker:'Prof. Rajesh Kumar', time:'11:00 AM – 12:30 PM',location:'Workshop Hall 1',    attendees:234 },
  { status:'live',      title:'Cloud Solutions for Bharat: Best Practices',          speaker:'Anjali Deshmukh',    time:'11:00 AM – 12:00 PM',location:'Conference Room B',  attendees:189 },
  { status:'live',      title:'Cybersecurity in Digital India',                      speaker:'Vikram Singh',       time:'1:00 PM – 2:00 PM',  location:'Main Auditorium',    attendees:312 },
  { status:'upcoming',  title:'Building India Stack: Modern Web Development',        speaker:'Meera Patel',        time:'2:30 PM – 4:00 PM',  location:'Workshop Hall 2',    attendees:0   },
  { status:'upcoming',  title:'Data Science for Social Impact in India',             speaker:'Panel Discussion',   time:'4:30 PM – 5:30 PM',  location:'Conference Room C',  attendees:0   },
  { status:'upcoming',  title:'Blockchain & Cryptocurrency: India Perspective',      speaker:'Arjun Malhotra',     time:'2:30 PM – 3:30 PM',  location:'Workshop Hall 1',    attendees:0   },
  { status:'upcoming',  title:'Networking & Chai Session',                           speaker:'All Participants',   time:'6:00 PM – 8:00 PM',  location:'Grand Foyer',        attendees:0   }
];

function setFilter(f, btn) {
  filterState = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function renderSessions() {
  const filtered = filterState === 'all' ? sessions : sessions.filter(s => s.status === filterState);
  const c = document.getElementById('sessions-container');
  if (!filtered.length) { c.innerHTML = '<p style="color:#64748b;padding:16px 0">No sessions found.</p>'; return; }

  c.innerHTML = filtered.map(s => {
    const i = sessions.indexOf(s);

    /* Live sessions: Pause + End only.
       Upcoming sessions: Adjust Time only — Start Session removed as requested.
       Completed sessions: no action buttons. */
    const actions = s.status === 'live'
      ? `<button class="btn btn-pause"><i class="fa-solid fa-pause"></i>Pause</button>
         <button class="btn btn-end" onclick="endSession(${i})"><i class="fa-regular fa-square"></i>End Session</button>`
      : s.status === 'upcoming'
      ? `<button class="btn btn-edit">Adjust Time</button>`
      : '';

    return `<div class="s-card ${s.status}">
      <div class="ch">
        <div class="cl">
          <span class="badge ${s.status}">${cap(s.status)}</span>
          ${s.status === 'live' ? `<span style="color:#64748b;font-size:13px">${s.attendees} attendees</span>` : ''}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-edit" onclick="openModal(${i})"><i class="fa-solid fa-pen"></i>Edit</button>
          <button class="btn btn-danger" onclick="deleteSession(${i})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="s-title">${s.title}</div>
      <div class="cd">
        <span><i class="fa-regular fa-user"></i>${s.speaker}</span>
        <span><i class="fa-regular fa-clock"></i>${s.time}</span>
        <span><i class="fa-solid fa-location-dot"></i>${s.location}</span>
      </div>
      ${actions ? `<div class="ca">${actions}</div>` : ''}
    </div>`;
  }).join('');
}

function endSession(i)    { sessions[i].status = 'completed'; render(); toast('Session ended'); }
function deleteSession(i) { if (!confirm('Delete?')) return; sessions.splice(i, 1); render(); toast('Deleted', '#ef4444'); }

function openModal(i) {
  editIdx = i;
  const s = i < 0 ? {} : sessions[i];
  document.getElementById('am-title').textContent = i < 0 ? 'Add Session' : 'Edit Session';
  document.getElementById('a-title').value     = s.title     || '';
  document.getElementById('a-speaker').value   = s.speaker   || '';
  document.getElementById('a-location').value  = s.location  || '';
  document.getElementById('a-time').value      = s.time      || '';
  document.getElementById('a-status').value    = s.status    || 'upcoming';
  document.getElementById('a-attendees').value = s.attendees || '';
  document.getElementById('agenda-modal').classList.add('open');
}

function saveAgenda() {
  const title = v('a-title').trim();
  if (!title) { toast('Title required', '#ef4444'); return; }
  const obj = { title, speaker: v('a-speaker'), location: v('a-location'), time: v('a-time'), status: v('a-status'), attendees: parseInt(v('a-attendees')) || 0 };
  if (editIdx >= 0) sessions[editIdx] = obj; else sessions.push(obj);
  closeModal('agenda-modal');
  render();
  toast(editIdx >= 0 ? 'Updated ✅' : 'Added ✅');
}

function render() { renderSessions(); }

initNav();
render();
