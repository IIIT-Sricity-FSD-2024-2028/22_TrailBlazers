/* =============================================
   scanner.js — Pure Vanilla JS for QR Scanner Page
   Handles: QR scan simulation, manual ticket verify,
            attendee verification popup, activity feed
   ============================================= */

'use strict';

// ── Mock Attendee Database ───────────────────────────────────────────────────
const ATTENDEES = {
    'TKT12345': { name: 'Nishanth',    ticket: 'TKT12345', event: 'Tech Innovation Summit 2026', email: 'nishanth@example.com',  valid: true  },
    'TKT02038': { name: 'Nishanth',    ticket: 'TKT02038', event: 'Tech Innovation Summit 2026', email: 'nishanth@example.com',  valid: true  },
    'TKT00249': { name: 'Arjun',       ticket: 'TKT00249', event: 'Tech Innovation Summit 2026', email: 'arjun@example.com',     valid: true  },
    'TKT00250': { name: 'Priya',       ticket: 'TKT00250', event: 'Tech Innovation Summit 2026', email: 'priya@example.com',     valid: false },
    'TKT00255': { name: 'Shreya',      ticket: 'TKT00255', event: 'Tech Innovation Summit 2026', email: 'shreya@example.com',    valid: true  },
    'TKT00260': { name: 'Rahul',       ticket: 'TKT00260', event: 'Tech Innovation Summit 2026', email: 'rahul@example.com',     valid: true  },
};

// Attendees to simulate on QR scan (cycles through)
const QR_POOL = [
    { name: 'Rohit',   ticket: 'TKT00253', event: 'Tech Innovation Summit 2026', email: 'rohit@example.com',   valid: true  },
    { name: 'Anjali',  ticket: 'TKT00252', event: 'Tech Innovation Summit 2026', email: 'anjali@example.com',  valid: true  },
    { name: 'Karthik', ticket: 'TKT00251', event: 'Tech Innovation Summit 2026', email: 'karthik@example.com', valid: false },
    { name: 'Meena',   ticket: 'TKT00254', event: 'Tech Innovation Summit 2026', email: 'meena@example.com',   valid: true  },
];

// ── State ────────────────────────────────────────────────────────────────────
let currentAttendee = null;
let qrPoolIndex = 0;
let isScanning = false;

// ── DOM References ────────────────────────────────────────────────────────────
const modal         = document.getElementById('verification-modal');
const modalClose    = document.getElementById('modal-close');
const scanBtn       = document.getElementById('scan-btn');
const verifyBtn     = document.getElementById('verify-btn');
const ticketInput   = document.getElementById('ticket-input');
const btnApprove    = document.getElementById('btn-approve');
const btnReject     = document.getElementById('btn-reject');
const activityList  = document.getElementById('activity-list');
const qrViewport    = document.getElementById('qr-viewport');

const statTotal    = document.getElementById('stat-total');
const statApproved = document.getElementById('stat-approved');
const statRejected = document.getElementById('stat-rejected');
const statPending  = document.getElementById('stat-pending');

// ── Modal Controls ────────────────────────────────────────────────────────────
function openModal(attendee) {
    currentAttendee = attendee;

    // Populate fields
    document.getElementById('att-name').textContent   = attendee.name;
    document.getElementById('att-ticket').textContent = attendee.ticket;
    document.getElementById('att-event').textContent  = attendee.event;
    document.getElementById('att-email').textContent  = attendee.email;

    const statusEl = document.getElementById('ticket-status');
    if (attendee.valid) {
        statusEl.className = 'ticket-status valid';
        statusEl.innerHTML = '<span>&#10004; Valid Ticket</span>';
        btnApprove.disabled = false;
    } else {
        statusEl.className = 'ticket-status invalid';
        statusEl.innerHTML = '<span>&#10006; Invalid / Already Used</span>';
        btnApprove.disabled = true;
        btnApprove.style.opacity = '0.4';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => modalClose.focus(), 50);
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    btnApprove.disabled = false;
    btnApprove.style.opacity = '';
    currentAttendee = null;
    ticketInput.value = '';
}

// ── Activity Feed ─────────────────────────────────────────────────────────────
function prependActivity(name, ticketId, status) {
    if (window.addOscActivity) {
        window.addOscActivity(name, ticketId, status);
    }
}

// ── Stats Update ──────────────────────────────────────────────────────────────
function incrementStat(el) {
    const prev = parseInt(el.textContent, 10);
    el.textContent = prev + 1;
    el.style.transform = 'scale(1.15)';
    el.style.color = '#f97316';
    setTimeout(() => { el.style.transform = ''; el.style.color = ''; }, 400);
}

function updateStats(action) {
    incrementStat(statTotal);
    const pending = parseInt(statPending.textContent, 10);
    statPending.textContent = Math.max(0, pending - 1);

    if (action === 'approve') {
        incrementStat(statApproved);
    } else {
        incrementStat(statRejected);
    }
}

// ── QR Scan Simulation ────────────────────────────────────────────────────────
scanBtn.addEventListener('click', () => {
    if (isScanning) return;
    isScanning = true;

    scanBtn.disabled = true;
    scanBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"
             style="animation:spin 0.8s linear infinite">
            <path d="M12 2a10 10 0 1 1-10 10"/>
        </svg>
        Scanning...
    `;
    qrViewport.classList.add('scanning');

    setTimeout(() => {
        const attendee = QR_POOL[qrPoolIndex % QR_POOL.length];
        qrPoolIndex++;

        scanBtn.disabled = false;
        scanBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <path d="M21 2H3v7h18zM21 15H3v7h18zM3 9h18M3 15h18"/>
            </svg>
            Scan QR Code
        `;
        qrViewport.classList.remove('scanning');
        isScanning = false;

        openModal(attendee);
    }, 1600);
});

// ── Manual Verify ─────────────────────────────────────────────────────────────
verifyBtn.addEventListener('click', handleVerify);

ticketInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleVerify();
    if (ticketInput.classList.contains('error')) {
        ticketInput.classList.remove('error');
    }
});

function handleVerify() {
    const raw = ticketInput.value.trim();
    if (!raw) {
        ticketInput.classList.add('error');
        ticketInput.focus();
        shakeElement(ticketInput);
        return;
    }

    const id = raw.toUpperCase();
    const attendee = ATTENDEES[id] || {
        name: 'Unknown Attendee',
        ticket: id,
        event: 'Tech Innovation Summit 2026',
        email: 'Not on record',
        valid: false,
    };

    openModal(attendee);
}

// ── Approve / Reject ──────────────────────────────────────────────────────────
btnApprove.addEventListener('click', () => {
    if (!currentAttendee) return;
    prependActivity(currentAttendee.name, currentAttendee.ticket, 'approved');
    updateStats('approve');
    closeModal();
});

btnReject.addEventListener('click', () => {
    if (!currentAttendee) return;
    prependActivity(currentAttendee.name, currentAttendee.ticket, 'rejected');
    updateStats('reject');
    closeModal();
});

// ── Close Triggers ────────────────────────────────────────────────────────────
modalClose.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake 0.35s ease';
    setTimeout(() => { el.style.animation = ''; }, 400);
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
}

// CSS keyframes injected via JS (only for spin + shake — no tailwind)
(function injectKeyframes() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%       { transform: translateX(-6px); }
            40%       { transform: translateX(6px); }
            60%       { transform: translateX(-4px); }
            80%       { transform: translateX(4px); }
        }
        #stat-total, #stat-approved, #stat-rejected, #stat-pending {
            display: inline-block;
            transition: transform 0.3s ease, color 0.3s ease;
        }
    `;
    document.head.appendChild(style);
})();
