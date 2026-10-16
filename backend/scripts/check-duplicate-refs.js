const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/store-data.json', 'utf8'));

const reqs = Object.values(data.event_requests || {});

const duplicateTitles = [
  'ai ethics & autonomous systems conference',
  'spoofed summit',
  'techfest 2026 - workflow verification',
  'ai & robotics techfest 2026',
  'india analytics & big data summit 2026',
  'end-to-end workflow summit 2026',
  'global ai & cloud leadership summit 2026',
  'convocation',
];

function findReferences(id) {
  const result = {};
  for (const [coll, items] of Object.entries(data)) {
    if (coll === 'events' || coll === 'event_requests' || coll === 'users') continue;
    const list = Array.isArray(items) ? items : Object.values(items || {});
    const matches = list.filter((item) => {
      return (
        item.eventId === id ||
        item.eventRequestId === id ||
        item.event_id === id ||
        item.event_request_id === id ||
        item.targetEventId === id ||
        item.id === id
      );
    });
    if (matches.length > 0) {
      result[coll] = matches.map((m) => m.id);
    }
  }
  return result;
}

duplicateTitles.forEach((title) => {
  console.log(`\n========================================`);
  console.log(`GROUP: "${title.toUpperCase()}"`);
  console.log(`========================================`);
  const matching = reqs.filter((r) => (r.eventName || '').trim().toLowerCase() === title);
  matching.forEach((r) => {
    const refs = findReferences(r.id);
    console.log(`\nID: ${r.id}`);
    console.log(`  Client: ${r.clientUserId} (${r.clientName}), Org: ${r.organizationName}`);
    console.log(`  Status: ${r.status}, OpStatus: ${r.operationalStatus}`);
    console.log(`  EM: ${r.eventManagerUserId}, OC: ${r.onsiteCoordinatorUserId}`);
    console.log(`  References: ${JSON.stringify(refs)}`);
  });
});
