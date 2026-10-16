const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/store-data.json', 'utf8'));

const events = Object.values(data.events || {});
const eventRequests = Object.values(data.event_requests || {});

console.log(`=== AUDIT OF EVENTS & EVENT REQUESTS ===`);
console.log(`Total events in 'events': ${events.length}`);
console.log(`Total event_requests in 'event_requests': ${eventRequests.length}`);

// Function to find all references to an event ID or event request ID across all collections
function countReferences(id) {
  const refs = {};
  for (const [collName, items] of Object.entries(data)) {
    if (collName === 'events' || collName === 'event_requests') continue;
    const list = Array.isArray(items) ? items : Object.values(items || {});
    const matching = list.filter((item) => {
      return (
        item.eventId === id ||
        item.eventRequestId === id ||
        item.event_id === id ||
        item.event_request_id === id ||
        item.targetEventId === id ||
        (item.details && typeof item.details === 'string' && item.details.includes(id)) ||
        (item.message && typeof item.message === 'string' && item.message.includes(id))
      );
    });
    if (matching.length > 0) {
      refs[collName] = matching.length;
    }
  }
  return refs;
}

console.log('\n--- AUDITING events collection ---');
const eventTitleMap = {};
events.forEach((e) => {
  const key = `${(e.name || e.eventName || '').trim().toLowerCase()}`;
  if (!eventTitleMap[key]) eventTitleMap[key] = [];
  eventTitleMap[key].push({
    id: e.id,
    name: e.name || e.eventName,
    startDate: e.startDate || e.date,
    endDate: e.endDate,
    venue: e.venue || e.location,
    status: e.status,
    operationalStatus: e.operationalStatus,
    client: e.clientUserId || e.organizationName,
    refs: countReferences(e.id),
  });
});

console.log(`Unique event titles in 'events': ${Object.keys(eventTitleMap).length}`);
for (const [title, list] of Object.entries(eventTitleMap)) {
  if (list.length > 1) {
    console.log(`\nDUPLICATE GROUP in 'events' (${list.length} records): "${title}"`);
    list.forEach((item) => {
      console.log(`  - ID: ${item.id} | Dates: ${item.startDate} to ${item.endDate} | Venue: ${item.venue} | Status: ${item.status}/${item.operationalStatus} | Refs: ${JSON.stringify(item.refs)}`);
    });
  }
}

console.log('\n--- AUDITING event_requests collection ---');
const reqTitleMap = {};
eventRequests.forEach((r) => {
  const key = `${(r.eventName || '').trim().toLowerCase()}`;
  if (!reqTitleMap[key]) reqTitleMap[key] = [];
  reqTitleMap[key].push({
    id: r.id,
    name: r.eventName,
    clientUserId: r.clientUserId,
    clientName: r.clientName,
    organizationName: r.organizationName,
    startDate: r.startDate || r.eventDate,
    endDate: r.endDate,
    venue: r.venue,
    status: r.status,
    operationalStatus: r.operationalStatus,
    eventManagerUserId: r.eventManagerUserId,
    onsiteCoordinatorUserId: r.onsiteCoordinatorUserId,
    refs: countReferences(r.id),
  });
});

console.log(`Unique event titles in 'event_requests': ${Object.keys(reqTitleMap).length}`);
let dupReqGroups = 0;
for (const [title, list] of Object.entries(reqTitleMap)) {
  if (list.length > 1) {
    dupReqGroups++;
    console.log(`\nDUPLICATE GROUP in 'event_requests' (${list.length} records): "${title}"`);
    list.forEach((item) => {
      console.log(`  - ID: ${item.id} | Client: ${item.clientUserId} (${item.clientName}) | Dates: ${item.startDate} to ${item.endDate} | Venue: ${item.venue} | Status: ${item.status}/${item.operationalStatus} | EM: ${item.eventManagerUserId} | Refs: ${JSON.stringify(item.refs)}`);
    });
  }
}
console.log(`\nTotal duplicate groups in event_requests: ${dupReqGroups}`);

// Check correlation between events and event_requests
console.log('\n--- CORRELATION BETWEEN events AND event_requests ---');
events.forEach(e => {
  const matchedReq = eventRequests.find(r => r.id === e.id || r.eventName?.toLowerCase() === (e.name || e.eventName)?.toLowerCase());
  if (matchedReq) {
    console.log(`Event ID ${e.id} matches Request ID ${matchedReq.id} (Name: "${e.name || e.eventName}")`);
  }
});
