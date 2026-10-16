const http = require('http');

function request(method, path, body = null, token = null) {
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
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      },
      (res) => {
        let resBody = '';
        res.on('data', chunk => resBody += chunk);
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(resBody);
          } catch (e) {
            parsed = resBody;
          }
          resolve({ status: res.status, statusCode: res.statusCode, data: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function login(email, password = 'Password@123') {
  const res = await request('POST', '/api/auth/login', { email, password });
  if (res.statusCode !== 200 || !res.data.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return { token: res.data.token, user: res.data.user };
}

async function runTests() {
  console.log('=== RUNNING DYNAMIC USER MANAGEMENT TESTS ===\n');

  // Test 1: Log in as IT Support Specialist
  console.log('1. Logging in as IT Support Specialist (it.support@wavevents.com)...');
  const itSupport = await login('it.support@wavevents.com');
  console.log(`   Logged in as: ${itSupport.user.name} (${itSupport.user.role})`);

  // Test 2: IT Support GET /api/users
  console.log('\n2. Testing GET /api/users as IT Support Specialist...');
  const itSupportUsersRes = await request('GET', '/api/users', null, itSupport.token);
  console.log(`   Status: ${itSupportUsersRes.statusCode}`);
  if (itSupportUsersRes.statusCode !== 200) {
    throw new Error(`GET /api/users failed: ${JSON.stringify(itSupportUsersRes.data)}`);
  }
  const itSupportUsers = itSupportUsersRes.data.users || [];
  console.log(`   IT Support retrieved ${itSupportUsers.length} users (total reported: ${itSupportUsersRes.data.total})`);
  
  // Verify IT Support scope: No SUPER_ADMIN, ADMIN, or DEPARTMENT_MANAGER in list
  const hasPrivilegedInITSupportView = itSupportUsers.some(u => 
    u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' || u.role === 'DEPARTMENT_MANAGER'
  );
  console.log(`   Privileged accounts excluded from IT Support view: ${!hasPrivilegedInITSupportView}`);
  if (hasPrivilegedInITSupportView) {
    throw new Error('Security flaw: Privileged accounts exposed to IT Support Specialist!');
  }

  // Test 3: Log in as IT Support Department Manager
  console.log('\n3. Logging in as IT Support Department Manager (it.manager@wavevents.com)...');
  const itManager = await login('it.manager@wavevents.com');
  console.log(`   Logged in as: ${itManager.user.name} (${itManager.user.role}, Dept: ${itManager.user.department})`);

  // Test 4: IT Manager GET /api/users
  console.log('\n4. Testing GET /api/users as IT Support Department Manager...');
  const itManagerUsersRes = await request('GET', '/api/users', null, itManager.token);
  console.log(`   Status: ${itManagerUsersRes.statusCode}`);
  if (itManagerUsersRes.statusCode !== 200) {
    throw new Error(`GET /api/users for IT Manager failed: ${JSON.stringify(itManagerUsersRes.data)}`);
  }
  const itManagerUsers = itManagerUsersRes.data.users || [];
  console.log(`   IT Manager retrieved ${itManagerUsers.length} users (total reported: ${itManagerUsersRes.data.total})`);

  // Verify IT Manager scope:
  // Can view IT Support department members and operational roles, but NOT SUPER_ADMIN, ADMIN, or other department heads
  const hasAdminInITMgrView = itManagerUsers.some(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN');
  const hasOtherDeptMgr = itManagerUsers.some(u => u.role === 'DEPARTMENT_MANAGER' && u.department !== 'IT_SUPPORT' && u.id !== itManager.user.id);
  console.log(`   SUPER_ADMIN / ADMIN excluded from IT Manager view: ${!hasAdminInITMgrView}`);
  console.log(`   Other Department Managers excluded from IT Manager view: ${!hasOtherDeptMgr}`);
  if (hasAdminInITMgrView || hasOtherDeptMgr) {
    throw new Error('Security flaw: Privileged or foreign department managers exposed to IT Manager!');
  }

  // Verify fields on user items
  const sampleUser = itManagerUsers[0];
  console.log(`\n5. Verifying user entity fields:`);
  console.log(`   Sample User: ID=${sampleUser.id}, Name=${sampleUser.name}, Email=${sampleUser.email}, Role=${sampleUser.role}, Org=${sampleUser.organization || 'N/A'}, Status=${sampleUser.status}`);
  if (!sampleUser.id || !sampleUser.name || !sampleUser.email || !sampleUser.role || !sampleUser.status) {
    throw new Error('User entity is missing required display fields');
  }

  // Test 6: Non-IT Department Manager access (e.g. Revenue Head or Event Management Head)
  console.log('\n6. Security check: Non-IT Department Manager attempting GET /api/users...');
  const emHead = await login('e2e.manager@wavevents.com'); // Event Manager
  const emUsersRes = await request('GET', '/api/users', null, emHead.token);
  console.log(`   Event Manager access status: ${emUsersRes.statusCode} (Expected 403 Forbidden)`);
  if (emUsersRes.statusCode !== 403) {
    throw new Error('Security flaw: Unauthorized role was not blocked from GET /api/users');
  }

  // Test 7: Client access check
  console.log('\n7. Security check: Client attempting GET /api/users...');
  const client = await login('clientb@company.com');
  const clientRes = await request('GET', '/api/users', null, client.token);
  console.log(`   Client access status: ${clientRes.statusCode} (Expected 403 Forbidden)`);
  if (clientRes.statusCode !== 403) {
    throw new Error('Security flaw: Client was not blocked from GET /api/users');
  }

  // Test 8: Privilege escalation prevention for IT Support (cannot create SUPER_ADMIN)
  console.log('\n8. Privilege Escalation: IT Support attempting to create a SUPER_ADMIN account...');
  const fakeAdminEmail = `hacked_admin_${Date.now()}@wavevents.com`;
  const escalateRes = await request('POST', '/api/users', {
    name: 'Rogue Admin',
    email: fakeAdminEmail,
    role: 'SUPER_ADMIN'
  }, itSupport.token);
  console.log(`   IT Support create SUPER_ADMIN status: ${escalateRes.statusCode} (Expected 403 Forbidden)`);
  console.log(`   Error message: ${escalateRes.data.message || escalateRes.data.error}`);
  if (escalateRes.statusCode !== 403) {
    throw new Error('Security flaw: IT Support was allowed to create a SUPER_ADMIN!');
  }

  // Test 9: Privilege escalation prevention for IT Manager (cannot create SUPER_ADMIN)
  console.log('\n9. Privilege Escalation: IT Manager attempting to create a SUPER_ADMIN account...');
  const mgrEscalateRes = await request('POST', '/api/users', {
    name: 'Rogue Admin 2',
    email: `fake_admin_${Date.now()}@wavevents.com`,
    role: 'SUPER_ADMIN'
  }, itManager.token);
  console.log(`   IT Manager create SUPER_ADMIN status: ${mgrEscalateRes.statusCode} (Expected 403 Forbidden)`);
  if (mgrEscalateRes.statusCode !== 403) {
    throw new Error('Security flaw: IT Manager was allowed to create a SUPER_ADMIN!');
  }

  // Test 10: Validation on invalid email format
  console.log('\n10. Input Validation: Submitting invalid email address...');
  const invalidEmailRes = await request('POST', '/api/users', {
    name: 'Invalid Email User',
    email: 'not-an-email',
    role: 'CLIENT'
  }, itSupport.token);
  console.log(`    Invalid email status: ${invalidEmailRes.statusCode} (Expected 400 Bad Request)`);
  if (invalidEmailRes.statusCode !== 400) {
    throw new Error('Validation flaw: Invalid email was accepted!');
  }

  // Test 11: Validation on invalid role
  console.log('\n11. Input Validation: Submitting invalid role...');
  const invalidRoleRes = await request('POST', '/api/users', {
    name: 'Invalid Role User',
    email: `valid_email_${Date.now()}@test.com`,
    role: 'NON_EXISTENT_ROLE'
  }, itSupport.token);
  console.log(`    Invalid role status: ${invalidRoleRes.statusCode} (Expected 400 Bad Request)`);
  if (invalidRoleRes.statusCode !== 400) {
    throw new Error('Validation flaw: Invalid role was accepted!');
  }

  // Test 12: Successful dynamic user creation by IT Support Specialist
  const newClientEmail = `new.client_${Date.now()}@partnerorg.com`;
  console.log(`\n12. Creating new Client account: ${newClientEmail}...`);
  const createClientRes = await request('POST', '/api/users', {
    name: 'Vikram Malhotra',
    email: newClientEmail,
    role: 'CLIENT',
    organization: 'Partner Technologies'
  }, itSupport.token);
  console.log(`    Create response status: ${createClientRes.statusCode}`);
  console.log(`    Message: ${createClientRes.data.message}`);
  console.log(`    Initial Password generated: ${createClientRes.data.initialPassword}`);
  console.log(`    Created user status: ${createClientRes.data.user?.status}`);
  if (createClientRes.statusCode !== 201 || !createClientRes.data.user?.id) {
    throw new Error(`Failed to create client user: ${JSON.stringify(createClientRes.data)}`);
  }

  // Test 13: Verify new user appears dynamically in GET /api/users
  console.log('\n13. Verifying newly created user is persisted and returned in GET /api/users...');
  const refetchUsersRes = await request('GET', '/api/users', null, itSupport.token);
  const foundNewUser = (refetchUsersRes.data.users || []).find(u => u.email === newClientEmail);
  console.log(`    User found in live directory: ${!!foundNewUser}`);
  console.log(`    Details: Name="${foundNewUser?.name}", Role="${foundNewUser?.role}", Org="${foundNewUser?.organization}", Status="${foundNewUser?.status}"`);
  if (!foundNewUser || foundNewUser.organization !== 'Partner Technologies') {
    throw new Error('Newly created user was not found or organization did not persist!');
  }

  // Test 14: Duplicate email rejection
  console.log('\n14. Testing duplicate account rejection on repeated submission...');
  const dupRes = await request('POST', '/api/users', {
    name: 'Duplicate Vikram',
    email: newClientEmail,
    role: 'CLIENT'
  }, itSupport.token);
  console.log(`    Duplicate email status: ${dupRes.statusCode} (Expected 409 Conflict)`);
  console.log(`    Error message: ${dupRes.data.message || dupRes.data.error}`);
  if (dupRes.statusCode !== 409) {
    throw new Error('Duplicate account was not rejected with 409 Conflict!');
  }

  // Test 15: Successful IT Support Specialist creation by IT Manager
  const newStaffEmail = `staff.specialist_${Date.now()}@wavevents.com`;
  console.log(`\n15. IT Manager creating an IT Support staff member: ${newStaffEmail}...`);
  const createStaffRes = await request('POST', '/api/users', {
    name: 'Ananya Deshmukh',
    email: newStaffEmail,
    role: 'IT_SUPPORT',
    organization: 'Wavevents Support Ops'
  }, itManager.token);
  console.log(`    Staff creation status: ${createStaffRes.statusCode}`);
  console.log(`    Message: ${createStaffRes.data.message}`);
  console.log(`    Department assigned: ${createStaffRes.data.user?.department}`);
  if (createStaffRes.statusCode !== 201 || createStaffRes.data.user?.department !== 'IT_SUPPORT') {
    throw new Error('Failed to create IT Support staff member by IT Manager!');
  }

  // Test 16: Verify login with initial password
  console.log(`\n16. Testing direct login with created user credentials...`);
  const newLoginRes = await login(newStaffEmail, createStaffRes.data.initialPassword);
  console.log(`    Login successful! Logged in as: ${newLoginRes.user.name} (${newLoginRes.user.role})`);

  console.log('\n=== ALL 16 DYNAMIC USER MANAGEMENT TESTS PASSED CLEANLY! ===\n');
}

runTests().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
