const fs = require('fs');
const path = require('path');

const seedPath = path.resolve(__dirname, '../src-nestjs/seed/seed-data/initial-seed.data.ts');
const content = fs.readFileSync(seedPath, 'utf8');

const staffRoles = new Set([
  'SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_MANAGER', 'EVENT_MANAGER', 'REVENUE', 'ONSITE_COORDINATOR', 'IT_SUPPORT'
]);

// Check each user block in initial-seed.data.ts
const userRegex = /\{[^{}]*"id":\s*"([^"]+)"[^{}]*"name":\s*"([^"]+)"[^{}]*"email":\s*"([^"]+)"[^{}]*"role":\s*"([^"]+)"[^{}]*\}/g;

let match;
const seedUsers = [];
const violations = [];

while ((match = userRegex.exec(content)) !== null) {
  const [full, id, name, email, role] = match;
  seedUsers.push({ id, name, email, role });
  const isStaff = staffRoles.has(role.toUpperCase());
  if (isStaff && !email.endsWith('@wavevents.com')) {
    violations.push({ id, name, role, email, expected: '@wavevents.com' });
  } else if (!isStaff && !email.endsWith('@gmail.com')) {
    violations.push({ id, name, role, email, expected: '@gmail.com' });
  }
}

console.log('Total Seed Users Found:', seedUsers.length);
console.log('Seed User Violations:', violations.length);
if (violations.length > 0) {
  console.log('Violations list:', violations);
}

// Check event_requests in seed
const reqRegex = /"contactEmail":\s*"([^"]+)"/g;
let reqMatch;
const nonGmailContactEmails = [];
while ((reqMatch = reqRegex.exec(content)) !== null) {
  const email = reqMatch[1];
  if (!email.endsWith('@gmail.com') && !email.endsWith('@wavevents.com')) {
    nonGmailContactEmails.push(email);
  }
}
console.log('Non-standard contact emails in seed:', nonGmailContactEmails.length);
if (nonGmailContactEmails.length > 0) {
  console.log('Contact emails:', nonGmailContactEmails);
}

// Check event_invitations in seed
const invRegex = /"recipientEmail":\s*"([^"]+)"/g;
let invMatch;
const nonGmailInvEmails = [];
while ((invMatch = invRegex.exec(content)) !== null) {
  const email = invMatch[1];
  if (!email.endsWith('@gmail.com')) {
    nonGmailInvEmails.push(email);
  }
}
console.log('Non-gmail invitation emails in seed:', nonGmailInvEmails.length);
if (nonGmailInvEmails.length > 0) {
  console.log('Invitation emails:', nonGmailInvEmails);
}
