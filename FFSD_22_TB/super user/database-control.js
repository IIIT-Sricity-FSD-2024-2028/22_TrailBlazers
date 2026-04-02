document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('header-user').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('header-dropdown').classList.toggle('active'); });
    document.addEventListener('click', () => document.getElementById('header-dropdown').classList.remove('active'));
    document.getElementById('notif-bell').addEventListener('click', () => showToast('You have 3 new notifications', 'info'));
    document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '../lp/index.html'; });

    /* ═══════════════════════════════════════
       DATABASE SCHEMA DEFINITION
       Matches the updated SQL schema completely
    ═══════════════════════════════════════ */
    const schema = {
        User: {
            columns: ['user_id', 'name', 'email', 'phone', 'password', 'created_at', 'status'],
            records: [
                { user_id: 1, name: 'Alice Admin', email: 'alice@example.com', phone: '1234567890', password: '***', created_at: '2026-01-05 10:00:00', status: 'Active' },
                { user_id: 2, name: 'Bob Client', email: 'bob@example.com', phone: '0987654321', password: '***', created_at: '2026-01-10 11:30:00', status: 'Active' },
                { user_id: 3, name: 'Charlie Coord', email: 'charlie@example.com', phone: '1112223333', password: '***', created_at: '2026-02-01 09:15:00', status: 'Active' },
                { user_id: 4, name: 'David Manager', email: 'david@example.com', phone: '4445556666', password: '***', created_at: '2026-02-05 14:20:00', status: 'Active' },
                { user_id: 5, name: 'Eve Attendee', email: 'eve@example.com', phone: '7778889999', password: '***', created_at: '2026-03-01 16:45:00', status: 'Active' }
            ]
        },
        Client: {
            columns: ['client_id', 'organization_name'],
            records: [
                { client_id: 2, organization_name: 'TechCorp Solutions' }
            ]
        },
        Coordinator: {
            columns: ['coordinator_id', 'assigned_zone'],
            records: [
                { coordinator_id: 3, assigned_zone: 'North Wing' }
            ]
        },
        Event_Manager: {
            columns: ['manager_id', 'experience_level'],
            records: [
                { manager_id: 4, experience_level: 'Senior' }
            ]
        },
        Attendee: {
            columns: ['attendee_id', 'registration_status'],
            records: [
                { attendee_id: 5, registration_status: 'Registered' }
            ]
        },
        Event: {
            columns: ['event_id', 'title', 'description', 'date', 'location', 'status', 'created_at', 'client_id', 'manager_id', 'coordinator_id'],
            records: [
                { event_id: 101, title: 'Annual Tech Summit', description: 'Tech conference for developers.', date: '2026-06-15', location: 'Convention Center', status: 'Upcoming', created_at: '2026-03-15 08:00:00', client_id: 2, manager_id: 4, coordinator_id: 3 }
            ]
        },
        Session: {
            columns: ['session_id', 'topic', 'start_time', 'end_time', 'event_id'],
            records: [
                { session_id: 1001, topic: 'Future of AI', start_time: '2026-06-15 09:00:00', end_time: '2026-06-15 10:30:00', event_id: 101 }
            ]
        },
        Poll: {
            columns: ['poll_id', 'question', 'created_at', 'event_id'],
            records: [
                { poll_id: 501, question: 'What is your favorite new web framework?', created_at: '2026-06-15 09:45:00', event_id: 101 }
            ]
        },
        Poll_Response: {
            columns: ['response_id', 'answer', 'poll_id', 'attendee_id'],
            records: [
                { response_id: 5001, answer: 'React 19', poll_id: 501, attendee_id: 5 }
            ]
        },
        Check_In: {
            columns: ['check_in_id', 'status', 'check_in_time', 'event_id', 'attendee_id'],
            records: [
                { check_in_id: 9001, status: 'Checked In', check_in_time: '2026-06-15 08:30:00', event_id: 101, attendee_id: 5 }
            ]
        },
        RSVP: {
            columns: ['rsvp_id', 'rsvp_date', 'status', 'event_id', 'attendee_id'],
            records: [
                { rsvp_id: 8001, rsvp_date: '2026-04-01', status: 'Confirmed', event_id: 101, attendee_id: 5 }
            ]
        },
        Feedback: {
            columns: ['feedback_id', 'rating', 'comment', 'created_at', 'attendee_id', 'event_id'],
            records: [
                { feedback_id: 7001, rating: 5, comment: 'Great session, learned a lot.', created_at: '2026-06-16 10:00:00', attendee_id: 5, event_id: 101 }
            ]
        },
        Report: {
            columns: ['report_id', 'attendance_count', 'poll_participation', 'feedback_score', 'generated_at', 'event_id'],
            records: [
                { report_id: 6001, attendance_count: 450, poll_participation: 320, feedback_score: 4.8, generated_at: '2026-06-17 08:00:00', event_id: 101 }
            ]
        }
    };

    // Load persisted data from localStorage or use defaults
    const savedSchema = localStorage.getItem('db_control_schema');
    const dbData = savedSchema ? JSON.parse(savedSchema) : JSON.parse(JSON.stringify(schema));

    function saveSchema() {
        localStorage.setItem('db_control_schema', JSON.stringify(dbData));
    }

    const tables = Object.keys(dbData).map(name => {
        const t = dbData[name];
        const sizeKB = JSON.stringify(t.records).length;
        return {
            name,
            health: t.records.length > 0 ? 'healthy' : 'warning',
            records: t.records.length,
            size: sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB',
            updated: ['2 min ago', '5 min ago', '30 sec ago', '1 min ago', '10 min ago'][Math.floor(Math.random() * 5)]
        };
    });

    const tbody = document.getElementById('db-tbody');

    function render() {
        // Recalculate tables array from dbData
        const currentTables = Object.keys(dbData).map(name => {
            const t = dbData[name];
            const sizeKB = JSON.stringify(t.records).length;
            return {
                name,
                health: t.records.length > 0 ? 'healthy' : 'warning',
                records: t.records.length,
                size: sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB',
                updated: ['2 min ago', '5 min ago', '30 sec ago', '1 min ago', '10 min ago'][Math.floor(Math.random() * 5)]
            };
        });

        // Update global stat cards in main view
        const statTables = document.getElementById('stat-total-tables');
        const statRecords = document.getElementById('stat-total-records');
        const statSize = document.getElementById('stat-total-size');
        
        if (statTables && statRecords && statSize) {
            statTables.textContent = currentTables.length;
            const totalRecordsSum = Object.values(dbData).reduce((sum, t) => sum + t.records.length, 0);
            statRecords.textContent = totalRecordsSum.toLocaleString();
            const totalSizeByte = Object.values(dbData).reduce((sum, t) => sum + JSON.stringify(t.records).length, 0);
            statSize.textContent = totalSizeByte > 1024 * 1024 ? (totalSizeByte / (1024 * 1024)).toFixed(1) + ' MB' : (totalSizeByte / 1024).toFixed(1) + ' KB';
        }

        tbody.innerHTML = currentTables.map(t => `<tr style="border-bottom:1px solid var(--border-light);">
            <td><span class="db-table-name">${t.name}</span></td>
            <td><div class="db-health ${t.health}"><span class="db-health-dot"></span> ${t.health === 'healthy' ? 'Healthy' : 'Warning'}</div></td>
            <td>${t.records.toLocaleString()}</td>
            <td>${t.size}</td>
            <td>${t.updated}</td>
            <td>
                <div style="display:flex;gap:6px;">
                    <button class="btn btn-info btn-view" data-name="${t.name}" style="padding:5px 10px;font-size:12px;">View</button>
                    <button class="btn btn-success btn-add" data-name="${t.name}" style="padding:5px 10px;font-size:12px;">Add</button>
                    <button class="btn btn-danger btn-delete" data-name="${t.name}" style="padding:5px 10px;font-size:12px;">Delete</button>
                </div>
            </td>
        </tr>`).join('');

        attachButtonHandlers();
    }

    function attachButtonHandlers() {
        // VIEW buttons
        tbody.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', () => openRecordsModal(btn.dataset.name));
        });

        // ADD buttons
        tbody.querySelectorAll('.btn-add').forEach(btn => {
            btn.addEventListener('click', () => openAddRecordModal(btn.dataset.name));
        });

        // DELETE buttons
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(btn.dataset.name));
        });
    }

    /* ─── VIEW RECORDS MODAL ─── */
    let currentViewTable = '';
    function openRecordsModal(tableName) {
        const table = dbData[tableName];
        if (!table) return;
        currentViewTable = tableName;

        document.getElementById('records-table-name').textContent = tableName;
        const recordsHead = document.getElementById('records-thead');
        const recordsBody = document.getElementById('records-tbody');
        const columnBadges = document.getElementById('records-columns-badges');
        const countLabel = document.getElementById('records-count-label');

        // Populate column badges
        columnBadges.innerHTML = table.columns.map(col =>
            `<span style="background:#eff6ff;color:var(--info);padding:4px 10px;border-radius:4px;font-size:12px;font-family:monospace;">${col}</span>`
        ).join('');

        // Update count label
        if (countLabel) countLabel.textContent = `Showing ${table.records.length} record${table.records.length !== 1 ? 's' : ''}`;

        // Build dynamic headers from columns
        recordsHead.innerHTML = `<tr>
            ${table.columns.map(col => `<th style="padding:12px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${col}</th>`).join('')}
            <th style="padding:12px 16px;text-align:right;padding-right:24px;font-weight:600;color:var(--text-muted);font-size:12px;">ACTIONS</th>
        </tr>`;

        // Build rows
        if (table.records.length === 0) {
            recordsBody.innerHTML = `<tr><td colspan="${table.columns.length + 1}" style="padding:30px;text-align:center;color:var(--text-muted);">No records found in this table.</td></tr>`;
        } else {
            recordsBody.innerHTML = table.records.map((rec, idx) => `<tr style="border-bottom:1px solid var(--border-light);${idx % 2 === 1 ? 'background:#fafafa;' : ''}">
                ${table.columns.map(col => {
                    let val = rec[col];
                    // Color code status fields
                    if (col === 'status' || col === 'is_read') {
                        const isGood = val === 'Active' || val === 'Confirmed' || val === 'upcoming' || val === true;
                        const color = isGood ? 'var(--success)' : 'var(--text-muted)';
                        return `<td style="padding:12px 16px;color:${color};"><span class="badge-dot" style="background:${color}"></span> ${val}</td>`;
                    }
                    if (col === 'rating') {
                        return `<td style="padding:12px 16px;color:#f97316;font-weight:600;">${'★'.repeat(val)}${'☆'.repeat(5-val)}</td>`;
                    }
                    if (col === 'amount') {
                        return `<td style="padding:12px 16px;">₹${Number(val).toLocaleString()}</td>`;
                    }
                    return `<td style="padding:12px 16px;">${val}</td>`;
                }).join('')}
                <td style="padding:12px 16px;text-align:right;padding-right:24px;">
                    <button class="record-delete-btn" data-table="${tableName}" data-idx="${idx}" style="border:1px solid var(--border-light);background:white;cursor:pointer;border-radius:4px;padding:4px 8px;color:var(--danger);" title="Delete record">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </td>
            </tr>`).join('');
        }

        // Attach record delete handlers
        document.querySelectorAll('.record-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tName = btn.dataset.table;
                const rIdx = parseInt(btn.dataset.idx);
                dbData[tName].records.splice(rIdx, 1);
                saveSchema();
                openRecordsModal(tName); // re-render
                render(); // update main table counts
                showToast(`Record deleted from ${tName}`, 'error');
            });
        });

        document.getElementById('records-modal').classList.add('active');
    }

    /* ─── ADD RECORD MODAL ─── */
    function openAddRecordModal(tableName) {
        const table = dbData[tableName];
        if (!table) return;

        // Remove existing modal if any
        let addModal = document.getElementById('add-record-modal');
        if (addModal) addModal.remove();

        addModal = document.createElement('div');
        addModal.id = 'add-record-modal';
        addModal.className = 'modal-overlay active';
        addModal.innerHTML = `
            <div class="modal-card" style="max-width:500px; background: #FFFFFF; padding: 28px; box-shadow: 0 10px 40px rgba(0,0,0,0.4);">
                <div class="modal-header">
                    <h3>Add Record to <strong>${tableName}</strong></h3>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body" style="max-height:400px;overflow-y:auto;">
                    <form id="add-record-form" style="display:flex;flex-direction:column;gap:14px;">
                        ${table.columns.map(col => `
                            <div>
                                <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">${col}</label>
                                <input type="text" name="${col}" placeholder="Enter ${col}" style="width:100%;padding:10px 12px;border:1px solid var(--border-light);border-radius:8px;font-size:13px;font-family:inherit;box-sizing:border-box;" required />
                            </div>
                        `).join('')}
                    </form>
                </div>
                <div class="modal-footer" style="display:flex;gap:10px;justify-content:flex-end;padding:16px 20px;border-top:1px solid var(--border-light);">
                    <button class="btn btn-secondary modal-cancel-btn" style="padding:8px 18px;">Cancel</button>
                    <button class="btn btn-success" id="submit-add-record" style="padding:8px 18px;">Add Record</button>
                </div>
            </div>
        `;
        document.body.appendChild(addModal);

        // Close handlers
        addModal.querySelector('.modal-close').addEventListener('click', () => addModal.remove());
        addModal.querySelector('.modal-cancel-btn').addEventListener('click', () => addModal.remove());
        addModal.addEventListener('click', (e) => { if (e.target === addModal) addModal.remove(); });

        // Submit handler
        document.getElementById('submit-add-record').addEventListener('click', () => {
            const form = document.getElementById('add-record-form');
            const formData = new FormData(form);
            const newRecord = {};
            let valid = true;
            table.columns.forEach(col => {
                let val = formData.get(col)?.trim();
                if (!val) { valid = false; return; }
                // Auto-cast numbers
                if (!isNaN(val) && val !== '') val = Number(val);
                // Auto-cast booleans
                if (val === 'true') val = true;
                if (val === 'false') val = false;
                newRecord[col] = val;
            });

            if (!valid) {
                showToast('Please fill all fields', 'error');
                return;
            }

            dbData[tableName].records.push(newRecord);
            saveSchema();
            render();
            addModal.remove();
            showToast(`Record added to ${tableName} successfully!`, 'success');
        });
    }

    /* ─── DELETE TABLE MODAL ─── */
    let deleteTarget = '';
    function openDeleteModal(tableName) {
        deleteTarget = tableName;
        document.getElementById('delete-table-name').textContent = deleteTarget;
        document.getElementById('delete-confirm-input').value = '';
        document.getElementById('confirm-delete-btn').disabled = true;
        document.getElementById('delete-modal').classList.add('active');
    }

    document.getElementById('delete-confirm-input').addEventListener('input', (e) => {
        document.getElementById('confirm-delete-btn').disabled = e.target.value !== deleteTarget;
    });

    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        if (dbData[deleteTarget]) {
            delete dbData[deleteTarget];
            saveSchema();
            render();
        }
        document.getElementById('delete-modal').classList.remove('active');
        showToast(`Table "${deleteTarget}" deleted!`, 'error');
    });

    render();

    document.getElementById('export-btn').addEventListener('click', () => {
        // Actually export the data as JSON
        const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'wevents_database_export.json';
        a.click();
        showToast('Database exported as JSON!', 'success');
    });

    document.getElementById('refresh-btn').addEventListener('click', () => {
        render();
        showToast('Database refreshed!', 'success');
    });

    document.getElementById('close-records-btn').addEventListener('click', () => document.getElementById('records-modal').classList.remove('active'));
    document.getElementById('modal-add-record-btn')?.addEventListener('click', () => {
        if (currentViewTable) {
            document.getElementById('records-modal').classList.remove('active');
            openAddRecordModal(currentViewTable);
        }
    });

    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => b.closest('.modal-overlay').classList.remove('active')));
    document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', (e) => { if (e.target === o) o.classList.remove('active'); }));

    window.showToast = function(msg, type='info') { const c=document.getElementById('toast-container'); const t=document.createElement('div'); t.className=`toast ${type}`; const icons={success:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',error:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',info:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}; t.innerHTML=`${icons[type]||icons.info} ${msg}`; c.appendChild(t); requestAnimationFrame(()=>t.classList.add('show')); setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},3500); };
});
