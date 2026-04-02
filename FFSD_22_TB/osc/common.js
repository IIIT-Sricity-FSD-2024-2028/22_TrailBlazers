/* =============================================
   common.js — Shared JS for all dashboard pages
   Handles: Account popup toggle (avatar button)
   ============================================= */

'use strict';

(function initAccountPopup() {
    const avatarBtn   = document.querySelector('.avatar-button');
    const popup       = document.getElementById('account-popup');

    if (!avatarBtn || !popup) return;

    // Toggle popup on avatar click
    avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = popup.classList.contains('active');
        if (isOpen) {
            closePopup();
        } else {
            openPopup();
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (popup.classList.contains('active') && !popup.contains(e.target)) {
            closePopup();
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && popup.classList.contains('active')) {
            closePopup();
        }
    });

    // Logout — direct to landing page
    const logoutBtn = document.getElementById('acct-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            closePopup();
            localStorage.removeItem('currentUser');
            window.location.href = '../lp/index.html';
        });
    }

    function openPopup() {
        popup.classList.add('active');
        avatarBtn.classList.add('active');
    }

    function closePopup() {
        popup.classList.remove('active');
        avatarBtn.classList.remove('active');
    }
})();

/* =============================================
   NOTIFICATIONS SYSTEM
   ============================================= */
(function initNotifications() {
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');
    const notifList = document.getElementById('notif-list');
    const clearAllBtn = document.getElementById('notif-clear-all');

    if (!notifBtn || !notifDropdown || !notifList) return;

    // Toggle dropdown
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = notifDropdown.classList.contains('active');
        
        // Close account popup if it's open
        const accountPopup = document.getElementById('account-popup');
        const avatarBtn = document.querySelector('.avatar-button');
        if (accountPopup && accountPopup.classList.contains('active')) {
            accountPopup.classList.remove('active');
            avatarBtn.classList.remove('active');
        }

        if (isOpen) {
            notifDropdown.classList.remove('active');
        } else {
            notifDropdown.classList.add('active');
            // Mark as read when opened (optional, we could keep them unread until 'resolve')
            notifBtn.classList.remove('has-unread');
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (notifDropdown.classList.contains('active') && !notifDropdown.contains(e.target) && e.target !== notifBtn && !notifBtn.contains(e.target)) {
            notifDropdown.classList.remove('active');
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && notifDropdown.classList.contains('active')) {
            notifDropdown.classList.remove('active');
        }
    });

    // Load from localStorage
    function loadNotifications() {
        const stored = localStorage.getItem('wevents_team_notifications');
        const notifs = stored ? JSON.parse(stored) : [];
        renderNotifications(notifs);
        
        // Check if any unread
        const hasUnread = notifs.some(n => !n.isRead);
        if (hasUnread) {
            notifBtn.classList.add('has-unread');
        } else {
            notifBtn.classList.remove('has-unread');
        }
    }

    // Render list
    function renderNotifications(notifs) {
        if (notifs.length === 0) {
            notifList.innerHTML = '<div class="notif-empty">No new notifications</div>';
            return;
        }

        notifList.innerHTML = '';
        notifs.slice().reverse().forEach(n => {
            const item = document.createElement('div');
            item.className = 'notif-item';
            
            // Priority icon styling
            let iconColorClass = 'priority-low';
            if (n.priority === 'medium') iconColorClass = 'priority-medium';
            if (n.priority === 'high') iconColorClass = 'priority-high';
            if (n.priority === 'critical') iconColorClass = 'priority-critical';

            item.innerHTML = `
                <div class="notif-icon ${iconColorClass}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <div class="notif-content-area">
                    <h4 class="notif-title">${n.title}</h4>
                    <p class="notif-desc">${n.desc}</p>
                    <div class="notif-meta">
                        <small>Reported by ${n.reporter || 'Team Member'} &bull; ${n.time}</small>
                        <button class="notif-resolve-btn" data-id="${n.id}">Resolve</button>
                    </div>
                </div>
            `;
            notifList.appendChild(item);
        });

        // Add listeners to resolve buttons
        notifList.querySelectorAll('.notif-resolve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                resolveNotification(id);
            });
        });
    }

    // Resolve specific notification
    function resolveNotification(id) {
        const stored = localStorage.getItem('wevents_team_notifications');
        if (!stored) return;
        let notifs = JSON.parse(stored);
        notifs = notifs.filter(n => n.id !== id);
        localStorage.setItem('wevents_team_notifications', JSON.stringify(notifs));
        loadNotifications();
    }

    // Clear all
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            localStorage.setItem('wevents_team_notifications', JSON.stringify([]));
            loadNotifications();
        });
    }

    // Listen to changes in other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'wevents_team_notifications') {
            loadNotifications();
        }
    });

    // Custom event listener for same-page updates
    window.addEventListener('teamNotificationAdded', () => {
        loadNotifications();
    });

    // Create global function to add notification
    window.addTeamNotification = function(title, desc, priority, reporter) {
        const stored = localStorage.getItem('wevents_team_notifications');
        const notifs = stored ? JSON.parse(stored) : [];
        
        const newNotif = {
            id: 'notif_' + Date.now() + Math.random().toString(36).substr(2, 5),
            title: title || 'New Issue Reported',
            desc: desc || 'An issue was reported by a team member.',
            priority: priority || 'low',
            reporter: reporter || 'Team Member',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: false
        };

        notifs.push(newNotif);
        
        // Keep only last 20 notifications
        if (notifs.length > 20) notifs = notifs.slice(notifs.length - 20);
        
        localStorage.setItem('wevents_team_notifications', JSON.stringify(notifs));
        
        // Trigger generic event so same page updates
        window.dispatchEvent(new Event('teamNotificationAdded'));
    };

    // Initial load
    loadNotifications();

})();

