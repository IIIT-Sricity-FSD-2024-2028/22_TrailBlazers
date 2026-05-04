const fs = require('fs');
const path = require('path');

const snippet = `
// --- AUTO-INJECTED PROFILE HEADER SCRIPT ---
(function() {
    if (window._profileHeaderInjected) return;
    window._profileHeaderInjected = true;

    document.addEventListener('DOMContentLoaded', () => {
        let userStr = localStorage.getItem('currentUser') || localStorage.getItem('wevents_user');
        if (!userStr) return;
        try {
            const user = JSON.parse(userStr);
            if (!user || !user.name) return;
            
            const initials = user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
            
            // 1. Super User Portal
            const suName = document.querySelector('.header-user-name');
            const suRole = document.querySelector('.header-user-role');
            const suAv = document.querySelector('.header-avatar');
            if (suName) suName.textContent = user.name;
            if (suRole) suRole.textContent = user.role.toUpperCase();
            if (suAv) suAv.textContent = initials;
            
            // Update dropdown items in super user
            const ddRows = document.querySelectorAll('.dd-row');
            if (ddRows.length >= 3) {
                ddRows[0].innerHTML = \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> \${user.name}\`;
                ddRows[1].innerHTML = \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 7 10-7"/></svg> \${user.email}\`;
                ddRows[2].innerHTML = \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> \${user.role.toUpperCase()}\`;
            }

            // 2. Project Portal (Client/Event Manager/Attendee)
            const navName = document.querySelector('.nav-user-name');
            const navRole = document.querySelector('.nav-user-role');
            const navAv = document.querySelector('.profile-wrapper .av');
            if (navName) navName.textContent = user.name;
            if (navRole) navRole.textContent = user.role.toUpperCase();
            if (navAv) navAv.textContent = initials;

            // Project dropdown
            const projDdName = document.querySelector('.ph > div > div:nth-child(1)');
            const projDdEmail = document.querySelector('.ph > div > div:nth-child(2)');
            if (projDdName && projDdName.textContent.includes('Alex')) projDdName.textContent = user.name;
            if (projDdEmail && projDdEmail.textContent.includes('alex')) projDdEmail.textContent = user.email;

            // 3. OSC Portal
            const oscName = document.querySelector('.user-info h3');
            const oscRole = document.querySelector('.user-info p');
            const oscAv = document.querySelector('.user-avatar');
            if (oscName) oscName.textContent = user.name;
            if (oscRole) oscRole.textContent = user.role.toUpperCase();
            if (oscAv && !oscAv.querySelector('img')) oscAv.textContent = initials;

            // 4. Generic matching
            document.querySelectorAll('.user-name, .sh-user-name').forEach(el => {
                if(el.id !== 'new-fname' && el.id !== 'new-lname' && el.tagName !== 'INPUT') el.textContent = user.name;
            });
            document.querySelectorAll('.user-email').forEach(el => {
                if(el.tagName !== 'INPUT') el.textContent = user.email;
            });
            document.querySelectorAll('.user-role').forEach(el => {
                if(el.tagName !== 'INPUT') el.textContent = user.role.toUpperCase();
            });
        } catch(e) {
            console.error('Error parsing user for header:', e);
        }
    });
})();
// --- END AUTO-INJECTED ---
`;

const dirs = ['f2'];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            const filepath = path.join(dir, file);
            let content = fs.readFileSync(filepath, 'utf8');
            if (!content.includes('AUTO-INJECTED PROFILE HEADER SCRIPT')) {
                fs.appendFileSync(filepath, '\n' + snippet);
                console.log('Appended to', filepath);
            }
        }
    });
});
