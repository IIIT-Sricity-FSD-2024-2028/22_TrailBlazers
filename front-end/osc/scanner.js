/* =============================================
   scanner.js — QR Scanner + Manual Ticket Verify
   Checks attendees against backend RSVPs and
   persists approved check-ins to checkins.json
   via POST /check-ins
   ============================================= */

'use strict';

const API = 'http://localhost:3000';

// ── State ────────────────────────────────────────────────────────────────────
let currentAttendee = null;   // { name, ticket, event, email, eventId, attendeeId, rsvpId, valid }
let qrPoolIndex     = 0;
let isScanning      = false;

// Simulated ticket codes — loaded from backend on init, fallback to static list
let QR_SIMULATION_TICKETS = ['TKT00007', 'TKT00008', 'TKT00009', 'TKT00010', 'TKT00011', 'TKT00012', 'TKT00013'];

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

// ── Get logged-in OSC user ────────────────────────────────────────────────────
function getOscUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('wevents_user') || '{}');
    } catch (_) { return {}; }
}

// ── API helper (always uses superuser role to bypass any access issues) ───────
async function apiFetch(path, options) {
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', role: 'superuser', ...(options && options.headers) },
    });
    return res;
}

// ── Load real ticket codes from backend RSVPs on init ────────────────────────
async function loadRealTicketPool() {
    try {
        const res  = await apiFetch('/rsvps');
        if (!res.ok) return;
        const rsvps = await res.json();
        // Only use confirmed/pending tickets for simulation
        const validTickets = rsvps
            .filter(r => r.ticketCode && (r.status === 'confirmed' || r.status === 'pending' || r.status === 'attended'))
            .map(r => r.ticketCode);
        if (validTickets.length > 0) {
            QR_SIMULATION_TICKETS = validTickets;
            console.log('[Scanner] Loaded', validTickets.length, 'real ticket codes for QR simulation.');
        }
    } catch (err) {
        console.warn('[Scanner] Could not load ticket pool from backend, using fallback list.', err);
    }
}

// ── Lookup Ticket from Backend RSVP ──────────────────────────────────────────
async function lookupTicket(ticketCode) {
    try {
        const res   = await apiFetch('/rsvps');
        if (!res.ok) throw new Error('RSVP fetch failed: ' + res.status);
        const rsvps = await res.json();
        return rsvps.find(r => r.ticketCode && r.ticketCode.toUpperCase() === ticketCode.toUpperCase()) || null;
    } catch (err) {
        console.error('[Scanner] RSVP lookup failed:', err);
        return null;
    }
}

// ── Fetch event title by eventId ──────────────────────────────────────────────
async function getEventTitle(eventId) {
    try {
        const res = await apiFetch(`/events/${eventId}`);
        if (!res.ok) return 'Event';
        const ev = await res.json();
        return ev.title || 'Event';
    } catch (_) { return 'Event'; }
}

// ── Check if already checked in ──────────────────────────────────────────────
async function isAlreadyCheckedIn(ticketCode) {
    try {
        const res      = await apiFetch('/check-ins');
        if (!res.ok) return false;
        const checkins = await res.json();
        return checkins.some(c => c.ticketCode === ticketCode && c.status === 'checked-in');
    } catch (_) { return false; }
}

// ── Modal Controls ────────────────────────────────────────────────────────────
function openModal(attendee) {
    currentAttendee = attendee;

    document.getElementById('att-name').textContent   = attendee.name;
    document.getElementById('att-ticket').textContent = attendee.ticket;
    document.getElementById('att-event').textContent  = attendee.event;
    document.getElementById('att-email').textContent  = attendee.email;

    const statusEl = document.getElementById('ticket-status');
    if (attendee.valid) {
        statusEl.className = 'ticket-status valid';
        statusEl.innerHTML = '<span>&#10004; Valid Ticket</span>';
        btnApprove.disabled      = false;
        btnApprove.style.opacity = '';
    } else {
        statusEl.className = 'ticket-status invalid';
        statusEl.innerHTML = `<span>&#10006; ${attendee.invalidReason || 'Invalid / Already Used'}</span>`;
        btnApprove.disabled      = true;
        btnApprove.style.opacity = '0.4';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => modalClose.focus(), 50);
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    btnApprove.disabled      = false;
    btnApprove.style.opacity = '';
    currentAttendee = null;
    ticketInput.value = '';
}

