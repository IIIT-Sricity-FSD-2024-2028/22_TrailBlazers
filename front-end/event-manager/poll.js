/* ==============================
   POLL PAGE — poll.js
   All data fetched from/persisted to the NestJS backend (polls.json).
   ============================== */

const API_BASE = 'http://localhost:3000';

let pollsData  = [];   // fetched from backend
let chartRefs  = {};
let options    = ['', ''];

// ── Get the logged-in event manager ──────────────────────────────────────────
function getManager() {
  try { return JSON.parse(localStorage.getItem('wevents_user')) || {}; } catch { return {}; }
}

// ── Get the active event ID from localStorage/sessionStorage ─────────────────
function getEventId() {
  return sessionStorage.getItem('active_event_id') ||
         localStorage.getItem('active_event_id')   || '';
}

// ── Fetch polls from backend ──────────────────────────────────────────────────
async function loadPolls() {
  try {
    const eventId = getEventId();
    const url = eventId ? `${API_BASE}/polls?eventId=${eventId}` : `${API_BASE}/polls`;
    const res = await fetch(url, { headers: { role: 'eventmanager' } });
    pollsData = await res.json();
  } catch (err) {
    console.error('Failed to load polls:', err);
    pollsData = [];
  }
}

function renderStats() {
  const active     = pollsData.filter(p => p.status === 'open').length;
  const closed     = pollsData.length - active;
  const totalVotes = pollsData.reduce((a, p) =>
    a + (p.options || []).reduce((b, o) => b + (o.votes || 0), 0), 0);
  document.getElementById('poll-stats').innerHTML = `
    <div class="pstat"><p>Total Polls</p><h2>${pollsData.length}</h2></div>
    <div class="pstat"><p>Active</p><h2 style="color:#10b981">${active}</h2></div>
    <div class="pstat"><p>Closed</p><h2 style="color:#ef4444">${closed}</h2></div>
    <div class="pstat"><p>Total Votes</p><h2 style="color:#2563eb">${totalVotes}</h2></div>`;
}

function renderPolls() {
  const c = document.getElementById('poll-container');
  Object.values(chartRefs).forEach(ch => ch.destroy());
  chartRefs = {};

  if (!pollsData.length) {
    c.innerHTML = '<p style="color:#64748b;padding:20px">No polls yet. Create one below!</p>';
    return;
  }

  const palette = ['#f97316','#2563eb','#10b981','#64748b','#8b5cf6','#ef4444'];

  c.innerHTML = pollsData.map((poll, i) => {
    const opts  = poll.options || [];
    const total = opts.reduce((a, o) => a + (o.votes || 0), 0);
    const isOpen = poll.status === 'open';

    return `<div class="poll-card">
      <div class="poll-header">
        <div class="poll-left">
          <span class="poll-badge ${isOpen ? '' : 'closed'}">${isOpen ? 'Active' : 'Closed'}</span>
          <span style="color:#64748b;font-size:13px">${poll.eventId || 'General'}</span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn ${isOpen ? 'btn-danger' : 'btn-success'}" onclick="togglePoll('${poll.id}', ${i})">
            ${isOpen ? '<i class="fa-solid fa-stop"></i> Close' : '<i class="fa-solid fa-play"></i> Reopen'}
          </button>
          <button class="btn btn-danger" onclick="deletePoll('${poll.id}', ${i})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="poll-title">${poll.question}</div>
      <div class="poll-meta">${total} total votes</div>
      <div class="poll-chart-wrap"><canvas id="chart-${i}"></canvas></div>
      <div style="margin-top:12px">
        ${opts.map((o, li) => {
          const pct = total ? ((o.votes / total) * 100).toFixed(1) : 0;
          return `<div class="poll-option">
            <div class="poll-option-top"><span>${o.label}</span><span style="font-weight:600">${o.votes} (${pct}%)</span></div>
            <div class="poll-bar"><div class="poll-fill" style="width:${pct}%;background:${palette[li] || '#94a3b8'}"></div></div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');

  pollsData.forEach((poll, i) => {
    const ctx = document.getElementById(`chart-${i}`);
    if (!ctx) return;
    const opts = poll.options || [];
    chartRefs[i] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: opts.map(o => o.label),
        datasets: [{ data: opts.map(o => o.votes || 0), backgroundColor: opts.map((_, li) => palette[li] || '#94a3b8'), borderRadius: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#eee' } } }
      }
    });
  });
}

/* ── New poll options UI ──────────────────────────────────────────────────── */
function initOptions() { options = ['', '']; renderOptions(); }

function renderOptions() {
  document.getElementById('options-container').innerHTML = options.map((o, i) => `
    <div class="option-row">
      <input placeholder="Option ${i + 1}" value="${o}" oninput="options[${i}]=this.value"/>
      ${options.length > 2 ? `<button class="rm-opt" onclick="removeOption(${i})"><i class="fa-solid fa-xmark"></i></button>` : ''}
    </div>`).join('');
}

function addOption()     { if (options.length >= 6) { toast('Max 6 options', '#f97316'); return; } options.push(''); renderOptions(); }
function removeOption(i) { options.splice(i, 1); renderOptions(); }

async function createPoll() {
  const q    = document.getElementById('np-question').value.trim();
  if (!q) { toast('Question required', '#ef4444'); return; }
  const opts = options.filter(o => o.trim());
  if (opts.length < 2) { toast('At least 2 options required', '#ef4444'); return; }

  const manager = getManager();
  const eventId = getEventId();

  try {
    const res = await fetch(`${API_BASE}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', role: 'eventmanager' },
      body: JSON.stringify({
        eventId:   eventId || undefined,
        question:  q,
        options:   opts,
        createdBy: manager.id || 'u5'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast(err.message || 'Failed to create poll', '#ef4444');
      return;
    }
    document.getElementById('np-question').value = '';
    document.getElementById('np-topic').value    = '';
    initOptions();
    await render();
    toast('Poll launched ✅', '#10b981');
  } catch (err) {
    toast('Backend not reachable: ' + err.message, '#ef4444');
  }
}

async function togglePoll(pollId, idx) {
  const poll = pollsData[idx];
  const isOpen = poll.status === 'open';
  try {
    if (isOpen) {
      await fetch(`${API_BASE}/polls/${pollId}/close`, { method: 'PATCH', headers: { role: 'eventmanager' } });
    } else {
      // Reopen: update status back to open
      await fetch(`${API_BASE}/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', role: 'eventmanager' },
        body: JSON.stringify({ status: 'open' })
      });
    }
    await render();
    toast(isOpen ? 'Poll closed' : 'Poll reopened ✅', '#64748b');
  } catch (err) {
    toast('Failed: ' + err.message, '#ef4444');
  }
}

async function deletePoll(pollId, idx) {
  if (!confirm('Delete this poll?')) return;
  try {
    await fetch(`${API_BASE}/polls/${pollId}`, { method: 'DELETE', headers: { role: 'eventmanager' } });
    await render();
    toast('Deleted', '#ef4444');
  } catch (err) {
    toast('Failed to delete: ' + err.message, '#ef4444');
  }
}

async function render() {
  await loadPolls();
  renderStats();
  renderPolls();
}

// ── Init ──────────────────────────────────────────────────────────────────────
initNav();
initOptions();
render();