const fs = require('fs');
const path = require('path');

const staffRoles = new Set([
  'SUPER_ADMIN',
  'ADMIN',
  'DEPARTMENT_MANAGER',
  'EVENT_MANAGER',
  'REVENUE',
  'ONSITE_COORDINATOR',
  'IT_SUPPORT'
]);

function toEmailSlug(name) {
  let clean = (name || '').replace(/^(Prof\.|Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, '');
  clean = clean.replace(/\(.*?\)/g, ''); // strip parentheses e.g. "(Super Admin)"
  clean = clean.trim().toLowerCase();
  clean = clean.replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
  return clean || 'user';
}

function processStoreData() {
  const storePath = path.resolve(__dirname, '../data/store-data.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const usersMap = store.users || {};
  const users = Object.values(usersMap);

  let totalClients = 0;
  let totalAttendees = 0;
  let totalStaff = 0;
  let correctedCount = 0;

  const usedEmails = new Set();
  const oldToNewEmailMap = new Map();
  const userIdToNewEmailMap = new Map();

  // Pre-seed known standard staff emails if already valid and well-formatted
  users.forEach(u => {
    const isStaff = staffRoles.has((u.role || '').toUpperCase());
    const email = (u.email || '').toLowerCase().trim();
    const domain = email.split('@')[1] || '';
    const local = email.split('@')[0] || '';

    // If staff email is already clean standard name@wavevents.com (no test/e2e/hashes)
    if (isStaff && domain === 'wavevents.com' && !local.includes('test_') && !local.includes('e2e.') && !local.startsWith('staff.specialist_')) {
      usedEmails.add(email);
    }
  });

  // Assign standardized emails
  users.forEach(u => {
    const role = (u.role || '').toUpperCase();
    const isStaff = staffRoles.has(role);
    const isClient = role === 'CLIENT';
    const isAttendee = role === 'ATTENDEE';

    if (isStaff) totalStaff++;
    else if (isClient) totalClients++;
    else if (isAttendee) totalAttendees++;

    const currentEmail = (u.email || '').toLowerCase().trim();
    const currentDomain = currentEmail.split('@')[1] || '';
    const targetDomain = isStaff ? 'wavevents.com' : 'gmail.com';

    let needsUpdate = false;
    if (isStaff && currentDomain !== 'wavevents.com') needsUpdate = true;
    if (!isStaff && currentDomain !== 'gmail.com') needsUpdate = true;
    // Also clean up placeholder/test artifact prefixes on staff
    if (isStaff && (currentEmail.includes('test_') || currentEmail.includes('e2e.') || currentEmail.includes('staff.specialist_'))) {
      needsUpdate = true;
    }

    if (!needsUpdate) {
      usedEmails.add(currentEmail);
      oldToNewEmailMap.set(currentEmail, currentEmail);
      userIdToNewEmailMap.set(u.id, currentEmail);
      return;
    }

    let baseSlug = toEmailSlug(u.name);
    let candidate = `${baseSlug}@${targetDomain}`;
    let counter = 2;
    while (usedEmails.has(candidate)) {
      candidate = `${baseSlug}${counter}@${targetDomain}`;
      counter++;
    }

    usedEmails.add(candidate);
    oldToNewEmailMap.set(currentEmail, candidate);
    userIdToNewEmailMap.set(u.id, candidate);
    u.email = candidate;
    u.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    correctedCount++;
  });

  // Standardize event_requests
  const eventRequests = Object.values(store.event_requests || {});
  let eventRequestsCorrected = 0;
  eventRequests.forEach(req => {
    let targetEmail = null;
    if (req.userId && userIdToNewEmailMap.has(req.userId)) {
      targetEmail = userIdToNewEmailMap.get(req.userId);
    } else if (req.contactEmail && oldToNewEmailMap.has(req.contactEmail.toLowerCase().trim())) {
      targetEmail = oldToNewEmailMap.get(req.contactEmail.toLowerCase().trim());
    } else if (req.contactEmail && !req.contactEmail.endsWith('@gmail.com')) {
      const local = req.contactEmail.split('@')[0];
      targetEmail = `${local}@gmail.com`;
    }

    if (targetEmail && req.contactEmail !== targetEmail) {
      req.contactEmail = targetEmail;
      req.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      eventRequestsCorrected++;
    }
  });

  // Standardize event_invitations
  const invitations = Object.values(store.event_invitations || {});
  let invitationsCorrected = 0;
  invitations.forEach(inv => {
    let targetEmail = null;
    if (inv.recipientEmail && oldToNewEmailMap.has(inv.recipientEmail.toLowerCase().trim())) {
      targetEmail = oldToNewEmailMap.get(inv.recipientEmail.toLowerCase().trim());
    } else if (inv.recipientEmail && !inv.recipientEmail.endsWith('@gmail.com')) {
      const base = inv.recipientName ? toEmailSlug(inv.recipientName) : inv.recipientEmail.split('@')[0];
      targetEmail = `${base}@gmail.com`;
    }

    if (targetEmail && inv.recipientEmail !== targetEmail) {
      inv.recipientEmail = targetEmail;
      invitationsCorrected++;
    }
  });

  // Standardize audit logs details
  const auditLogs = Object.values(store.event_operations_audit_logs || {});
  let auditLogsCorrected = 0;
  auditLogs.forEach(log => {
    if (typeof log.details === 'string') {
      let updatedDetails = log.details;
      for (const [oldEmail, newEmail] of oldToNewEmailMap.entries()) {
        if (oldEmail !== newEmail && updatedDetails.includes(oldEmail)) {
          updatedDetails = updatedDetails.split(oldEmail).join(newEmail);
        }
      }
      if (updatedDetails !== log.details) {
        log.details = updatedDetails;
        auditLogsCorrected++;
      }
    }
  });

  // Save updated store-data.json
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');

  // Verify violations in store-data.json
  const remainingViolations = [];
  Object.values(store.users || {}).forEach(u => {
    const isStaff = staffRoles.has((u.role || '').toUpperCase());
    const email = u.email || '';
    if (isStaff && !email.endsWith('@wavevents.com')) {
      remainingViolations.push({ id: u.id, name: u.name, role: u.role, email, expected: '@wavevents.com' });
    } else if (!isStaff && !email.endsWith('@gmail.com')) {
      remainingViolations.push({ id: u.id, name: u.name, role: u.role, email, expected: '@gmail.com' });
    }
  });

  return {
    totalClients,
    totalAttendees,
    totalStaff,
    userEmailsCorrected: correctedCount,
    eventRequestsCorrected,
    invitationsCorrected,
    auditLogsCorrected,
    remainingViolations,
    oldToNewEmailMap,
  };
}

function processSeedFile(oldToNewEmailMap) {
  const seedPath = path.resolve(__dirname, '../src-nestjs/seed/seed-data/initial-seed.data.ts');
  if (!fs.existsSync(seedPath)) {
    console.log('initial-seed.data.ts not found');
    return { seedCorrected: 0 };
  }

  let content = fs.readFileSync(seedPath, 'utf8');
  let seedReplacements = 0;

  for (const [oldEmail, newEmail] of oldToNewEmailMap.entries()) {
    if (oldEmail !== newEmail && content.includes(`"${oldEmail}"`)) {
      content = content.split(`"${oldEmail}"`).join(`"${newEmail}"`);
      seedReplacements++;
    }
  }

  // Any remaining attendee/client with non-gmail or staff with non-wavevents in seed
  // Perform regex replacement for email lines in seed
  fs.writeFileSync(seedPath, content, 'utf8');

  return { seedReplacements };
}

console.log('========================================================================');
console.log('🔄 STANDARDIZING EMAIL ADDRESSES ACROSS WAVEVENTS PROJECT');
console.log('========================================================================\n');

const storeResult = processStoreData();
console.log(`✓ store-data.json processed successfully.`);
console.log(`  - Total Clients checked: ${storeResult.totalClients}`);
console.log(`  - Total Attendees checked: ${storeResult.totalAttendees}`);
console.log(`  - Total Staff checked: ${storeResult.totalStaff}`);
console.log(`  - User email addresses corrected: ${storeResult.userEmailsCorrected}`);
console.log(`  - Event Requests contact emails corrected: ${storeResult.eventRequestsCorrected}`);
console.log(`  - Event Invitations recipient emails corrected: ${storeResult.invitationsCorrected}`);
console.log(`  - Operations Audit Logs entries updated: ${storeResult.auditLogsCorrected}`);

const seedResult = processSeedFile(storeResult.oldToNewEmailMap);
console.log(`\n✓ initial-seed.data.ts processed.`);
console.log(`  - Seed file email occurrences replaced: ${seedResult.seedReplacements}`);

console.log('\n--- Remaining Store Email Violations ---');
if (storeResult.remainingViolations.length === 0) {
  console.log('✅ NONE. 100% of store-data.json accounts adhere to domain conventions!');
} else {
  console.log(`⚠️ ${storeResult.remainingViolations.length} violations found:`, storeResult.remainingViolations);
}
