class Auth {
    static initLoginUI() {
        DataStore.init(); // Initialize mock data
        
        const roleSelect = document.getElementById('roleSelect');
        const userSelectGroup = document.getElementById('userSelectGroup');
        const userSelect = document.getElementById('userSelect');
        const loginForm = document.getElementById('loginForm');

        if (!roleSelect) return;

        roleSelect.addEventListener('change', (e) => {
            const role = e.target.value;
            const users = DataStore.getUsersByRole(role);
            
            userSelect.innerHTML = '';
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
            const role = roleSelect.value;
            const userId = userSelect.value;
            
            if (role && userId) {
                const user = DataStore.getUserById(userId);
                this.login(user);
            }
        });
    }

    static login(user) {
        localStorage.setItem('wevents_user', JSON.stringify(user));
        window.location.href = 'dashboard.html'; // Load dashboard shell
    }

    static logout() {
        localStorage.removeItem('wevents_user');
        window.location.href = '../lp/index.html';
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
        if(!user) return false;
        if(user.role === 'superuser') return true;

        // End user
        if(user.role === 'enduser') {
            return action === 'view' || action === 'rsvp';
        }
        
        return false;
    }
}
