const fs = require('fs');
const path = require('path');

const storePath = path.resolve(__dirname, '../data/store-data.json');
const backupPath = path.resolve(__dirname, '../data/store-data.backup.20261017.json');

if (!fs.existsSync(backupPath)) {
  console.error('❌ Backup file does not exist! Aborting cleanup.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));

// Safety check: record existing user account IDs and password hashes
const originalUsers = JSON.parse(JSON.stringify(data.users));
const originalUserCount = Object.keys(originalUsers).length;

console.log('=== WAVEVENTS EVENT DATA CLEANUP & RECONCILIATION ===\n');
console.log(`Initial event_requests count: ${Object.keys(data.event_requests || {}).length}`);
console.log(`Initial events count: ${Object.keys(data.events || {}).length}`);
console.log(`Initial user accounts count: ${originalUserCount}`);

let duplicateEventsRemoved = 0;
let dependentRecordsReconciled = 0;

// Helper to reconcile all references to an event ID to a canonical ID
function reconcileEventId(oldId, canonicalId) {
  if (oldId === canonicalId) return;

  for (const [collName, items] of Object.entries(data)) {
    if (collName === 'events' || collName === 'event_requests' || collName === 'users') continue;
    const list = Array.isArray(items) ? items : Object.values(items || {});
    list.forEach((item) => {
      let changed = false;
      if (item.eventId === oldId) {
        item.eventId = canonicalId;
        changed = true;
      }
      if (item.eventRequestId === oldId) {
        item.eventRequestId = canonicalId;
        changed = true;
      }
      if (item.event_id === oldId) {
        item.event_id = canonicalId;
        changed = true;
      }
      if (item.event_request_id === oldId) {
        item.event_request_id = canonicalId;
        changed = true;
      }
      if (item.targetEventId === oldId) {
        item.targetEventId = canonicalId;
        changed = true;
      }
      if (changed) {
        dependentRecordsReconciled++;
      }
    });
  }
}

// Helper to delete an event request and event record safely
function removeDuplicate(id, canonicalId) {
  reconcileEventId(id, canonicalId);
  if (data.event_requests && data.event_requests[id]) {
    delete data.event_requests[id];
    duplicateEventsRemoved++;
  }
  if (data.events && data.events[id]) {
    delete data.events[id];
  }
}

// 1. Group: "ai ethics & autonomous systems conference"
// Canonical: req_f2f7006ed2d993e5
const group1Duplicates = ['req_8e5721a9497b1404', 'req_aeac9452b48e508c', 'req_c475eed25352bf02'];
group1Duplicates.forEach((id) => removeDuplicate(id, 'req_f2f7006ed2d993e5'));

// 2. Group: "spoofed summit"
// Canonical: req_4ed47395c6640453
const group2Duplicates = [
  'req_c4627ff0963b14f7',
  'req_a03ccda60d728752',
  'req_1d43d046bfb86e18',
  'req_f9bceaeb5afa2efa',
  'req_df298d8b7fc60dc5',
  'req_063fe4ab2f520df5',
];
group2Duplicates.forEach((id) => removeDuplicate(id, 'req_4ed47395c6640453'));

// 3. Group: "techfest 2026 - workflow verification"
// Canonical: test_req_1786621608389
const group3Duplicates = ['test_req_1786621591197', 'test_req_1786621784825'];
group3Duplicates.forEach((id) => removeDuplicate(id, 'test_req_1786621608389'));

// 4. Group: "ai & robotics techfest 2026"
// Canonical: req_test_wf_023df48a (has quotation qtn_test_15d08f3e and change requests)
const group4Duplicates = [
  'req_test_wf_17f59104',
  'req_test_wf_60c7483c',
  'req_test_wf_30d9f262',
  'req_test_wf_2f53a83d',
  'req_test_wf_536628d6',
  'req_test_wf_f0acb2ff',
  'req_test_wf_ae4458af',
  'req_test_wf_a059bc4c',
  'req_test_wf_6ae676e8',
  'req_test_wf_29655991',
];
group4Duplicates.forEach((id) => removeDuplicate(id, 'req_test_wf_023df48a'));

// 5. Group: "india analytics & big data summit 2026"
// Canonical: evt_analytics_test_1_1911 (has tickets, sessions, polls, feedback)
const group5Duplicates = ['evt_analytics_test_1_5206', 'evt_analytics_test_1_3586'];
group5Duplicates.forEach((id) => removeDuplicate(id, 'evt_analytics_test_1_1911'));

// 6. Group: "end-to-end workflow summit 2026"
// Preserve req_3b90b8dd729481a5 for "Awaiting Quotation" stage (PRICING).
// Preserve req_562d2c70c60366a6 for "Assigned Event" (COMMERCIAL_APPROVED).
// Remove duplicate assigned clones req_585617c5321fe688, req_f4a4dc81031c6de3, req_1e11ad61cea3de15.
const group6Duplicates = ['req_585617c5321fe688', 'req_f4a4dc81031c6de3', 'req_1e11ad61cea3de15'];
group6Duplicates.forEach((id) => removeDuplicate(id, 'req_562d2c70c60366a6'));

// 7. Group: "global ai & cloud leadership summit 2026"
// Preserve req_5966efd74a312327 for "Awaiting Quotation" stage (PRICING).
// Preserve req_aaad41fa677dbc1b for "Commercial Approved awaiting escalation" (has payments).
// Remove duplicate copies req_b2d675c109fc129e and req_132a509c8e5f3e8d.
const group7Duplicates = ['req_b2d675c109fc129e', 'req_132a509c8e5f3e8d'];
group7Duplicates.forEach((id) => removeDuplicate(id, 'req_aaad41fa677dbc1b'));

// 8. Group: "convocation"
// req_57ca35bd5e6a7ccc: QUOTATION_SENT (Awaiting Client Approval)
// req_df4503a21d800cf0: COMMERCIAL_APPROVED (Assigned to Staff)
// Both preserved as required by Section C (representative examples of distinct workflow stages).

// Now ensure balanced event lifecycle: Upcoming, Ongoing, Past
// Today is 2026-10-17.
// 1. Ongoing events (span current date: 2026-10-17)
if (data.events && data.events['evt-coord-a']) {
  data.events['evt-coord-a'].startDate = '2026-10-16';
  data.events['evt-coord-a'].endDate = '2026-10-18';
  data.events['evt-coord-a'].date = '2026-10-16';
  data.events['evt-coord-a'].status = 'PUBLISHED';
  data.events['evt-coord-a'].operationalStatus = 'LIVE';
}
if (data.event_requests && data.event_requests['evt-coord-a']) {
  data.event_requests['evt-coord-a'].startDate = '2026-10-16';
  data.event_requests['evt-coord-a'].endDate = '2026-10-18';
  data.event_requests['evt-coord-a'].eventDate = '2026-10-16';
  data.event_requests['evt-coord-a'].operationalStatus = 'LIVE';
}

if (data.events && data.events['evt_poll_test_1_1978']) {
  data.events['evt_poll_test_1_1978'].startDate = '2026-10-17';
  data.events['evt_poll_test_1_1978'].endDate = '2026-10-19';
  data.events['evt_poll_test_1_1978'].date = '2026-10-17';
  data.events['evt_poll_test_1_1978'].status = 'PUBLISHED';
  data.events['evt_poll_test_1_1978'].operationalStatus = 'LIVE';
}
if (data.event_requests && data.event_requests['evt_poll_test_1_1978']) {
  data.event_requests['evt_poll_test_1_1978'].startDate = '2026-10-17';
  data.event_requests['evt_poll_test_1_1978'].endDate = '2026-10-19';
  data.event_requests['evt_poll_test_1_1978'].eventDate = '2026-10-17';
  data.event_requests['evt_poll_test_1_1978'].operationalStatus = 'LIVE';
}

// Ensure all remaining events have consistent start and end dates
const allReqs = Object.values(data.event_requests || {});
allReqs.forEach((r) => {
  if (!r.startDate && r.eventDate) r.startDate = r.eventDate;
  if (!r.endDate && r.startDate) r.endDate = r.startDate;
});
const allEvents = Object.values(data.events || {});
allEvents.forEach((e) => {
  if (!e.startDate && e.date) e.startDate = e.date;
  if (!e.endDate && e.startDate) e.endDate = e.startDate;
});

// CRITICAL USER SAFETY CHECK
const currentUsers = data.users;
if (Object.keys(currentUsers).length !== originalUserCount) {
  console.error('❌ CRITICAL ERROR: User account count changed! Aborting.');
  process.exit(1);
}
for (const [uid, u] of Object.entries(originalUsers)) {
  const cur = currentUsers[uid];
  if (!cur || cur.email !== u.email || cur.passwordHash !== u.passwordHash || cur.role !== u.role) {
    console.error(`❌ CRITICAL ERROR: User account ${uid} was modified! Aborting.`);
    process.exit(1);
  }
}
console.log('✅ USER SAFETY VERIFICATION: 100% of user accounts, IDs, roles, emails, and password hashes remain untouched.');

// Write back to store-data.json atomically
fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
console.log(`\n✅ store-data.json updated successfully.`);

// Lifecycle count calculation
const today = '2026-10-17';
let upcoming = 0;
let ongoing = 0;
let past = 0;

const finalReqs = Object.values(data.event_requests || {});
finalReqs.forEach((r) => {
  const sd = r.startDate || r.eventDate;
  const ed = r.endDate || sd;
  if (ed < today) {
    past++;
  } else if (sd <= today && ed >= today) {
    ongoing++;
  } else {
    upcoming++;
  }
});

console.log(`\n=== FINAL DATASET SUMMARY ===`);
console.log(`- Duplicate event requests safely removed: ${duplicateEventsRemoved}`);
console.log(`- Dependent records reconciled: ${dependentRecordsReconciled}`);
console.log(`- Remaining unique event requests: ${finalReqs.length}`);
console.log(`- Remaining unique published events: ${Object.keys(data.events || {}).length}`);
console.log(`- Upcoming events: ${upcoming}`);
console.log(`- Ongoing events: ${ongoing}`);
console.log(`- Past events: ${past}`);

// Check Event Manager assignment counts after cleanup
console.log(`\n--- EVENT MANAGER ASSIGNMENT COUNTS AFTER CLEANUP ---`);
const managers = Object.values(data.users).filter((u) => u.role === 'EVENT_MANAGER');
managers.forEach((m) => {
  const active = finalReqs.filter(
    (r) =>
      r.eventManagerUserId === m.id &&
      r.status !== 'REJECTED' &&
      r.operationalStatus !== 'CANCELLED' &&
      r.operationalStatus !== 'COMPLETED',
  );
  console.log(`  ${m.name} (${m.id}): ${active.length} active events (Limit: 7)`);
});
