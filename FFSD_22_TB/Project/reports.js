/* ==============================
   REPORTS PAGE — reports.js
   ============================== */

let editIdx   = -1;
let savedNotes = [];

let reportData = [
  { session:'Inaugural Keynote', speaker:'Dr. Priya Sharma',  attendees:542, qas:42, poll:67, rating:'high' },
  { session:'AI & ML Workshop',  speaker:'Prof. Rajesh Kumar', attendees:234, qas:38, poll:85, rating:'high' },
  { session:'Cloud Solutions',   speaker:'Anjali Deshmukh',    attendees:189, qas:29, poll:79, rating:'med'  },
  { session:'Cybersecurity',     speaker:'Vikram Singh',       attendees:312, qas:47, poll:91, rating:'high' },
  { session:'Web Development',   speaker:'Meera Patel',        attendees:276, qas:25, poll:58, rating:'med'  }
];

function renderStats() {
  const totAtt  = reportData.reduce((a, r) => a + r.attendees, 0);
  const totQas  = reportData.reduce((a, r) => a + r.qas,       0);
  const avgPoll = reportData.length ? Math.round(reportData.reduce((a, r) => a + r.poll, 0) / reportData.length) : 0;
  document.getElementById('rep-stats').innerHTML = `
    <div class="rstat"><p>Total Attendees</p><h2>${totAtt}</h2></div>
    <div class="rstat"><p>Sessions Tracked</p><h2 style="color:#2563eb">${reportData.length}</h2></div>
    <div class="rstat"><p>Total Q&As</p><h2 style="color:#f97316">${totQas}</h2></div>
    <div class="rstat"><p>Avg Poll Participation</p><h2 style="color:#10b981">${avgPoll}%</h2></div>`;
}

function renderTable() {
  document.getElementById('report-tbody').innerHTML = reportData.map((r, i) => `
    <tr>
      <td style="font-weight:500">${r.session}</td>
      <td style="color:#64748b">${r.speaker}</td>
      <td>${r.attendees}</td>
      <td>${r.qas}</td>
      <td>${r.poll}%</td>
      <td><span class="status-badge ${r.rating}">${r.rating === 'high' ? 'High' : r.rating === 'med' ? 'Medium' : 'Low'}</span></td>
      <td><div style="display:flex;gap:6px">
        <button style="padding:5px 9px;border-radius:7px;background:#f1f5f9;border:1px solid #e2e8f0;cursor:pointer;font-size:12px" onclick="openModal(${i})"><i class="fa-solid fa-pen"></i></button>
        <button style="padding:5px 9px;border-radius:7px;background:transparent;border:1px solid #ef4444;color:#ef4444;cursor:pointer;font-size:12px" onclick="deleteRow(${i})"><i class="fa-solid fa-trash"></i></button>
      </div></td>
    </tr>`).join('');
}

function saveNote() {
  const t = document.getElementById('notes-area').value.trim();
  if (!t) { toast('Note is empty', '#ef4444'); return; }
  savedNotes.unshift({ text: t, time: new Date().toLocaleString('en-IN') });
  document.getElementById('notes-area').value = '';
  renderNotes();
  toast('Note saved ✅');
}

function renderNotes() {
  document.getElementById('saved-notes').innerHTML = savedNotes.map((n, i) => `
    <div style="background:white;border-radius:10px;padding:12px 16px;margin-bottom:8px;border:1px solid #e5e7eb;font-size:14px">
      <div style="color:#64748b;font-size:12px;margin-bottom:5px">${n.time}</div>
      <div>${n.text}</div>
      <button style="margin-top:8px;font-size:12px;padding:4px 10px;border-radius:7px;background:transparent;border:1px solid #ef4444;color:#ef4444;cursor:pointer" onclick="deleteNote(${i})"><i class="fa-solid fa-trash"></i> Remove</button>
    </div>`).join('');
}

function deleteNote(i) { savedNotes.splice(i, 1); renderNotes(); toast('Note removed', '#ef4444'); }

function openModal(i = -1) {
  editIdx = i;
  const r = i < 0 ? {} : reportData[i];
  document.getElementById('rm-title').textContent   = i < 0 ? 'Add Report Entry' : 'Edit Entry';
  document.getElementById('r-session').value        = r.session   || '';
  document.getElementById('r-speaker').value        = r.speaker   || '';
  document.getElementById('r-attendees').value      = r.attendees || '';
  document.getElementById('r-qas').value            = r.qas       || '';
  document.getElementById('r-poll').value           = r.poll      || '';
  document.getElementById('r-rating').value         = r.rating    || 'high';
  document.getElementById('rep-modal').classList.add('open');
}

function saveReport() {
  const session = v('r-session').trim();
  if (!session) { toast('Session name required', '#ef4444'); return; }
  const obj = { session, speaker: v('r-speaker'), attendees: parseInt(v('r-attendees')) || 0, qas: parseInt(v('r-qas')) || 0, poll: parseInt(v('r-poll')) || 0, rating: v('r-rating') };
  if (editIdx >= 0) reportData[editIdx] = obj; else reportData.push(obj);
  closeModal('rep-modal');
  render();
  toast(editIdx >= 0 ? 'Updated ✅' : 'Entry added ✅');
}

function deleteRow(i) {
  if (!confirm('Delete this entry?')) return;
  reportData.splice(i, 1);
  render();
  toast('Deleted', '#ef4444');
}

function exportReport(type) { toast('Exporting as ' + type + '... (demo)', '#2563eb'); }

function render() { renderStats(); renderTable(); renderNotes(); }

/* ---- Charts (fixed-height wrappers in CSS) ---- */
function initCharts() {
  new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: { labels:['Keynote','AI','Cloud','Cyber','Web'], datasets:[{ data:[542,234,189,312,276], backgroundColor:'#f97316', borderRadius:6 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:'#eee' } } } }
  });
  new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: { labels:['9AM','10AM','11AM','12PM','1PM','2PM','3PM'], datasets:[{ data:[50,180,320,290,180,250,210], borderColor:'#2563eb', backgroundColor:'rgba(37,99,235,.1)', tension:.4, fill:true }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:'#eee' } } } }
  });
  new Chart(document.getElementById('pieChart'), {
    type: 'pie',
    data: {
      labels: ['Technology','Security','AI','Platforms'],
      datasets:[{ data:[35,25,25,15], backgroundColor:['#f97316','#2563eb','#10b981','#8b5cf6'] }]
    },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }
  });
}

initNav();
render();
initCharts();
