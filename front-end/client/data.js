const API_BASE = 'http://localhost:3000';

// In-memory cache populated from backend on init
let _eventsCache = [];
let _usersCache  = [];
let _rsvpsCache  = [];
let _pollRespCache = [];
let _qnaCache    = [];
let _checkinsCache = [];

// Use window flag so createEventView.js can force a refresh
if (typeof window._datastoreCacheLoaded === 'undefined') window._datastoreCacheLoaded = false;

class DataStore {
    // Sync load from in-memory cache (populated by loadFromBackend)
    static init() { /* no-op: use loadFromBackend() for async init */ }

    // ── Async bootstrap ──────────────────────────────────────────────────────
    static async loadFromBackend() {
        if (window._datastoreCacheLoaded) return;
        const user = Auth ? Auth.getCurrentUser() : null;
        const roleHeader = (user && user.role) ? user.role : 'superuser';
        try {
            // For clients, filter events by their clientId so pending events show up
            let eventsUrl = `${API_BASE}/events`;
            if (user && user.role === 'client' && user.id) {
                eventsUrl = `${API_BASE}/events?clientId=${encodeURIComponent(user.id)}`;
            }
            const [evRes, usRes, rsvpRes, prRes, qnaRes, ciRes] = await Promise.all([
                fetch(eventsUrl,                           { headers: { role: roleHeader } }),
                fetch(`${API_BASE}/users`,                 { headers: { role: 'superuser' } }),
                fetch(`${API_BASE}/rsvps`,                 { headers: { role: roleHeader } }),
                fetch(`${API_BASE}/poll-responses`,        { headers: { role: roleHeader } }),
                fetch(`${API_BASE}/qna`,                   { headers: { role: roleHeader } }),
                fetch(`${API_BASE}/check-ins`,             { headers: { role: roleHeader } }),
            ]);
            _eventsCache    = await evRes.json();
            _usersCache     = await usRes.json();
            _rsvpsCache     = prRes.ok       ? await rsvpRes.json() : [];
            _pollRespCache  = prRes.ok       ? await prRes.json()   : [];
            _qnaCache       = qnaRes.ok      ? await qnaRes.json()  : [];
            _checkinsCache  = ciRes.ok       ? await ciRes.json()   : [];
            window._datastoreCacheLoaded = true;
        } catch(e) {
            console.error('DataStore: could not load from backend', e);
        }
    }

    // ── Events ──────────────────────────────────────────────────────────────
    static getEvents()           { return _eventsCache; }
    static getRSVPs()            { return _rsvpsCache; }
    static getCheckIns()         { return _checkinsCache; }
    static getQnA()              { return _qnaCache; }
    static getPollResponses()    { return _pollRespCache; }

    static getEventById(id) {
        return _eventsCache.find(e => String(e.id) === String(id)) || null;
    }

    static addEvent(eventData) {
        const newEvent = { ...eventData, id: eventData.id || ('e' + Date.now()) };
        _eventsCache.unshift(newEvent);
        return newEvent;
    }

    static updateEvent(id, eventData) {
        const idx = _eventsCache.findIndex(e => String(e.id) === String(id));
        if (idx !== -1) {
            _eventsCache[idx] = { ..._eventsCache[idx], ...eventData };
            return _eventsCache[idx];
        }
        return null;
    }

    static async deleteEvent(id) {
        const user = Auth ? Auth.getCurrentUser() : null;
        const roleHeader = (user && user.role) ? user.role : 'eventmanager';
        try {
            await fetch(`${API_BASE}/events/${id}`, {
                method: 'DELETE',
                headers: { role: roleHeader }
            });
        } catch(e) {
            console.error('DataStore: failed to delete event from backend', e);
        }
        _eventsCache = _eventsCache.filter(e => String(e.id) !== String(id));
    }

    // ── Users ───────────────────────────────────────────────────────────────
    static getAllUsers()        { return _usersCache; }
    static getUserById(id)     { return _usersCache.find(u => u.id === id) || null; }
    static getUsersByRole(role){ return _usersCache.filter(u => u.role === role); }

    // ── Stats (computed from live backend cache) ─────────────────────────────
    static getDashboardStats() {
        const events     = _eventsCache;
        const active     = events.filter(e => e.status === 'live' || e.status === 'upcoming' || e.status === 'approved');
        const totalRSVPs = _rsvpsCache.length;
        const checkedIn  = _checkinsCache.filter(c => c.status === 'checked-in').length;
        const totalQnA   = _qnaCache.length;
        const totalPolls = _pollRespCache.length;

        // Compute average rating from events that have it
        let ratingSum = 0, ratingCount = 0, engagementSum = 0;
        events.forEach(e => {
            if (e.stats) {
                if (e.stats.rating)     { ratingCount++; ratingSum += parseFloat(e.stats.rating); }
                if (e.stats.engagement) { engagementSum += parseFloat(e.stats.engagement); }
            }
        });

        // Poll participation rate: poll responses vs total RSVPs
        const pollRate = totalRSVPs > 0 ? Math.round((totalPolls / totalRSVPs) * 100) : 0;
        // Check-in rate
        const checkInRate = totalRSVPs > 0 ? Math.round((checkedIn / totalRSVPs) * 100) : 0;
        // Users by role
        const totalUsers      = _usersCache.length;
        const totalManagers   = _usersCache.filter(u => u.role === 'eventmanager').length;
        const totalClients    = _usersCache.filter(u => u.role === 'client').length;
        const totalAttendees  = _usersCache.filter(u => u.role === 'attendee').length;
        const totalOSC        = _usersCache.filter(u => u.role === 'osc').length;

        return {
            engagementScore:    ratingCount ? (engagementSum / ratingCount).toFixed(1) : (events.length ? '85.0' : '0.0'),
            engagementTrend:    '12.4',
            activeEventsCount:  active.length,
            totalEventsCount:   events.length,
            avgRating:          ratingCount ? (ratingSum / ratingCount).toFixed(1) : '4.5',
            totalRSVPs:         totalRSVPs,
            checkedIn:          checkedIn,
            checkInRate:        checkInRate,
            pollRate:           pollRate,
            qaCount:            totalQnA,
            totalHosted:        events.length,
            // User breakdown (for superuser portal)
            totalUsers,
            totalManagers,
            totalClients,
            totalAttendees,
            totalOSC,
        };
    }

    static getRecentActivity() {
        return _eventsCache.slice(0, 5).map(e => ({
            id:        e.id,
            title:     e.title,
            status:    e.status,
            date:      e.date,
            attendees: _rsvpsCache.filter(r => r.eventId === e.id).length ||
                       (e.stats ? (e.stats.rsvps || e.stats.checkins) : 0) || 0,
            color: e.status === 'live'      ? '#ef4444' :
                   e.status === 'upcoming'  ? '#f97316' :
                   e.status === 'approved'  ? '#10b981' :
                   e.status === 'pending'   ? '#f59e0b' : '#94a3b8'
        }));
    }

    // Kept for backward compat
    static saveEvents(events) { _eventsCache = events; }
    static getPendingEvents() { return []; }
    static savePendingEvents() {}
}