/* ==============================
   SETTINGS PAGE — settings.js
   ============================== */

let editStaffIdx = -1;

let staff = [
  { name:'Alex Thompson', email:'alex.t@evnt.com',   role:'Lead Coordinator' },
  { name:'Priya Nair',    email:'priya.n@evnt.com',  role:'Coordinator'      },
  { name:'Rahul Mehta',   email:'rahul.m@evnt.com',  role:'Tech Support'     },
  { name:'Sunita Rao',    email:'sunita.r@evnt.com', role:'Registration'     }
];

function renderStaff() {
  document.getElementById('staff-list').innerHTML = staff.map((s, i) => `
    <div class="staff-item">
      <div class="staff-left">
        <div class="staff-av">${s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
        <div><div class="staff-name">${s.name}</div><div class="staff-role">${s.email}</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="background:#f1f5f9;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500">${s.role}</span>
        <button style="padding:5px 9px;border-radius:7px;background:#f1f5f9;border:1px solid #e2e8f0;cursor:pointer;font-size:12px" onclick="openStaffModal(${i})"><i class="fa-solid fa-pen"></i></button>
        <button style="padding:5px 9px;border-radius:7px;background:transparent;border:1px solid #ef4444;color:#ef4444;cursor:pointer;font-size:12px" onclick="removeStaff(${i})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join('');
}

function openStaffModal(i = -1) {
  editStaffIdx = i;
  const s = i < 0 ? {} : staff[i];
  document.getElementById('staff-modal-title').textContent = i < 0 ? 'Add Team Member' : 'Edit Team Member';
  document.getElementById('sf-name').value  = s.name  || '';
  document.getElementById('sf-email').value = s.email || '';
  document.getElementById('sf-role').value  = s.role  || 'Coordinator';
  document.getElementById('staff-modal').classList.add('open');
}

function saveStaff() {
  const name = v('sf-name').trim();
  if (!name) { toast('Name required', '#ef4444'); return; }
  const obj = { name, email: v('sf-email'), role: v('sf-role') };
  if (editStaffIdx >= 0) staff[editStaffIdx] = obj; else staff.push(obj);
  closeModal('staff-modal');
  renderStaff();
  toast(editStaffIdx >= 0 ? 'Updated ✅' : 'Member added ✅');
}

function removeStaff(i) {
  if (!confirm('Remove this team member?')) return;
  staff.splice(i, 1);
  renderStaff();
  toast('Removed', '#ef4444');
}

function saveEventInfo() {
  const name = document.getElementById('ev-name').value.trim();
  if (!name) { toast('Event name required', '#ef4444'); return; }
  toast('Event info saved ✅');
}

function resetData()    { if (!confirm('Reset all event data? This cannot be undone.')) return; toast('Data reset (demo)', '#ef4444'); }
function archiveEvent() { if (!confirm('Archive this event?')) return; toast('Event archived (demo)', '#64748b'); }

initNav();
renderStaff();
