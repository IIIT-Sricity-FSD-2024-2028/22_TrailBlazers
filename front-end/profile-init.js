/**
 * profile-init.js — WEVENTS Shared Profile Renderer
 * ====================================================
 * Reads the logged-in user from localStorage and populates
 * the profile popup / dropdown in every portal:
 *   • Super User Portal   (.header-user-name, .dd-row[0..2])
 *   • Event Manager Portal (shared.js injectHeader handles it, but also covers home.html nav)
 *   • OSC Portal           (account-popup, avatar-button, coordinator-label, settings-modal)
 *   • Front-end / attendee portal (generic .userName / .userEmail elements)
 *
 * Include this script at the bottom of <body> in every portal HTML page.
 */
(function () {
    'use strict';

    /* ── 1. Read stored user (set by landing-page/auth.js on sign-in) ── */
    function getUser() {
        try {
            const raw = localStorage.getItem('currentUser') || localStorage.getItem('wevents_user');
            return raw ? JSON.parse(raw) : null;
        } catch (_) { return null; }
    }

    function initials(name) {
        return (name || 'U').split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase();
    }

    function roleLabel(role) {
        const map = {
            superuser:    'Super Admin',
            eventmanager: 'Event Manager',
            client:       'Client',
            osc:          'On-Site Coordinator',
            attendee:     'Attendee',
        };
        return map[role] || (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User');
    }

    function setText(selector, value, all) {
        const els = all ? document.querySelectorAll(selector) : [document.querySelector(selector)];
        els.forEach(el => { if (el) el.textContent = value; });
    }

    function run() {
        const user = getUser();
        if (!user || !user.name) return;

        const name  = user.name;
        const email = user.email || '';
        const role  = user.role  || '';
        const ini   = initials(name);
        const label = roleLabel(role);

        /* ══════════════════════════════════════════════════════
           A) SUPER USER PORTAL
           Elements: .header-user-name  .header-user-role
                     .header-avatar     .dd-row (1st 3)
        ══════════════════════════════════════════════════════ */
        setText('.header-user-name', name);
        setText('.header-user-role', label);
        setText('.header-avatar',    ini);

        const ddRows = document.querySelectorAll('.dd-row');
        if (ddRows[0]) ddRows[0].innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> ${name}`;
        if (ddRows[1]) ddRows[1].innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 7 10-7"/></svg> ${email}`;
        if (ddRows[2]) ddRows[2].innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> ${label}`;

        /* ══════════════════════════════════════════════════════
           B) OSC PORTAL
           account-popup:  .acct-header-info strong/span
                           .acct-header-avatar
                           .acct-detail-row (name, email, role)
           header:         .avatar-button
                           .coordinator-label small / span
           settings modal: big AT avatar, h2, p
        ══════════════════════════════════════════════════════ */

        // Account popup header
        const acctStrong = document.querySelector('.acct-header-info strong');
        const acctSpan   = document.querySelector('.acct-header-info span');
        const acctAv     = document.querySelector('.acct-header-avatar');
        if (acctStrong) acctStrong.textContent = name;
        if (acctSpan)   acctSpan.textContent   = label;
        if (acctAv)     acctAv.textContent      = ini;

        // Account popup body rows (name, email, role text nodes after the icon spans)
        const acctRows = document.querySelectorAll('.acct-detail-row');
        if (acctRows[0]) {
            const icon = acctRows[0].querySelector('span');
            acctRows[0].textContent = '';
            if (icon) acctRows[0].appendChild(icon);
            acctRows[0].append(' ' + name);
        }
        if (acctRows[1]) {
            const icon = acctRows[1].querySelector('span');
            acctRows[1].textContent = '';
            if (icon) acctRows[1].appendChild(icon);
            acctRows[1].append(' ' + email);
        }
        if (acctRows[2]) {
            const icon = acctRows[2].querySelector('span');
            acctRows[2].textContent = '';
            if (icon) acctRows[2].appendChild(icon);
            acctRows[2].append(' ' + label);
        }

        // Avatar button (top-right circle)
        const avatarBtn = document.querySelector('.avatar-button');
        if (avatarBtn) avatarBtn.textContent = ini;

        // Coordinator label in header
        const coordSmall = document.querySelector('.coordinator-label small');
        const coordSpan  = document.querySelector('.coordinator-label span');
        if (coordSmall) coordSmall.textContent = label;
        if (coordSpan)  coordSpan.textContent  = name;

        // Settings / Profile modal
        const settingsModalAv = document.querySelector('#global-settings-modal [style*="border-radius: 50%"]');
        if (settingsModalAv) settingsModalAv.textContent = ini;

        const settingsModalH2 = document.querySelector('#global-settings-modal h2');
        if (settingsModalH2) settingsModalH2.textContent = name;

        const settingsModalP = document.querySelector('#global-settings-modal h2 + p');
        if (settingsModalP)  settingsModalP.textContent  = label;

        /* ══════════════════════════════════════════════════════
           C) EVENT MANAGER PORTAL (home.html standalone navbar)
           .nav-user-name  .nav-user-role  .av
           .ph name/role divs   .pb .pi items
        ══════════════════════════════════════════════════════ */
        setText('.nav-user-name', name);
        setText('.nav-user-role', label);

        // Avatar initials (profile wrapper)
        document.querySelectorAll('.profile-wrapper .av').forEach(el => el.textContent = ini);

        // Profile dropdown header (.ph)
        const phNameDiv = document.querySelector('.ph > div > div:first-child');
        const phRoleDiv = document.querySelector('.ph > div > div:last-child');
        const phAvDiv   = document.querySelector('.ph > .av');
        if (phNameDiv && !phNameDiv.querySelector('input')) phNameDiv.textContent = name;
        if (phRoleDiv && !phRoleDiv.querySelector('input')) phRoleDiv.textContent = label;
        if (phAvDiv)   phAvDiv.textContent = ini;

        // Profile dropdown body (.pb .pi items: name, email, role)
        const piItems = document.querySelectorAll('.pb .pi');
        if (piItems[0]) {
            const icon = piItems[0].querySelector('i');
            piItems[0].textContent = '';
            if (icon) piItems[0].appendChild(icon);
            piItems[0].append(name);
        }
        if (piItems[1]) {
            const icon = piItems[1].querySelector('i');
            piItems[1].textContent = '';
            if (icon) piItems[1].appendChild(icon);
            piItems[1].append(email);
        }
        if (piItems[2]) {
            const icon = piItems[2].querySelector('i');
            piItems[2].textContent = '';
            if (icon) piItems[2].appendChild(icon);
            piItems[2].append(label);
        }

        /* ══════════════════════════════════════════════════════
           D) FRONT-END / ATTENDEE PORTAL
           Uses dynamic elements with id="userName" / id="userEmail"
        ══════════════════════════════════════════════════════ */
        const userNameEl  = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        const userRoleEl  = document.getElementById('userRole');
        if (userNameEl)  userNameEl.textContent  = name;
        if (userEmailEl) userEmailEl.textContent = email;
        if (userRoleEl)  userRoleEl.textContent  = label;
    }

    /* Run on DOMContentLoaded (or immediately if DOM is already ready) */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }

})();
