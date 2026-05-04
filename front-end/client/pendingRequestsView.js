/**
 * PendingRequestsView
 * ─────────────────────────────────────────────────────────────────────────
 * Shown to event managers to view, approve, or reject client event requests.
 * Calls:
 *   GET  /pending-requests          → load all requests
 *   PATCH /pending-requests/:id/review → approve or reject
 */
class PendingRequestsView {

    static render() {
        return `
            <div class="page-header">
                <div class="page-title">
                    <h2>Pending Event Requests</h2>
                    <p>Review and approve client event hosting requests</p>
                </div>
            </div>
            <div id="pending-requests-container">
                <div style="text-align:center; padding: 40px; color: var(--text-muted);">
                    <div style="width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#3b82f6;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
                    Loading requests…
                </div>
            </div>
            <style>
                @keyframes spin { to { transform: rotate(360deg); } }
                .req-card { background:#fff; border-radius:12px; border:1px solid #e2e8f0; padding:24px; margin-bottom:16px; transition:box-shadow 0.2s; }
                .req-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
                .req-card-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
                .req-title { font-size:17px; font-weight:700; color:#1e3a8a; margin:0 0 4px; }
                .req-meta { font-size:13px; color:#64748b; display:flex; flex-wrap:wrap; gap:16px; margin-bottom:14px; }
                .req-meta span { display:flex; align-items:center; gap:5px; }
                .req-badge { padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; }
                .badge-pending  { background:#fef3c7; color:#92400e; }
                .badge-approved { background:#d1fae5; color:#065f46; }
                .badge-rejected { background:#fee2e2; color:#991b1b; }
                .req-actions { display:flex; gap:10px; margin-top:14px; }
                .btn-approve { background:#10b981; color:#fff; border:none; padding:9px 20px; border-radius:8px; font-weight:600; cursor:pointer; font-size:13px; transition:background 0.2s; }
                .btn-approve:hover { background:#059669; }
                .btn-reject { background:#fff; color:#ef4444; border:1.5px solid #ef4444; padding:9px 20px; border-radius:8px; font-weight:600; cursor:pointer; font-size:13px; transition:all 0.2s; }
                .btn-reject:hover { background:#fee2e2; }
                .empty-state { text-align:center; padding:60px 20px; color:#94a3b8; }
                .empty-state svg { margin-bottom:16px; opacity:0.4; }
            </style>
        `;
    }