// ── Show loading in modal ─────────────────────────────────────────────────────
function showLookingUp(ticketCode) {
    document.getElementById('att-name').textContent   = 'Looking up…';
    document.getElementById('att-ticket').textContent = ticketCode;
    document.getElementById('att-event').textContent  = '—';
    document.getElementById('att-email').textContent  = '—';
    document.getElementById('ticket-status').className = 'ticket-status';
    document.getElementById('ticket-status').innerHTML = '<span>⏳ Checking backend…</span>';
    btnApprove.disabled      = true;
    btnApprove.style.opacity = '0.4';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ── Full ticket verify flow (used by both QR and manual) ─────────────────────
async function verifyAndOpen(ticketCode) {
    const code = ticketCode.trim().toUpperCase();
    if (!code) {
        ticketInput.classList.add('error');
        shakeElement(ticketInput);
        return;
    }

    // Show modal immediately with "looking up" state
    showLookingUp(code);

    // 1. Check if already checked in
    const alreadyIn = await isAlreadyCheckedIn(code);
    if (alreadyIn) {
        openModal({
            name:          'Already Checked-In',
            ticket:        code,
            event:         'Tech Innovation Summit 2026',
            email:         '—',
            valid:         false,
            invalidReason: 'Already Checked-In',
        });
        return;
    }

    // 2. Look up in RSVPs
    const rsvp = await lookupTicket(code);
    if (!rsvp) {
        openModal({
            name:          'Unknown Attendee',
            ticket:        code,
            event:         'Tech Innovation Summit 2026',
            email:         'Not on record',
            valid:         false,
            invalidReason: 'Ticket not found',
        });
        return;
    }

    // 3. Fetch event title
    const eventTitle = await getEventTitle(rsvp.eventId);

    // 4. Check if RSVP is confirmed
    const isConfirmed = rsvp.status === 'confirmed' || rsvp.status === 'attended';

    openModal({
        name:      rsvp.name,
        ticket:    rsvp.ticketCode,
        event:     eventTitle,
        email:     rsvp.email,
        eventId:   rsvp.eventId,
        attendeeId: rsvp.attendeeId || null,
        rsvpId:    rsvp.id,
        valid:     isConfirmed,
        invalidReason: isConfirmed ? null : `RSVP status: ${rsvp.status}`,
    });
}

// ── Activity Feed ─────────────────────────────────────────────────────────────
function prependActivity(name, ticketId, status) {
    if (window.addOscActivity) {
        window.addOscActivity(name, ticketId, status);
    }
}

// ── Stats Update ──────────────────────────────────────────────────────────────
function incrementStat(el) {
    const prev = parseInt(el.textContent, 10) || 0;
    el.textContent       = prev + 1;
    el.style.transform   = 'scale(1.15)';
    el.style.color       = '#f97316';
    setTimeout(() => { el.style.transform = ''; el.style.color = ''; }, 400);
}

function updateStats(action) {
    incrementStat(statTotal);
    const pending = parseInt(statPending.textContent, 10) || 0;
    statPending.textContent = Math.max(0, pending - 1);
    if (action === 'approve') {
        incrementStat(statApproved);
    } else {
        incrementStat(statRejected);
    }
}

// ── POST check-in to backend ──────────────────────────────────────────────────
async function postCheckIn(attendee) {
    const osc = getOscUser();
    const payload = {
        eventId:       attendee.eventId   || 'e1',
        attendeeId:    attendee.attendeeId || attendee.rsvpId || `att_${Date.now()}`,
        attendeeEmail: attendee.email,
        attendeeName:  attendee.name,
        ticketCode:    attendee.ticket,
        status:        'checked-in',
        checkedInBy:   osc.id   || 'osc',
        checkedInName: osc.name || 'On-Site Coordinator',
    };

    try {
        const res = await apiFetch('/check-ins', {
            method: 'POST',
            body:   JSON.stringify(payload),
        });
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            console.error('[Scanner] Check-in POST failed:', res.status, errBody);
            showToast('Backend error: ' + (errBody.message || res.status), 'error');
            return false;
        }
        const saved = await res.json();
        console.log('[Scanner] ✅ Check-in saved to backend:', saved);
        return true;
    } catch (err) {
        console.error('[Scanner] Network error on check-in POST:', err);
        showToast('Network error — check-in not saved to backend!', 'error');
        return false;
    }
}

