document.addEventListener('DOMContentLoaded', () => {
    // ── Account dropdown ──
    document.getElementById('header-user').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('header-dropdown').classList.toggle('active'); });
    document.addEventListener('click', () => document.getElementById('header-dropdown').classList.remove('active'));
    document.getElementById('notif-bell').addEventListener('click', () => showToast('You have 3 new notifications', 'info'));
    document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '../lp/index.html'; });

    function generateMockUsers() {
        const firstNames = ['Amit', 'Raj', 'Priya', 'Neha', 'Arjun', 'Riya', 'Vikram', 'Sneha', 'Karan', 'Anita', 'Rahul', 'Kavya', 'Sandeep', 'Meera', 'Rohan', 'Pooja', 'Aditya', 'Divya', 'Suresh', 'Anjali'];
        const lastNames = ['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar', 'Mehta', 'Gupta', 'Desai', 'Joshi', 'Kapoor', 'Reddy', 'Iyer', 'Bose', 'Das', 'Roy', 'Nair', 'Menon', 'Rao', 'Yadav', 'Malhotra'];
        const events = ['Tech Conference 2026', 'Product Launch Summit', 'Innovation Workshop', 'Corporate Training', 'Global Marketing Expo', 'Developer Meetup', 'Annual Gala'];
        const colors = ['#f97316','#7c3aed','#2563eb','#16a34a','#ea580c','#0891b2','#dc2626','#9333ea','#d97706','#059669'];

        const generateList = (count, role) => {
            return Array.from({ length: count }).map(() => {
                const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
                const name = `${fname} ${lname}`;
                const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${Math.floor(Math.random() * 1000)}@gmail.com`;
                const avatar = (fname[0] + lname[0]).toUpperCase();
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                let userObj = {
                    name, avatar, color, email, role,
                    active: Math.random() > 0.1,
                    joined: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                };

                if (role === 'Event Manager' || role === 'Coordinator') {
                    const isBusy = Math.random() > 0.5;
                    userObj.availability = isBusy ? 'Busy' : 'Vacant';
                    if (isBusy) {
                        userObj.assignedEvent = events[Math.floor(Math.random() * events.length)];
                    }
                }
                return userObj;
            });
        };

        let generated = [];
        generated = generated.concat(generateList(3, 'Super Admin'));
        generated = generated.concat(generateList(15, 'Event Manager'));
        generated = generated.concat(generateList(45, 'Coordinator'));
        generated = generated.concat(generateList(20, 'Client'));
        generated = generated.concat(generateList(120, 'Attendee'));
        return generated;
    }

    // Load from localStorage or generate new schema schema
    const savedSU = localStorage.getItem('su_users_data_v3');
    const users = savedSU ? JSON.parse(savedSU) : generateMockUsers();

    function saveUsersToStorage() {
        localStorage.setItem('su_users_data_v3', JSON.stringify(users));
    }

    let currentPage = 1;
    const itemsPerPage = 10;

    const tbody = document.getElementById('users-tbody');
    const searchInput = document.getElementById('user-search');
    const roleFilter = document.getElementById('role-filter');
    let editingUserIdx = null;

    function getBadgeClass(role) {
        const map = { 'Super Admin': 'badge-admin', 'Event Manager': 'badge-event-manager', 'Coordinator': 'badge-coordinator', 'Client': 'badge-client', 'Attendee': 'badge-attendee' };
        return map[role] || '';
    }

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
                renderUsers();
            });
        });
    }

    function renderUsers() {
        const search = searchInput.value.toLowerCase();
        const role = roleFilter.value;
        const filtered = users.filter(u => {
            const matchSearch = u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
            const matchRole = role === 'all' || u.role === role;
            return matchSearch && matchRole;
        });

        document.getElementById('user-count-num').textContent = filtered.length;

        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages || 1;

        const startIdx = (currentPage - 1) * itemsPerPage;
        const pageItems = filtered.slice(startIdx, startIdx + itemsPerPage);

        document.getElementById('page-start').textContent = filtered.length === 0 ? 0 : startIdx + 1;
        document.getElementById('page-end').textContent = Math.min(startIdx + itemsPerPage, filtered.length);
        document.getElementById('page-total').textContent = filtered.length;
        
        renderPaginationButtons(totalPages);

        tbody.innerHTML = pageItems.map((u, i) => {
            const actualIndex = users.indexOf(u);
            let availabilityHtml = `<span style="color:var(--text-muted);font-size:12px;">N/A</span>`;
            if (u.role === 'Event Manager' || u.role === 'Coordinator') {
                if (u.availability === 'Busy') {
                    availabilityHtml = `<div style="display:flex; flex-direction:column; gap:4px;"><span class="badge" style="background:rgba(239, 68, 68, 0.1); color:#ef4444; width:fit-content;"><span class="badge-dot" style="background-color:#ef4444;"></span>Busy</span><span style="font-size:11px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;" title="${u.assignedEvent}">${u.assignedEvent}</span></div>`;
                } else {
                    availabilityHtml = `<span class="badge" style="background:rgba(34, 197, 94, 0.1); color:#22c55e;"><span class="badge-dot" style="background-color:#22c55e;"></span>Vacant</span>`;
                }
            }
            return `
            <tr>
                <td><div class="user-cell"><div class="user-cell-avatar" style="background:${u.color}">${u.avatar}</div><div class="user-cell-info"><span class="user-cell-name">${u.name}</span></div></div></td>
                <td>${u.email}</td>
                <td><span class="badge ${getBadgeClass(u.role)}">${u.role}</span></td>
                <td>${availabilityHtml}</td>
                <td><span class="badge ${u.active ? 'badge-active' : 'badge-inactive'}"><span class="badge-dot"></span> ${u.active ? 'Active' : 'Inactive'}</span></td>
                <td><div class="toggle ${u.active ? 'active' : ''}" data-idx="${actualIndex}"><div class="toggle-knob"></div></div></td>
                <td>${u.joined}</td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-secondary btn-edit" data-idx="${actualIndex}" style="padding:4px 8px;font-size:12px; border-color: #2563EB; color: #2563EB;">Change Role</button>
                        <button class="btn btn-danger btn-delete" data-idx="${actualIndex}" style="padding:4px 8px;font-size:12px;">Delete</button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        // Toggle handlers
        tbody.querySelectorAll('.toggle').forEach(t => {
            t.addEventListener('click', () => {
                const idx = parseInt(t.dataset.idx);
                users[idx].active = !users[idx].active;
                saveUsersToStorage();
                renderUsers();
                updateStats();
            });
        });

        // Edit handlers
        tbody.querySelectorAll('.btn-edit').forEach(b => {
            b.addEventListener('click', () => {
                const idx = parseInt(b.dataset.idx);
                editingUserIdx = idx;
                document.getElementById('edit-user-name').textContent = users[idx].name;
                document.getElementById('edit-user-email').textContent = users[idx].email;
                document.getElementById('edit-user-role').value = users[idx].role;
                document.getElementById('edit-modal').classList.add('active');
            });
        });

        // Delete handlers
        tbody.querySelectorAll('.btn-delete').forEach(b => {
            b.addEventListener('click', () => {
                const idx = parseInt(b.dataset.idx);
                const name = users[idx].name;
                users.splice(idx, 1);
                saveUsersToStorage();
                renderUsers();
                updateStats();
                showToast(`User ${name} deleted successfully`, 'error');
            });
        });
    }

    function updateStats() {
        document.getElementById('stat-all').textContent = users.length;
        document.getElementById('stat-admin').textContent = users.filter(u => u.role === 'Super Admin').length;
        document.getElementById('stat-em').textContent = users.filter(u => u.role === 'Event Manager').length;
        document.getElementById('stat-coord').textContent = users.filter(u => u.role === 'Coordinator').length;
        document.getElementById('stat-client').textContent = users.filter(u => u.role === 'Client').length;
        document.getElementById('stat-attendee').textContent = users.filter(u => u.role === 'Attendee').length;
    }

    document.getElementById('prev-page').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderUsers(); }});
    document.getElementById('next-page').addEventListener('click', () => { currentPage++; renderUsers(); });

    searchInput.addEventListener('input', () => { currentPage = 1; renderUsers(); });
    roleFilter.addEventListener('change', () => { currentPage = 1; renderUsers(); });
    renderUsers();

    // Create User Modal
    document.getElementById('create-user-btn').addEventListener('click', () => document.getElementById('create-user-modal').classList.add('active'));
    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => b.closest('.modal-overlay').classList.remove('active')));
    document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', (e) => { if (e.target === o) o.classList.remove('active'); }));

    document.getElementById('create-user-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fname = document.getElementById('new-fname').value;
        const lname = document.getElementById('new-lname').value;
        const email = document.getElementById('new-email').value;
        const role = document.getElementById('new-role').value;
        const initials = (fname[0] + lname[0]).toUpperCase();
        const colors = ['#f97316','#7c3aed','#2563eb','#16a34a','#ea580c','#0891b2','#dc2626'];
        users.push({ name: `${fname} ${lname}`, avatar: initials, color: colors[Math.floor(Math.random()*colors.length)], email, role, active: true, joined: new Date().toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}), availability: (role === 'Event Manager' || role === 'Coordinator') ? 'Vacant' : undefined });
        saveUsersToStorage();
        renderUsers(); updateStats();
        document.getElementById('create-user-modal').classList.remove('active');
        e.target.reset();
        showToast(`User ${fname} ${lname} created successfully!`, 'success');
    });

    // Edit User Modal Actions
    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        document.getElementById('edit-modal').classList.remove('active');
        editingUserIdx = null;
    });

    document.getElementById('save-edit-btn').addEventListener('click', () => {
        if (editingUserIdx !== null) {
            const newRole = document.getElementById('edit-user-role').value;
            users[editingUserIdx].role = newRole;
            if (newRole === 'Event Manager' || newRole === 'Coordinator') {
                if (!users[editingUserIdx].availability) {
                    users[editingUserIdx].availability = 'Vacant';
                }
            } else {
                delete users[editingUserIdx].availability;
                delete users[editingUserIdx].assignedEvent;
            }
            saveUsersToStorage();
            renderUsers(); updateStats();
            document.getElementById('edit-modal').classList.remove('active');
            showToast(`User role updated to ${newRole}!`, 'success');
            editingUserIdx = null;
        }
    });

    window.showToast = function(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>', info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' };
        toast.innerHTML = `${icons[type] || icons.info} ${msg}`;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
    };
});
