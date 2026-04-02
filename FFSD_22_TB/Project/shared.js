/* ==============================
   WEVENTS — SHARED UTILITIES
   ============================== */

const ROUTES = {
  dashboard:    'dashboard.html',
  event_agenda: 'event_agenda.html',
  sessions:     'sessions.html',
  attendance:   'attendance.html',
  engagement:   'engagement.html',
  live:         'liveQA.html',
  poll:         'poll.html',
  reports:      'reports.html',
  settings:     'settings.html'
};

function initNav() {
  document.querySelectorAll('.menu li').forEach(li => {
    li.addEventListener('click', () => {
      if (ROUTES[li.dataset.page]) location.href = ROUTES[li.dataset.page];
    });
  });

  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  if (profileBtn) {
    profileBtn.onclick = () => profileDropdown.classList.toggle('show');
    document.addEventListener('click', e => {
      if (!e.target.closest('.profile-wrapper')) profileDropdown.classList.remove('show');
    });
  }

  // Logout — all pages
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.location.href = '../lp/index.html';
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
  });
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function v(id) {
  return document.getElementById(id).value;
}

function toast(msg, color = '#10b981') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = color;
  t.style.opacity = '1';
  t.style.transform = 'translateY(0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-20px)'; }, 2500);
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
