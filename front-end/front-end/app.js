// APP CORE AND ROUTER
class App {
    static init() {
        if (!Auth.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }

        DataStore.init(); // ensure data is loaded
        this.user = Auth.getCurrentUser();
        this.renderUserDetails();
        this.renderSidebar();
        
        // Mobile sidebar toggle
        document.getElementById('mobileToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Initialize Router
        window.addEventListener('hashchange', this.route.bind(this));
        
        // Initial route based on hash or default to my-events for admin/manager
        if (!window.location.hash) {
            if (this.user.role === 'superuser') {
                window.location.hash = '#/my-events';
            } else {
                window.location.hash = '#/dashboard';
            }
        } else {
            this.route();
        }
    }

    static renderUserDetails() {
        document.getElementById('userName').textContent = this.user.name;
        document.getElementById('userEmail').textContent = this.user.email;
        document.getElementById('userInitial').textContent = this.user.name.charAt(0).toUpperCase();

        // Populate Dropdown
        const roleNames = {
            'superuser': 'Super User',

            'enduser': 'Attendee'
        };
        const ddUserName = document.getElementById('ddUserName');
        const ddUserEmail = document.getElementById('ddUserEmail');
        const ddUserRole = document.getElementById('ddUserRole');
        
        if (ddUserName) ddUserName.textContent = this.user.name;
        if (ddUserEmail) ddUserEmail.textContent = this.user.email;
        if (ddUserRole) ddUserRole.textContent = roleNames[this.user.role] || this.user.role;

        // Toggle dropdown logic
        const profileBtn = document.getElementById('userProfileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                const isDisplay = profileDropdown.style.display === 'block';
                profileDropdown.style.display = isDisplay ? 'none' : 'block';
                e.stopPropagation();
            });
            // Close dropdown if clicked outside
            document.addEventListener('click', (e) => {
                if (!profileBtn.contains(e.target)) {
                    profileDropdown.style.display = 'none';
                }
            });
        }
        
        // Change topbar text based on role
        if(this.user.role === 'enduser') {
            document.getElementById('topbarTitle').textContent = 'Event Portal';
        }
    }

    static renderSidebar() {
        const nav = document.getElementById('sidebarNav');
        nav.innerHTML = '';
        
        const links = [
            { id: 'dashboard', name: 'Dashboard', hash: '#/dashboard', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>' },
        ];

        if (this.user.role === 'superuser') {
            links.push({ id: 'events', name: 'Create Event', hash: '#/events', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' });
            links.push({ id: 'my-events', name: 'My Events', hash: '#/my-events', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' });
        } else if (this.user.role === 'enduser') {
            links.push({ id: 'browse-events', name: 'Browse Events', hash: '#/browse-events', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' });
        }
        
        // Additional mock links
        links.push({ id: 'engagement', name: 'Engagement Tools', hash: '#/engagement', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>' });
        links.push({ id: 'reports', name: 'Reports', hash: '#/reports', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>' });
        links.push({ id: 'notifications', name: 'Notifications', hash: '#/notifications', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>' });
        links.push({ id: 'settings', name: 'Settings', hash: '#/settings', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' });

        links.forEach(link => {
            const el = document.createElement('a');
            el.href = link.hash;
            el.className = 'nav-item';
            el.id = `nav-${link.id}`;
            el.innerHTML = `<i style="display:inline-flex; align-items:center; justify-content:center; width: 24px;">${link.icon}</i> ${link.name}`;
            nav.appendChild(el);
        });
    }

    static updateActiveNav(hash) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const activeLink = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('href') === hash.split('?')[0]);
        if(activeLink) {
            activeLink.classList.add('active');
        }
    }

    static route() {
        const hash = window.location.hash;
        const mainContent = document.getElementById('mainContent');
        this.updateActiveNav(hash);

        // Very simple hash router
        if (hash === '#/dashboard') {
            mainContent.innerHTML = HomeView.render();
            HomeView.init();
        } 
        else if (hash === '#/my-events' && this.user.role === 'superuser') {
            mainContent.innerHTML = EventsView.renderMyEvents();
            EventsView.initMyEvents();
        }
        else if (hash === '#/browse-events') {
            mainContent.innerHTML = EventsView.renderAllEvents();
            EventsView.initAllEvents();
        }
        else if (hash === '#/events') {
            if (this.user.role === 'enduser') {
                mainContent.innerHTML = EventsView.renderAllEvents();
                EventsView.initAllEvents();
            } else {
                mainContent.innerHTML = CreateEventView.render();
                CreateEventView.init();
            }
        }
        else if (hash.startsWith('#/create-event') && Auth.hasAccess('create_event')) {
            mainContent.innerHTML = CreateEventView.render();
            CreateEventView.init();
        }
        else if (hash.startsWith('#/edit-event')) {
            const eventId = hash.split('id=')[1]?.split('&')[0];
            if (eventId) {
                mainContent.innerHTML = CreateEventView.render(eventId);
                CreateEventView.init(eventId);
            }
        }
        else if (hash === '#/engagement') {
            mainContent.innerHTML = EngagementView.render();
            if (typeof EngagementView.init === 'function') EngagementView.init();
        }
        else if (hash === '#/reports') {
            mainContent.innerHTML = ReportsView.render();
            if (typeof ReportsView.init === 'function') ReportsView.init();
        }
        else if (hash === '#/notifications') {
            mainContent.innerHTML = NotificationsView.render();
            if (typeof NotificationsView.init === 'function') NotificationsView.init();
        }
        else if (hash.startsWith('#/event-details')) {
            const eventId = hash.split('id=')[1]?.split('&')[0];
            if (eventId) {
                mainContent.innerHTML = EventDetailsView.render(eventId);
                if (typeof EventDetailsView.init === 'function') {
                    EventDetailsView.init(eventId);
                }
            }
        }
        else if (hash.startsWith('#/event-dashboard')) {
            const eventId = hash.split('id=')[1]?.split('&')[0];
            if (eventId) {
                mainContent.innerHTML = EventDashboardView.render(eventId);
                if (typeof EventDashboardView.init === 'function') {
                    EventDashboardView.init(eventId);
                }
            }
        }
        else if (hash === '#/settings') {
            mainContent.innerHTML = SettingsView.render();
            if (typeof SettingsView.init === 'function') SettingsView.init();
        }
        else {
            mainContent.innerHTML = `<div class="card"><h2>Page not found or access denied.</h2></div>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Only init App on dashboard.html
    if (window.location.pathname.includes('dashboard.html')) {
        App.init();
    }
});
