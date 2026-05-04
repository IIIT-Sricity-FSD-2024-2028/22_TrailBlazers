/* ============================================================
   DASHBOARD JS — Super User Dashboard
   Fetches live data from backend API (http://localhost:3000)
   ============================================================ */
const API = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    // ── Account dropdown ──
    const headerUser = document.getElementById('header-user');
    const headerDropdown = document.getElementById('header-dropdown');
    headerUser.addEventListener('click', (e) => { e.stopPropagation(); headerDropdown.classList.toggle('active'); });
    document.addEventListener('click', () => headerDropdown.classList.remove('active'));
    document.getElementById('notif-bell').addEventListener('click', () => showToast('You have new notifications', 'info'));
    document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '../landing-page/index.html'; });

    // ── Fetch live data from backend ──
    let events = [], users = [];
    try {
        const [evRes, usRes] = await Promise.all([
            fetch(`${API}/events`,  { headers: { role: 'superuser' } }),
            fetch(`${API}/users`,   { headers: { role: 'superuser' } }),
        ]);
        events = evRes.ok ? await evRes.json() : [];
        users  = usRes.ok ? await usRes.json() : [];
    } catch(err) {
        showToast('Failed to connect to backend: ' + err.message, 'error');
    }

    // ── Map events to display format ──
    function mapEvent(e) {
        const statusMap = {
            upcoming: 'active', pending: 'queued', completed: 'completed',
            live: 'active', approved: 'active', rejected: 'inactive'
        };
        const mgr = e.managerName || 'System';
        const mAvatar = mgr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const colors = ['#7c3aed', '#2563eb', '#16a34a', '#ea580c', '#db2777'];
        const mColor = colors[mgr.length % colors.length];
        return {
            id: e.id, name: e.title,
            location: e.location || 'Virtual',
            client: e.clientName || e.domain || 'Internal',
            manager: mgr, managerAvatar: mAvatar, managerColor: mColor,
            status: statusMap[e.status] || e.status,
            attendees: e.attendees || (e.stats ? e.stats.rsvps : 0) || 0,
            date: e.date || ''
        };
    }

    const displayEvents = events.map(mapEvent);

    // ── Render events table ──
    const tbody = document.getElementById('recent-events-body');
    const filter = document.getElementById('events-filter');

    function renderEvents(filterVal) {
        const filtered = filterVal === 'all' ? displayEvents : displayEvents.filter(e => e.status === filterVal);
        if (!filtered.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:#94a3b8;">No events found.</td></tr>`;
            return;
        }
        tbody.innerHTML = filtered.map(ev => `
            <tr>
                <td>
                    <div class="user-cell-info">
                        <span class="user-cell-name">${ev.name}</span>
                        <span class="user-cell-sub">${ev.location}</span>
                    </div>
                </td>
                <td>${ev.client}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-cell-avatar" style="background:${ev.managerColor}">${ev.managerAvatar}</div>
                        <span>${ev.manager}</span>
                    </div>
                </td>
                <td><span class="badge badge-${ev.status || 'inactive'}"><span class="badge-dot"></span> ${cap(ev.status)}</span></td>
                <td><span style="display:flex;align-items:center;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> ${ev.attendees}</span></td>
                <td>${ev.date}</td>
            </tr>
        `).join('');
    }

    filter.addEventListener('change', () => renderEvents(filter.value));
    renderEvents('all');

    // ── Update stat cards from live data ──
    const activeCount    = users.filter(u => u.status !== 'inactive').length;
    const managerCount   = users.filter(u => u.role === 'eventmanager').length;
    const liveEvents     = events.filter(e => e.status === 'live' || e.status === 'upcoming' || e.status === 'approved').length;
    const pendingEvents  = events.filter(e => e.status === 'pending').length;

    const statMap = {
        'stat-total-users':   users.length,
        'stat-active-users':  activeCount,
        'stat-managers':      managerCount,
        'stat-live-events':   liveEvents,
        'stat-pending-events':pendingEvents,
        'stat-total-events':  events.length,
    };
    Object.entries(statMap).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });

    function cap(s) {
        if (!s) return 'Unknown';
        s = String(s).toLowerCase();
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    // ── Toast helper ──
    window.showToast = function(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = {
            success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error:   '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info:    '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        toast.innerHTML = `${icons[type] || icons.info} ${msg}`;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
    };
});