document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('header-user').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('header-dropdown').classList.toggle('active'); });
    document.addEventListener('click', () => document.getElementById('header-dropdown').classList.remove('active'));
    document.getElementById('notif-bell').addEventListener('click', () => showToast('You have 3 new notifications', 'info'));
    document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '../landing-page/index.html'; });

    // Maintenance toggle
    document.getElementById('toggle-maintenance').addEventListener('click', function() {
        this.classList.toggle('active');
        showToast(this.classList.contains('active') ? 'Maintenance mode ENABLED' : 'Maintenance mode DISABLED', this.classList.contains('active') ? 'error' : 'success');
    });

    // Refresh
    document.getElementById('refresh-health').addEventListener('click', () => showToast('System health data refreshed!', 'success'));

    const services = [
        { name: 'API Gateway', icon: '🔌', status: 'online', uptime: 99.98, response: '12ms', lastCheck: '10 sec ago', iconBg: '#dcfce7', iconColor: '#16a34a' },
        { name: 'Authentication Service', icon: '🔐', status: 'online', uptime: 99.95, response: '28ms', lastCheck: '15 sec ago', iconBg: '#eff6ff', iconColor: '#2563eb' },
        { name: 'Database Cluster', icon: '🗄️', status: 'online', uptime: 99.99, response: '8ms', lastCheck: '5 sec ago', iconBg: '#f3e8ff', iconColor: '#7c3aed' },
        { name: 'Email Service', icon: '📧', status: 'degraded', uptime: 87.20, response: '245ms', lastCheck: '30 sec ago', iconBg: '#fef3c7', iconColor: '#d97706' },
        { name: 'File Storage', icon: '📁', status: 'online', uptime: 99.90, response: '35ms', lastCheck: '20 sec ago', iconBg: '#fff7ed', iconColor: '#ea580c' },
        { name: 'Analytics Engine', icon: '📊', status: 'offline', uptime: 0, response: '—', lastCheck: '23 min ago', iconBg: '#fef2f2', iconColor: '#dc2626' },
        { name: 'Notification Service', icon: '🔔', status: 'online', uptime: 99.92, response: '18ms', lastCheck: '8 sec ago', iconBg: '#dcfce7', iconColor: '#16a34a' },
        { name: 'Search Index', icon: '🔍', status: 'online', uptime: 99.88, response: '42ms', lastCheck: '12 sec ago', iconBg: '#eff6ff', iconColor: '#2563eb' },
    ];

    const tbody = document.getElementById('services-tbody');
    const statusBadge = { online: 'badge-active', degraded: 'badge-warning', offline: 'badge-inactive' };
    const statusLabel = { online: 'Online', degraded: 'Degraded', offline: 'Offline' };
    const barColor = { online: '#16a34a', degraded: '#d97706', offline: '#dc2626' };

    function render() {
        tbody.innerHTML = services.map(s => `<tr>
            <td><div class="service-name"><div class="service-icon" style="background:${s.iconBg}">${s.icon}</div><span style="font-weight:600">${s.name}</span></div></td>
            <td><span class="badge ${statusBadge[s.status]}"><span class="badge-dot"></span> ${statusLabel[s.status]}</span></td>
            <td><div style="display:flex;align-items:center;gap:6px"><div class="uptime-bar"><div class="uptime-bar-fill" style="width:${s.uptime}%;background:${barColor[s.status]}"></div></div><span class="uptime-text">${s.uptime}%</span></div></td>
            <td>${s.response}</td>
            <td>${s.lastCheck}</td>
        </tr>`).join('');
    }
    render();

    window.showToast = function(msg, type='info') { const c=document.getElementById('toast-container'); const t=document.createElement('div'); t.className=`toast ${type}`; const icons={success:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',error:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',info:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}; t.innerHTML=`${icons[type]||icons.info} ${msg}`; c.appendChild(t); requestAnimationFrame(()=>t.classList.add('show')); setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},3500); };
});