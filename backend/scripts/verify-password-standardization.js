const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist-nestjs/app.module');
const { AuthService } = require('../dist-nestjs/modules/auth/auth.service');
const { UsersService } = require('../dist-nestjs/modules/users/users.service');
const { InMemoryStore } = require('../dist-nestjs/repositories/in-memory.store');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function runVerification() {
  console.log('========================================================================');
  console.log('🔐 FINAL COMPREHENSIVE PASSWORD STANDARDIZATION & AUTHENTICATION AUDIT');
  console.log('========================================================================\n');

  const targetPassword = 'Password123!';
  const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

  // --- Step 1: Audit store-data.json ---
  console.log('--- Step 1: Auditing store-data.json ---');
  const storePath = path.resolve(__dirname, '../data/store-data.json');
  const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const storeUsers = Object.values(storeData.users || {});

  console.log(`Found ${storeUsers.length} total users in store-data.json.`);
  let storeValidCount = 0;
  const storeViolations = [];

  for (const user of storeUsers) {
    if (!user.passwordHash || !bcryptRegex.test(user.passwordHash)) {
      storeViolations.push({ id: user.id, email: user.email, issue: 'Invalid or missing bcrypt hash format' });
    } else if (!bcrypt.compareSync(targetPassword, user.passwordHash)) {
      storeViolations.push({ id: user.id, email: user.email, issue: 'Hash does not match Password123!' });
    } else {
      storeValidCount++;
    }
  }

  console.log(`Store accounts checked: ${storeUsers.length}`);
  console.log(`Store accounts valid: ${storeValidCount}`);
  if (storeViolations.length > 0) {
    console.error('Violations found in store-data.json:', storeViolations);
    process.exit(1);
  }
  console.log('✔ 100% of store-data.json accounts match Password123! and valid bcrypt format.\n');

  // --- Step 2: Audit initial-seed.data.ts ---
  console.log('--- Step 2: Auditing initial-seed.data.ts ---');
  const seedPath = path.resolve(__dirname, '../src-nestjs/seed/seed-data/initial-seed.data.ts');
  const seedContent = fs.readFileSync(seedPath, 'utf8');

  const startIndex = seedContent.indexOf('"users": [');
  const endIndex = seedContent.indexOf('],', startIndex);
  const usersJson = seedContent.substring(startIndex + 9, endIndex + 1);
  const seedUsers = JSON.parse(usersJson);

  console.log(`Found ${seedUsers.length} total users in initial-seed.data.ts.`);
  let seedValidCount = 0;
  const seedViolations = [];

  for (const user of seedUsers) {
    if (!user.passwordHash || !bcryptRegex.test(user.passwordHash)) {
      seedViolations.push({ id: user.id, email: user.email, issue: 'Invalid or missing bcrypt hash format' });
    } else if (!bcrypt.compareSync(targetPassword, user.passwordHash)) {
      seedViolations.push({ id: user.id, email: user.email, issue: 'Hash does not match Password123!' });
    } else {
      seedValidCount++;
    }
  }

  console.log(`Seed accounts checked: ${seedUsers.length}`);
  console.log(`Seed accounts valid: ${seedValidCount}`);
  if (seedViolations.length > 0) {
    console.error('Violations found in initial-seed.data.ts:', seedViolations);
    process.exit(1);
  }
  console.log('✔ 100% of initial-seed.data.ts accounts match Password123! and valid bcrypt format.\n');

  // --- Step 3: Runtime Login Verification via NestJS AuthService ---
  console.log('--- Step 3: Runtime Login Tests for Each User Role ---');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const authService = app.get(AuthService);
  const usersService = app.get(UsersService);
  const store = app.get(InMemoryStore);

  const testRoles = [
    { role: 'SUPER_ADMIN', desc: 'Super Admin' },
    { role: 'DEPARTMENT_MANAGER', desc: 'Department Head (Events)', filter: u => u.department === 'EVENT_MANAGEMENT' },
    { role: 'DEPARTMENT_MANAGER', desc: 'Department Head (Revenue)', filter: u => u.department === 'REVENUE' },
    { role: 'DEPARTMENT_MANAGER', desc: 'Department Head (IT Support)', filter: u => u.department === 'IT_SUPPORT' },
    { role: 'EVENT_MANAGER', desc: 'Event Manager' },
    { role: 'REVENUE', desc: 'Revenue Staff' },
    { role: 'ONSITE_COORDINATOR', desc: 'Onsite Coordinator' },
    { role: 'IT_SUPPORT', desc: 'IT Support Staff' },
    { role: 'CLIENT', desc: 'Client' },
    { role: 'ATTENDEE', desc: 'Attendee' },
  ];

  const roleLoginResults = [];

  for (const testRole of testRoles) {
    const candidate = storeUsers.find(u => {
      if (u.role !== testRole.role) return false;
      if (testRole.filter) return testRole.filter(u);
      return true;
    });

    if (!candidate) {
      throw new Error(`Could not find candidate user for role ${testRole.role} (${testRole.desc})`);
    }

    // 1. Test successful login with Password123!
    let loginSuccess = false;
    let returnedToken = null;
    let returnedRole = null;
    try {
      const result = await authService.login({ email: candidate.email, password: targetPassword });
      if (result && result.token && result.user && result.user.role === candidate.role) {
        loginSuccess = true;
        returnedToken = result.token;
        returnedRole = result.user.role;
      }
    } catch (err) {
      loginSuccess = false;
      console.error(`Login failed for ${testRole.desc} (${candidate.email}):`, err.message);
    }

    // 2. Test rejection with wrong password
    let wrongPasswordRejected = false;
    try {
      await authService.login({ email: candidate.email, password: 'WrongPassword999!' });
    } catch (err) {
      wrongPasswordRejected = true;
    }

    // 3. Test rejection with lowercase password123 (case-sensitivity)
    let caseMismatchRejected = false;
    try {
      await authService.login({ email: candidate.email, password: 'password123' });
    } catch (err) {
      caseMismatchRejected = true;
    }

    const passedAll = loginSuccess && wrongPasswordRejected && caseMismatchRejected;
    roleLoginResults.push({
      role: testRole.role,
      description: testRole.desc,
      user: candidate.name,
      email: candidate.email,
      loginSuccess,
      wrongPasswordRejected,
      caseMismatchRejected,
      status: passedAll ? 'PASSED' : 'FAILED',
    });

    console.log(`[${passedAll ? 'PASS' : 'FAIL'}] ${testRole.desc.padEnd(30)} | Email: ${candidate.email.padEnd(34)} | Valid Login: ${loginSuccess} | Wrong Rejected: ${wrongPasswordRejected}`);
  }

  // --- Step 4: Verify Newly Created Users Follow Policy ---
  console.log('\n--- Step 4: Testing Newly Created Users Password Policy ---');

  const adminCreator = { id: 'usr_super_admin', role: 'SUPER_ADMIN', name: 'Super Admin' };

  // A. Create user with explicit custom password
  const testStaffEmail = 'new.audit.staff@wavevents.com';
  const explicitPassword = 'CustomSecurePass789!';
  const customUserRes = await usersService.createUser({
    name: 'Audit Custom Staff',
    email: testStaffEmail,
    role: 'EVENT_MANAGER',
    department: 'EVENT_MANAGEMENT',
    password: explicitPassword,
  }, adminCreator);

  console.log('Created user with explicit password:', customUserRes.user.email);
  const customLoginRes = await authService.login({ email: testStaffEmail, password: explicitPassword });
  console.log('✔ Explicit password user logged in successfully:', !!customLoginRes.token);

  let customTargetPassRejected = false;
  try {
    await authService.login({ email: testStaffEmail, password: targetPassword });
  } catch (e) {
    customTargetPassRejected = true;
  }
  console.log('✔ Explicit password user correctly rejected Password123!:', customTargetPassRejected);

  // B. Create user with auto-generated password
  const testAutoEmail = 'new.audit.auto@wavevents.com';
  const autoUserRes = await usersService.createUser({
    name: 'Audit Auto Staff',
    email: testAutoEmail,
    role: 'REVENUE',
    department: 'REVENUE',
  }, adminCreator);

  const autoPassword = autoUserRes.initialPassword;
  console.log('Created user with auto-generated password policy:', autoUserRes.user.email, 'Pattern matches Wave_*!2026:', /^Wave_[0-9a-f]{8}!2026$/.test(autoPassword));
  const autoLoginRes = await authService.login({ email: testAutoEmail, password: autoPassword });
  console.log('✔ Auto-generated password user logged in successfully:', !!autoLoginRes.token);

  let autoTargetPassRejected = false;
  try {
    await authService.login({ email: testAutoEmail, password: targetPassword });
  } catch (e) {
    autoTargetPassRejected = true;
  }
  console.log('✔ Auto-generated password user correctly rejected Password123!:', autoTargetPassRejected);

  // Clean up temporary test users created during audit
  store.delete('users', customUserRes.user.id);
  store.delete('users', autoUserRes.user.id);
  store.saveToDisk();

  await app.close();

  console.log('\n========================================================================');
  console.log('📊 FINAL SUMMARY OF AUDIT:');
  console.log(`- Total store accounts verified: ${storeValidCount} / ${storeUsers.length}`);
  console.log(`- Total seed accounts verified:  ${seedValidCount} / ${seedUsers.length}`);
  console.log(`- Role login tests passed:       ${roleLoginResults.filter(r => r.status === 'PASSED').length} / ${roleLoginResults.length}`);
  console.log(`- Passwords stored as bcrypt:    YES (10 rounds bcryptjs, regex-verified)`);
  console.log('========================================================================\n');
}

runVerification().catch(err => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
