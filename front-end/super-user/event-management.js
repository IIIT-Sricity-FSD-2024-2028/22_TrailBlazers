/* ============================================================
   EVENT MANAGEMENT JS — Super User Portal
   ALL data fetched live from backend GET /events
   Approve  → PATCH /events/:id  { status: 'upcoming' }
   Reject   → PATCH /events/:id  { status: 'rejected' }
   Create   → POST  /events
   Delete   → DELETE /events/:id
   All ops  → appendAuditLog() for audit trail
   ============================================================ */
const API = 'http://localhost:3000';

function appendAuditLog(action, icon, by, entity, severity, role) {
    const key  = 'su_audit_log';
    const logs = JSON.parse(sessionStorage.getItem(key) || '[]');
    logs.unshift({
        action, actionIcon: icon, by,
        byAvatar: by.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
        byColor: '#f97316',
        entity, severity,
        ip: 'SuperUser Portal',
        time: new Date().toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        role,
    });
    sessionStorage.setItem(key, JSON.stringify(logs.slice(0, 200)));
}

document.addEventListener('DOMContentLoaded', async () => {
    // ── UI helpers ──
    document.getElementById('header-user').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('header-dropdown').classList.toggle('active'); });
    document.addEventListener('click', () => document.getElementById('header-dropdown').classList.remove('active'));
    document.getElementById('notif-bell').addEventListener('click', () => showToast('You have new notifications', 'info'));
    document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '../landing-page/index.html'; });

    // ── Fetch events from backend ──
    let allEvents = [];

    async function loadEvents() {
        try {
            const res = await fetch(`${API}/events`, { headers: { role: 'superuser' } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            allEvents = await res.json();
        } catch(err) {
            showToast('Failed to load events: ' + err.message, 'error');
            allEvents = [];
        }
        renderAll();
    }

    // ── Map event to display format ──
    function mapDisplay(e) {
        const statusMap = {
            live: 'Active', upcoming: 'Active', approved: 'Active',
            pending: 'Queued', completed: 'Completed', rejected: 'Rejected'
        };
        const mgr = e.managerName || 'System Admin';
        const mAvatar = mgr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const colors = ['#7c3aed', '#2563eb', '#16a34a', '#ea580c', '#db2777'];
        const mColor = colors[mgr.length % colors.length];
        return {
            id: e.id,
            name: e.title,
            location: e.location || 'Virtual',
            client: e.clientName || e.domain || 'Internal',
            clientEmail: e.clientEmail || '—',
            manager: mgr, mAvatar, mColor,
            status: statusMap[e.status] || e.status,
            rawStatus: e.status,
            attendees: e.attendees || (e.stats ? e.stats.rsvps : 0) || 0,
            capacity: e.capacity || 0,
            date: e.date || '',
            description: e.description || '',
        };
    }

    // ── Current filter ──
    let currentStatus = 'all';
    const tbody       = document.getElementById('events-tbody');
    const searchInput = document.getElementById('event-search');

    function getDisplayEvents() { return allEvents.map(mapDisplay); }

    function render() {
        const search = (searchInput.value || '').toLowerCase();
        const display = getDisplayEvents();
        const filtered = display.filter(e => {
            const matchSearch = e.name.toLowerCase().includes(search) || e.client.toLowerCase().includes(search);
            const matchStatus = currentStatus === 'all' || currentStatus === 'Pending'
                ? true
                : e.status === currentStatus;
            return matchSearch && matchStatus;
        });

        const badgeMap = { Active: 'badge-active', Queued: 'badge-queued', Completed: 'badge-completed', Rejected: 'badge-inactive' };
        tbody.innerHTML = filtered.length
            ? filtered.map((e, idx) => `
                <tr class="event-row" data-idx="${idx}" style="cursor:pointer;transition:background .2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
                    <td><div class="user-cell-info"><span class="user-cell-name">${e.name}</span><span class="user-cell-sub">${e.location}</span></div></td>
                    <td>${e.client}</td>
                    <td><div class="user-cell"><div class="user-cell-avatar" style="background:${e.mColor}">${e.mAvatar}</div><span>${e.manager}</span></div></td>
                    <td><span class="badge ${badgeMap[e.status] || ''}"><span class="badge-dot"></span> ${e.status}</span></td>
                    <td><span style="display:flex;align-items:center;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> ${e.attendees}</span></td>
                    <td>${e.date}</td>
                </tr>`).join('')
            : `<tr><td colspan="6" style="text-align:center;padding:32px;color:#94a3b8;">No events match.</td></tr>`;

        // Row click → details modal
        document.querySelectorAll('.event-row').forEach(row => {
            row.addEventListener('click', () => {
                const e = filtered[parseInt(row.dataset.idx)];
                document.getElementById('detail-ev-name').textContent     = e.name;
                document.getElementById('detail-ev-status').innerHTML     = `<span class="badge ${badgeMap[e.status] || ''}"><span class="badge-dot"></span> ${e.status}</span>`;
                document.getElementById('detail-ev-client').textContent   = e.client;
                document.getElementById('detail-ev-location').textContent = e.location;
                document.getElementById('detail-ev-manager').textContent  = e.manager;
                const teamEl = document.getElementById('detail-ev-team');
                if (teamEl) teamEl.innerHTML = '<div style="font-size:13px;color:var(--text-muted);padding:4px;">No onsite team assigned yet.</div>';
                document.getElementById('event-details-modal').classList.add('active');
            });
        });

        updateStats();

        // Show/hide pending section
        const pendingSection = document.getElementById('pending-approval-section');
        if (pendingSection) pendingSection.style.display = (currentStatus === 'all' || currentStatus === 'Pending') ? '' : 'none';

        renderPendingEvents();
    }

    function updateStats() {
        const d = getDisplayEvents();
        const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setEl('stat-total',     d.length);
        setEl('stat-active',    d.filter(e => e.status === 'Active').length);
        setEl('stat-queued',    d.filter(e => e.status === 'Queued').length);
        setEl('stat-completed', d.filter(e => e.status === 'Completed').length);
        setEl('stat-pending',   d.filter(e => e.rawStatus === 'pending').length);
    }

    // ── Pending Approval Section ──
    let currentPendingIdx = -1;

    function renderPendingEvents() {
        const ptbody = document.getElementById('pending-tbody');
        if (!ptbody) return;
        const pendingEvents = allEvents.filter(e => e.status === 'pending').map(mapDisplay);
        if (!pendingEvents.length) {
            ptbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px;">🎉 No pending events — all caught up!</td></tr>';
        } else {
            ptbody.innerHTML = pendingEvents.map((e, i) => `
                <tr style="cursor:pointer;transition:background .2s;" onmouseover="this.style.background='#fffbeb'" onmouseout="this.style.background=''">
                    <td><span class="pending-ev-name" data-idx="${i}" style="font-weight:600;color:#ea580c;cursor:pointer;">${e.name}</span><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${e.location}</div></td>
                    <td>${e.client}</td>
                    <td>${e.date}</td>
                    <td><span style="display:flex;align-items:center;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> ${e.capacity}</span></td>
                    <td><span class="badge badge-queued"><span class="badge-dot"></span> Pending</span></td>
                </tr>`).join('');
            ptbody.querySelectorAll('.pending-ev-name').forEach(el => {
                el.addEventListener('click', () => openApprovalModal(parseInt(el.dataset.idx), pendingEvents));
            });
            ptbody.querySelectorAll('tr').forEach((row, i) => {
                row.addEventListener('click', (ev) => {
                    if (!ev.target.classList.contains('pending-ev-name')) openApprovalModal(i, pendingEvents);
                });
            });
        }
        const summaryEl = document.getElementById('pending-summary');
        if (summaryEl) summaryEl.textContent = `${pendingEvents.length} pending events awaiting approval`;
    }

    function openApprovalModal(idx, pendingEvents) {
        currentPendingIdx = idx;
        const e = pendingEvents[idx];
        document.getElementById('apm-name').textContent         = e.name;
        document.getElementById('apm-desc').textContent         = e.description || 'No description provided.';
        document.getElementById('apm-client').textContent       = e.client;
        document.getElementById('apm-client-email').textContent = e.clientEmail;
        document.getElementById('apm-date').textContent         = new Date(e.date || Date.now()).toDateString();
        document.getElementById('apm-location').textContent     = e.location;
        document.getElementById('apm-attendees').textContent    = e.capacity + ' members';
        document.getElementById('apm-type').textContent         = 'In-Person';
        document.getElementById('apm-status').innerHTML         = `<span class="badge badge-queued"><span class="badge-dot"></span> Pending</span>`;
        document.getElementById('apm-approve-btn').dataset.id   = e.id;
        document.getElementById('apm-reject-btn').dataset.id    = e.id;
        document.getElementById('apm-waiting-btn').dataset.id   = e.id;
        document.getElementById('approval-modal').classList.add('active');
    }

    function closeApprovalModal() {
        document.getElementById('approval-modal').classList.remove('active');
        currentPendingIdx = -1;
    }

    async function patchEventStatus(id, status) {
        const res = await fetch(`${API}/events/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', role: 'superuser' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    }

    document.getElementById('apm-approve-btn').addEventListener('click', async () => {
        const id = document.getElementById('apm-approve-btn').dataset.id;
        try {
            await patchEventStatus(id, 'upcoming');
            const ev = allEvents.find(e => e.id === id);
            if (ev) { ev.status = 'upcoming'; }
            closeApprovalModal();
            render();
            appendAuditLog('EVENT_APPROVED', '✅', 'Amanda Phillips', `Event #${id} approved`, 'Info', 'Superuser');
            showToast(`Event approved and set to upcoming!`, 'success');
        } catch(err) { showToast('Approve failed: ' + err.message, 'error'); }
    });

    document.getElementById('apm-reject-btn').addEventListener('click', async () => {
        const id = document.getElementById('apm-reject-btn').dataset.id;
        try {
            await patchEventStatus(id, 'rejected');
            const ev = allEvents.find(e => e.id === id);
            if (ev) ev.status = 'rejected';
            closeApprovalModal();
            render();
            appendAuditLog('EVENT_REJECTED', '❌', 'Amanda Phillips', `Event #${id} rejected`, 'Critical', 'Superuser');
            showToast(`Event rejected.`, 'error');
        } catch(err) { showToast('Reject failed: ' + err.message, 'error'); }
    });

    document.getElementById('apm-waiting-btn').addEventListener('click', async () => {
        const id = document.getElementById('apm-waiting-btn').dataset.id;
        try {
            await patchEventStatus(id, 'pending');
            closeApprovalModal();
            render();
            showToast(`Event kept as pending.`, 'info');
        } catch(err) { showToast('Update failed: ' + err.message, 'error'); }
    });

    document.getElementById('apm-close-btn').addEventListener('click', closeApprovalModal);

    // ── Create Event Modal ──
    document.getElementById('create-event-btn').addEventListener('click', () => document.getElementById('create-event-modal').classList.add('active'));
    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => {
        b.closest('.modal-overlay').classList.remove('active');
        currentPendingIdx = -1;
    }));
    document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', (e) => {
        if (e.target === o) { o.classList.remove('active'); currentPendingIdx = -1; }
    }));

    document.getElementById('create-event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name    = document.getElementById('ev-name').value.trim();
        const date    = document.getElementById('ev-date').value;
        const loc     = document.getElementById('ev-location').value.trim();
        const client  = document.getElementById('ev-client').value.trim();
        const manager = document.getElementById('ev-manager').value;

        if (!name || !date || !loc) {
            showToast('Please fill in all required fields (name, date, location)', 'error');
            return;
        }

        try {
            const res = await fetch(`${API}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', role: 'superuser' },
                body: JSON.stringify({
                    title:       name,
                    date,
                    location:    loc,
                    domain:      client || 'General',
                    managerName: manager || 'TBD',
                    status:      'pending',
                    attendees:   0,
                    capacity:    100,
                    description: 'Created from Super User dashboard',
                })
            });
            if (!res.ok) throw new Error(await res.text());
            const created = await res.json();
            allEvents.unshift(created);
            render();
            document.getElementById('create-event-modal').classList.remove('active');
            e.target.reset();
            appendAuditLog('EVENT_CREATED', '📅', 'Amanda Phillips', `${name}`, 'Info', 'Superuser');
            showToast(`Event "${name}" created!`, 'success');
        } catch(err) { showToast('Create failed: ' + err.message, 'error'); console.error('[Create Event]', err); }
    });

    // ── Filter tabs ──
    searchInput.addEventListener('input', render);
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = tab.dataset.status;
            render();
        });
    });

    // ── Toast ──
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

    // ── Initial load ──
    await loadEvents();
});