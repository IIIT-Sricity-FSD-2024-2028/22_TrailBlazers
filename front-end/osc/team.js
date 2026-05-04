/* =============================================
   team.js — Pure Vanilla JS for Team Page
   Handles: member detail popup, live stats,
            status filtering, progress bars
   ============================================= */

'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────
const TEAM_MAX_CHECKINS = 300; // reference for progress bar %

// Status display config
const STATUS_CONFIG = {
    active:  { tag: 'active',  label: '&#10004; Active',    avatarFilter: '' },
    break:   { tag: 'break',   label: '&#9201; On Break',   avatarFilter: 'grayscale(40%)' },
    offline: { tag: 'offline', label: '&#9679; Offline',    avatarFilter: 'grayscale(80%)' },
};

// ── DOM References ────────────────────────────────────────────────────────────
const memberModal      = document.getElementById('member-modal');
const memberModalClose = document.getElementById('member-modal-close');

const modalAvatar   = document.getElementById('modal-avatar');
const modalName     = document.getElementById('modal-name');
const modalRole     = document.getElementById('modal-role');
const modalStatusTag = document.getElementById('modal-status-tag');
const modalLocation = document.getElementById('modal-location');
const modalCheckins = document.getElementById('modal-checkins');
const modalEmail    = document.getElementById('modal-email');
const modalPhone    = document.getElementById('modal-phone');
const modalProgressBar = document.getElementById('modal-progress-bar');
const modalProgressPct = document.getElementById('modal-progress-pct');

// ── Member Row Click → Open Detail Modal ──────────────────────────────────────
const memberRows = document.querySelectorAll('.member-row');

memberRows.forEach((row) => {
    row.addEventListener('click', () => {
        const data = {
            name:     row.dataset.member,
            role:     row.dataset.role,
            location: row.dataset.location,
            checkins: parseInt(row.dataset.checkins, 10),
            status:   row.dataset.status,
            email:    row.dataset.email,
            phone:    row.dataset.phone,
        };

        // Highlight selected
        memberRows.forEach(r => r.classList.remove('member-row--selected'));
        row.classList.add('member-row--selected');

        openMemberModal(data);
    });

    // Keyboard accessibility
    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'button');
    row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            row.click();
        }
    });
});

// ── Open Member Modal ─────────────────────────────────────────────────────────
function openMemberModal(data) {
    // Avatar initials & color
    const initials = getInitials(data.name);
    const avatarBg = getAvatarColor(data.status);
    modalAvatar.textContent        = initials;
    modalAvatar.style.background   = avatarBg.bg;
    modalAvatar.style.color        = avatarBg.color;

    // Core info
    modalName.textContent     = data.name;
    modalRole.textContent     = data.role;
    modalLocation.textContent = data.location;
    modalCheckins.textContent = data.checkins;
    modalEmail.textContent    = data.email;
    modalPhone.textContent    = data.phone;

    // Status tag
    const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.offline;
    modalStatusTag.className   = `status-tag ${cfg.tag}`;
    modalStatusTag.innerHTML   = cfg.label;

    // Progress bar
    const pct = Math.min(100, Math.round((data.checkins / TEAM_MAX_CHECKINS) * 100));
    modalProgressPct.textContent = `${pct}%`;

    // Reset then animate
    modalProgressBar.style.width = '0%';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modalProgressBar.style.width = `${pct}%`;
        });
    });

    // Show overlay
    memberModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => memberModalClose.focus(), 50);
}

// ── Close Modal ───────────────────────────────────────────────────────────────
function closeMemberModal() {
    memberModal.classList.remove('active');
    document.body.style.overflow = '';
    memberRows.forEach(r => r.classList.remove('member-row--selected'));
}

memberModalClose.addEventListener('click', closeMemberModal);

memberModal.addEventListener('click', (e) => {
    if (e.target === memberModal) closeMemberModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && memberModal.classList.contains('active')) {
        closeMemberModal();
    }
});

