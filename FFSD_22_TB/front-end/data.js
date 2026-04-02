// MOCK DATA AND STORAGE UTILITIES
const MOCK_USERS = [
    { id: 'u1', name: 'Rajesh Kumar', email: 'rajesh@gmail.com', role: 'superuser', domain: 'Client Hosted Events' },
    { id: 'u2', name: 'Arjun Mehta', email: 'arjun@gmail.com', role: 'superuser', domain: 'Tech Conferences' },
    { id: 'u3', name: 'Kavya Iyer', email: 'kavya@gmail.com', role: 'superuser', domain: 'Marketing Events' },
    { id: 'u4', name: 'Rahul Sharma', email: 'rahul.s@gmail.com', role: 'enduser' },
    { id: 'u5', name: 'Priya Patel', email: 'priya.p@gmail.com', role: 'enduser' }
];

const INITIAL_EVENTS = [
    {
        id: 'e1',
        title: 'Global Tech Summit 2026',
        status: 'upcoming',
        date: '2026-04-15',
        location: 'India Habitat Centre, New Delhi',
        attendees: 342,
        capacity: 500,
        sessions: 8,
        speakers: 12,
        managerId: 'u1',
        managerName: 'Rajesh Kumar',
        domain: 'Client Hosted Events',
        description: 'Explore the future of technology with industry leaders at our annual Tech Conference. Covers AI, cloud computing, and more.',
        timeline: [],
        stats: { rsvps: 342, checkins: 298, engagement: 87.5, rating: 4.8, participationTrend: [10, 25, 45, 30, 55, 78], feedbackScore: 92 }
    },
    {
        id: 'e2',
        title: 'Digital Marketing Expo',
        status: 'completed',
        date: '2026-03-20',
        location: 'Taj Hotel, Mumbai',
        attendees: 156,
        capacity: 200,
        sessions: 5,
        speakers: 6,
        managerId: 'u1',
        managerName: 'Rajesh Kumar',
        domain: 'Client Hosted Events',
        description: 'Exclusive reveal of our new product ecosystem designed for modern enterprises.',
        timeline: [],
        stats: { rsvps: 182, checkins: 156, engagement: 82.0, rating: 4.4, participationTrend: [70, 65, 40, 25, 10, 5], feedbackScore: 85 }
    },
    {
        id: 'e3',
        title: 'AI Innovation Workshop',
        status: 'pending',
        date: '2026-05-10',
        location: 'IISc Auditorium, Bangalore',
        attendees: 0,
        capacity: 300,
        sessions: 6,
        speakers: 8,
        managerId: 'u1',
        managerName: 'Rajesh Kumar',
        domain: 'Client Hosted Events',
        description: 'A hands-on workshop focused on creative problem-solving and rapid prototyping methodologies.',
        timeline: [],
        stats: { rsvps: 0, checkins: 0, engagement: 0, rating: 0, participationTrend: [0, 0, 0, 0, 0, 0], feedbackScore: 0 }
    },
    {
        id: 'e4',
        title: 'Sustainability Forum Live',
        status: 'live',
        date: '2026-04-02',
        location: 'Virtual Event Center',
        attendees: 890,
        capacity: 2000,
        sessions: 12,
        speakers: 15,
        managerId: 'u1',
        managerName: 'Rajesh Kumar',
        domain: 'Client Hosted Events',
        description: 'Live discussion on global sustainability goals and corporate responsibility.',
        timeline: [],
        stats: { rsvps: 1200, checkins: 890, engagement: 94.2, rating: 4.9, participationTrend: [15, 35, 60, 85, 95, 100], feedbackScore: 96 }
    }
];

const INITIAL_PENDING = [
    { name: 'Tech Innovation Summit 2026', location: 'Pune, Maharashtra', expected: 500, client: 'Priya Sharma', clientEmail: 'priya.s@techcorp.com', date: 'Apr 15, 2026', fullDate: 'Wednesday, April 15, 2026', description: 'Annual technology conference featuring AI and blockchain workshops', type: 'In-Person', status: 'Pending' },
    { name: 'Healthcare Leadership Forum', location: 'Chennai, Tamil Nadu', expected: 200, client: 'Amit Gupta', clientEmail: 'amit.g@healthtech.com', date: 'Apr 22, 2026', fullDate: 'Wednesday, April 22, 2026', description: 'Forum for healthcare industry leaders to discuss digital transformation', type: 'In-Person', status: 'Pending' }
];

