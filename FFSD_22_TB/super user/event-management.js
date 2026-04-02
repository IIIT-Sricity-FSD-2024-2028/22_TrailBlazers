document.addEventListener('DOMContentLoaded', () => {
    // Initialize DataStore
    DataStore.init();

    // ── Account dropdown ──
    document.getElementById('header-user').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('header-dropdown').classList.toggle('active'); });
    document.addEventListener('click', () => document.getElementById('header-dropdown').classList.remove('active'));
    document.getElementById('notif-bell').addEventListener('click', () => showToast('You have 3 new notifications', 'info'));
    document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('wevents_user'); window.location.href = '../lp/index.html'; });

    // ══════════════════════════════════════════════════════════
    //  EXISTING EVENTS (Active / Queued / Completed)
    // ══════════════════════════════════════════════════════════
    function getUnifiedEvents() {
        const data = DataStore.getEvents();
        return data.map(e => {
            let statusMap = e.status;
            if (e.status === 'upcoming') statusMap = 'Active';
            if (e.status === 'pending') statusMap = 'Queued';
            if (e.status === 'completed') statusMap = 'Completed';
            
            const mgr = e.managerName || 'System Admin';
            const mAvatar = mgr.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
            const colors = ['#7c3aed', '#2563eb', '#16a34a', '#ea580c', '#db2777'];
            const mColor = colors[mgr.length % colors.length];
            
            return {
                id: e.id,
                name: e.title,
                location: e.location || 'Virtual',
                client: e.domain || 'Internal',
                manager: mgr,
                mAvatar: mAvatar,
                mColor: mColor,
                status: statusMap,
                attendees: e.attendees || 0,
                date: e.date || '',
                team: []
            };
        });
    }
    const events = getUnifiedEvents();

    // ══════════════════════════════════════════════════════════
    //  PENDING APPROVAL EVENTS (Fetched from unified DataStore)
    // ══════════════════════════════════════════════════════════
    let rawPendingEvents = DataStore.getEvents().filter(e => e.status === 'pending' || e.status === 'Waiting');
    // Map them clearly for pending template
    let pendingEvents = rawPendingEvents.map(e => ({
        id: e.id,
        name: e.title,
        location: e.location || 'Virtual',
        client: e.domain || 'Client',
        clientEmail: 'contact@client.com',
        date: e.date,
        fullDate: new Date(e.date || Date.now()).toDateString(),
        expected: e.capacity || 0,
        description: e.description,
        type: 'In-Person',
        status: e.status
    }));

    const approvedEvents = [];
    const waitingEvents = [];

    // ══════════════════════════════════════════════════════════
    //  MAIN EVENTS TABLE (Active / Queued / Completed)
    // ══════════════════════════════════════════════════════════
    let currentStatus = 'all';
    const tbody = document.getElementById('events-tbody');
    const searchInput = document.getElementById('event-search');

    function render() {
        const search = searchInput.value.toLowerCase();
        const filtered = events.filter(e => {
            const matchSearch = e.name.toLowerCase().includes(search) || e.client.toLowerCase().includes(search);
            const matchStatus = currentStatus === 'all' || currentStatus === 'Pending' || e.status === currentStatus;
            return matchSearch && matchStatus;
        });
        const badgeMap = { Active: 'badge-active', Queued: 'badge-queued', Completed: 'badge-completed' };
        tbody.innerHTML = filtered.map((e, idx) => `<tr class="event-row" data-idx="${idx}" style="cursor:pointer; transition:background .2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
            <td><div class="user-cell-info"><span class="user-cell-name">${e.name}</span><span class="user-cell-sub">${e.location}</span></div></td>
            <td>${e.client}</td>
            <td><div class="user-cell"><div class="user-cell-avatar" style="background:${e.mColor}">${e.mAvatar}</div><span>${e.manager}</span></div></td>
            <td><span class="badge ${badgeMap[e.status]}"><span class="badge-dot"></span> ${e.status}</span></td>
            <td><span style="display:flex;align-items:center;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> ${e.attendees}</span></td>
            <td>${e.date}</td>
        </tr>`).join('');
        
        updateStats();

        // Click on row to view details
        document.querySelectorAll('.event-row').forEach(row => {
            row.addEventListener('click', () => {
                const e = filtered[parseInt(row.dataset.idx)];
                const badgeMap2 = { Active: 'badge-active', Queued: 'badge-queued', Completed: 'badge-completed' };
                document.getElementById('detail-ev-name').textContent = e.name;
                document.getElementById('detail-ev-status').innerHTML = `<span class="badge ${badgeMap2[e.status]}"><span class="badge-dot"></span> ${e.status}</span>`;
                document.getElementById('detail-ev-client').textContent = e.client;
                document.getElementById('detail-ev-location').textContent = e.location;
                document.getElementById('detail-ev-manager').textContent = e.manager;
                
                const teamHtml = e.team && e.team.length ? e.team.map(t => `<div style="display:flex;align-items:center;padding:6px;background:#fff;border-radius:4px;border:1px solid #e2e8f0;"><div class="user-cell-avatar" style="width:24px;height:24px;font-size:10px;background:#64748b;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:50%;">${t.avatar}</div><div style="margin-left:8px;"><div style="font-size:13px;font-weight:600;color:var(--text-primary);">${t.name}</div><div style="font-size:11px;color:var(--text-muted);">${t.role}</div></div></div>`).join('') : '';
                document.getElementById('detail-ev-team').innerHTML = teamHtml || '<div style="font-size:13px;color:var(--text-muted);padding:4px;">No onsite team assigned yet.</div>';
                
                document.getElementById('event-details-modal').classList.add('active');
            });
        });

        // Toggle pending approval section visibility
        const pendingSection = document.getElementById('pending-approval-section');
        if (pendingSection) {
            pendingSection.style.display = (currentStatus === 'all' || currentStatus === 'Pending') ? '' : 'none';
        }
    }

    function updateStats() {
        const _all = getUnifiedEvents();
        document.getElementById('stat-total').textContent = _all.length;
        document.getElementById('stat-active').textContent = _all.filter(e => e.status === 'Active').length;
        document.getElementById('stat-queued').textContent = _all.filter(e => e.status === 'Queued').length;
        document.getElementById('stat-completed').textContent = _all.filter(e => e.status === 'Completed').length;
        document.getElementById('stat-pending').textContent = pendingEvents.length;
    }

    searchInput.addEventListener('input', render);
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = tab.dataset.status;
            render();
        });
    });

    // ══════════════════════════════════════════════════════════
    //  PENDING APPROVAL TABLE & WORKFLOW
    // ══════════════════════════════════════════════════════════
    let currentPendingIdx = -1;

    function renderPendingEvents() {
        const ptbody = document.getElementById('pending-tbody');
        if (pendingEvents.length === 0) {
            ptbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px;">🎉 No pending events — all caught up!</td></tr>';
        } else {
            ptbody.innerHTML = pendingEvents.map((e, i) =>
                '<tr style="cursor:pointer;transition:background .2s;" onmouseover="this.style.background=\'#fffbeb\'" onmouseout="this.style.background=\'\'">' +
                '<td><span class="pending-ev-name" data-idx="' + i + '" style="font-weight:600;color:#ea580c;cursor:pointer;">' + e.name + '</span><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + e.location + '</div></td>' +
                '<td>' + e.client + '</td>' +
                '<td>' + e.date + '</td>' +
                '<td><span style="display:flex;align-items:center;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> ' + e.expected + '</span></td>' +
                '<td><span class="badge badge-queued"><span class="badge-dot"></span> Pending</span></td>' +
                '</tr>'
            ).join('');
            ptbody.querySelectorAll('.pending-ev-name').forEach(el => {
                el.addEventListener('click', () => openApprovalModal(parseInt(el.dataset.idx)));
            });
            // Also make entire row clickable
            ptbody.querySelectorAll('tr').forEach((row, i) => {
                row.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('pending-ev-name')) {
                        openApprovalModal(i);
                    }
                });
            });
        }
        const summaryEl = document.getElementById('pending-summary');
        if (summaryEl) {
            summaryEl.textContent = pendingEvents.length + ' pending · ' + approvedEvents.length + ' approved · ' + waitingEvents.length + ' waiting for manager';
        }
        updateStats();
    }

    function renderApprovedEvents() {
        const section = document.getElementById('approved-section');
        const atbody = document.getElementById('approved-tbody');
        if (approvedEvents.length === 0) {
            section.style.display = 'none';
        } else {
            section.style.display = '';
            atbody.innerHTML = approvedEvents.map(e =>
                '<tr>' +
                '<td><div style="font-weight:600;color:#16a34a;">' + e.name + '</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + e.location + '</div></td>' +
                '<td>' + e.client + '</td>' +
                '<td>' + e.date + '</td>' +
                '<td><span style="display:flex;align-items:center;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> ' + e.expected + '</span></td>' +
                '<td><span class="badge badge-active"><span class="badge-dot"></span> Approved</span></td>' +
                '</tr>'
            ).join('');
        }
    }

    // ── Approval Modal ──
    function openApprovalModal(idx) {
        currentPendingIdx = idx;
        const e = pendingEvents[idx];
        document.getElementById('apm-name').textContent = e.name;
        document.getElementById('apm-desc').textContent = e.description;
        document.getElementById('apm-client').textContent = e.client;
        document.getElementById('apm-client-email').textContent = e.clientEmail;
        document.getElementById('apm-date').textContent = e.fullDate;
        document.getElementById('apm-location').textContent = e.location;
        document.getElementById('apm-attendees').textContent = e.expected + ' members';
        document.getElementById('apm-type').textContent = e.type;
        document.getElementById('apm-status').innerHTML = '<span class="badge badge-queued"><span class="badge-dot"></span> ' + e.status + '</span>';
        document.getElementById('approval-modal').classList.add('active');
    }

    function closeApprovalModal() {
        document.getElementById('approval-modal').classList.remove('active');
        currentPendingIdx = -1;
    }

    // Approve
    document.getElementById('apm-approve-btn').addEventListener('click', () => {
        if (currentPendingIdx < 0) return;
        const e = pendingEvents.splice(currentPendingIdx, 1)[0];
        e.status = 'Approved';
        
        // Sync to unified localStorage
        DataStore.updateEvent(e.id, { status: 'upcoming' });

        approvedEvents.push(e);
        closeApprovalModal();
        
        // Refresh local cache for table render
        events.length = 0;
        events.push(...getUnifiedEvents());
        
        renderPendingEvents();
        renderApprovedEvents();
        render(); // Re-render main table
        showToast(`"${e.name}" has been approved and moved to active!`, 'success');
    });

    // Reject
    document.getElementById('apm-reject-btn').addEventListener('click', () => {
        if (currentPendingIdx < 0) return;
        const e = pendingEvents.splice(currentPendingIdx, 1)[0];
        DataStore.updateEvent(e.id, { status: 'rejected' });
        
        closeApprovalModal();
        renderPendingEvents();
        renderApprovedEvents();
        showToast(`"${e.name}" has been rejected.`, 'error');
    });

    // Waiting
    document.getElementById('apm-waiting-btn').addEventListener('click', () => {
        if (currentPendingIdx < 0) return;
        const e = pendingEvents.splice(currentPendingIdx, 1)[0];
        e.status = 'Waiting';
        waitingEvents.push(e);
        DataStore.updateEvent(e.id, { status: 'Waiting' });
        
        closeApprovalModal();
        renderPendingEvents();
        renderApprovedEvents();
        showToast(`"${e.name}" marked as waiting for manager.`, 'info');
    });

    // Close
    document.getElementById('apm-close-btn').addEventListener('click', closeApprovalModal);

    // ══════════════════════════════════════════════════════════
    //  CREATE EVENT & MODALS
    // ══════════════════════════════════════════════════════════
    document.getElementById('create-event-btn').addEventListener('click', () => document.getElementById('create-event-modal').classList.add('active'));
    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => {
        b.closest('.modal-overlay').classList.remove('active');
        currentPendingIdx = -1;
    }));
    document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', (e) => {
        if (e.target === o) {
            o.classList.remove('active');
            currentPendingIdx = -1;
        }
    }));

    document.getElementById('create-event-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('ev-name').value;
        const managerMap = {'Priya Sharma':{a:'PS',c:'#7c3aed'},'Arjun Mehta':{a:'AM',c:'#2563eb'},'Riya Kapoor':{a:'RK',c:'#16a34a'},'Vikram Singh':{a:'VS',c:'#ea580c'}};
        const mgr = document.getElementById('ev-manager').value;
        
        const newEv = DataStore.addEvent({
            title: name,
            status: 'pending',
            date: document.getElementById('ev-date').value,
            location: document.getElementById('ev-location').value,
            attendees: 0,
            capacity: 100,
            domain: document.getElementById('ev-client').value,
            managerName: mgr,
            description: 'Created from Super User dashboard'
        });
        
        events.push({ 
            name, location: newEv.location, client: newEv.domain, 
            manager: mgr, mAvatar: managerMap[mgr].a, mColor: managerMap[mgr].c, 
            status: 'Queued', attendees: 0, 
            date: new Date(newEv.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), team: [] 
        });

        render(); document.getElementById('create-event-modal').classList.remove('active'); e.target.reset();
        showToast(`Event "${name}" created!`, 'success');
    });

    // ══════════════════════════════════════════════════════════
    //  INITIAL RENDER
    // ══════════════════════════════════════════════════════════
    render();
    renderPendingEvents();
    renderApprovedEvents();

    // ── Toast helper ──
    window.showToast = function(msg, type='info') { const c=document.getElementById('toast-container'); const t=document.createElement('div'); t.className=`toast ${type}`; const icons={success:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',error:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',info:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}; t.innerHTML=`${icons[type]||icons.info} ${msg}`; c.appendChild(t); requestAnimationFrame(()=>t.classList.add('show')); setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},3500); };
});
