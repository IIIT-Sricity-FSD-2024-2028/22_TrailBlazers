/* =============================================
   report.js — Pure Vanilla JS for Report Issue Page
   Handles: character counter, form validation,
            "Report Issue" toast, "Escalate" popup
   ============================================= */

'use strict';

// ── DOM References ──────────────────────────────────────────────────────────
const issueTitleInput  = document.getElementById('issue-title');
const prioritySelect   = document.getElementById('priority-level');
const descTextarea     = document.getElementById('issue-description');
const charCountEl      = document.getElementById('char-count');
const reportBtn        = document.getElementById('report-btn');
const escalateBtn      = document.getElementById('escalate-btn');
const toast            = document.getElementById('success-toast');

const escalateModal    = document.getElementById('escalate-modal');
const escalateClose    = document.getElementById('escalate-close');
const cancelEscalate   = document.getElementById('cancel-escalate');
const confirmEscalate  = document.getElementById('confirm-escalate'); 
const escIssuePreview  = document.getElementById('esc-issue-preview');
const escPriorityPrev  = document.getElementById('esc-priority-preview');

const MAX_CHARS = 500;
let toastTimer = null;

// ── Character Counter ────────────────────────────────────────────────────────
descTextarea.addEventListener('input', updateCharCount);

function updateCharCount() {
    const len = descTextarea.value.length;
    charCountEl.textContent = `${len}/${MAX_CHARS} characters`;
    if (len >= MAX_CHARS * 0.9) {
        charCountEl.classList.add('limit');
    } else {
        charCountEl.classList.remove('limit');
    }
}

// ── Form Validation ──────────────────────────────────────────────────────────
function validateForm() {
    let valid = true;

    if (!issueTitleInput.value.trim()) {
        markError(issueTitleInput);
        valid = false;
    } else {
        clearError(issueTitleInput);
    }

    if (!prioritySelect.value) {
        markError(prioritySelect);
        valid = false;
    } else {
        clearError(prioritySelect);
    }

    return valid;
}

function markError(el) {
    el.classList.add('error');
    shakeElement(el);
    el.addEventListener('input', () => clearError(el), { once: true });
    el.addEventListener('change', () => clearError(el), { once: true });
}

function clearError(el) {
    el.classList.remove('error');
}

// ── Report Issue Button ──────────────────────────────────────────────────────
reportBtn.addEventListener('click', async () => {
    if (!validateForm()) {
        showToast('&#9888; Please fill in required fields.', 'error');
        return;
    }

    const title    = issueTitleInput.value.trim();
    const desc     = descTextarea.value.trim();
    const priority = prioritySelect.value;

    // Get reporter name from session storage if available
    let reporter = 'On-Site Coordinator';
    try { const u = JSON.parse(sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || '{}'); if (u && u.name) reporter = u.name; } catch(e) {}

    try {
        await fetch('http://localhost:3000/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'role': 'osc' },
            body: JSON.stringify({ title, desc, priority, reporter })
        });
    } catch(e) { console.warn('Could not send notification to backend:', e); }

    showToast('&#10004; Issue reported &amp; team notified', 'success');
    resetForm();
});

// ── Escalate Button → Opens Modal ────────────────────────────────────────────
escalateBtn.addEventListener('click', () => {
    // Show preview info in modal
    const title    = issueTitleInput.value.trim() || 'Not specified';
    const priority = prioritySelect.options[prioritySelect.selectedIndex]?.text || 'Not specified';
    const rawVal   = prioritySelect.value;

    escIssuePreview.textContent = title.length > 35 ? title.slice(0, 35) + '…' : title;
    escPriorityPrev.textContent = priority;
    escPriorityPrev.className   = `esc-value esc-priority priority-${rawVal}`;

    openEscalateModal();
});

// ── Escalate Modal Controls ───────────────────────────────────────────────────
function openEscalateModal() {
    escalateModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => confirmEscalate.focus(), 50);
}

function closeEscalateModal() {
    escalateModal.classList.remove('active');
    document.body.style.overflow = '';
}

escalateClose.addEventListener('click', closeEscalateModal);
cancelEscalate.addEventListener('click', closeEscalateModal);

escalateModal.addEventListener('click', (e) => {
    if (e.target === escalateModal) closeEscalateModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && escalateModal.classList.contains('active')) {
        closeEscalateModal();
    }
});

// ── Confirm Escalation ────────────────────────────────────────────────────────
confirmEscalate.addEventListener('click', async () => {
    const title    = issueTitleInput.value.trim() || 'Unspecified Issue';
    const priority = prioritySelect.value || 'medium';
    const desc     = descTextarea.value.trim() || 'No description provided.';

    // Get reporter name from session/local storage
    let reporter = 'On-Site Coordinator';
    try { const u = JSON.parse(sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || '{}'); if (u && u.name) reporter = u.name; } catch(e) {}

    try {
        await fetch('http://localhost:3000/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'role': 'osc' },
            body: JSON.stringify({
                title:    '🚨 Escalated: ' + title,
                desc:     desc,
                priority: priority,
                reporter: reporter
            })
        });
    } catch(e) { console.warn('Could not send escalation to backend:', e); }

    closeEscalateModal();
    showToast('&#128680; Issue escalated to Manager!', 'escalate');
    resetForm();
});

// ── Toast Notification ────────────────────────────────────────────────────────
function showToast(message, type) {
    // Clear any running timer
    if (toastTimer) clearTimeout(toastTimer);

    toast.innerHTML      = `<span>${message}</span>`;
    toast.className      = `toast toast--${type} toast--visible`;

    toastTimer = setTimeout(() => {
        toast.classList.remove('toast--visible');
    }, 3500);
}

// ── Reset Form ────────────────────────────────────────────────────────────────
function resetForm() {
    issueTitleInput.value  = '';
    prioritySelect.value   = '';
    descTextarea.value     = '';
    charCountEl.textContent = `0/${MAX_CHARS} characters`;
    charCountEl.classList.remove('limit');
    clearError(issueTitleInput);
    clearError(prioritySelect);
}

// ── Shake Animation Helper ────────────────────────────────────────────────────
function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake 0.35s ease';
    setTimeout(() => { el.style.animation = ''; }, 400);
}

// Inject keyframe for shake
(function injectKeyframes() {
    const s = document.createElement('style');
    s.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%       { transform: translateX(-6px); }
            40%       { transform: translateX(6px); }
            60%       { transform: translateX(-4px); }
            80%       { transform: translateX(4px); }
        }
    `;
    document.head.appendChild(s);
})();