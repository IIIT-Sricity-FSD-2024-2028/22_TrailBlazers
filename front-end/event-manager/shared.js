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

/* ── Inject the full-width top header ── */
function injectHeader() {
  // Only inject on event pages (pages that have a sidebar with .menu)
  if (!document.querySelector('.menu')) return;

  // Get real logged-in user
  const _mgr = (() => { try { return JSON.parse(localStorage.getItem('wevents_user')) || {}; } catch { return {}; } })();
  const _mgrName     = _mgr.name    || 'Event Manager';
  const _mgrEmail    = _mgr.email   || '';
  const _mgrInitials = _mgrName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const _mgrRole     = _mgr.role === 'eventmanager' ? 'Event Manager' : (_mgr.role || 'Event Manager');

  const header = document.createElement('header');
  header.id = 'site-header';
  header.innerHTML = `
    <div class="sh-left">
      <div class="sh-logo-icon"><i class="fa-regular fa-calendar"></i></div>
      <div class="sh-title-group">
        <span class="sh-title">Wevents.com</span>
        <span class="sh-subtitle">Event Manager</span>
      </div>
    </div>
    <div class="sh-right">
      <div class="sh-status">
        <span class="sh-status-dot"></span> All systems operational
      </div>
      <div class="sh-notif" id="sh-notif-bell">
        <i class="fa-regular fa-bell"></i>
        <span class="sh-badge" id="sh-badge-count" style="display:none">0</span>
        <div class="sh-notif-dropdown" id="sh-notif-dropdown">
          <div class="sh-dd-head">
            <span class="sh-dd-title">Notifications</span>
            <span style="font-size:11px;opacity:0.8;cursor:pointer" id="mark-all-read">Mark all as read</span>
          </div>
          <div class="sh-dd-body" id="sh-notif-list">
             <div class="sh-notif-empty">No new notifications</div>
          </div>
        </div>
      </div>
      <div class="sh-user-wrap">
        <div class="sh-user" id="sh-profileBtn">
          <div class="sh-user-info">
            <span class="sh-user-name">${_mgrName}</span>
            <span class="sh-user-role">${_mgrRole}</span>
          </div>
          <div class="sh-avatar">${_mgrInitials}</div>
          <i class="fa-solid fa-chevron-down sh-chevron"></i>
        </div>
        <div class="sh-dropdown" id="sh-profileDropdown">
          <div class="sh-dd-head">
            <div>
              <div class="sh-dd-name">${_mgrName}</div>
              <div class="sh-dd-role">${_mgrRole}</div>
            </div>
            <div class="sh-avatar sm">${_mgrInitials}</div>
          </div>
          <div class="sh-dd-body">
            <div class="sh-dd-row"><i class="fa-regular fa-user"></i> ${_mgrName}</div>
            <div class="sh-dd-row"><i class="fa-regular fa-envelope"></i> ${_mgrEmail}</div>
            <div class="sh-dd-row"><i class="fa-regular fa-shield"></i> ${_mgrRole}</div>
          </div>
          <div class="sh-dd-foot">
            <button class="logout-btn sh-logout">
              <i class="fa-solid fa-right-from-bracket"></i> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Issue Details Modal Markup
  const issueModal = document.createElement('div');
  issueModal.className = 'issue-modal-overlay';
  issueModal.id = 'sh-issue-modal';
  issueModal.innerHTML = `
    <div class="issue-modal-card">
        <button class="issue-modal-close" id="sh-issue-close"><i class="fa-solid fa-times"></i></button>
        <div class="issue-modal-header" id="sh-issue-title">Issue Title</div>
        
        <div class="issue-meta-row">
            <div>
                <span class="issue-meta-label">Priority Level</span>
                <span class="sh-notif-badge" id="sh-issue-priority">High</span>
            </div>
            <div>
                <span class="issue-meta-label">Reported By</span>
                <span class="issue-meta-value" id="sh-issue-source">On-Site Coordinator</span>
            </div>
        </div>
        
        <span class="issue-meta-label">Description</span>
        <div class="issue-desc" id="sh-issue-desc">Description goes here...</div>
        
        <div class="issue-actions">
            <button class="issue-btn-dash" onclick="window.location.href='dashboard.html'">Go to Event Dashboard</button>
        </div>
    </div>
  `;

  // Insert header before the .one-unit wrapper
  const wrapper = document.querySelector('.one-unit') || document.body.firstChild;
  document.body.insertBefore(header, wrapper || document.body.firstChild);
  document.body.appendChild(issueModal); // append to body

  document.getElementById('sh-issue-close').addEventListener('click', () => {
      document.getElementById('sh-issue-modal').classList.remove('active');
  });

  // Hide the old broken navbars inside .main
  document.body.classList.add('hide-old-nav');

  // --- Notifications Logic ---
  window.openIssueModal = function(id) {
      let notifs = JSON.parse(localStorage.getItem('wevents_em_notifications')) || [];
      const notif = notifs.find(n => n.id === id);
      if (!notif) return;
      
      // Mark as read
      notif.read = true;
      localStorage.setItem('wevents_em_notifications', JSON.stringify(notifs));
      renderNotifications();

      // Populate modal
      document.getElementById('sh-issue-title').textContent = notif.title;
      const priorityEl = document.getElementById('sh-issue-priority');
      priorityEl.textContent = notif.priority;
      priorityEl.className = `sh-notif-badge badge-${notif.priority}`;
      document.getElementById('sh-issue-source').textContent = notif.source;
      document.getElementById('sh-issue-desc').textContent = notif.description || 'No description provided.';
      
      // Close dropdown and show modal
      document.getElementById('sh-notif-bell').classList.remove('open');
      document.getElementById('sh-issue-modal').classList.add('active');
  };

  function renderNotifications() {
      const listEl = document.getElementById('sh-notif-list');
      const badgeEl = document.getElementById('sh-badge-count');
      
      let notifs = JSON.parse(localStorage.getItem('wevents_em_notifications')) || [];
      
      const unreadCount = notifs.filter(n => !n.read).length;
      if (unreadCount > 0) {
          badgeEl.textContent = unreadCount;
          badgeEl.style.display = 'flex';
      } else {
          badgeEl.style.display = 'none';
      }

      if (notifs.length === 0) {
          listEl.innerHTML = '<div class="sh-notif-empty">No new notifications</div>';
          return;
      }

      listEl.innerHTML = notifs.map(n => `
          <div class="sh-notif-item ${!n.read ? 'unread' : ''}" style="cursor: pointer;" onclick="openIssueModal('${n.id}')">
              <div class="sh-notif-title">${n.title}</div>
              <div class="sh-notif-meta">
                  <span>From: ${n.source}</span>
                  <span class="sh-notif-badge badge-${n.priority}">${n.priority}</span>
              </div>
              <div style="font-size:10px; color:#94a3b8; margin-top:2px;">
                 ${new Date(n.timestamp).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
              </div>
          </div>
      `).join('');
  }

  // Initialize notifications render
  renderNotifications();
  
  // Listen for storage changes to update tabs instantly
  window.addEventListener('storage', (e) => {
      if (e.key === 'wevents_em_notifications') {
          renderNotifications();
      }
  });

  // Notifications dropdown interactions
  const notifBell = document.getElementById('sh-notif-bell');
  const notifDropdown = document.getElementById('sh-notif-dropdown');
  
  notifBell.addEventListener('click', (e) => {
      e.stopPropagation();
      notifBell.classList.toggle('open');
      const profileDrop = document.getElementById('sh-profileDropdown');
      if (profileDrop) profileDrop.classList.remove('open'); // close other dd
  });

  document.getElementById('mark-all-read').addEventListener('click', (e) => {
      e.stopPropagation();
      let notifs = JSON.parse(localStorage.getItem('wevents_em_notifications')) || [];
      notifs.forEach(n => n.read = true);
      localStorage.setItem('wevents_em_notifications', JSON.stringify(notifs));
      renderNotifications();
  });

  // Wire new header profile dropdown
  const btn  = document.getElementById('sh-profileBtn');
  const drop = document.getElementById('sh-profileDropdown');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    drop.classList.toggle('open');
    notifBell.classList.remove('open'); // close notif dd
  });
  
  document.addEventListener('click', e => {
    if (!e.target.closest('.sh-user-wrap') && drop) drop.classList.remove('open');
    if (!e.target.closest('.sh-notif') && notifBell) notifBell.classList.remove('open');
  });
}

function initNav() {
  // Inject full-width header first
  injectHeader();

  document.querySelectorAll('.menu li').forEach(li => {
    li.addEventListener('click', () => {
      if (ROUTES[li.dataset.page]) location.href = ROUTES[li.dataset.page];
    });
  });

  // Wire existing profile btn if present (home.html uses it)
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  if (profileBtn && profileDropdown) {
    profileBtn.onclick = () => profileDropdown.classList.toggle('show');
    document.addEventListener('click', e => {
      if (!e.target.closest('.profile-wrapper')) profileDropdown.classList.remove('show');
    });
  }

  // Logout — covers both old logout-btn and new sh-logout
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('wevents_user');
      window.location.href = '../landing-page/index.html';
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