    static async init() {
        const container = document.getElementById('pending-requests-container');
        if (!container) return;

        try {
            const res = await fetch('http://localhost:3000/pending-requests', {
                headers: { role: 'eventmanager' }
            });
            const requests = await res.json();

            if (!requests || requests.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>
                        <p style="font-size:16px; font-weight:600;">No pending requests</p>
                        <p style="font-size:14px;">All client requests have been reviewed.</p>
                    </div>`;
                return;
            }

            container.innerHTML = requests.map(r => this._renderCard(r)).join('');

            // Bind approve/reject buttons
            container.querySelectorAll('.btn-approve').forEach(btn => {
                btn.addEventListener('click', () => this._handleApprove(btn.dataset.id));
            });
            container.querySelectorAll('.btn-reject').forEach(btn => {
                btn.addEventListener('click', () => this._handleReject(btn.dataset.id));
            });

        } catch (err) {
            container.innerHTML = `<div class="empty-state"><p style="color:#ef4444;">Failed to load requests. Ensure the backend is running.</p></div>`;
            console.error(err);
        }
    }

    static _renderCard(r) {
        const badgeClass = r.status === 'Pending' ? 'badge-pending' : r.status === 'Approved' ? 'badge-approved' : 'badge-rejected';
        const isPending = r.status === 'Pending';
        return `
            <div class="req-card" id="req-${r.id}">
                <div class="req-card-header">
                    <div>
                        <p class="req-title">${r.name}</p>
                        <div style="font-size:13px; color:#64748b;">Requested by <strong>${r.client}</strong> (${r.clientEmail})</div>
                    </div>
                    <span class="req-badge ${badgeClass}">${r.status}</span>
                </div>
                <div class="req-meta">
                    <span>📅 ${r.date}</span>
                    <span>📍 ${r.location}</span>
                    <span>👥 ${r.expected} expected</span>
                    <span>🎪 ${r.type || 'In-Person'}</span>
                    ${r.eventId ? `<span>🔗 Event ID: ${r.eventId}</span>` : ''}
                </div>
                <div style="font-size:13px; color:#475569; margin-bottom:10px;">${r.description}</div>
                ${r.rejectionReason ? `<div style="font-size:13px; color:#ef4444; background:#fee2e2; padding:8px 12px; border-radius:8px; margin-bottom:10px;">Rejection reason: ${r.rejectionReason}</div>` : ''}
                ${r.managerId ? `<div style="font-size:13px; color:#10b981;">✅ Approved by ${r.managerName || r.managerId}</div>` : ''}
                ${isPending ? `
                <div class="req-actions">
                    <button class="btn-approve" data-id="${r.id}">✅ Approve</button>
                    <button class="btn-reject"  data-id="${r.id}">✖ Reject</button>
                </div>` : ''}
            </div>`;
    }

    static async _handleApprove(reqId) {
        const user = Auth.getCurrentUser();
        if (!user) return;

        const confirmed = confirm('Approve this event request? The event status will be changed to "upcoming".');
        if (!confirmed) return;

        try {
            const res = await fetch(`http://localhost:3000/pending-requests/${reqId}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'role': 'eventmanager' },
                body: JSON.stringify({
                    decision: 'approved',
                    managerId: user.id,
                    managerName: user.name
                })
            });
            if (!res.ok) throw new Error(await res.text());
            const reviewed = await res.json();

            // ── Notify client about approval ──────────────────────────────
            try {
                await fetch('http://localhost:3000/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'role': 'eventmanager' },
                    body: JSON.stringify({
                        title:       '✅ Event Request Approved: ' + (reviewed.name || reqId),
                        desc:        `Your event request "${reviewed.name || reqId}" has been approved by ${user.name}. It is now listed as upcoming.`,
                        priority:    'low',
                        reporter:    user.name || 'Event Manager',
                        targetEmail: reviewed.clientEmail || ''
                    })
                });
            } catch(e) { console.warn('Approval notification failed:', e); }

            alert('Request approved! The event is now listed as upcoming.');
            // Reload the view
            const main = document.getElementById('mainContent');
            if (main) {
                main.innerHTML = PendingRequestsView.render();
                PendingRequestsView.init();
            }
        } catch (err) {
            alert('Failed to approve: ' + err.message);
        }
    }

    static async _handleReject(reqId) {
        const user = Auth.getCurrentUser();
        const reason = prompt('Enter a rejection reason (optional):') || 'Not approved at this time.';
        try {
            const res = await fetch(`http://localhost:3000/pending-requests/${reqId}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'role': 'eventmanager' },
                body: JSON.stringify({
                    decision: 'rejected',
                    rejectionReason: reason
                })
            });
            if (!res.ok) throw new Error(await res.text());
            const reviewed = await res.json();

            // ── Notify client about rejection ──────────────────────────────
            try {
                await fetch('http://localhost:3000/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'role': 'eventmanager' },
                    body: JSON.stringify({
                        title:       '❌ Event Request Rejected: ' + (reviewed.name || reqId),
                        desc:        `Your event request "${reviewed.name || reqId}" was rejected. Reason: ${reason}`,
                        priority:    'medium',
                        reporter:    (user && user.name) || 'Event Manager',
                        targetEmail: reviewed.clientEmail || ''
                    })
                });
            } catch(e) { console.warn('Rejection notification failed:', e); }

            alert('Request rejected.');
            const main = document.getElementById('mainContent');
            if (main) {
                main.innerHTML = PendingRequestsView.render();
                PendingRequestsView.init();
            }
        } catch (err) {
            alert('Failed to reject: ' + err.message);
        }
    }
}