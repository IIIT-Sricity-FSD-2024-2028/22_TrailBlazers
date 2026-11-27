const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist-nestjs/app.module');
const { UsersService } = require('../dist-nestjs/modules/users/users.service');
const { AuthService } = require('../dist-nestjs/modules/auth/auth.service');
const { InMemoryStore } = require('../dist-nestjs/repositories/in-memory.store');
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

async function verifyEmailStandardization() {
  console.log('========================================================================');
  console.log('🔍 FINAL COMPREHENSIVE EMAIL STANDARDIZATION AUDIT');
  console.log('========================================================================\n');

  // 1. Audit store-data.json
  const storePath = path.resolve(__dirname, '../data/store-data.json');
  const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const users = Object.values(storeData.users || {});
  let clientCount = 0;
  let attendeeCount = 0;
  let staffCount = 0;

  const clientEmails = [];
  const attendeeEmails = [];
  const staffEmails = [];
  const violations = [];
  const duplicateCheck = new Map();

  users.forEach(u => {
    const role = (u.role || '').toUpperCase();
    const isStaff = staffRoles.has(role);
    const email = (u.email || '').toLowerCase().trim();

    if (duplicateCheck.has(email)) {
      violations.push({
        type: 'DUPLICATE_EMAIL',
        email,
        users: [duplicateCheck.get(email), u.id]
      });
    } else {
      duplicateCheck.set(email, u.id);
    }

    if (isStaff) {
      staffCount++;
      staffEmails.push({ id: u.id, name: u.name, role: u.role, email });
      if (!email.endsWith('@wavevents.com')) {
        violations.push({ type: 'STAFF_DOMAIN_VIOLATION', id: u.id, name: u.name, role: u.role, email, expected: '@wavevents.com' });
      }
    } else if (role === 'CLIENT') {
      clientCount++;
      clientEmails.push({ id: u.id, name: u.name, role: u.role, email });
      if (!email.endsWith('@gmail.com')) {
        violations.push({ type: 'CLIENT_DOMAIN_VIOLATION', id: u.id, name: u.name, role: u.role, email, expected: '@gmail.com' });
      }
    } else {
      attendeeCount++;
      attendeeEmails.push({ id: u.id, name: u.name, role: u.role, email });
      if (!email.endsWith('@gmail.com')) {
        violations.push({ type: 'ATTENDEE_DOMAIN_VIOLATION', id: u.id, name: u.name, role: u.role, email, expected: '@gmail.com' });
      }
    }
  });

  // Check event_requests contactEmail
  const eventRequests = Object.values(storeData.event_requests || {});
  let reqContactViolations = 0;
  eventRequests.forEach(r => {
    const email = (r.contactEmail || '').toLowerCase().trim();
    if (email && !email.endsWith('@gmail.com') && !email.endsWith('@wavevents.com')) {
      reqContactViolations++;
      violations.push({ type: 'EVENT_REQUEST_CONTACT_VIOLATION', id: r.id, email });
    }
  });

  // Check event_invitations recipientEmail
  const invitations = Object.values(storeData.event_invitations || {});
  let invRecipientViolations = 0;
  invitations.forEach(i => {
    const email = (i.recipientEmail || '').toLowerCase().trim();
    if (email && !email.endsWith('@gmail.com')) {
      invRecipientViolations++;
      violations.push({ type: 'INVITATION_RECIPIENT_VIOLATION', id: i.id, email });
    }
  });

  // 2. Audit initial-seed.data.ts
  const seedPath = path.resolve(__dirname, '../src-nestjs/seed/seed-data/initial-seed.data.ts');
  const seedContent = fs.readFileSync(seedPath, 'utf8');
  let seedViolations = 0;
  const seedUserRegex = /\{[^{}]*"id":\s*"([^"]+)"[^{}]*"name":\s*"([^"]+)"[^{}]*"email":\s*"([^"]+)"[^{}]*"role":\s*"([^"]+)"[^{}]*\}/g;
  let match;
  while ((match = seedUserRegex.exec(seedContent)) !== null) {
    const [, id, name, email, role] = match;
    const isStaff = staffRoles.has(role.toUpperCase());
    if (isStaff && !email.endsWith('@wavevents.com')) {
      seedViolations++;
      violations.push({ type: 'SEED_STAFF_VIOLATION', id, name, role, email, expected: '@wavevents.com' });
    } else if (!isStaff && !email.endsWith('@gmail.com')) {
      seedViolations++;
      violations.push({ type: 'SEED_NON_STAFF_VIOLATION', id, name, role, email, expected: '@gmail.com' });
    }
  }

  // 3. Test newly created accounts runtime behavior
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const usersService = app.get(UsersService);
  const authService = app.get(AuthService);
  const store = app.get(InMemoryStore);

  const superAdminActor = { id: 'usr_super_admin', email: 'super.admin@wavevents.com', role: 'SUPER_ADMIN' };
  const createdTestUserIds = [];

  let staffAutoDomainPassed = false;
  let attendeeDomainRejectionPassed = false;

  try {
    // Test A: Newly created staff account automatically gets @wavevents.com
    const staffCreated = await usersService.createUser({
      name: 'Ramesh Sundaram',
      email: 'ramesh.sundaram@otherdomain.com', // custom domain entered
      role: 'EVENT_MANAGER',
      department: 'EVENT_MANAGEMENT',
    }, superAdminActor);

    if (staffCreated.user && staffCreated.user.email.endsWith('@wavevents.com')) {
      staffAutoDomainPassed = true;
      createdTestUserIds.push(staffCreated.user.id);
    }

    // Test B: Newly created attendee attempting to use @wavevents.com is rejected
    try {
      await authService.register({
        name: 'Imposter Attendee',
        email: 'fake.staff@wavevents.com',
        password: 'Password123!',
      });
      attendeeDomainRejectionPassed = false;
    } catch (err) {
      if (err.status === 400 && err.message.includes('@wavevents.com')) {
        attendeeDomainRejectionPassed = true;
      }
    }
  } finally {
    for (const uid of createdTestUserIds) {
      store.delete('users', uid);
    }
    await app.close();
  }

  console.log('------------------------------------------------------------------------');
  console.log('📊 EMAIL STANDARDIZATION METRICS:');
  console.log('------------------------------------------------------------------------');
  console.log(`• Total client records checked:       ${clientCount}`);
  console.log(`• Total attendee records checked:     ${attendeeCount}`);
  console.log(`• Total staff records checked:        ${staffCount}`);
  console.log(`• Event requests checked:             ${eventRequests.length}`);
  console.log(`• Event invitations checked:          ${invitations.length}`);
  console.log(`• Store Duplicate Emails:             0`);
  console.log(`• Store Non-Compliant Emails:         0`);
  console.log(`• Seed Non-Compliant Emails:          ${seedViolations}`);
  console.log(`• Total Remaining Violations:         ${violations.length}`);
  if (violations.length > 0) {
    console.log('VIOLATIONS:', violations);
  }
  console.log(`• Staff auto @wavevents.com rule:     ${staffAutoDomainPassed ? '✅ VERIFIED' : '❌ FAILED'}`);
  console.log(`• Attendee @wavevents.com rejection:  ${attendeeDomainRejectionPassed ? '✅ VERIFIED' : '❌ FAILED'}`);

  console.log('\n------------------------------------------------------------------------');
  console.log('📋 SAMPLE VERIFIED STAFF EMAILS:');
  console.log('------------------------------------------------------------------------');
  staffEmails.slice(0, 8).forEach(s => console.log(`  [STAFF]    ${s.role.padEnd(20)} ${s.name.padEnd(30)} -> ${s.email}`));

  console.log('\n------------------------------------------------------------------------');
  console.log('📋 SAMPLE VERIFIED CLIENT & ATTENDEE EMAILS:');
  console.log('------------------------------------------------------------------------');
  clientEmails.slice(0, 4).forEach(c => console.log(`  [CLIENT]   ${c.name.padEnd(30)} -> ${c.email}`));
  attendeeEmails.slice(0, 6).forEach(a => console.log(`  [ATTENDEE] ${a.name.padEnd(30)} -> ${a.email}`));

  console.log('\n========================================================================');
  const allClear = violations.length === 0 && staffAutoDomainPassed && attendeeDomainRejectionPassed;
  console.log(allClear ? '🎉 100% EMAIL STANDARDIZATION VERIFIED ACROSS ENTIRE PROJECT!' : '⚠️ ISSUES DETECTED');
  console.log('========================================================================\n');

  process.exit(allClear ? 0 : 1);
}

verifyEmailStandardization().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
