/* ==============================
   ATTENDANCE PAGE — attendance.js
   ============================== */

let editIdx = -1;

let attendees = [
  { name:'Aarav Sharma',  email:'aarav.s@email.com',  time:'8:45 AM',         sessions:3, status:'checked' },
  { name:'Priya Patel',   email:'priya.p@email.com',  time:'9:12 AM',         sessions:4, status:'checked' },
  { name:'Rohit Verma',   email:'rohit.v@email.com',  time:'8:30 AM',         sessions:5, status:'checked' },
  { name:'Diya Singh',    email:'diya.s@email.com',   time:'10:05 AM',        sessions:2, status:'checked' },
  { name:'Arjun Reddy',   email:'arjun.r@email.com',  time:'9:45 AM',         sessions:3, status:'checked' },
  { name:'Ananya Iyer',   email:'ananya.i@email.com', time:'Not checked in',  sessions:0, status:'pending' },
  { name:'Vivek Kumar',   email:'vivek.k@email.com',  time:'8:52 AM',         sessions:4, status:'checked' },
  { name:'Kavya Menon',   email:'kavya.m@email.com',  time:'9:30 AM',         sessions:2, status:'checked' },
  { name:'Aditya Joshi',  email:'aditya.j@email.com', time:'Not checked in',  sessions:0, status:'pending' },
  { name:'Neha Gupta',    email:'neha.g@email.com',   time:'10:15 AM',        sessions:1, status:'checked' }
];

const sessionData = [
  { name:'Inaugural Keynote', count:'542 / 600', percent:90, color:'orange' },
  { name:'AI Workshop',       count:'234 / 250', percent:94, color:'green'  },
  { name:'Cloud Solutions',   count:'189 / 200', percent:95, color:'green'  },
  { name:'Cybersecurity',     count:'312 / 400', percent:78, color:'orange' }
];

function renderStats() {
  const checked = attendees.filter(a => a.status === 'checked').length;
  const rate    = Math.round(checked / 850 * 100);
  document.getElementById('big-stats').innerHTML = `
    <div class="big-stat-card"><div><p class="big-stat-title">Total RSVP</p><h2 class="big-stat-value">850</h2></div><div class="big-stat-icon orange"><i class="fa-solid fa-users"></i></div></div>
    <div class="big-stat-card"><div><p class="big-stat-title">Checked In</p><h2 class="big-stat-value">${checked}</h2></div><div class="big-stat-icon green"><i class="fa-solid fa-user-check"></i></div></div>
    <div class="big-stat-card"><div><p class="big-stat-title">Check-in Rate</p><h2 class="big-stat-value">${rate}%</h2></div><div class="big-stat-icon blue"><i class="fa-solid fa-qrcode"></i></div></div>`;
}

function renderSessionAttendance() {
  document.getElementById('session-attendance').innerHTML =
    '<h2 style="font-size:16px;font-weight:600;margin-bottom:16px">Session-wise Attendance</h2>' +
    sessionData.map(s => `
      <div class="arow">
        <div class="arow-top">
          <span style="font-weight:500">${s.name}</span>
          <span style="color:#64748b">${s.count} (${s.percent}%)</span>
        </div>
        <div class="progress-bar"><div class="progress-fill ${s.color}" style="width:${s.percent}%"></div></div>
      </div>`).join('');
}

function renderTable() {
  const q  = document.getElementById('search-input').value.toLowerCase();
  const fs = document.getElementById('filter-status').value;
  const filtered = attendees.filter(a => {
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchS = !fs || a.status === fs;
    return matchQ && matchS;
  });
  document.getElementById('att-empty').style.display = filtered.length ? 'none' : 'block';
  document.getElementById('att-tbody').innerHTML = filtered.map(a => {
    const i = attendees.indexOf(a);
    return `<tr>
      <td style="font-weight:500">${a.name}</td>
      <td style="color:#64748b">${a.email}</td>
      <td>${a.time}</td>
      <td>${a.sessions}</td>
      <td><span class="status-badge ${a.status}">${a.status === 'checked' ? 'Checked In' : 'Pending'}</span></td>
      <td><div class="action-btns">
        ${a.status === 'pending'
          ? `<button class="tb-btn tb-checkin" onclick="checkIn(${i})"><i class="fa-solid fa-check"></i> Check In</button>`
          : `<button class="tb-btn tb-edit" onclick="uncheckIn(${i})">Undo</button>`}
        <button class="tb-btn tb-edit" onclick="openModal(${i})"><i class="fa-solid fa-pen"></i></button>
        <button class="tb-btn tb-del"  onclick="deleteAttendee(${i})"><i class="fa-solid fa-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('');
}

function checkIn(i) {
  attendees[i].status = 'checked';
  attendees[i].time   = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  render(); toast('Checked in ✅', '#10b981');
}
function uncheckIn(i) {
  attendees[i].status = 'pending';
  attendees[i].time   = 'Not checked in';
  render(); toast('Check-in undone', '#f97316');
}
function deleteAttendee(i) {
  if (!confirm('Remove attendee?')) return;
  attendees.splice(i, 1); render(); toast('Removed', '#ef4444');
}

function openModal(i) {
  editIdx = i;
  const a = i < 0 ? {} : attendees[i];
  document.getElementById('att-modal-title').textContent = i < 0 ? 'Add Attendee' : 'Edit Attendee';
  document.getElementById('at-name').value     = a.name     || '';
  document.getElementById('at-email').value    = a.email    || '';
  document.getElementById('at-time').value     = a.time     || '';
  document.getElementById('at-sessions').value = a.sessions || '';
  document.getElementById('at-status').value   = a.status   || 'pending';
  document.getElementById('att-modal').classList.add('open');
}

function saveAttendee() {
  const name = v('at-name').trim();
  if (!name) { toast('Name required', '#ef4444'); return; }
  const obj = { name, email: v('at-email'), time: v('at-time') || 'Not checked in', sessions: parseInt(v('at-sessions')) || 0, status: v('at-status') };
  if (editIdx >= 0) attendees[editIdx] = obj; else attendees.push(obj);
  closeModal('att-modal'); render(); toast(editIdx >= 0 ? 'Updated ✅' : 'Attendee added ✅');
}

function render() { renderStats(); renderSessionAttendance(); renderTable(); }

initNav();
render();
