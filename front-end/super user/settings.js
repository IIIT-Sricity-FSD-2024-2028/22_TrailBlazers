/* ============================================================
   SETTINGS JS — Tab switching, toggles, forms
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // ── Account dropdown ──
    const headerUser = document.getElementById('header-user');
    const headerDropdown = document.getElementById('header-dropdown');
    headerUser.addEventListener('click', (e) => { e.stopPropagation(); headerDropdown.classList.toggle('active'); });
    document.addEventListener('click', () => headerDropdown.classList.remove('active'));

    // ── Notification bell ──
    document.getElementById('notif-bell').addEventListener('click', () => showToast('You have 3 new notifications', 'info'));

    // ── Logout ──
    document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '../lp/index.html'; });

    // ── Tab switching ──
    const navItems = document.querySelectorAll('.settings-nav-item');
    const panels = document.querySelectorAll('.settings-panel');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            navItems.forEach(n => n.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(`panel-${tab}`).classList.add('active');
        });
    });

    // ── Toggle switches ──
    document.querySelectorAll('.toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
        });
    });

    // ── Profile form submit ──
    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Profile updated successfully!', 'success');
    });

    // ── Security form submit ──
    document.getElementById('security-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;
        if (newPass && newPass !== confirmPass) {
            showToast('Passwords do not match!', 'error');
            return;
        }
        showToast('Security settings updated!', 'success');
        e.target.reset();
    });

    // ── Notification save ──
    document.getElementById('save-notif-btn').addEventListener('click', () => {
        showToast('Notification preferences saved!', 'success');
    });

    // ── Platform form submit ──
    document.getElementById('platform-form').addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Platform configuration saved!', 'success');
    });

    // ── Email form submit ──
    document.getElementById('email-form').addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Email settings saved!', 'success');
    });

    // ── Test email ──
    document.getElementById('test-email-btn').addEventListener('click', () => {
        showToast('Test email sent to amanda@gmail.com', 'info');
    });



    // ── Change avatar link ──
    document.getElementById('change-avatar-link').addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Avatar upload coming soon!', 'info');
    });

    // ── Toast helper ──
    window.showToast = function(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = {
            success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        toast.innerHTML = `${icons[type] || icons.info} ${msg}`;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
    };
});