class DataStore {
    static init() {
        const DATA_VERSION = '2.9'; 
        if (localStorage.getItem('wevents_data_version') !== DATA_VERSION) {
            localStorage.setItem('wevents_data', JSON.stringify(INITIAL_EVENTS));
            localStorage.setItem('wevents_pending_data', JSON.stringify(INITIAL_PENDING));
            localStorage.setItem('wevents_data_version', DATA_VERSION);
        }
        if (!localStorage.getItem('wevents_data')) {
            localStorage.setItem('wevents_data', JSON.stringify(INITIAL_EVENTS));
        }
    }

    static getEvents() {
        this.init();
        let events = JSON.parse(localStorage.getItem('wevents_data')) || [];
        let modified = false;
        events.forEach(e => {
            if (e.status === 'ongoing') {
                e.status = 'upcoming';
                modified = true;
            }
        });
        if (modified) {
            this.saveEvents(events);
        }
        return events;
    }
    
    static saveEvents(events) {
        localStorage.setItem('wevents_data', JSON.stringify(events));
    }

    static getPendingEvents() {
        this.init();
        return JSON.parse(localStorage.getItem('wevents_pending_data')) || [];
    }

    static savePendingEvents(events) {
        localStorage.setItem('wevents_pending_data', JSON.stringify(events));
    }

    static getEventById(id) {
        const events = this.getEvents();
        return events.find(e => String(e.id) === String(id));
    }

    static addEvent(eventData) {
        const events = this.getEvents();
        const newEvent = {
            ...eventData,
            id: 'e' + Date.now(),
            status: eventData.status || 'pending',
            attendees: 0,
            sessions: eventData.timeline ? eventData.timeline.length : 0,
            speakers: eventData.timeline ? new Set(eventData.timeline.map(s => s.speaker)).size : 0,
            stats: eventData.stats || { rsvps: 0, checkins: 0, engagement: 0, rating: 0, participationTrend: [], feedbackScore: 0 }
        };
        events.unshift(newEvent);
        this.saveEvents(events);
        return newEvent;
    }

    static updateEvent(id, eventData) {
        const events = this.getEvents();
        const index = events.findIndex(e => String(e.id) === String(id));
        if (index !== -1) {
            events[index] = { 
                ...events[index], 
                ...eventData,
                sessions: eventData.timeline ? eventData.timeline.length : events[index].sessions,
                speakers: eventData.timeline ? new Set(eventData.timeline.map(s => s.speaker)).size : events[index].speakers
            };
            this.saveEvents(events);
            return events[index];
        }
        return null;
    }

    static deleteEvent(id) {
        let events = this.getEvents();
        events = events.filter(e => String(e.id) !== String(id));
        this.saveEvents(events);
    }

    static getDashboardStats() {
        const events = this.getEvents();
        const active = events.filter(e => e.status === 'live' || e.status === 'upcoming');
        const completed = events.filter(e => e.status === 'completed');
        
        let totalRSVPs = 0;
        let totalQA = 0;
        let totalsReview = 0;
        let ratingSum = 0;
        let engagementSum = 0;

        events.forEach(e => {
            if (e.stats) {
                totalRSVPs += parseInt(e.stats.rsvps) || 0;
                totalQA += parseInt(e.stats.qa) || Math.floor(Math.random() * 50);
                if (e.stats.rating) {
                    totalsReview++;
                    ratingSum += parseFloat(e.stats.rating);
                }
                if (e.stats.engagement) {
                    engagementSum += parseFloat(e.stats.engagement);
                }
            }
        });

        return {
            engagementScore: totalsReview ? (engagementSum / totalsReview).toFixed(1) : '85.0',
            engagementTrend: '12.4',
            activeEventsCount: active.length,
            avgRating: totalsReview ? (ratingSum / totalsReview).toFixed(1) : '4.5',
            totalRSVPs: totalRSVPs || 1500,
            pollRate: 68,
            qaCount: totalQA || 290,
            totalHosted: events.length
        };
    }

    static getRecentActivity() {
        const events = this.getEvents();
        return events.slice(0, 4).map(e => ({
            id: e.id,
            title: e.title,
            status: e.status,
            date: e.date,
            attendees: e.attendees || (e.stats ? e.stats.checkins : 0) || 0,
            color: e.status === 'live' ? '#ef4444' : (e.status === 'upcoming' ? '#f97316' : '#10b981')
        }));
    }
}
