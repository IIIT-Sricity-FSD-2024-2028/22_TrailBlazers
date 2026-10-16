const http = require('http');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5001,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...headers,
        },
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(resBody);
          } catch (e) {
            parsed = resBody;
          }
          resolve({ statusCode: res.statusCode, data: parsed, headers: res.headers });
        });
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runAuthTests() {
  console.log('=== RUNNING AUTHENTICATION SECURITY VERIFICATION SUITE ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    } else {
      console.log(`✅ PASS: ${message}`);
      passed++;
    }
  }

  // Account with valid bcrypt hash matching 'password123'
  const validUserEmail = 'testclient_1792181180737@corp.com';
  const validPassword = 'password123';
  const wrongPassword = 'WrongPassword999!';

  // Account with malformed 92-char password hash
  const staffEmail = 'it.support@wavevents.com';
  const adminEmail = 'super.admin@wavevents.com';

  // TEST 1: Correct email + correct password
  console.log('\n--- TEST 1: Correct email + correct password ---');
  const t1 = await request('POST', '/api/auth/login', { email: validUserEmail, password: validPassword });
  assert(t1.statusCode === 200, `Expected 200 OK, got ${t1.statusCode}`);
  assert(!!t1.data.token, 'Expected JWT token to be issued');
  assert(t1.data.user?.email === validUserEmail, 'Expected returned user to match email');
  const validUserToken = t1.data.token;

  // TEST 2: Correct email + incorrect password
  console.log('\n--- TEST 2: Correct email + incorrect password ---');
  const t2 = await request('POST', '/api/auth/login', { email: validUserEmail, password: wrongPassword });
  assert(t2.statusCode === 401, `Expected 401 Unauthorized, got ${t2.statusCode}`);
  assert(!t2.data.token, 'Expected NO token issued on incorrect password');

  // TEST 3: Unknown email + any password
  console.log('\n--- TEST 3: Unknown email + any password ---');
  const t3 = await request('POST', '/api/auth/login', { email: 'nonexistent.user.123@wavevents.com', password: 'SomePassword123!' });
  assert(t3.statusCode === 401, `Expected 401 Unauthorized, got ${t3.statusCode}`);
  assert(!t3.data.token, 'Expected NO token issued for unknown email');

  // TEST 4: Correct email + empty password
  console.log('\n--- TEST 4: Correct email + empty password ---');
  const t4 = await request('POST', '/api/auth/login', { email: validUserEmail, password: '' });
  assert(t4.statusCode === 400 || t4.statusCode === 401, `Expected 400/401 for empty password, got ${t4.statusCode}`);
  assert(!t4.data.token, 'Expected NO token issued for empty password');

  // TEST 5: Staff account + incorrect password
  console.log('\n--- TEST 5: Staff account + incorrect password ---');
  const t5 = await request('POST', '/api/auth/login', { email: staffEmail, password: 'IncorrectStaffPassword!@#' });
  assert(t5.statusCode === 401, `Expected 401 Unauthorized, got ${t5.statusCode}`);
  assert(!t5.data.token, 'Expected NO token issued for staff with incorrect password');

  // TEST 6: Administrator account + incorrect password
  console.log('\n--- TEST 6: Administrator account + incorrect password ---');
  const t6 = await request('POST', '/api/auth/login', { email: adminEmail, password: 'IncorrectAdminPassword!@#' });
  assert(t6.statusCode === 401, `Expected 401 Unauthorized, got ${t6.statusCode}`);
  assert(!t6.data.token, 'Expected NO token issued for admin with incorrect password');

  // TEST 7: Attendee or client account + incorrect password
  console.log('\n--- TEST 7: Attendee or client account + incorrect password ---');
  const t7 = await request('POST', '/api/auth/login', { email: 'client_1792181257735@innovate.com', password: 'BadClientPassword!' });
  assert(t7.statusCode === 401, `Expected 401 Unauthorized, got ${t7.statusCode}`);
  assert(!t7.data.token, 'Expected NO token issued for attendee/client with incorrect password');

  // TEST 8: Attempt to bypass authentication using a role header without valid authentication
  console.log('\n--- TEST 8: Attempt to bypass authentication using a role header ---');
  const t8 = await request('GET', '/api/auth/me', null, { 'x-role': 'SUPER_ADMIN' });
  assert(t8.statusCode === 401, `Expected protected endpoint to reject x-role without token with 401 Unauthorized, got ${t8.statusCode}`);
  const t8b = await request('GET', '/api/users', null, { 'x-role': 'SUPER_ADMIN' });
  assert(t8b.statusCode === 401, `Expected /api/users to reject x-role without token with 401 Unauthorized, got ${t8b.statusCode}`);

  // TEST 9: Successful login - server derives user role from token, not arbitrary role header
  console.log('\n--- TEST 9: Role derived from server-side user record ---');
  const t9 = await request('GET', '/api/auth/me', null, {
    Authorization: `Bearer ${validUserToken}`,
    'x-role': 'SUPER_ADMIN', // Spoofed header attempt
  });
  assert(t9.statusCode === 200, `Expected 200 OK, got ${t9.statusCode}`);
  assert(t9.data.user?.role === 'ATTENDEE', `Expected role to be derived as ATTENDEE from token, got ${t9.data.user?.role}`);

  // Also verify that ATTENDEE cannot access SUPER_ADMIN only endpoint even if x-role: SUPER_ADMIN is sent
  const t9b = await request('GET', '/api/auth/access-logs', null, {
    Authorization: `Bearer ${validUserToken}`,
    'x-role': 'SUPER_ADMIN',
  });
  assert(t9b.statusCode === 403, `Expected 403 Forbidden when ATTENDEE accesses super admin logs with spoofed header, got ${t9b.statusCode}`);

  // TEST 10: Existing user with an unsupported or malformed password hash
  console.log('\n--- TEST 10: Existing user with unsupported/malformed password hash ---');
  const t10 = await request('POST', '/api/auth/login', { email: staffEmail, password: 'password123' });
  assert(t10.statusCode === 401, `Expected 401 Unauthorized for malformed hash account, got ${t10.statusCode}`);
  assert(!t10.data.token, 'Expected NO token issued for account with malformed hash');

  // TEST 11: Login failure after a previous successful session
  console.log('\n--- TEST 11: Login failure after previous successful session ---');
  // First login succeeds
  const s1 = await request('POST', '/api/auth/login', { email: validUserEmail, password: validPassword });
  assert(s1.statusCode === 200 && !!s1.data.token, 'Previous login succeeded');
  // Subsequent login attempt with wrong password
  const s2 = await request('POST', '/api/auth/login', { email: validUserEmail, password: 'WrongPasswordAfterSuccess' });
  assert(s2.statusCode === 401, 'Subsequent failed login attempt returns 401');
  assert(!s2.data.token, 'Subsequent failed login attempt does NOT issue or return token');

  console.log(`\n========================================`);
  console.log(`ALL ${passed} / ${total} AUTHENTICATION TESTS PASSED CLEANLY!`);
  console.log(`========================================\n`);
}

runAuthTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
