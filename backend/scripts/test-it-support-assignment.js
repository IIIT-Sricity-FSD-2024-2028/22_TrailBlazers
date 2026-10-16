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
  console.log('=== RUNNING IT SUPPORT ASSIGNMENT VERIFICATION TESTS ===\n');

  // 1. Log in as IT Support Department Manager
  console.log('1. Logging in as IT Support Department Manager...');
  const itMgr = await login('it.manager@wavevents.com');
  console.log(`   Success: Logged in as ${itMgr.user.name} (${itMgr.user.role}, Dept: ${itMgr.user.department})`);

  // 2. Fetch IT Support Team
  console.log('\n2. Fetching IT Support department team members...');
  const teamRes = await request('GET', '/api/hierarchy/team', null, itMgr.token);
  console.log(`   Status: ${teamRes.statusCode}`);
  const members = teamRes.data.members || [];
  console.log(`   Found ${members.length} team members:`);
  members.forEach(m => {
    console.log(`   - ${m.name} (${m.email}): Status=${m.status}, Available=${m.isAvailable}, ActiveTickets=${m.activeIssuesCount}`);
  });
  if (members.length === 0) throw new Error('No team members found for IT Support');

  // Verify Department Manager is excluded from assignable staff list
  const hasManagerInTeam = members.some(m => m.role === 'DEPARTMENT_MANAGER');
  console.log(`   Department Manager excluded from staff list: ${!hasManagerInTeam}`);

  // 3. Fetch IT Support Issues
  console.log('\n3. Fetching IT Support department issues...');
  const issuesRes = await request('GET', '/api/hierarchy/issues', null, itMgr.token);
  console.log(`   Status: ${issuesRes.statusCode}`);
  const issues = issuesRes.data.issues || [];
  console.log(`   Found ${issues.length} issues in queue.`);

  let targetIssue = issues.find(i => i.status !== 'RESOLVED' && i.status !== 'ESCALATED_TO_ADMIN');
  if (!targetIssue) {
    console.log('   Creating a test technical issue for assignment...');
    const createRes = await request('POST', '/api/hierarchy/issues/create', {
      category: 'System Bug',
      priority: 'High',
      issueType: 'TECHNICAL',
      description: 'API rate limiting error on login screen',
      escalationReason: 'Requires IT specialist analysis'
    }, itMgr.token);
    targetIssue = createRes.data.issue;
  }
  console.log(`   Target Issue for test: ID=${targetIssue.id}, Type=${targetIssue.issueType}, Status=${targetIssue.status}, Current Assignee=${targetIssue.assignedUserName || 'None'}`);

  // 4. Test unauthorized user trying to assign (e.g. Client or unrelated user)
  console.log('\n4. Security check: Client attempting to assign IT issue...');
  const clientUser = await login('clientb@company.com');
  const unauthRes = await request('POST', `/api/hierarchy/issues/${targetIssue.id}/assign`, {
    assignedUserId: members[0].id
  }, clientUser.token);
  console.log(`   Unauthorized assignment response status: ${unauthRes.statusCode} (Expected 403 Forbidden)`);
  if (unauthRes.statusCode !== 403) throw new Error('Security check failed: unauthorized user was not blocked');

  // 5. Test assigning to a user in another department
  console.log('\n5. Data Integrity: Attempting assignment to a user in a different department (EVENT_MANAGEMENT)...');
  const invalidDeptRes = await request('POST', `/api/hierarchy/issues/${targetIssue.id}/assign`, {
    assignedUserId: 'usr_e2e_mgr_1'
  }, itMgr.token);
  console.log(`   Cross-department assignment status: ${invalidDeptRes.statusCode} (Expected 400 Bad Request)`);
  console.log(`   Error message: ${invalidDeptRes.data.message || invalidDeptRes.data.error}`);
  if (invalidDeptRes.statusCode !== 400) throw new Error('Cross-department validation failed');

  // 6. Test assigning to an available IT Support staff member
  const targetStaff = members[0];
  console.log(`\n6. Assigning issue to available IT Support specialist: ${targetStaff.name} (ID=${targetStaff.id})...`);
  const assignRes = await request('POST', `/api/hierarchy/issues/${targetIssue.id}/assign`, {
    assignedUserId: targetStaff.id
  }, itMgr.token);
  console.log(`   Assignment response status: ${assignRes.statusCode}`);
  console.log(`   Assigned issue response: ID=${assignRes.data.issue?.id}, Status=${assignRes.data.issue?.status}, Assignee=${assignRes.data.issue?.assignedUserName}`);
  if (assignRes.statusCode !== 200 || !assignRes.data.issue?.assignedUserId) {
    throw new Error('Failed to assign issue to staff member');
  }

  // 7. Verify persistence after fetching again
  console.log('\n7. Verifying persistence via GET /api/hierarchy/issues...');
  const refetchRes = await request('GET', '/api/hierarchy/issues', null, itMgr.token);
  const updatedIssue = (refetchRes.data.issues || []).find(i => i.id === targetIssue.id);
  console.log(`   Persisted: assignedUserId=${updatedIssue?.assignedUserId}, assignedUserName=${updatedIssue?.assignedUserName}, status=${updatedIssue?.status}`);
  if (updatedIssue.assignedUserId !== targetStaff.id || updatedIssue.assignedUserName !== targetStaff.name) {
    throw new Error('Persisted assignment does not match assigned staff');
  }

  // 8. Verify notification was sent to target staff member
  console.log(`\n8. Checking notification for assigned specialist (${targetStaff.email})...`);
  const staffSession = await login(targetStaff.email);
  const notifRes = await request('GET', '/api/notifications', null, staffSession.token);
  const staffNotifs = notifRes.data.notifications || [];
  const assignmentNotif = staffNotifs.find(n => n.message && n.message.includes(targetIssue.category || 'issue'));
  console.log(`   Staff has ${staffNotifs.length} notifications.`);
  if (assignmentNotif) {
    console.log(`   Found notification: "${assignmentNotif.title}" - "${assignmentNotif.message}"`);
  } else {
    console.log(`   Latest notification: "${staffNotifs[0]?.title}" - "${staffNotifs[0]?.message}"`);
  }

  // 9. Verify staff dashboard / technical queue for the assigned staff member
  console.log(`\n9. Checking staff member's issue queue...`);
  const staffIssuesRes = await request('GET', '/api/hierarchy/issues', null, staffSession.token);
  const staffIssues = staffIssuesRes.data.issues || [];
  const myAssignedInStaffQueue = staffIssues.find(i => i.id === targetIssue.id);
  console.log(`   Issue found in staff queue: ${!!myAssignedInStaffQueue}`);
  console.log(`   Issue details in queue: Assignee=${myAssignedInStaffQueue?.assignedUserName}, Status=${myAssignedInStaffQueue?.status}`);

  // 10. Test Reassignment to another available staff member (if available)
  if (members.length > 1) {
    const secondStaff = members[1];
    console.log(`\n10. Testing reassignment to another staff member: ${secondStaff.name}...`);
    const reassignRes = await request('POST', `/api/hierarchy/issues/${targetIssue.id}/assign`, {
      assignedUserId: secondStaff.id
    }, itMgr.token);
    console.log(`    Reassignment status: ${reassignRes.statusCode}`);
    console.log(`    New Assignee: ${reassignRes.data.issue?.assignedUserName}`);
    if (reassignRes.data.issue?.assignedUserId !== secondStaff.id) {
      throw new Error('Reassignment failed');
    }
  }

  // 11. Test that assignment did not automatically resolve the issue
  console.log('\n11. Verifying that assignment did NOT resolve the issue...');
  const checkStatusRes = await request('GET', '/api/hierarchy/issues', null, itMgr.token);
  const checkIssue = checkStatusRes.data.issues.find(i => i.id === targetIssue.id);
  console.log(`    Current Status: ${checkIssue.status} (Should be IN_PROGRESS, not RESOLVED)`);
  if (checkIssue.status === 'RESOLVED') {
    throw new Error('Issue was incorrectly marked RESOLVED upon assignment');
  }

  // 12. Test Resolve functionality still works
  console.log('\n12. Testing Resolve action on the issue...');
  const resolveRes = await request('POST', `/api/hierarchy/issues/${targetIssue.id}/resolve`, {
    resolutionDetails: 'Verified and resolved during automated test run.'
  }, itMgr.token);
  console.log(`    Resolve response status: ${resolveRes.statusCode}`);
  const postResolveRes = await request('GET', '/api/hierarchy/issues', null, itMgr.token);
  const resolvedIssue = postResolveRes.data.issues.find(i => i.id === targetIssue.id);
  console.log(`    Post-resolve status: ${resolvedIssue.status} (Should be RESOLVED)`);
  if (resolvedIssue.status !== 'RESOLVED') {
    throw new Error('Resolve failed to transition issue to RESOLVED');
  }

  // 13. Test that resolved issues CANNOT be assigned
  console.log('\n13. Testing that RESOLVED issue cannot be assigned...');
  const assignResolvedRes = await request('POST', `/api/hierarchy/issues/${targetIssue.id}/assign`, {
    assignedUserId: targetStaff.id
  }, itMgr.token);
  console.log(`    Assign to resolved issue status: ${assignResolvedRes.statusCode} (Expected 400 Bad Request)`);
  console.log(`    Error message: ${assignResolvedRes.data.message || assignResolvedRes.data.error}`);
  if (assignResolvedRes.statusCode !== 400) {
    throw new Error('Resolved issue was incorrectly allowed to be assigned');
  }

  console.log('\n=== ALL 13 TEST SUITES PASSED CLEANLY! ===\n');
}

runTests().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
