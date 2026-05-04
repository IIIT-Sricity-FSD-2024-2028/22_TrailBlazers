class Auth {
    static async initLoginUI() {
        const roleSelect       = document.getElementById('roleSelect');
        const userSelectGroup  = document.getElementById('userSelectGroup');
        const userSelect       = document.getElementById('userSelect');
        const loginForm        = document.getElementById('loginForm');

        if (!roleSelect) return;

        // Load users directly from backend on every login page load
        let allUsers = [];
        try {
            const res = await fetch('http://localhost:3000/users', { headers: { role: 'superuser' } });
            allUsers = await res.json();
        } catch(e) {
            console.warn('Could not load users from backend, falling back to cache', e);
        }

        roleSelect.addEventListener('change', (e) => {
            const role = e.target.value;
            const users = allUsers.filter(u => u.role === role);

            userSelect.innerHTML = '<option value="">-- Select user --</option>';
            users.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = `${u.name} (${u.email})`;
                userSelect.appendChild(opt);
            });

            userSelectGroup.style.display = 'block';
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const role   = roleSelect.value;
            const userId = userSelect.value;

            if (role && userId) {
                const user = allUsers.find(u => u.id === userId);
                if (user) this.login(user);
            }
        });
    }

    static login(user) {
        localStorage.setItem('wevents_user', JSON.stringify(user));
        window.location.href = 'dashboard.html'; // Load dashboard shell
    }

    static logout() {
        localStorage.removeItem('wevents_user');
        window.location.href = '../landing-page/index.html';
    }

    static getCurrentUser() {
        if (!localStorage.getItem('wevents_user')) return null;
        return JSON.parse(localStorage.getItem('wevents_user'));
    }

    static isLoggedIn() {
        return !!this.getCurrentUser();
    }
    
    static hasAccess(action, resource) {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (user.role === 'superuser') return true;

        if (user.role === 'client' || user.role === 'eventmanager') {
            if (action === 'create_event') return true;
            if (action === 'manage_event') {
                if (!resource) return false;
                if (user.role === 'client') return resource.clientId === user.id || resource.clientEmail === user.email;
                if (user.role === 'eventmanager') return resource.managerId === user.id;
            }
            return action === 'view';
        }

        if (user.role === 'attendee') {
            return action === 'view' || action === 'rsvp';
        }

        return false;
    }
}