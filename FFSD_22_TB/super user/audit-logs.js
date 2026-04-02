document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('header-user').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('header-dropdown').classList.toggle('active'); });
    document.addEventListener('click', () => document.getElementById('header-dropdown').classList.remove('active'));
    document.getElementById('notif-bell').addEventListener('click', () => showToast('You have 3 new notifications', 'info'));
    document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '../lp/index.html'; });

    const logs = [
        { action: 'USER_CREATED', actionIcon: '👤', by: 'Amanda Phillips', byAvatar: 'AP', byColor: '#f97316', entity: 'Sneha Patel (User)', severity: 'Info', ip: '192.168.1.12', time: 'Mar 30, 2026 14:22' },
        { action: 'EVENT_DELETED', actionIcon: '🗑️', by: 'Amanda Phillips', byAvatar: 'AP', byColor: '#f97316', entity: 'Old Workshop 2025 (Event)', severity: 'Critical', ip: '192.168.1.12', time: 'Mar 30, 2026 13:45' },
        { action: 'ROLE_UPDATED', actionIcon: '🔄', by: 'Amanda Phillips', byAvatar: 'AP', byColor: '#f97316', entity: 'Arjun Mehta → Coordinator', severity: 'Warning', ip: '192.168.1.12', time: 'Mar 30, 2026 12:30' },
        { action: 'SETTINGS_CHANGED', actionIcon: '⚙️', by: 'Amanda Phillips', byAvatar: 'AP', byColor: '#f97316', entity: 'Platform Config', severity: 'Info', ip: '192.168.1.12', time: 'Mar 30, 2026 11:15' },
        { action: 'USER_DELETED', actionIcon: '❌', by: 'Amanda Phillips', byAvatar: 'AP', byColor: '#f97316', entity: 'Test User (User)', severity: 'Critical', ip: '192.168.1.12', time: 'Mar 29, 2026 16:40' },
        { action: 'EVENT_CREATED', actionIcon: '📅', by: 'Priya Sharma', byAvatar: 'PS', byColor: '#7c3aed', entity: 'Design Summit (Event)', severity: 'Info', ip: '10.0.0.45', time: 'Mar 29, 2026 14:20' },
        { action: 'LOGIN', actionIcon: '🔑', by: 'Vikram Singh', byAvatar: 'VS', byColor: '#ea580c', entity: 'Dashboard', severity: 'Info', ip: '172.16.0.8', time: 'Mar 29, 2026 09:05' },
        { action: 'ROLE_UPDATED', actionIcon: '🔄', by: 'Amanda Phillips', byAvatar: 'AP', byColor: '#f97316', entity: 'Riya Kapoor → Event Manager', severity: 'Warning', ip: '192.168.1.12', time: 'Mar 28, 2026 17:30' },
        { action: 'EVENT_DELETED', actionIcon: '🗑️', by: 'Amanda Phillips', byAvatar: 'AP', byColor: '#f97316', entity: 'Cancelled Meetup (Event)', severity: 'Critical', ip: '192.168.1.12', time: 'Mar 28, 2026 15:10' },
        { action: 'USER_CREATED', actionIcon: '👤', by: 'Amanda Phillips', byAvatar: 'AP', byColor: '#f97316', entity: 'Karan Joshi (User)', severity: 'Info', ip: '192.168.1.12', time: 'Mar 28, 2026 11:45' },
        { action: 'SETTINGS_CHANGED', actionIcon: '⚙️', by: 'Amanda Phillips', byAvatar: 'AP', byColor: '#f97316', entity: 'Email Settings', severity: 'Warning', ip: '192.168.1.12', time: 'Mar 27, 2026 16:20' },
        { action: 'LOGIN', actionIcon: '🔑', by: 'Arjun Mehta', byAvatar: 'AM', byColor: '#2563eb', entity: 'Dashboard', severity: 'Warning', ip: '10.0.0.22', time: 'Mar 27, 2026 08:30' },
    ];

    const tbody = document.getElementById('logs-tbody');
    const searchInput = document.getElementById('log-search');
    const actionFilter = document.getElementById('action-filter');
    const severityFilter = document.getElementById('severity-filter');

    const severityBadge = { Critical: 'badge-critical', Warning: 'badge-warning', Info: 'badge-info' };

    let currentPage = 1;
    const itemsPerPage = 10;

    function renderPaginationButtons(totalPages) {
        const pageNumbers = document.getElementById('page-numbers');
        document.getElementById('prev-page').disabled = currentPage === 1;
        document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;

        let html = '';
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);
        
        if (totalPages > 5) {
            if (startPage <= 2) endPage = 5;
            if (endPage >= totalPages - 1) startPage = totalPages - 4;
        }

        if (startPage > 1) {
            html += `<button class="btn btn-secondary btn-sm page-btn" data-page="1" style="padding: 4px 10px; font-size: 13px;">1</button>`;
            if (startPage > 2) html += `<span style="padding: 4px 6px;">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="btn btn-sm page-btn" data-page="${i}" style="padding: 4px 10px; font-size: 13px; ${i === currentPage ? 'background:var(--accent);color:white;border-color:var(--accent);' : 'background:transparent;border:1px solid var(--border-color);color:var(--text-main);'}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span style="padding: 4px 6px;">...</span>`;
            html += `<button class="btn btn-secondary btn-sm page-btn" data-page="${totalPages}" style="padding: 4px 10px; font-size: 13px;">${totalPages}</button>`;
        }

        pageNumbers.innerHTML = html;

        pageNumbers.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentPage = parseInt(btn.dataset.page);
                render();
            });
        });
    }

    function render() {
        const search = searchInput.value.toLowerCase();
        const action = actionFilter.value;
        const severity = severityFilter.value;
        const filtered = logs.filter(l => {
            const matchSearch = l.action.toLowerCase().includes(search) || l.by.toLowerCase().includes(search) || l.entity.toLowerCase().includes(search);
            const matchAction = action === 'all' || l.action === action;
            const matchSeverity = severity === 'all' || l.severity === severity;
            return matchSearch && matchAction && matchSeverity;
        });

        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages || 1;

        const startIdx = (currentPage - 1) * itemsPerPage;
        const pageItems = filtered.slice(startIdx, startIdx + itemsPerPage);

        document.getElementById('page-start').textContent = filtered.length === 0 ? 0 : startIdx + 1;
        document.getElementById('page-end').textContent = Math.min(startIdx + itemsPerPage, filtered.length);
        document.getElementById('page-total').textContent = filtered.length;
        renderPaginationButtons(totalPages);

        tbody.innerHTML = pageItems.map(l => `<tr>
            <td><span class="action-tag"><span>${l.actionIcon}</span> ${l.action}</span></td>
            <td><div class="user-cell"><div class="user-cell-avatar" style="background:${l.byColor}">${l.byAvatar}</div><span>${l.by}</span></div></td>
            <td>${l.entity}</td>
            <td><span class="badge ${severityBadge[l.severity]}">${l.severity}</span></td>
            <td><code style="font-size:12px;background:#f1f5f9;padding:2px 8px;border-radius:4px;">${l.ip}</code></td>
            <td style="white-space:nowrap;font-size:13px;color:var(--text-muted)">${l.time}</td>
        </tr>`).join('');

        document.getElementById('stat-total').textContent = logs.length;
        document.getElementById('stat-critical').textContent = logs.filter(l => l.severity === 'Critical').length;
        document.getElementById('stat-warning').textContent = logs.filter(l => l.severity === 'Warning').length;
        document.getElementById('stat-info').textContent = logs.filter(l => l.severity === 'Info').length;
    }

    document.getElementById('prev-page').addEventListener('click', () => { if (currentPage > 1) { currentPage--; render(); }});
    document.getElementById('next-page').addEventListener('click', () => { currentPage++; render(); });

    searchInput.addEventListener('input', () => { currentPage = 1; render(); });
    actionFilter.addEventListener('change', () => { currentPage = 1; render(); });
    severityFilter.addEventListener('change', () => { currentPage = 1; render(); });
    render();

    window.showToast = function(msg, type='info') { const c=document.getElementById('toast-container'); const t=document.createElement('div'); t.className=`toast ${type}`; const icons={success:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',error:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',info:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}; t.innerHTML=`${icons[type]||icons.info} ${msg}`; c.appendChild(t); requestAnimationFrame(()=>t.classList.add('show')); setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},3500); };
});
