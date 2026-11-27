const fs = require('fs');
const path = require('path');

function inspectStoreData() {
  const storePath = path.resolve(__dirname, '../data/store-data.json');
  if (!fs.existsSync(storePath)) {
    console.log('store-data.json not found');
    return;
  }
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const users = Object.values(store.users || {});

  const clients = [];
  const attendees = [];
  const staff = [];
  const other = [];

  const staffRoles = new Set([
    'SUPER_ADMIN',
    'ADMIN',
    'DEPARTMENT_MANAGER',
    'EVENT_MANAGER',
    'REVENUE',
    'ONSITE_COORDINATOR',
    'IT_SUPPORT'
  ]);

  users.forEach(u => {
    if (staffRoles.has(u.role)) {
      staff.push(u);
    } else if (u.role === 'CLIENT') {
      clients.push(u);
    } else if (u.role === 'ATTENDEE') {
      attendees.push(u);
    } else {
      other.push(u);
    }
  });

  console.log(`\n=== store-data.json Users Summary ===`);
  console.log(`Total users: ${users.length}`);
  console.log(`Clients: ${clients.length}`);
  console.log(`Attendees: ${attendees.length}`);
  console.log(`Staff: ${staff.length}`);
  console.log(`Other: ${other.length}`);

  console.log('\n--- Clients Emails ---');
  clients.forEach(u => console.log(`  ${u.id} | ${u.name} | ${u.email}`));

  console.log('\n--- Attendees Non-Gmail Emails ---');
  const nonGmailAttendees = attendees.filter(u => !(u.email || '').endsWith('@gmail.com'));
  nonGmailAttendees.forEach(u => console.log(`  ${u.id} | ${u.name} | ${u.email}`));
  console.log(`Non-Gmail Attendees: ${nonGmailAttendees.length} / ${attendees.length}`);

  console.log('\n--- Staff Non-Wavevents Emails ---');
  const nonWaveventsStaff = staff.filter(u => !(u.email || '').endsWith('@wavevents.com'));
  nonWaveventsStaff.forEach(u => console.log(`  ${u.id} | ${u.name} | ${u.role} | ${u.email}`));
  console.log(`Non-Wavevents Staff: ${nonWaveventsStaff.length} / ${staff.length}`);

  console.log('\n--- Event Requests Contact Emails ---');
  const eventRequests = Object.values(store.event_requests || {});
  eventRequests.forEach(r => {
    console.log(`  ${r.id} | ${r.eventName} | client: ${r.userId} | contactEmail: ${r.contactEmail}`);
  });

  console.log('\n--- Event Invitations Recipient Emails ---');
  const invitations = Object.values(store.event_invitations || {});
  invitations.forEach(i => {
    console.log(`  ${i.id} | ${i.recipientName} | ${i.recipientEmail}`);
  });
}

inspectStoreData();
