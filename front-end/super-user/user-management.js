/* ============================================================
   USER MANAGEMENT JS — Super User Portal
   COMPLETE CRUD from backend. All operations write to backend
   AND append to local audit log (sessionStorage).
   ============================================================ */
const API = 'http://localhost:3000';

/* ── Shared audit-log helper (session-based, read by audit-logs.js) ── */
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
    // ── UI ──
    document.getElementById('header-user').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('header-dropdown').classList.toggle('active'); });
    document.addEventListener('click', () => document.getElementById('header-dropdown').classList.remove('active'));
    document.getElementById('notif-bell').addEventListener('click', () => showToast('You have new notifications', 'info'));
    document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '../landing-page/index.html'; });

    let users = [];

    async function loadUsers() {
        try {
            const res = await fetch(`${API}/users`, { headers: { role: 'superuser' } });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            users = await res.json();
        } catch(err) {
            showToast('Failed to load users: ' + err.message, 'error');
            users = [];
        }
        renderUsers();
        updateStats();
    }

    // ── Pagination ──
    let currentPage = 1;
    const ITEMS_PER_PAGE = 10;

    const tbody       = document.getElementById('users-tbody');
    const searchInput = document.getElementById('user-search');
    const roleFilter  = document.getElementById('role-filter');
    let editingUserId = null;

    const ROLE_DISPLAY = {
        superuser:    'Super Admin',
        eventmanager: 'Event Manager',
        osc:          'Coordinator',
        client:       'Client',
        attendee:     'Attendee',
    };
    const BADGE_CLASS = {
        superuser:    'badge-admin',
        eventmanager: 'badge-event-manager',
        osc:          'badge-coordinator',
        client:       'badge-client',
        attendee:     'badge-attendee',
    };

    function avatarColor(name) {
        const c = ['#f97316','#7c3aed','#2563eb','#16a34a','#ea580c','#0891b2','#dc2626','#9333ea'];
        let h = 0; for (const ch of (name || '')) h = ch.charCodeAt(0) + ((h << 5) - h);
        return c[Math.abs(h) % c.length];
    }
    function initials(name) { return (name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(); }

    function getFiltered() {
        const q    = (searchInput.value || '').toLowerCase();
        const role = roleFilter.value;
        return users.filter(u => {
            const ms = (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
            const mr = role === 'all' || u.role === role;
            return ms && mr;
        });
    }

    function renderPaginationButtons(totalPages) {
        const pn = document.getElementById('page-numbers');
        document.getElementById('prev-page').disabled = currentPage === 1;
        document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
        let html = '';
        let s = Math.max(1, currentPage - 2), e = Math.min(totalPages, currentPage + 2);
        if (totalPages > 5) { if (s <= 2) e = Math.min(5, totalPages); if (e >= totalPages - 1) s = Math.max(totalPages - 4, 1); }
        if (s > 1) { html += `<button class="btn btn-secondary btn-sm page-btn" data-page="1" style="padding:4px 10px;font-size:13px;">1</button>`; if (s > 2) html += `<span style="padding:4px 6px;">…</span>`; }
        for (let i = s; i <= e; i++) html += `<button class="btn btn-sm page-btn" data-page="${i}" style="padding:4px 10px;font-size:13px;${i === currentPage ? 'background:var(--accent);color:white;border-color:var(--accent);' : 'background:transparent;border:1px solid var(--border-color);color:var(--text-main);'}">${i}</button>`;
        if (e < totalPages) { if (e < totalPages - 1) html += `<span style="padding:4px 6px;">…</span>`; html += `<button class="btn btn-secondary btn-sm page-btn" data-page="${totalPages}" style="padding:4px 10px;font-size:13px;">${totalPages}</button>`; }
        pn.innerHTML = html;
        pn.querySelectorAll('.page-btn').forEach(b => b.addEventListener('click', () => { currentPage = parseInt(b.dataset.page); renderUsers(); }));
    }

    function renderUsers() {
        const filtered   = getFiltered();
        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        if (currentPage > totalPages) currentPage = totalPages || 1;
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const page  = filtered.slice(start, start + ITEMS_PER_PAGE);

        const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setEl('user-count-num', filtered.length);
        setEl('page-start', filtered.length === 0 ? 0 : start + 1);
        setEl('page-end',   Math.min(start + ITEMS_PER_PAGE, filtered.length));
        setEl('page-total', filtered.length);

        renderPaginationButtons(totalPages);

        tbody.innerHTML = page.map(u => {
            const av    = initials(u.name);
            const color = avatarColor(u.name);
            const badge = BADGE_CLASS[u.role] || '';
            const label = ROLE_DISPLAY[u.role] || u.role;
            const active = (u.status || 'active') === 'active';
            const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
            return `
            <tr>
                <td><div class="user-cell"><div class="user-cell-avatar" style="background:${color}">${av}</div><div class="user-cell-info"><span class="user-cell-name">${u.name}</span></div></div></td>
                <td>${u.email}</td>
                <td><span class="badge ${badge}">${label}</span></td>
                <td><span style="color:var(--text-muted);font-size:12px;">${u.domain || '—'}</span></td>
                <td><span class="badge ${active ? 'badge-active' : 'badge-inactive'}"><span class="badge-dot"></span> ${active ? 'Active' : 'Inactive'}</span></td>
                <td><div class="toggle ${active ? 'active' : ''}" data-id="${u.id}"><div class="toggle-knob"></div></div></td>
                <td>${joined}</td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-secondary btn-edit" data-id="${u.id}" style="padding:4px 8px;font-size:12px;border-color:#2563EB;color:#2563EB;">Change Role</button>
                        <button class="btn btn-danger btn-delete" data-id="${u.id}" style="padding:4px 8px;font-size:12px;">Delete</button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        // ── Active toggle ──
        tbody.querySelectorAll('.toggle').forEach(t => {
            t.addEventListener('click', async () => {
                const id = t.dataset.id;
                const u  = users.find(u => u.id === id);
                if (!u) return;
                const newStatus = (u.status || 'active') === 'active' ? 'inactive' : 'active';
                try {
                    const res = await fetch(`${API}/users/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', role: 'superuser' },
                        body: JSON.stringify({ status: newStatus })
                    });
                    if (!res.ok) throw new Error(await res.text());
                    u.status = newStatus;
                    renderUsers(); updateStats();
                    appendAuditLog('USER_STATUS_CHANGED', '🔄', 'Amanda Phillips', `${u.name} → ${newStatus}`, 'Warning', 'Superuser');
                    showToast(`${u.name} marked as ${newStatus}`, 'success');
                } catch(err) { showToast('Update failed: ' + err.message, 'error'); }
            });
        });

        // ── Change Role ──
        tbody.querySelectorAll('.btn-edit').forEach(b => {
            b.addEventListener('click', () => {
                const u = users.find(u => u.id === b.dataset.id);
                if (!u) return;
                editingUserId = u.id;
                document.getElementById('edit-user-name').textContent  = u.name;
                document.getElementById('edit-user-email').textContent = u.email;
                document.getElementById('edit-user-role').value        = u.role;
                document.getElementById('edit-modal').classList.add('active');
            });
        });

        // ── Delete ──
        tbody.querySelectorAll('.btn-delete').forEach(b => {
            b.addEventListener('click', async () => {
                const u = users.find(u => u.id === b.dataset.id);
                if (!u) return;
                if (!confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) return;
                try {
                    const res = await fetch(`${API}/users/${u.id}`, { method: 'DELETE', headers: { role: 'superuser' } });
                    if (!res.ok) throw new Error(await res.text());
                    users = users.filter(x => x.id !== u.id);
                    renderUsers(); updateStats();
                    appendAuditLog('USER_DELETED', '❌', 'Amanda Phillips', `${u.name} (${u.role})`, 'Critical', 'Superuser');
                    showToast(`User "${u.name}" deleted successfully`, 'error');
                } catch(err) { showToast('Delete failed: ' + err.message, 'error'); }
            });
        });
    }

    function updateStats() {
        const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setEl('stat-all',      users.length);
        setEl('stat-admin',    users.filter(u => u.role === 'superuser').length);
        setEl('stat-em',       users.filter(u => u.role === 'eventmanager').length);
        setEl('stat-coord',    users.filter(u => u.role === 'osc').length);
        setEl('stat-client',   users.filter(u => u.role === 'client').length);
        setEl('stat-attendee', users.filter(u => u.role === 'attendee').length);
    }

    document.getElementById('prev-page').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderUsers(); } });
    document.getElementById('next-page').addEventListener('click', () => { const tp = Math.ceil(getFiltered().length / ITEMS_PER_PAGE); if (currentPage < tp) { currentPage++; renderUsers(); } });
    searchInput.addEventListener('input',  () => { currentPage = 1; renderUsers(); });
    roleFilter.addEventListener('change',  () => { currentPage = 1; renderUsers(); });

    // ══ CREATE USER ══════════════════════════════════════════════════════════════
    document.getElementById('create-user-btn').addEventListener('click', () => document.getElementById('create-user-modal').classList.add('active'));

    document.getElementById('create-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fname  = document.getElementById('new-fname').value.trim();
        const lname  = document.getElementById('new-lname').value.trim();
        const email  = document.getElementById('new-email').value.trim();
        const role   = document.getElementById('new-role').value;
        const domain = (document.getElementById('new-domain')?.value || '').trim();

        if (!fname || !lname || !email || !role) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const domainDefaults = {
            superuser: 'Platform Administration', eventmanager: 'Tech Conferences',
            osc: 'Tech Conferences', client: 'Client Hosted Events', attendee: 'General'
        };

        const payload = {
            name:   `${fname} ${lname}`,
            email,
            role,
            domain: domain || domainDefaults[role] || 'General',
        };

        try {
            const res = await fetch(`${API}/users`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', role: 'superuser' },
                body:    JSON.stringify(payload),
            });
            if (!res.ok) {
                const errBody = await res.text();
                throw new Error(`${res.status}: ${errBody}`);
            }
            const created = await res.json();
            users.unshift(created);
            renderUsers(); updateStats();
            document.getElementById('create-user-modal').classList.remove('active');
            e.target.reset();
            appendAuditLog('USER_CREATED', '👤', 'Amanda Phillips', `${created.name} (${created.role})`, 'Info', 'Superuser');
            showToast(`User "${created.name}" created successfully!`, 'success');
        } catch(err) {
            showToast('Create failed — ' + err.message, 'error');
            console.error('[Create User]', err);
        }
    });

    // ══ SAVE ROLE CHANGE ═════════════════════════════════════════════════════════
    document.getElementById('save-edit-btn').addEventListener('click', async () => {
        if (!editingUserId) return;
        const newRole = document.getElementById('edit-user-role').value;
        try {
            const res = await fetch(`${API}/users/${editingUserId}`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json', role: 'superuser' },
                body:    JSON.stringify({ role: newRole }),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            const idx = users.findIndex(u => u.id === editingUserId);
            if (idx !== -1) users[idx] = updated;
            renderUsers(); updateStats();
            document.getElementById('edit-modal').classList.remove('active');
            appendAuditLog('ROLE_UPDATED', '🔄', 'Amanda Phillips', `${updated.name} → ${ROLE_DISPLAY[newRole] || newRole}`, 'Warning', 'Superuser');
            showToast(`Role updated to "${ROLE_DISPLAY[newRole] || newRole}"`, 'success');
            editingUserId = null;
        } catch(err) { showToast('Role update failed: ' + err.message, 'error'); }
    });

    document.getElementById('cancel-edit-btn').addEventListener('click', () => { document.getElementById('edit-modal').classList.remove('active'); editingUserId = null; });
    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => b.closest('.modal-overlay').classList.remove('active')));
    document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('active'); }));

    // ── Toast ──
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

    await loadUsers();
});