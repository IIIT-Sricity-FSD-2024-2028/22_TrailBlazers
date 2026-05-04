/**
 * AdminView — Superuser-only Admin Panel
 * Fetches live data from backend on every load.
 * Supports search + filter on both Users and Events tables.
 */
class AdminView {

    static render() {
        return `
            <div class="page-header" style="margin-bottom: 20px;">
                <div class="page-title">
                    <h2>🛡️ Admin Panel</h2>
                    <p>Manage all users and events directly from backend data</p>
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs" id="adminTabs" style="border-bottom: 1px solid var(--border-color); margin-bottom: 24px; display:flex; gap:4px;">
                <div class="tab active" data-tab="users" style="padding:10px 20px; cursor:pointer; font-weight:600; border-bottom:2px solid var(--primary); color:var(--primary);">👥 Users</div>
                <div class="tab"        data-tab="events" style="padding:10px 20px; cursor:pointer; font-weight:500; color:var(--text-muted);">📅 Events</div>
            </div>

            <!-- USERS TAB -->
            <div id="adminTab-users">
                <!-- Filters -->
                <div style="display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap; align-items:center;">
                    <input type="text" id="userSearch" placeholder="🔍 Search name or email…"
                        style="flex:1; min-width:200px; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px;">
                    <select id="userRoleFilter" style="padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px;">
                        <option value="">All Roles</option>
                        <option value="superuser">Superuser</option>
                        <option value="eventmanager">Event Manager</option>
                        <option value="client">Client</option>
                        <option value="attendee">Attendee</option>
                        <option value="osc">On-Site Coordinator</option>
                    </select>
                    <select id="userStatusFilter" style="padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px;">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <span id="userCount" style="font-size:13px; color:var(--text-muted); white-space:nowrap;"></span>
                </div>
                <div class="card" style="padding:0; overflow:hidden;">
                    <div id="usersTable" style="overflow-x:auto;">
                        <div style="padding:40px; text-align:center; color:var(--text-muted);">Loading users from backend…</div>
                    </div>
                </div>
            </div>

            <!-- EVENTS TAB -->
            <div id="adminTab-events" style="display:none;">
                <!-- Filters -->
                <div style="display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap; align-items:center;">
                    <input type="text" id="eventSearch" placeholder="🔍 Search title or location…"
                        style="flex:1; min-width:200px; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px;">
                    <select id="eventStatusFilter" style="padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px;">
                        <option value="">All Status</option>
                        <option value="live">Live</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <select id="eventDomainFilter" style="padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px;">
                        <option value="">All Domains</option>
                        <option value="Tech Conferences">Tech Conferences</option>
                        <option value="Healthcare &amp; Life Sciences">Healthcare &amp; Life Sciences</option>
                        <option value="Fintech &amp; Banking">Fintech &amp; Banking</option>
                        <option value="Client Hosted Events">Client Hosted Events</option>
                    </select>
                    <span id="eventCount" style="font-size:13px; color:var(--text-muted); white-space:nowrap;"></span>
                </div>
                <div class="card" style="padding:0; overflow:hidden;">
                    <div id="eventsTable" style="overflow-x:auto;">
                        <div style="padding:40px; text-align:center; color:var(--text-muted);">Loading events from backend…</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ── Role badge colours ────────────────────────────────────────────────────
    static _roleBadge(role) {
        const map = {
            superuser:    { bg: '#f0fdf4', color: '#16a34a', label: 'Superuser' },
            eventmanager: { bg: '#eff6ff', color: '#2563EB', label: 'Event Manager' },
            client:       { bg: '#fff7ed', color: '#f97316', label: 'Client' },
            attendee:     { bg: '#f8fafc', color: '#64748b', label: 'Attendee' },
            osc:          { bg: '#faf5ff', color: '#7c3aed', label: 'On-Site Coord.' },
        };
        const s = map[role] || { bg: '#f1f5f9', color: '#94a3b8', label: role };
        return `<span style="background:${s.bg}; color:${s.color}; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700;">${s.label}</span>`;
    }

    // ── Status badge colours ──────────────────────────────────────────────────
    static _statusBadge(status) {
        const map = {
            live:      { bg: '#fef2f2', color: '#ef4444' },
            upcoming:  { bg: '#fff7ed', color: '#f97316' },
            pending:   { bg: '#fefce8', color: '#ca8a04' },
            approved:  { bg: '#f0fdf4', color: '#16a34a' },
            completed: { bg: '#f1f5f9', color: '#64748b' },
            rejected:  { bg: '#fef2f2', color: '#dc2626' },
            active:    { bg: '#f0fdf4', color: '#16a34a' },
            inactive:  { bg: '#f1f5f9', color: '#94a3b8' },
        };
        const s = map[status] || { bg: '#f1f5f9', color: '#94a3b8' };
        return `<span style="background:${s.bg}; color:${s.color}; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; text-transform:capitalize;">${status}</span>`;
    }

    // ── Render Users table ────────────────────────────────────────────────────
    static _renderUsersTable(users) {
        const el = document.getElementById('usersTable');
        const cnt = document.getElementById('userCount');
        if (!el) return;
        cnt && (cnt.textContent = `${users.length} user${users.length !== 1 ? 's' : ''} found`);
        if (!users.length) {
            el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted);">No users match the filters.</div>';
            return;
        }
        el.innerHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                <thead>
                    <tr style="background:var(--bg-color); border-bottom:2px solid var(--border-color);">
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">ID</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Name</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Email</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Role</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Domain</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Status</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Joined</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map((u, i) => `
                    <tr style="border-bottom:1px solid var(--border-color); ${i % 2 === 0 ? '' : 'background:var(--bg-color);'}">
                        <td style="padding:14px 16px; font-weight:600; color:var(--text-muted); font-size:12px;">${u.id}</td>
                        <td style="padding:14px 16px; font-weight:600; color:var(--text-main);">${u.name}</td>
                        <td style="padding:14px 16px; color:var(--text-muted);">${u.email}</td>
                        <td style="padding:14px 16px;">${this._roleBadge(u.role)}</td>
                        <td style="padding:14px 16px; color:var(--text-muted); font-size:12px;">${u.domain || '—'}</td>
                        <td style="padding:14px 16px;">${this._statusBadge(u.status || 'active')}</td>
                        <td style="padding:14px 16px; color:var(--text-muted); font-size:12px;">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    }

