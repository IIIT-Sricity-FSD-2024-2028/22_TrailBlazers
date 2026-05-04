const fs = require('fs');

const dashFile = 'super user/dashboard.js';
let dashContent = fs.readFileSync(dashFile, 'utf8');

const eventDefRegex = /const events = \[\s*\{.*?\}\s*,\s*\];/s; // too complex, let's replace manually by searching literal lines

const dashNew = 
    // Fetch unified data from localStorage
    function getUnifiedEvents() {
        const raw = localStorage.getItem('wevents_data');
        if (!raw) return [];
        try {
            const data = JSON.parse(raw);
            return data.map(e => {
                let statusMap = e.status;
                if (e.status === 'ongoing') statusMap = 'active';
                if (e.status === 'pending') statusMap = 'queued';
                
                // Deterministic color and avatar based on managerName
                const mgr = e.managerName || 'System';
                const mAvatar = mgr.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
                const colors = ['#7c3aed', '#2563eb', '#16a34a', '#ea580c', '#db2777'];
                const mColor = colors[mgr.length % colors.length];

                return {
                    id: e.id,
                    name: e.title,
                    location: e.location || 'Virtual',
                    client: e.domain || 'Internal',
                    manager: mgr,
                    managerAvatar: mAvatar,
                    managerColor: mColor,
                    status: statusMap,
                    attendees: e.attendees || 0,
                    date: e.date || ''
                };
            });
        } catch(err) {
            return [];
        }
    }
    const events = getUnifiedEvents();
;

// we can just replace 'const events = [\n...    ];'
// We know it stops at '];' on line 27.
let dashLines = dashContent.split('\n');
const startDash = dashLines.findIndex(x => x.includes('const events = ['));
const endDash = dashLines.findIndex((x, i) => i > startDash && x.trim() === '];');

if (startDash !== -1 && endDash !== -1) {
    dashLines.splice(startDash, endDash - startDash + 1, dashNew);
    fs.writeFileSync(dashFile, dashLines.join('\n'));
    console.log('Updated super user/dashboard.js');
}

const evFile = 'super user/event-management.js';
let evContent = fs.readFileSync(evFile, 'utf8');

const startEv = evContent.indexOf('const events = [');
const endEv = evContent.indexOf('];', startEv);

if (startEv !== -1 && endEv !== -1) {
    const replacement = 
    function getUnifiedEvents() {
        const raw = localStorage.getItem('wevents_data');
        if (!raw) return [];
        try {
            const data = JSON.parse(raw);
            return data.map(e => {
                let statusMap = e.status;
                if (e.status === 'ongoing') statusMap = 'Active';
                if (e.status === 'pending') statusMap = 'Queued';
                if (e.status === 'completed') statusMap = 'Completed';
                
                const mgr = e.managerName || 'System Admin';
                const mAvatar = mgr.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
                const colors = ['#7c3aed', '#2563eb', '#16a34a', '#ea580c', '#db2777'];
                const mColor = colors[mgr.length % colors.length];
                
                return {
                    id: e.id,
                    name: e.title,
                    location: e.location || 'Virtual',
                    client: e.domain || 'Internal',
                    manager: mgr,
                    mAvatar: mAvatar,
                    mColor: mColor,
                    status: statusMap,
                    attendees: e.attendees || 0,
                    date: e.date || '',
                    team: []
                };
            });
        } catch(err) {
            return [];
        }
    }
    const events = getUnifiedEvents();
    ;
    
    // Also we need to replace pendingEvents wait NO, pending events logic can stay, but when we approve an event we should ALSO put it into wevents_data so it integrates with actors!
    
    fs.writeFileSync(evFile, evContent.substring(0, startEv) + replacement + evContent.substring(endEv + 2));
    console.log('Updated super user/event-management.js data read logic');
}

