/* ==============================
   POLL PAGE — poll.js
   ============================== */

let polls = [
  { id:1, title:'Which cloud platform do you prefer?',           topic:'Cloud Computing', active:true,  labels:['AWS','Azure','Google Cloud','Others'],                  data:[68,52,28,8],   colors:['#f97316','#2563eb','#10b981','#64748b'] },
  { id:2, title:'Have you implemented AI in your organisation?', topic:'AI Workshop',     active:true,  labels:['Yes, extensively','Yes, limited','Planning to','No plans'], data:[45,89,52,12], colors:['#10b981','#2563eb','#f97316','#64748b'] },
  { id:3, title:'Which cybersecurity threat concerns you most?', topic:'Cybersecurity',   active:false, labels:['Phishing','Ransomware','Data Breach','Insider Threats'],  data:[78,55,43,22], colors:['#ef4444','#f97316','#2563eb','#8b5cf6'] }
];

let chartRefs = {};
let options   = ['', ''];

function renderStats() {
  const active      = polls.filter(p => p.active).length;
  const closed      = polls.length - active;
  const totalVotes  = polls.reduce((a, p) => a + p.data.reduce((b, v) => b + v, 0), 0);
  document.getElementById('poll-stats').innerHTML = `
    <div class="pstat"><p>Total Polls</p><h2>${polls.length}</h2></div>
    <div class="pstat"><p>Active</p><h2 style="color:#10b981">${active}</h2></div>
    <div class="pstat"><p>Closed</p><h2 style="color:#ef4444">${closed}</h2></div>
    <div class="pstat"><p>Total Votes</p><h2 style="color:#2563eb">${totalVotes}</h2></div>`;
}

function renderPolls() {
  const c = document.getElementById('poll-container');
  /* Destroy old chart instances before re-rendering */
  Object.values(chartRefs).forEach(ch => ch.destroy());
  chartRefs = {};

  if (!polls.length) { c.innerHTML = '<p style="color:#64748b;padding:20px">No polls yet.</p>'; return; }

  c.innerHTML = polls.map((poll, i) => {
    const total = poll.data.reduce((a, b) => a + b, 0);
    return `<div class="poll-card">
      <div class="poll-header">
        <div class="poll-left">
          <span class="poll-badge ${poll.active ? '' : 'closed'}">${poll.active ? 'Active' : 'Closed'}</span>
          <span style="color:#64748b;font-size:13px">${poll.topic}</span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn ${poll.active ? 'btn-danger' : 'btn-success'}" onclick="togglePoll(${i})">
            ${poll.active ? '<i class="fa-solid fa-stop"></i> Close' : '<i class="fa-solid fa-play"></i> Reopen'}
          </button>
          <button class="btn btn-danger" onclick="deletePoll(${i})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="poll-title">${poll.title}</div>
      <div class="poll-meta">${total} total votes</div>
      <!-- Fixed-height wrapper prevents chart from growing on scroll -->
      <div class="poll-chart-wrap"><canvas id="chart-${i}"></canvas></div>
      <div style="margin-top:12px">
        ${poll.labels.map((l, li) => {
          const pct = total ? ((poll.data[li] / total) * 100).toFixed(1) : 0;
          return `<div class="poll-option">
            <div class="poll-option-top"><span>${l}</span><span style="font-weight:600">${poll.data[li]} (${pct}%)</span></div>
            <div class="poll-bar"><div class="poll-fill" style="width:${pct}%;background:${poll.colors[li]}"></div></div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');

  /* Init charts after DOM is updated */
  polls.forEach((poll, i) => {
    const ctx = document.getElementById(`chart-${i}`);
    if (!ctx) return;
    chartRefs[i] = new Chart(ctx, {
      type: 'bar',
      data: { labels: poll.labels, datasets: [{ data: poll.data, backgroundColor: poll.colors, borderRadius: 6 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#eee' } } }
      }
    });
  });
}

/* ---- New poll options UI ---- */
function initOptions() { options = ['', '']; renderOptions(); }

function renderOptions() {
  document.getElementById('options-container').innerHTML = options.map((o, i) => `
    <div class="option-row">
      <input placeholder="Option ${i + 1}" value="${o}" oninput="options[${i}]=this.value"/>
      ${options.length > 2 ? `<button class="rm-opt" onclick="removeOption(${i})"><i class="fa-solid fa-xmark"></i></button>` : ''}
    </div>`).join('');
}

function addOption()       { if (options.length >= 6) { toast('Max 6 options', '#f97316'); return; } options.push(''); renderOptions(); }
function removeOption(i)   { options.splice(i, 1); renderOptions(); }

function createPoll() {
  const q = document.getElementById('np-question').value.trim();
  if (!q) { toast('Question required', '#ef4444'); return; }
  const opts = options.filter(o => o.trim());
  if (opts.length < 2) { toast('At least 2 options required', '#ef4444'); return; }
  const palette = ['#f97316','#2563eb','#10b981','#64748b','#8b5cf6','#ef4444'];
  polls.unshift({
    id:     Date.now(),
    title:  q,
    topic:  document.getElementById('np-topic').value || 'General',
    active: true,
    labels: opts,
    data:   opts.map(() => 0),
    colors: palette.slice(0, opts.length)
  });
  document.getElementById('np-question').value = '';
  document.getElementById('np-topic').value    = '';
  initOptions();
  render();
  toast('Poll launched ✅', '#10b981');
}

function togglePoll(i) {
  polls[i].active = !polls[i].active;
  render();
  toast(polls[i].active ? 'Poll reopened ✅' : 'Poll closed', '#64748b');
}
function deletePoll(i) {
  if (!confirm('Delete this poll?')) return;
  polls.splice(i, 1);
  render();
  toast('Deleted', '#ef4444');
}

function render() { renderStats(); renderPolls(); }

initNav();
initOptions();
render();
