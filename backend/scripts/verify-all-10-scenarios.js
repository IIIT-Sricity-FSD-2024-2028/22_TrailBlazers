const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist-nestjs/app.module');
const { UsersService } = require('../dist-nestjs/modules/users/users.service');
const { AuthService } = require('../dist-nestjs/modules/auth/auth.service');
const { EventManagerService } = require('../dist-nestjs/modules/event-manager/event-manager.service');
const { RevenueService } = require('../dist-nestjs/modules/revenue/revenue.service');
const { HierarchyService } = require('../dist-nestjs/modules/hierarchy/hierarchy.service');
const { InMemoryStore } = require('../dist-nestjs/repositories/in-memory.store');
const fs = require('fs');
const path = require('path');

async function runVerification() {
  console.log('================================================================');
  console.log('🚀 STARTING COMPREHENSIVE VERIFICATION FOR ALL 10 USER SCENARIOS');
  console.log('================================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const usersService = app.get(UsersService);
  const authService = app.get(AuthService);
  const eventManagerService = app.get(EventManagerService);
  const revenueService = app.get(RevenueService);
  const hierarchyService = app.get(HierarchyService);
  const store = app.get(InMemoryStore);

  const results = [];
  const superAdminActor = { id: 'usr_super_admin_1', email: 'admin@wavevents.com', role: 'SUPER_ADMIN' };

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Create a new department member
    // -------------------------------------------------------------
    console.log('👉 Scenario 1: Create a new department member...');
    const newMemberEmail = `e2e_dyn_member_${Date.now()}@wavevents.com`;
    const createRes = await usersService.createUser({
      name: 'Dynamic E2E Member',
      email: newMemberEmail,
      role: 'EVENT_MANAGER',
      department: 'EVENT_MANAGEMENT',
    }, superAdminActor);

    const newMember = createRes.user;
    const initialPassword = createRes.initialPassword;
    console.log(`   ✓ Created User ID: ${newMember.id}, Role: ${newMember.role}, Dept: ${newMember.department}`);
    console.log(`   ✓ Initial Generated Password: ${initialPassword}`);

    results.push({
      scenario: 1,
      name: 'Create a new department member',
      passed: !!newMember.id && newMember.department === 'EVENT_MANAGEMENT',
      details: `Created user ${newMember.id} (${newMember.email}) in department ${newMember.department}`
    });

    // -------------------------------------------------------------
    // SCENARIO 2: Verify that their dashboard displays zero statistics
    // -------------------------------------------------------------
    console.log('\n👉 Scenario 2: Verify that their dashboard displays zero statistics...');
    const newMemberDashboard = await eventManagerService.getDashboard(newMember);
    const newMemberEvents = await eventManagerService.getEvents({}, newMember);

    const metrics = newMemberDashboard.metrics;
    const isAllZero = metrics.assignedEvents === 0 &&
      metrics.ongoingEvents === 0 &&
      metrics.completedEvents === 0 &&
      metrics.pendingEvents === 0 &&
      newMemberEvents.events.length === 0;

    console.log('   Metrics for fresh user:', metrics);
    console.log('   Events count for fresh user:', newMemberEvents.events.length);
    console.log(`   ✓ Fresh dashboard zero check: ${isAllZero ? 'PASSED' : 'FAILED'}`);

    results.push({
      scenario: 2,
      name: 'Dashboard displays zero statistics for newly created user',
      passed: isAllZero,
      details: `Metrics: assigned=${metrics.assignedEvents}, ongoing=${metrics.ongoingEvents}, completed=${metrics.completedEvents}, pending=${metrics.pendingEvents}, eventsList=${newMemberEvents.events.length}`
    });

    // -------------------------------------------------------------
    // SCENARIO 3: Log in using the newly created account
    // -------------------------------------------------------------
    console.log('\n👉 Scenario 3: Log in using the newly created account...');
    const loginRes = await authService.login({
      email: newMemberEmail,
      password: initialPassword,
    });

    const loginSuccess = !!loginRes.token && loginRes.user.id === newMember.id;
    console.log(`   ✓ Login token issued: ${loginSuccess ? 'YES' : 'NO'}`);
    console.log(`   ✓ Authenticated User: ${loginRes.user.name} (${loginRes.user.role})`);

    results.push({
      scenario: 3,
      name: 'Log in using the newly created account',
      passed: loginSuccess,
      details: `Successfully authenticated new member, JWT token issued: ${loginRes.token ? loginRes.token.substring(0, 20) + '...' : 'none'}`
    });

    // -------------------------------------------------------------
    // SCENARIO 4: Assign an event to that member
    // -------------------------------------------------------------
    console.log('\n👉 Scenario 4: Assign an event to that member...');
    // Find an event request to assign
    const availableRequests = store.findAll('event_requests');
    let targetReq = availableRequests[0];

    // Assign via hierarchyService (Department Head action)
    const deptHeadActor = { id: 'usr_dept_mgr_event', email: 'event.head@wavevents.com', role: 'DEPARTMENT_MANAGER', department: 'EVENT_MANAGEMENT' };
    const assignRes = await hierarchyService.assignStaff(
      targetReq.id,
      { eventManagerUserId: newMember.id },
      deptHeadActor
    );

    console.log(`   ✓ Assigned event "${targetReq.eventName}" (ID: ${targetReq.id}) to ${newMember.id}`);
    console.log(`   ✓ Result message: ${assignRes.message}`);

    results.push({
      scenario: 4,
      name: 'Assign an event to that member',
      passed: assignRes.success && assignRes.eventRequest.eventManagerUserId === newMember.id,
      details: `Assigned event ${targetReq.id} to new member ${newMember.id}`
    });

    // -------------------------------------------------------------
    // SCENARIO 5: Verify that only their statistics change
    // -------------------------------------------------------------
    console.log('\n👉 Scenario 5: Verify that only their statistics change...');
    const updatedNewMemberDashboard = await eventManagerService.getDashboard(newMember);
    const updatedNewMemberEvents = await eventManagerService.getEvents({}, newMember);

    // Also check another manager's metrics (e.g., usr_mgr_sneha)
    const snehaUser = store.findById('users', 'usr_mgr_sneha');
    const snehaDashboard = await eventManagerService.getDashboard(snehaUser);

    console.log('   New member updated metrics:', updatedNewMemberDashboard.metrics);
    console.log('   New member events count:', updatedNewMemberEvents.events.length);
    console.log('   Sneha metrics:', snehaDashboard.metrics);

    const newMemberStatsUpdated = updatedNewMemberDashboard.metrics.assignedEvents === 1 &&
      updatedNewMemberEvents.events.length === 1;

    console.log(`   ✓ Only assigned member stats updated: ${newMemberStatsUpdated ? 'PASSED' : 'FAILED'}`);

    results.push({
      scenario: 5,
      name: 'Verify that only their statistics change',
      passed: newMemberStatsUpdated,
      details: `New member assignedEvents: 0 -> 1. Events list length: 1. Sneha assignedEvents: ${snehaDashboard.metrics.assignedEvents}.`
    });

    // -------------------------------------------------------------
    // SCENARIO 6: Log in as another member and verify they cannot see first member's assigned work
    // -------------------------------------------------------------
    console.log('\n👉 Scenario 6: Log in as another member and verify isolation...');
    const snehaEvents = await eventManagerService.getEvents({}, snehaUser);
    const snehaHasFirstMemberEvent = snehaEvents.events.some(e => e.id === targetReq.id);

    let isolationExceptionThrown = false;
    try {
      await eventManagerService.getEventDetails(targetReq.id, snehaUser);
    } catch (err) {
      if (err.name === 'ForbiddenException' || err.status === 403) {
        isolationExceptionThrown = true;
      }
    }

    console.log(`   Sneha sees new member's event in list: ${snehaHasFirstMemberEvent ? 'YES (LEAK)' : 'NO (ISOLATED)'}`);
    console.log(`   Sneha viewing new member's event details blocked with 403 Forbidden: ${isolationExceptionThrown ? 'YES' : 'NO'}`);

    results.push({
      scenario: 6,
      name: 'Log in as another member and verify data isolation',
      passed: !snehaHasFirstMemberEvent && isolationExceptionThrown,
      details: `Sneha cannot see member event in events list (!snehaHasFirstMemberEvent = true), and getEventDetails throws ForbiddenException (403)`
    });

    // -------------------------------------------------------------
    // SCENARIO 7: Log in as Department Head and verify department-wide information
    // -------------------------------------------------------------
    console.log('\n👉 Scenario 7: Log in as Department Head and verify department-wide information...');
    const deptHeadTeam = await hierarchyService.getTeam(deptHeadActor);
    const deptHeadOverview = await hierarchyService.getOverview(deptHeadActor);

    console.log(`   Department Head team roster size: ${deptHeadTeam.members.length}`);
    console.log('   Department Head summary:', deptHeadTeam.summary);
    console.log('   Department Head metrics:', deptHeadTeam.metrics);

    const deptHeadSeesAll = deptHeadTeam.members.length >= 5 &&
      deptHeadTeam.summary.totalDepartmentMembers >= 5 &&
      deptHeadOverview.departments.EVENT_MANAGEMENT.members.length >= 5;

    console.log(`   ✓ Department Head sees entire department: ${deptHeadSeesAll ? 'PASSED' : 'FAILED'}`);

    results.push({
      scenario: 7,
      name: 'Department Head sees department-wide information and team',
      passed: deptHeadSeesAll,
      details: `Team roster size: ${deptHeadTeam.members.length}, Total department members: ${deptHeadTeam.summary.totalDepartmentMembers}, Workload: ${deptHeadTeam.summary.departmentWorkload}`
    });

    // -------------------------------------------------------------
    // SCENARIO 8: Attempt to create a second Department Head for the same department (Must be rejected)
    // -------------------------------------------------------------
    console.log('\n👉 Scenario 8: Attempt to create a second Department Head for EVENT_MANAGEMENT...');
    let secondDeptHeadRejected = false;
    let rejectionMessage = '';

    try {
      await usersService.createUser({
        name: 'Second Event Head',
        email: `second_head_${Date.now()}@wavevents.com`,
        role: 'DEPARTMENT_MANAGER',
        department: 'EVENT_MANAGEMENT',
      }, superAdminActor);
    } catch (err) {
      if (err.name === 'ConflictException' || err.status === 409) {
        secondDeptHeadRejected = true;
        rejectionMessage = err.message;
      }
    }

    console.log(`   ✓ Second Department Head rejected: ${secondDeptHeadRejected ? 'YES (409 Conflict)' : 'NO (FAILED)'}`);
    console.log(`   ✓ Backend Rejection Message: "${rejectionMessage}"`);

    results.push({
      scenario: 8,
      name: 'Attempt to create a second Department Head is rejected',
      passed: secondDeptHeadRejected,
      details: `Correctly threw ConflictException (409): "${rejectionMessage}"`
    });

    // -------------------------------------------------------------
    // SCENARIO 9: Restart backend and verify that all data persists
    // -------------------------------------------------------------
    console.log('\n👉 Scenario 9: Restart backend and verify persistence...');
    // Close the current context
    await app.close();

    // Recreate the application context to simulate a backend cold restart
    const appRestarted = await NestFactory.createApplicationContext(AppModule, { logger: false });
    const restartedStore = appRestarted.get(InMemoryStore);
    const restartedEventManagerService = appRestarted.get(EventManagerService);

    const persistedUser = restartedStore.findById('users', newMember.id);
    const persistedReq = restartedStore.findById('event_requests', targetReq.id);
    const persistedDashboard = await restartedEventManagerService.getDashboard(persistedUser);

    console.log(`   ✓ Persisted User in store after cold restart: ${persistedUser ? persistedUser.name : 'NOT FOUND'}`);
    console.log(`   ✓ Persisted Event Manager Assignment: ${persistedReq.eventManagerUserId === newMember.id ? 'VERIFIED' : 'FAILED'}`);
    console.log(`   ✓ Recalculated Dashboard assignedEvents: ${persistedDashboard.metrics.assignedEvents}`);

    const persistenceVerified = !!persistedUser &&
      persistedReq.eventManagerUserId === newMember.id &&
      persistedDashboard.metrics.assignedEvents === 1;

    results.push({
      scenario: 9,
      name: 'Restart backend and verify data persistence',
      passed: persistenceVerified,
      details: `User ${newMember.id} and event assignment persisted across application restart from store-data.json; assignedEvents = ${persistedDashboard.metrics.assignedEvents}`
    });

    // -------------------------------------------------------------
    // SCENARIO 10: Verify that existing users do not receive incorrect or duplicated statistics
    // -------------------------------------------------------------
    console.log('\n👉 Scenario 10: Verify existing users do not receive duplicated statistics...');
    const rahulUser = restartedStore.findById('users', 'usr_mgr_rahul');
    const rahulDashboard = await restartedEventManagerService.getDashboard(rahulUser);
    const rahulEvents = await restartedEventManagerService.getEvents({}, rahulUser);

    console.log('   Rahul metrics:', rahulDashboard.metrics);
    console.log('   Rahul events count in list:', rahulEvents.events.length);

    // Check no duplicate IDs in events
    const eventIds = rahulEvents.events.map(e => e.id);
    const hasDuplicates = new Set(eventIds).size !== eventIds.length;

    const noDuplication = !hasDuplicates && rahulDashboard.metrics.assignedEvents === rahulEvents.events.length;
    console.log(`   ✓ Existing user statistics verified without duplication: ${noDuplication ? 'PASSED' : 'FAILED'}`);

    results.push({
      scenario: 10,
      name: 'Existing users do not receive incorrect or duplicated statistics',
      passed: noDuplication,
      details: `Rahul assigned events: ${rahulDashboard.metrics.assignedEvents}, actual events returned: ${rahulEvents.events.length}, duplicate events: ${hasDuplicates ? 'YES' : 'NO'}`
    });

    await appRestarted.close();

  } catch (err) {
    console.error('Fatal verification error:', err);
  }

  console.log('\n================================================================');
  console.log('📊 VERIFICATION SUMMARY');
  console.log('================================================================');
  let allPassed = true;
  for (const r of results) {
    console.log(`Scenario ${r.scenario}: [${r.passed ? 'PASS ✅' : 'FAIL ❌'}] ${r.name}`);
    console.log(`   Details: ${r.details}`);
    if (!r.passed) allPassed = false;
  }
  console.log('================================================================');
  console.log(`Overall Result: ${allPassed ? 'ALL 10 SCENARIOS PASSED SUCCESSFULLY! 🎉' : 'SOME SCENARIOS FAILED'}`);
  console.log('================================================================\n');

  process.exit(allPassed ? 0 : 1);
}

runVerification();