/* =============================================
   ACTIVITY FILTERING SYSTEM
   ============================================= */
(function initActivityFilter() {
    const filterSelect = document.getElementById('activity-filter');
    const activityList = document.getElementById('activity-list');
    
    if (!filterSelect || !activityList) return;
    
    filterSelect.addEventListener('change', (e) => {
        const filterValue = e.target.value;
        const items = activityList.querySelectorAll('.activity-item');
        
        items.forEach(item => {
            if (filterValue === 'all') {
                item.style.display = 'flex';
            } else {
                if (item.getAttribute('data-status') === filterValue) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    });
})();

/* =============================================
   RECENT ACTIVITY FEED SYSTEM
   ============================================= */
(function initActivityFeed() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    // Seed mock data if not present empty layout
    const defaultActivities = [
        { name: 'Siddu', ticket: 'TKT00248', status: 'approved', time: '2 min ago' },
        { name: 'Sujith', ticket: 'TKT00247', status: 'approved', time: '5 min ago' },
        { name: 'Vipul', ticket: 'TKT00246', status: 'rejected', time: '8 min ago' },
        { name: 'Rahul', ticket: 'TKT00245', status: 'pending', time: '10 min ago' },
        { name: 'Vikas', ticket: 'TKT00243', status: 'approved', time: '12 min ago' },
        { name: 'Sai Nandhan', ticket: 'TKT00244', status: 'approved', time: '15 min ago' }
    ];

    if (!localStorage.getItem('wevents_osc_activity')) {
        localStorage.setItem('wevents_osc_activity', JSON.stringify(defaultActivities));
    }

    function renderActivities() {
        const activities = JSON.parse(localStorage.getItem('wevents_osc_activity')) || [];
        activityList.innerHTML = '';
        
        if (activities.length === 0) {
            activityList.innerHTML = '<div style="padding:16px;text-align:center;color:#64748b;font-size:13px;">No recent activity</div>';
            return;
        }

        activities.forEach(act => {
            const badgeClass = act.status;
            let badgeSymbol = '';
            if (act.status === 'approved') badgeSymbol = '&#10004; Approved';
            else if (act.status === 'rejected') badgeSymbol = '&#10006; Rejected';
            else if (act.status === 'pending') badgeSymbol = '&#8987; Pending';

            const item = document.createElement('div');
            item.className = 'activity-item';
            item.setAttribute('data-status', act.status);
            item.innerHTML = `
                <div><strong>${act.name}</strong><br><small>${act.ticket}</small></div>
                <div class="status-col">
                    <span class="badge ${badgeClass}">${badgeSymbol}</span>
                    <br><small>${act.time}</small>
                </div>
            `;
            activityList.appendChild(item);
        });
        
        // Retrigger filter if selected
        const filterSelect = document.getElementById('activity-filter');
        if (filterSelect) filterSelect.dispatchEvent(new Event('change'));
    }

    window.addOscActivity = function(name, ticket, status) {
        let activities = JSON.parse(localStorage.getItem('wevents_osc_activity')) || [];
        activities.unshift({
            name: name,
            ticket: ticket,
            status: status,
            time: 'Just now'
        });
        
        if (activities.length > 8) {
            activities = activities.slice(0, 8);
        }
        
        localStorage.setItem('wevents_osc_activity', JSON.stringify(activities));
        renderActivities();
        window.dispatchEvent(new Event('oscActivityAdded'));
    };

    window.addEventListener('storage', (e) => {
        if (e.key === 'wevents_osc_activity') renderActivities();
    });

    window.addEventListener('oscActivityAdded', () => {
        renderActivities();
    });

    renderActivities();
})();

/* =============================================
   EVENT DETAILS DROPDOWN
   ============================================= */
(function initEventDetailsDropdown() {
    const eventBtn = document.getElementById('event-details-btn');
    const eventDropdown = document.getElementById('event-details-dropdown');

    if (!eventBtn || !eventDropdown) return;

    eventBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = eventDropdown.classList.contains('active');
        
        // Close other popups
        const accountPopup = document.getElementById('account-popup');
        const notifDropdown = document.getElementById('notif-dropdown');
        if (accountPopup) accountPopup.classList.remove('active');
        if (notifDropdown) notifDropdown.classList.remove('active');

        if (isOpen) {
            eventDropdown.classList.remove('active');
            eventBtn.classList.remove('active');
        } else {
            eventDropdown.classList.add('active');
            eventBtn.classList.add('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (eventDropdown.classList.contains('active') && !eventDropdown.contains(e.target) && e.target !== eventBtn && !eventBtn.contains(e.target)) {
            eventDropdown.classList.remove('active');
            eventBtn.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && eventDropdown.classList.contains('active')) {
            eventDropdown.classList.remove('active');
            eventBtn.classList.remove('active');
        }
    });

    // Populate dropdown content
    eventDropdown.innerHTML = `
        <div class="edd-header">
            <strong>Tech Innovation Summit 2026</strong>
            <p>Event ID: EVN-2026-042</p>
        </div>
        <div class="edd-section">
            <div class="edd-label">EVENT MANAGER</div>
            <div class="edd-manager">
                <div class="edd-manager-avatar">PS</div>
                <div>
                    <strong>Priya Sharma</strong>
                    <p>priya.s@wevents.com</p>
                </div>
            </div>
        </div>
        <div class="edd-section">
            <div class="edd-label">AGENDA / SCHEDULE</div>
            <ul class="agenda-list">
                <li>
                    <span class="agenda-time">09:00 AM</span>
                    <span class="agenda-event">Keynote: Future of AI</span>
                </li>
                <li class="active">
                    <span class="agenda-time">10:30 AM</span>
                    <span class="agenda-event">Panel: Sustainable Tech</span>
        <div class="edd-footer">
            <button class="btn-edd-full" id="view-full-program-btn" style="width: 100%; padding: 10px; background: #1e3a8a; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">View Full Program</button>
        </div>
    `;

    // View Full Program button handler
    setTimeout(() => {
        const fullProgramBtn = document.getElementById('view-full-program-btn');
        if (fullProgramBtn) {
            fullProgramBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close the dropdown
                eventDropdown.classList.remove('active');
                eventBtn.classList.remove('active');
                // Open the full program modal
                openFullProgramModal();
            });
        }
    }, 50);

    function openFullProgramModal() {
        // Remove existing modal if any
        const existing = document.getElementById('full-program-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'full-program-modal';
        overlay.className = 'modal-overlay active';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;';
        overlay.innerHTML = `
            <div style="background:white;border-radius:16px;width:700px;max-width:92vw;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:scaleUp 0.2s ease;">
                <div style="padding:24px 28px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;border-radius:16px 16px 0 0;z-index:2;">
                    <div>
                        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0;">Tech Innovation Summit 2026</h2>
                        <p style="font-size:13px;color:#64748b;margin:4px 0 0;">Full Event Program • Grand Ballroom, Hall A</p>
                    </div>
                    <button id="close-full-program" style="background:none;border:none;cursor:pointer;padding:6px;border-radius:8px;color:#94a3b8;transition:all 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div style="padding:24px 28px;">
                    ${[
                        { time: '08:30 AM', title: 'Registration & Check-in', speaker: 'Front Desk', location: 'Main Lobby', duration: '30 min', type: 'registration' },
                        { time: '09:00 AM', title: 'Keynote: Future of AI', speaker: 'Dr. Ananya Gupta', location: 'Main Auditorium', duration: '1 hour', type: 'keynote', live: true },
                        { time: '10:00 AM', title: 'Coffee Break & Networking', speaker: '', location: 'Atrium', duration: '30 min', type: 'break' },
                        { time: '10:30 AM', title: 'Panel: Sustainable Tech', speaker: 'Industry Leaders', location: 'Hall A', duration: '1 hour', type: 'panel', live: true },
                        { time: '11:30 AM', title: 'Workshop: Cloud Native Architecture', speaker: 'Vikram Singh', location: 'Lab 101', duration: '1 hour', type: 'workshop' },
                        { time: '12:30 PM', title: 'Lunch & Networking', speaker: '', location: 'Dining Hall', duration: '1 hour', type: 'break' },
                        { time: '01:30 PM', title: 'Talk: ML in Production', speaker: 'Sarah Jones', location: 'Hall B', duration: '45 min', type: 'talk' },
                        { time: '02:15 PM', title: 'Demo: Edge Computing Solutions', speaker: 'Amit Shah', location: 'Demo Zone', duration: '45 min', type: 'demo' },
                        { time: '03:00 PM', title: 'Panel: Future of JavaScript', speaker: 'Sarah Jones, Amit Shah', location: 'Hall B', duration: '1 hour', type: 'panel' },
                        { time: '04:00 PM', title: 'Fireside Chat: Startup Ecosystems', speaker: 'Priya Sharma & Guest', location: 'Lounge', duration: '45 min', type: 'talk' },
                        { time: '04:45 PM', title: 'Lightning Talks', speaker: 'Various Speakers', location: 'Main Auditorium', duration: '45 min', type: 'talk' },
                        { time: '05:30 PM', title: 'Closing Ceremony & Awards', speaker: 'Event Committee', location: 'Main Auditorium', duration: '30 min', type: 'keynote' },
                        { time: '06:00 PM', title: 'Networking Reception', speaker: '', location: 'Rooftop Terrace', duration: '2 hours', type: 'break' },
                    ].map((item, i) => {
                        const colors = { keynote: '#1e3a8a', panel: '#7c3aed', workshop: '#0891b2', talk: '#2563eb', demo: '#ea580c', break: '#64748b', registration: '#16a34a' };
                        const bg = { keynote: '#eff6ff', panel: '#f5f3ff', workshop: '#ecfeff', talk: '#eff6ff', demo: '#fff7ed', break: '#f8fafc', registration: '#f0fdf4' };
                        return `
                        <div style="display:flex;gap:16px;padding:14px 0;${i > 0 ? 'border-top:1px solid #f1f5f9;' : ''}">
                            <div style="min-width:72px;text-align:right;">
                                <span style="font-size:12px;font-weight:700;color:${colors[item.type]||'#64748b'};">${item.time}</span>
                            </div>
                            <div style="width:3px;border-radius:2px;background:${colors[item.type]||'#e2e8f0'};flex-shrink:0;"></div>
                            <div style="flex:1;">
                                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                                    <span style="font-size:14px;font-weight:600;color:#0f172a;">${item.title}</span>
                                    ${item.live ? '<span style="background:#ef4444;color:white;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:700;animation:pulse 2s infinite;">LIVE</span>' : ''}
                                </div>
                                ${item.speaker ? `<p style="font-size:12px;color:#64748b;margin:0 0 4px;">${item.speaker}</p>` : ''}
                                <div style="display:flex;gap:12px;font-size:11px;color:#94a3b8;">
                                    <span>📍 ${item.location}</span>
                                    <span>⏱ ${item.duration}</span>
                                    <span style="background:${bg[item.type]||'#f8fafc'};color:${colors[item.type]||'#64748b'};padding:1px 8px;border-radius:4px;font-weight:600;text-transform:capitalize;">${item.type}</span>
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
            </style>
        `;
        document.body.appendChild(overlay);

        document.getElementById('close-full-program').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
        });
    }
})();

/* =============================================
   GLOBAL SETTINGS MODAL
   ============================================= */
(function initGlobalSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('global-settings-modal');

    if (!settingsBtn || !settingsModal) return;

    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    let currentStatus = 'active';

    window.setGlobalStatus = function(status) {
        currentStatus = status;
        const activeBtn = document.getElementById('global-status-active-btn');
        const breakBtn = document.getElementById('global-status-break-btn');
        if (!activeBtn || !breakBtn) return;

        if (status === 'active') {
            activeBtn.classList.add('active');
            breakBtn.classList.remove('active');
        } else {
            activeBtn.classList.remove('active');
            breakBtn.classList.add('active');
        }
    };

    window.saveGlobalSettings = function() {
        // Save to localStorage so it persists across OSC pages
        localStorage.setItem('wevents_osc_status', currentStatus);
        
        // Update the team UI if we're on the team page
        updateTeamUIForUser(currentStatus);
        
        settingsModal.classList.remove('active');
        
        // Optional: show toast message
        if (window.showGlobalToast) {
            window.showGlobalToast(`Profile saved. Status: ${currentStatus.toUpperCase()}`);
        } else if (typeof toast === 'function') {
            toast(`Profile saved. Status: ${currentStatus.toUpperCase()}`);
        }
    };

    function updateTeamUIForUser(status) {
        // Look for "Alex Thompson" in the team list
        const rows = document.querySelectorAll('.member-row');
        rows.forEach(row => {
            const nameEl = row.querySelector('.member-name');
            if (nameEl && nameEl.textContent.includes('Alex Thompson')) {
                const statusTag = row.querySelector('.status-tag');
                if (statusTag) {
                    if (status === 'active') {
                        statusTag.className = 'status-tag active';
                        statusTag.innerHTML = '&#10004; Active';
                    } else {
                        statusTag.className = 'status-tag break';
                        statusTag.innerHTML = '&#9201; On Break';
                    }
                }
                // Update data attribute
                row.setAttribute('data-status', status);
            }
        });

        // Update counts (computeTeamStats is defined in team.js)
        if (typeof computeTeamStats === 'function') {
            computeTeamStats();
        }
    }

    // Load initial status
    const savedStatus = localStorage.getItem('wevents_osc_status') || 'active';
    window.setGlobalStatus(savedStatus);
    // Use a small timeout to ensure DOM is ready if it's the team page
    setTimeout(() => updateTeamUIForUser(savedStatus), 100);
})();