// ── Live Team Stats ───────────────────────────────────────────────────────────
function computeTeamStats() {
    let totalCheckins = 0;
    let activeCount   = 0;
    const totalMembers = memberRows.length;

    memberRows.forEach((row) => {
        totalCheckins += parseInt(row.dataset.checkins, 10) || 0;
        if (row.dataset.status === 'active') activeCount++;
    });

    const totalEl  = document.getElementById('total-checkins');
    const memberEl = document.getElementById('member-count');
    const badgeEl  = document.getElementById('active-count-badge');

    if (totalEl)  totalEl.textContent  = totalCheckins.toLocaleString();
    if (memberEl) memberEl.textContent = totalMembers;
    if (badgeEl)  badgeEl.textContent  = `${activeCount}/${totalMembers} Active`;
}

computeTeamStats();

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name) {
    return name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getAvatarColor(status) {
    const map = {
        active:  { bg: '#1e3a8a', color: 'white' },
        break:   { bg: '#94a3b8', color: 'white' },
        offline: { bg: '#cbd5e1', color: '#64748b' },
    };
    return map[status] || map.offline;
}

// ── Member Edit & Status ───────────────────────────────────────────────────────
let currentEditingMember = null;
let selectedStatus = 'active';

window.openEditMemberModal = function(memberName) {
    currentEditingMember = memberName;
    const row = document.querySelector(`.member-row[data-member="${memberName}"]`);
    if (!row) return;

    document.getElementById('edit-member-title').textContent = `Edit ${memberName}'s Profile`;
    document.getElementById('edit-member-phone').value = row.dataset.phone || '';
    
    // Set initial status in modal
    window.setMemberStatus(row.dataset.status || 'active');

    document.getElementById('edit-member-modal').classList.add('active');
};

window.setMemberStatus = function(status) {
    selectedStatus = status;
    const activeBtn = document.getElementById('status-active-btn');
    const breakBtn = document.getElementById('status-break-btn');

    if (status === 'active') {
        activeBtn.classList.add('active');
        breakBtn.classList.remove('active');
    } else {
        activeBtn.classList.remove('active');
        breakBtn.classList.add('active');
    }
};

window.saveMemberChanges = function() {
    if (!currentEditingMember) return;
    
    const row = document.querySelector(`.member-row[data-member="${currentEditingMember}"]`);
    if (!row) return;

    const newPhone = document.getElementById('edit-member-phone').value;
    
    // Update data attributes
    row.dataset.phone = newPhone;
    row.dataset.status = selectedStatus;

    // Update UI Elements
    const statusTag = row.querySelector('.status-tag');
    const cfg = STATUS_CONFIG[selectedStatus];
    
    if (statusTag) {
        statusTag.className = `status-tag ${cfg.tag}`;
        statusTag.innerHTML = cfg.label;
    }

    // Update Avatar Color
    const avatar = row.querySelector('.member-avatar');
    if (avatar) {
        const colorCfg = getAvatarColor(selectedStatus);
        avatar.style.background = colorCfg.bg;
        avatar.style.color = colorCfg.color;
    }

    // Special behavior for On Break
    if (selectedStatus === 'break') {
        row.querySelector('.member-location').innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Rest Area';
        row.dataset.location = "Rest Area";
    }

    // Close Modal
    document.getElementById('edit-member-modal').classList.remove('active');
    
    // Refresh stats
    computeTeamStats();
    
    // Notification (Visual Only)
    console.log(`Updated ${currentEditingMember} to ${selectedStatus}`);
};

// Add helper class listener for member locations if they exist as spans
memberRows.forEach(row => {
    const sub = row.querySelector('.member-sub');
    // Ensure location has a class for easy selection
    const locSpan = sub.childNodes[4]; // This is fragile, let's just make it robust
    // Find the child with the location SVG
    sub.querySelectorAll('svg').forEach(svg => {
        if (svg.innerHTML.includes('M12 2C8.1')) {
            svg.nextSibling.textContent = ' ' + row.dataset.location + ' ';
            svg.parentElement.classList.add('member-location-container');
        }
    });
});