// ── Toast helper ─────────────────────────────────────────────────────────────
function showToast(msg, type) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `
        position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
        background:${type === 'error' ? '#ef4444' : '#22c55e'};
        color:white;padding:10px 20px;border-radius:8px;font-size:14px;
        font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);
        animation:fadeIn 0.2s ease;
    `;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// ── QR Scan (simulate picking a ticket from real backend RSVPs) ───────────────
scanBtn.addEventListener('click', async () => {
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

    // Simulate a 1.5s scan delay, then pick the next real ticket code
    setTimeout(async () => {
        // Skip tickets already checked-in in this session
        let ticketCode;
        let attempts = 0;
        do {
            ticketCode = QR_SIMULATION_TICKETS[qrPoolIndex % QR_SIMULATION_TICKETS.length];
            qrPoolIndex++;
            attempts++;
        } while (attempts < QR_SIMULATION_TICKETS.length);

        scanBtn.disabled = false;
        scanBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <path d="M21 2H3v7h18zM21 15H3v7h18zM3 9h18M3 15h18"/>
            </svg>
            Scan QR Code
        `;
        qrViewport.classList.remove('scanning');
        isScanning = false;

        await verifyAndOpen(ticketCode);
    }, 1500);
});

// ── Manual Verify ─────────────────────────────────────────────────────────────
verifyBtn.addEventListener('click', handleVerify);
ticketInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleVerify();
    if (ticketInput.classList.contains('error')) ticketInput.classList.remove('error');
});

async function handleVerify() {
    const raw = ticketInput.value.trim();
    if (!raw) {
        ticketInput.classList.add('error');
        ticketInput.focus();
        shakeElement(ticketInput);
        return;
    }
    await verifyAndOpen(raw);
}

// ── Approve (persists to backend) ─────────────────────────────────────────────
btnApprove.addEventListener('click', async () => {
    if (!currentAttendee) return;

    btnApprove.disabled = true;
    btnApprove.textContent = '⏳ Saving…';

    const saved = await postCheckIn(currentAttendee);

    prependActivity(currentAttendee.name, currentAttendee.ticket, 'approved');
    updateStats('approve');

    if (saved) {
        showToast(`✅ ${currentAttendee.name} checked in and saved!`, 'success');
    }

    closeModal();
});

// ── Reject (no backend write — just local UI update) ─────────────────────────
btnReject.addEventListener('click', () => {
    if (!currentAttendee) return;
    prependActivity(currentAttendee.name, currentAttendee.ticket, 'rejected');
    updateStats('reject');
    closeModal();
});

// ── Close Triggers ────────────────────────────────────────────────────────────
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'shake 0.35s ease';
    setTimeout(() => { el.style.animation = ''; }, 400);
}

// CSS keyframes
(function injectKeyframes() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
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

// ── Initialize: load real ticket pool and live stats from backend ─────────────
(async function init() {
    // 1. Load real tickets from backend RSVPs for QR simulation
    await loadRealTicketPool();

    // 2. Load current check-in counts from backend to seed the stat counters
    try {
        const res = await apiFetch('/check-ins');
        if (res.ok) {
            const checkins = await res.json();
            const approved = checkins.filter(c => c.status === 'checked-in').length;
            const pending  = checkins.filter(c => c.status === 'pending').length;
            statTotal.textContent    = checkins.length;
            statApproved.textContent = approved;
            statPending.textContent  = pending;
            statRejected.textContent = '0'; // rejections are local-only
            console.log('[Scanner] Loaded live check-in stats: total=' + checkins.length);
        }
    } catch (err) {
        console.warn('[Scanner] Could not load live stats:', err);
    }
})();