    // ── Render Events table ───────────────────────────────────────────────────
    static _renderEventsTable(events) {
        const el = document.getElementById('eventsTable');
        const cnt = document.getElementById('eventCount');
        if (!el) return;
        cnt && (cnt.textContent = `${events.length} event${events.length !== 1 ? 's' : ''} found`);
        if (!events.length) {
            el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted);">No events match the filters.</div>';
            return;
        }
        el.innerHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                <thead>
                    <tr style="background:var(--bg-color); border-bottom:2px solid var(--border-color);">
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">ID</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Title</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Date</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Status</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Domain</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Client</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Manager</th>
                        <th style="padding:14px 16px; text-align:left; font-weight:700; color:var(--text-muted); font-size:11px; text-transform:uppercase;">Capacity</th>
                    </tr>
                </thead>
                <tbody>
                    ${events.map((e, i) => `
                    <tr style="border-bottom:1px solid var(--border-color); ${i % 2 === 0 ? '' : 'background:var(--bg-color);'}" class="admin-event-row" data-id="${e.id}" style="cursor:pointer;">
                        <td style="padding:14px 16px; font-weight:600; color:var(--text-muted); font-size:12px;">${e.id}</td>
                        <td style="padding:14px 16px;">
                            <a href="#/event-details?id=${e.id}" style="font-weight:700; color:var(--text-main); text-decoration:none;">${e.title}</a>
                            <div style="font-size:11px; color:var(--text-muted);">${e.location || '—'}</div>
                        </td>
                        <td style="padding:14px 16px; color:var(--text-muted); font-size:12px;">${e.date || '—'}</td>
                        <td style="padding:14px 16px;">${this._statusBadge(e.status)}</td>
                        <td style="padding:14px 16px; color:var(--text-muted); font-size:12px;">${e.domain || '—'}</td>
                        <td style="padding:14px 16px; font-size:12px; color:var(--text-muted);">${e.clientName || '—'}</td>
                        <td style="padding:14px 16px; font-size:12px; color:var(--text-muted);">${e.managerName || 'TBD'}</td>
                        <td style="padding:14px 16px; font-weight:600; color:var(--text-main);">${e.capacity || 0}</td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    }

    // ── Apply user filters ────────────────────────────────────────────────────
    static _applyUserFilters(allUsers) {
        const q      = (document.getElementById('userSearch')?.value || '').toLowerCase();
        const role   = document.getElementById('userRoleFilter')?.value || '';
        const status = document.getElementById('userStatusFilter')?.value || '';
        const filtered = allUsers.filter(u => {
            if (role   && u.role   !== role)   return false;
            if (status && (u.status || 'active') !== status) return false;
            if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
            return true;
        });
        this._renderUsersTable(filtered);
    }

    // ── Apply event filters ───────────────────────────────────────────────────
    static _applyEventFilters(allEvents) {
        const q      = (document.getElementById('eventSearch')?.value || '').toLowerCase();
        const status = document.getElementById('eventStatusFilter')?.value || '';
        const domain = document.getElementById('eventDomainFilter')?.value || '';
        const filtered = allEvents.filter(e => {
            if (status && e.status !== status) return false;
            if (domain && e.domain !== domain) return false;
            if (q && !e.title.toLowerCase().includes(q) && !(e.location || '').toLowerCase().includes(q)) return false;
            return true;
        });
        this._renderEventsTable(filtered);
    }

    // ── Init ─────────────────────────────────────────────────────────────────
    static async init() {
        const user = App.user || Auth.getCurrentUser() || {};
        if (user.role !== 'superuser') {
            document.getElementById('mainContent').innerHTML =
                '<div class="card"><p style="color:#ef4444; font-weight:600;">⛔ Access denied. Superuser only.</p></div>';
            return;
        }

        // Tab switching
        document.querySelectorAll('#adminTabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('#adminTabs .tab').forEach(t => {
                    t.classList.remove('active');
                    t.style.borderBottom = 'none';
                    t.style.color = 'var(--text-muted)';
                    t.style.fontWeight = '500';
                });
                tab.classList.add('active');
                tab.style.borderBottom = '2px solid var(--primary)';
                tab.style.color = 'var(--primary)';
                tab.style.fontWeight = '600';
                const target = tab.getAttribute('data-tab');
                document.getElementById('adminTab-users').style.display  = target === 'users'  ? '' : 'none';
                document.getElementById('adminTab-events').style.display = target === 'events' ? '' : 'none';
            });
        });

        // Fetch users and events live from backend
        let allUsers = [], allEvents = [];
        try {
            const [uRes, eRes] = await Promise.all([
                fetch('http://localhost:3000/users',  { headers: { role: 'superuser' } }),
                fetch('http://localhost:3000/events', { headers: { role: 'superuser' } }),
            ]);
            allUsers  = uRes.ok  ? await uRes.json()  : [];
            allEvents = eRes.ok  ? await eRes.json()  : [];
        } catch(err) {
            document.getElementById('usersTable').innerHTML  = `<div style="padding:30px; text-align:center; color:#ef4444;">❌ Failed to load from backend: ${err.message}</div>`;
            document.getElementById('eventsTable').innerHTML = `<div style="padding:30px; text-align:center; color:#ef4444;">❌ Failed to load from backend: ${err.message}</div>`;
            return;
        }

        // Initial render
        this._renderUsersTable(allUsers);
        this._renderEventsTable(allEvents);

        // Attach filter listeners — users
        ['userSearch', 'userRoleFilter', 'userStatusFilter'].forEach(id => {
            document.getElementById(id)?.addEventListener('input',  () => this._applyUserFilters(allUsers));
            document.getElementById(id)?.addEventListener('change', () => this._applyUserFilters(allUsers));
        });

        // Attach filter listeners — events
        ['eventSearch', 'eventStatusFilter', 'eventDomainFilter'].forEach(id => {
            document.getElementById(id)?.addEventListener('input',  () => this._applyEventFilters(allEvents));
            document.getElementById(id)?.addEventListener('change', () => this._applyEventFilters(allEvents));
        });
    }
}