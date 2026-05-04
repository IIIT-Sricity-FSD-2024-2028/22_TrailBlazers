/* ============================================================
   DATABASE CONTROL JS — Super User Portal
   Fetches ALL table data live from backend API endpoints.
   View/records reflect real backend JSON files.
   ============================================================ */
const API = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('header-user').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('header-dropdown').classList.toggle('active'); });
    document.addEventListener('click', () => document.getElementById('header-dropdown').classList.remove('active'));
    document.getElementById('notif-bell').addEventListener('click', () => showToast('You have new notifications', 'info'));
    document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '../landing-page/index.html'; });

    // ── Table definitions: which API to call and how to map columns ──
    const TABLE_DEFS = [
        {
            name: 'Users',
            endpoint: '/users',
            columns: ['id', 'name', 'email', 'role', 'domain', 'status', 'createdAt'],
        },
        {
            name: 'Events',
            endpoint: '/events',
            columns: ['id', 'title', 'date', 'location', 'status', 'domain', 'clientName', 'managerName', 'capacity', 'attendees'],
        },
        {
            name: 'RSVPs',
            endpoint: '/rsvps',
            columns: ['id', 'eventId', 'attendeeId', 'attendeeName', 'attendeeEmail', 'phone', 'status', 'createdAt'],
        },
        {
            name: 'Check_Ins',
            endpoint: '/check-ins',
            columns: ['id', 'eventId', 'attendeeId', 'attendeeName', 'attendeeEmail', 'ticketCode', 'status', 'checkInTime', 'createdAt'],
        },
        {
            name: 'Feedback',
            endpoint: '/feedback',
            columns: ['id', 'eventId', 'attendeeId', 'attendeeName', 'rating', 'comment', 'createdAt'],
        },
        {
            name: 'Polls',
            endpoint: '/polls',
            columns: ['id', 'eventId', 'question', 'options', 'createdAt'],
        },
        {
            name: 'Poll_Responses',
            endpoint: '/poll-responses',
            columns: ['id', 'pollId', 'eventId', 'attendeeId', 'attendeeName', 'selectedOption', 'createdAt'],
        },
        {
            name: 'Sessions',
            endpoint: '/sessions',
            columns: ['id', 'eventId', 'title', 'speaker', 'startTime', 'endTime', 'location', 'type'],
        },
        {
            name: 'QnA',
            endpoint: '/qna',
            columns: ['id', 'eventId', 'attendeeId', 'attendeeName', 'question', 'answer', 'status', 'createdAt'],
        },
        {
            name: 'Notifications',
            endpoint: '/notifications',
            columns: ['id', 'userId', 'type', 'message', 'isRead', 'createdAt'],
        },
        {
            name: 'Reports',
            endpoint: '/reports',
            columns: ['id', 'eventId', 'attendanceCount', 'pollParticipation', 'feedbackScore', 'checkInRate', 'generatedAt'],
        },
    ];

    // ── Fetch all tables from backend ──
    let tableData = {}; // name → { columns, records }

    async function loadAllTables() {
        const results = await Promise.allSettled(
            TABLE_DEFS.map(def =>
                fetch(`${API}${def.endpoint}`, { headers: { role: 'superuser' } })
                    .then(r => r.ok ? r.json() : [])
                    .catch(() => [])
            )
        );
        TABLE_DEFS.forEach((def, i) => {
            const records = results[i].status === 'fulfilled' ? results[i].value : [];
            tableData[def.name] = { columns: def.columns, records: Array.isArray(records) ? records : [] };
        });
        render();
    }

    // ── Render main table list ──
    const tbody = document.getElementById('db-tbody');

    function render() {
        const entries = Object.entries(tableData);

        // Update stat cards
        const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setEl('stat-total-tables',  entries.length);
        const totalRecords = entries.reduce((s, [, t]) => s + t.records.length, 0);
        setEl('stat-total-records', totalRecords.toLocaleString());
        const totalBytes = entries.reduce((s, [, t]) => s + JSON.stringify(t.records).length, 0);
        setEl('stat-total-size', totalBytes > 1024 * 1024 ? (totalBytes / (1024 * 1024)).toFixed(1) + ' MB' : (totalBytes / 1024).toFixed(1) + ' KB');

        tbody.innerHTML = entries.map(([name, t]) => {
            const sizeB = JSON.stringify(t.records).length;
            const size  = sizeB > 1024 ? (sizeB / 1024).toFixed(1) + ' KB' : sizeB + ' B';
            const health = t.records.length > 0 ? 'healthy' : 'warning';
            return `<tr style="border-bottom:1px solid var(--border-light);">
                <td><span class="db-table-name">${name}</span></td>
                <td><div class="db-health ${health}"><span class="db-health-dot"></span> ${health === 'healthy' ? 'Healthy' : 'Empty'}</div></td>
                <td>${t.records.length.toLocaleString()}</td>
                <td>${size}</td>
                <td>Live</td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-info btn-view" data-name="${name}" style="padding:5px 10px;font-size:12px;">View</button>
                        <button class="btn btn-success btn-add-record" data-name="${name}" style="padding:5px 10px;font-size:12px;">Add</button>
                        <button class="btn btn-secondary btn-refresh-table" data-name="${name}" style="padding:5px 10px;font-size:12px;">Refresh</button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        attachButtonHandlers();
    }

    function attachButtonHandlers() {
        tbody.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', () => openRecordsModal(btn.dataset.name));
        });
        tbody.querySelectorAll('.btn-add-record').forEach(btn => {
            btn.addEventListener('click', () => openAddRecordModal(btn.dataset.name));
        });
        tbody.querySelectorAll('.btn-refresh-table').forEach(btn => {
            btn.addEventListener('click', async () => {
                const name = btn.dataset.name;
                const def  = TABLE_DEFS.find(d => d.name === name);
                if (!def) return;
                try {
                    const res = await fetch(`${API}${def.endpoint}`, { headers: { role: 'superuser' } });
                    const data = res.ok ? await res.json() : [];
                    tableData[name].records = Array.isArray(data) ? data : [];
                    render();
                    showToast(`${name} refreshed — ${tableData[name].records.length} records`, 'success');
                } catch(err) { showToast('Refresh failed: ' + err.message, 'error'); }
            });
        });
    }

    // ── VIEW RECORDS MODAL — shows real backend records ──
    let currentViewTable = '';

    // ── Add Record — real backend POST ──
    const ADD_ENDPOINTS = {
        Users:  { url: '/users',  fields: ['name','email','role','domain'], required: ['name','email','role'] },
        Events: { url: '/events', fields: ['title','date','location','domain','description','capacity'], required: ['title','date','location','domain','description','capacity'] },
    };

    function openAddRecordModal(tableName) {
        const def = ADD_ENDPOINTS[tableName];
        if (!def) { showToast(`Adding records to "${tableName}" is managed via the main portal or Swagger at http://localhost:3000/api`, 'info'); return; }

        let existing = document.getElementById('add-record-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'add-record-modal';
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-card" style="max-width:520px; background:#FFFFFF; padding:28px; box-shadow:0 10px 40px rgba(0,0,0,0.4);">
                <div class="modal-header"><h3>Add Record to <strong>${tableName}</strong></h3><button class="modal-close" aria-label="Close">&times;</button></div>
                <div class="modal-body" style="max-height:400px;overflow-y:auto;">
                    <form id="add-record-form" style="display:flex;flex-direction:column;gap:14px;margin-top:12px;">
                        ${def.fields.map(f => {
                            if (f === 'role') return `<div><label style="display:block;font-size:12px;font-weight:600;color:#64748b;margin-bottom:4px;text-transform:uppercase;">${f} <span style="color:red">*</span></label><select name="${f}" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;"><option value="superuser">Super Admin</option><option value="eventmanager">Event Manager</option><option value="osc">On-Site Coordinator</option><option value="client">Client</option><option value="attendee" selected>Attendee</option></select></div>`;
                            const req = def.required.includes(f);
                            const type = f === 'date' ? 'date' : f === 'capacity' ? 'number' : f === 'email' ? 'email' : 'text';
                            return `<div><label style="display:block;font-size:12px;font-weight:600;color:#64748b;margin-bottom:4px;text-transform:uppercase;">${f}${req ? ' <span style="color:red">*</span>' : ''}</label><input type="${type}" name="${f}" placeholder="Enter ${f}" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;box-sizing:border-box;" ${req ? 'required' : ''}></div>`;
                        }).join('')}
                    </form>
                </div>
                <div class="modal-footer" style="display:flex;gap:10px;justify-content:flex-end;padding:16px 20px;border-top:1px solid #e2e8f0;">
                    <button class="btn btn-secondary modal-cancel-btn" style="padding:8px 18px;">Cancel</button>
                    <button class="btn btn-success" id="submit-add-record" style="padding:8px 18px;">Add Record</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-cancel-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

        document.getElementById('submit-add-record').addEventListener('click', async () => {
            const form = document.getElementById('add-record-form');
            const data = {};
            let valid = true;
            def.fields.forEach(f => {
                const el = form.elements[f];
                if (!el) return;
                let v = el.value.trim();
                if (def.required.includes(f) && !v) { valid = false; return; }
                if (f === 'capacity') v = parseInt(v) || 100;
                if (v) data[f] = v;
            });
            if (!valid) { showToast('Fill in all required fields (*)', 'error'); return; }
            // Fill defaults for events
            if (tableName === 'Events') { data.status = 'pending'; if (!data.capacity) data.capacity = 100; }

            try {
                const res = await fetch(`${API}${def.url}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', role: 'superuser' },
                    body: JSON.stringify(data)
                });
                if (!res.ok) throw new Error(await res.text());
                const created = await res.json();
                tableData[tableName].records.unshift(created);
                render();
                modal.remove();
                // Append to session audit log
                try {
                    const logs = JSON.parse(sessionStorage.getItem('su_audit_log') || '[]');
                    logs.unshift({ action: `${tableName.toUpperCase().slice(0,-1)}_CREATED`, actionIcon: '➕', by: 'Amanda Phillips', byAvatar: 'AP', byColor: '#f97316', entity: `${tableName} record #${created.id || '?'}`, severity: 'Info', ip: 'SuperUser Portal', time: new Date().toLocaleString('en-IN', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit'}), role: 'Superuser' });
                    sessionStorage.setItem('su_audit_log', JSON.stringify(logs.slice(0, 200)));
                } catch {}
                showToast(`Record added to ${tableName} successfully!`, 'success');
            } catch(err) { showToast(`Add failed: ${err.message}`, 'error'); console.error('[Add Record]', err); }
        });
    }

    function openRecordsModal(tableName) {
        const table = tableData[tableName];
        if (!table) return;
        currentViewTable = tableName;

        document.getElementById('records-table-name').textContent = tableName;
        const recordsHead    = document.getElementById('records-thead');
        const recordsBody    = document.getElementById('records-tbody');
        const columnBadges   = document.getElementById('records-columns-badges');
        const countLabel     = document.getElementById('records-count-label');

        columnBadges.innerHTML = table.columns.map(col =>
            `<span style="background:#eff6ff;color:var(--info);padding:4px 10px;border-radius:4px;font-size:12px;font-family:monospace;">${col}</span>`
        ).join('');

        if (countLabel) countLabel.textContent = `Showing ${table.records.length} record${table.records.length !== 1 ? 's' : ''} (live from backend)`;

        recordsHead.innerHTML = `<tr>
            ${table.columns.map(col => `<th style="padding:12px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${col}</th>`).join('')}
        </tr>`;

        if (!table.records.length) {
            recordsBody.innerHTML = `<tr><td colspan="${table.columns.length}" style="padding:30px;text-align:center;color:var(--text-muted);">No records in this table.</td></tr>`;
        } else {
            recordsBody.innerHTML = table.records.map((rec, idx) => `
                <tr style="border-bottom:1px solid var(--border-light);${idx % 2 === 1 ? 'background:#fafafa;' : ''}">
                    ${table.columns.map(col => {
                        let val = rec[col];
                        if (val === null || val === undefined) val = '—';
                        // Status coloring
                        if (col === 'status' || col === 'isRead') {
                            const good = val === 'active' || val === 'checked-in' || val === 'confirmed' || val === true || val === 'live' || val === 'approved';
                            const color = good ? 'var(--success)' : (val === 'pending' ? '#f97316' : 'var(--text-muted)');
                            return `<td style="padding:12px 16px;"><span style="color:${color};font-weight:600;">${val}</span></td>`;
                        }
                        if (col === 'rating') {
                            const r = parseInt(val) || 0;
                            return `<td style="padding:12px 16px;color:#f97316;font-weight:600;">${'★'.repeat(r)}${'☆'.repeat(Math.max(0, 5 - r))}</td>`;
                        }
                        // Truncate long text
                        const str = String(val);
                        const display = str.length > 60 ? str.substring(0, 60) + '…' : str;
                        return `<td style="padding:12px 16px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${str.replace(/"/g, '&quot;')}">${display}</td>`;
                    }).join('')}
                </tr>`).join('');
        }

        document.getElementById('records-modal').classList.add('active');
    }

    // ── Export button — export full live data ──
    document.getElementById('export-btn').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(tableData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'wevents_database_export.json';
        a.click();
        showToast('Database exported as JSON!', 'success');
    });

    document.getElementById('refresh-btn').addEventListener('click', async () => {
        await loadAllTables();
        showToast('All tables refreshed from backend!', 'success');
    });

    document.getElementById('close-records-btn').addEventListener('click', () => document.getElementById('records-modal').classList.remove('active'));
    document.getElementById('modal-add-record-btn')?.addEventListener('click', () => {
        document.getElementById('records-modal').classList.remove('active');
        showToast('To add records, use the main portal (Client/Attendee/etc.) or Swagger at http://localhost:3000/api', 'info');
    });

    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => b.closest('.modal-overlay').classList.remove('active')));
    document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', (e) => { if (e.target === o) o.classList.remove('active'); }));

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

    // ── Initial load ──
    showToast('Loading database tables from backend…', 'info');
    await loadAllTables();
});