/* ============================================================
   AUDIT LOGS JS — Super User Portal
   Derives real audit log entries from backend API data:
   - Events created/updated/rejected/approved → EVENT_CREATED, EVENT_APPROVED, etc.
   - Users created → USER_CREATED
   - RSVPs → RSVP_CREATED
   - Check-ins → CHECKIN_CREATED
   - Sorted newest-first by createdAt / updatedAt
   ============================================================ */
const API = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('header-user').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('header-dropdown').classList.toggle('active'); });
    document.addEventListener('click', () => document.getElementById('header-dropdown').classList.remove('active'));
    document.getElementById('notif-bell').addEventListener('click', () => showToast('You have new notifications', 'info'));
    document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '../landing-page/index.html'; });

    // ── Fetch all relevant data from backend ──
    let logs = [];

    async function fetchAll() {
        let events = [], users = [], rsvps = [], checkins = [], feedback = [], pollResponses = [];

        const safe = async (url) => {
            try {
                const r = await fetch(url, { headers: { role: 'superuser' } });
                return r.ok ? r.json() : [];
            } catch { return []; }
        };

        [events, users, rsvps, checkins, feedback, pollResponses] = await Promise.all([
            safe(`${API}/events`),
            safe(`${API}/users`),
            safe(`${API}/rsvps`),
            safe(`${API}/check-ins`),
            safe(`${API}/feedback`),
            safe(`${API}/poll-responses`),
        ]);

        return { events, users, rsvps, checkins, feedback, pollResponses };
    }

    // ── Map an avatar color from a name ──
    function avatarColor(name) {
        const colors = ['#f97316','#7c3aed','#2563eb','#16a34a','#ea580c','#0891b2','#dc2626','#9333ea'];
        let hash = 0;
        for (let c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

    function initials(name) {
        return (name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    }

    function fmtTime(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        return d.toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // ── Derive audit log entries from backend data ──
    function buildLogs({ events, users, rsvps, checkins, feedback, pollResponses }) {
        const entries = [];

        // ── EVENTS ──
        events.forEach(e => {
            const actor = e.clientName || e.managerName || 'Unknown';
            const role  = e.clientName ? 'Client' : (e.managerName ? 'Manager' : 'System');

            // Created log
            entries.push({
                action: 'EVENT_CREATED',
                actionIcon: '📅',
                by: actor,
                byAvatar: initials(actor),
                byColor: avatarColor(actor),
                entity: `${e.title} (Event #${e.id})`,
                severity: 'Info',
                ip: 'Backend',
                time: e.createdAt,
                role,
            });

            // Status-specific logs based on current status
            if (e.status === 'approved') {
                entries.push({
                    action: 'EVENT_APPROVED',
                    actionIcon: '✅',
                    by: 'Super Admin',
                    byAvatar: 'SA',
                    byColor: '#16a34a',
                    entity: `${e.title} (Event #${e.id})`,
                    severity: 'Info',
                    ip: 'Backend',
                    time: e.updatedAt,
                    role: 'Superuser',
                });
            }
            if (e.status === 'rejected') {
                entries.push({
                    action: 'EVENT_REJECTED',
                    actionIcon: '❌',
                    by: 'Super Admin',
                    byAvatar: 'SA',
                    byColor: '#dc2626',
                    entity: `${e.title} (Event #${e.id})`,
                    severity: 'Critical',
                    ip: 'Backend',
                    time: e.updatedAt,
                    role: 'Superuser',
                });
            }
            if (e.status === 'live') {
                entries.push({
                    action: 'EVENT_LIVE',
                    actionIcon: '🔴',
                    by: e.managerName || 'System',
                    byAvatar: initials(e.managerName || 'System'),
                    byColor: '#ef4444',
                    entity: `${e.title} (Event #${e.id})`,
                    severity: 'Warning',
                    ip: 'Backend',
                    time: e.updatedAt,
                    role: 'Manager',
                });
            }
            if (e.status === 'completed') {
                entries.push({
                    action: 'EVENT_COMPLETED',
                    actionIcon: '🏁',
                    by: e.managerName || 'System',
                    byAvatar: initials(e.managerName || 'System'),
                    byColor: '#64748b',
                    entity: `${e.title} (Event #${e.id})`,
                    severity: 'Info',
                    ip: 'Backend',
                    time: e.updatedAt,
                    role: 'Manager',
                });
            }
        });

        // ── USERS CREATED ──
        users.forEach(u => {
            entries.push({
                action: 'USER_CREATED',
                actionIcon: '👤',
                by: 'Super Admin',
                byAvatar: 'SA',
                byColor: '#f97316',
                entity: `${u.name} (${u.role})`,
                severity: 'Info',
                ip: 'Backend',
                time: u.createdAt,
                role: 'Superuser',
            });
        });

        // ── RSVPs ──
        rsvps.forEach(r => {
            const name = r.attendeeName || r.attendeeEmail || 'Attendee';
            entries.push({
                action: 'RSVP_CREATED',
                actionIcon: '📋',
                by: name,
                byAvatar: initials(name),
                byColor: avatarColor(name),
                entity: `RSVP for Event #${r.eventId}`,
                severity: 'Info',
                ip: 'Backend',
                time: r.createdAt,
                role: 'Attendee',
            });
        });

        // ── CHECK-INS ──
        checkins.forEach(c => {
            const name = c.attendeeName || c.attendeeEmail || 'Attendee';
            entries.push({
                action: 'CHECKIN_CREATED',
                actionIcon: '✅',
                by: name,
                byAvatar: initials(name),
                byColor: avatarColor(name),
                entity: `Check-in for Event #${c.eventId} — ${c.status}`,
                severity: c.status === 'checked-in' ? 'Info' : 'Warning',
                ip: 'Backend',
                time: c.createdAt || c.checkInTime,
                role: 'OSC',
            });
        });

        // ── FEEDBACK ──
        feedback.forEach(f => {
            const name = f.attendeeName || 'Attendee';
            entries.push({
                action: 'FEEDBACK_SUBMITTED',
                actionIcon: '⭐',
                by: name,
                byAvatar: initials(name),
                byColor: avatarColor(name),
                entity: `Feedback for Event #${f.eventId} — Rating: ${f.rating}/5`,
                severity: 'Info',
                ip: 'Backend',
                time: f.createdAt,
                role: 'Attendee',
            });
        });

        // ── POLL RESPONSES ──
        pollResponses.forEach(pr => {
            const name = pr.attendeeName || 'Attendee';
            entries.push({
                action: 'POLL_RESPONDED',
                actionIcon: '📊',
                by: name,
                byAvatar: initials(name),
                byColor: avatarColor(name),
                entity: `Poll Response — Event #${pr.eventId}`,
                severity: 'Info',
                ip: 'Backend',
                time: pr.createdAt,
                role: 'Attendee',
            });
        });

        // Sort newest-first by time
        entries.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

        // Format times for display
        return entries.map(e => ({ ...e, time: fmtTime(e.time) }));
    }

    async function loadLogs() {
        const data = await fetchAll();
        // Backend-derived entries from JSON files
        const backendLogs = buildLogs(data);
        // Session-based entries from portal CRUD actions (USER_CREATED, EVENT_APPROVED, etc.)
        const sessionLogs = JSON.parse(sessionStorage.getItem('su_audit_log') || '[]');
        // Merge: session logs first (most recent portal ops), then backend
        logs = [...sessionLogs, ...backendLogs];
        renderStats();
        render();
    }

    // ── Render ──
    const tbody          = document.getElementById('logs-tbody');
    const searchInput    = document.getElementById('log-search');
    const actionFilter   = document.getElementById('action-filter');
    const severityFilter = document.getElementById('severity-filter');

    const severityBadge  = { Critical: 'badge-critical', Warning: 'badge-warning', Info: 'badge-info' };

    let currentPage = 1;
    const itemsPerPage = 10;

    function renderPaginationButtons(totalPages) {
        const pageNumbers = document.getElementById('page-numbers');
        document.getElementById('prev-page').disabled = currentPage === 1;
        document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
        let html = '';
        let startPage = Math.max(1, currentPage - 2);
        let endPage   = Math.min(totalPages, currentPage + 2);
        if (totalPages > 5) {
            if (startPage <= 2) endPage = Math.min(5, totalPages);
            if (endPage >= totalPages - 1) startPage = Math.max(totalPages - 4, 1);
        }
        if (startPage > 1) {
            html += `<button class="btn btn-secondary btn-sm page-btn" data-page="1" style="padding:4px 10px;font-size:13px;">1</button>`;
            if (startPage > 2) html += `<span style="padding:4px 6px;">...</span>`;
        }
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="btn btn-sm page-btn" data-page="${i}" style="padding:4px 10px;font-size:13px;${i === currentPage ? 'background:var(--accent);color:white;border-color:var(--accent);' : 'background:transparent;border:1px solid var(--border-color);color:var(--text-main);'}">${i}</button>`;
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span style="padding:4px 6px;">...</span>`;
            html += `<button class="btn btn-secondary btn-sm page-btn" data-page="${totalPages}" style="padding:4px 10px;font-size:13px;">${totalPages}</button>`;
        }
        pageNumbers.innerHTML = html;
        pageNumbers.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); render(); });
        });
    }

    function getFiltered() {
        const search   = (searchInput.value || '').toLowerCase();
        const action   = actionFilter.value;
        const severity = severityFilter.value;
        return logs.filter(l => {
            const matchSearch   = l.action.toLowerCase().includes(search) || l.by.toLowerCase().includes(search) || l.entity.toLowerCase().includes(search);
            const matchAction   = action   === 'all' || l.action   === action;
            const matchSeverity = severity === 'all' || l.severity === severity;
            return matchSearch && matchAction && matchSeverity;
        });
    }

    function renderStats() {
        const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setEl('stat-total',    logs.length);
        setEl('stat-critical', logs.filter(l => l.severity === 'Critical').length);
        setEl('stat-warning',  logs.filter(l => l.severity === 'Warning').length);
        setEl('stat-info',     logs.filter(l => l.severity === 'Info').length);
    }

    function render() {
        const filtered   = getFiltered();
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages || 1;
        const startIdx  = (currentPage - 1) * itemsPerPage;
        const pageItems = filtered.slice(startIdx, startIdx + itemsPerPage);

        document.getElementById('page-start').textContent = filtered.length === 0 ? 0 : startIdx + 1;
        document.getElementById('page-end').textContent   = Math.min(startIdx + itemsPerPage, filtered.length);
        document.getElementById('page-total').textContent = filtered.length;
        renderPaginationButtons(totalPages);

        if (!pageItems.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">No audit entries match the filter.</td></tr>`;
            return;
        }

        tbody.innerHTML = pageItems.map(l => `<tr>
            <td><span class="action-tag"><span>${l.actionIcon}</span> ${l.action}</span></td>
            <td><div class="user-cell"><div class="user-cell-avatar" style="background:${l.byColor}">${l.byAvatar}</div><span>${l.by}</span></div></td>
            <td>${l.entity}</td>
            <td><span class="badge ${severityBadge[l.severity] || 'badge-info'}">${l.severity}</span></td>
            <td><code style="font-size:12px;background:#f1f5f9;padding:2px 8px;border-radius:4px;">${l.role}</code></td>
            <td style="white-space:nowrap;font-size:13px;color:var(--text-muted)">${l.time}</td>
        </tr>`).join('');
    }

    document.getElementById('prev-page').addEventListener('click', () => { if (currentPage > 1) { currentPage--; render(); } });
    document.getElementById('next-page').addEventListener('click', () => { const tp = Math.ceil(getFiltered().length / itemsPerPage); if (currentPage < tp) { currentPage++; render(); } });
    searchInput.addEventListener('input',     () => { currentPage = 1; render(); });
    actionFilter.addEventListener('change',   () => { currentPage = 1; render(); });
    severityFilter.addEventListener('change', () => { currentPage = 1; render(); });

    // ── Refresh button ──
    const refreshBtn = document.querySelector('[data-refresh]') || document.getElementById('refresh-logs-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadLogs);

    window.showToast = function(msg, type = 'info') {
        const c = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        const icons = {
            success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error:   '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info:    '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        t.innerHTML = `${icons[type] || icons.info} ${msg}`;
        c.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
    };

    // ── Load ──
    await loadLogs();
});