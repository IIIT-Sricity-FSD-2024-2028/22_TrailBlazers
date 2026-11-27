const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist-nestjs/app.module');
const { UsersService } = require('../dist-nestjs/modules/users/users.service');
const { EventManagerService } = require('../dist-nestjs/modules/event-manager/event-manager.service');
const { HierarchyService } = require('../dist-nestjs/modules/hierarchy/hierarchy.service');
const { InMemoryStore } = require('../dist-nestjs/repositories/in-memory.store');
const { ForbiddenException } = require('@nestjs/common');

async function runTest() {
  console.log('========================================================================');
  console.log('🧪 EVENT MANAGER WORKSPACE ISOLATION & PERMISSION AUDIT (10 SCENARIOS)');
  console.log('========================================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const usersService = app.get(UsersService);
  const eventManagerService = app.get(EventManagerService);
  const hierarchyService = app.get(HierarchyService);
  const store = app.get(InMemoryStore);

  const superAdminActor = { id: 'usr_super_admin_1', email: 'admin@wavevents.com', role: 'SUPER_ADMIN' };
  const deptHeadUser = { 
    id: 'usr_dept_mgr_event', 
    email: 'devika.sharma@wavevents.com', 
    name: 'Devika Sharma',
    role: 'DEPARTMENT_MANAGER', 
    department: 'EVENT_MANAGEMENT' 
  };

  const createdUserIds = [];
  const createdEventIds = [];
  const testResults = [];

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Create three Event Manager accounts (Rahul, Sneha, Amit)
    // -------------------------------------------------------------------------
    console.log('👉 Step 1: Create three Event Manager accounts...');
    const timestamp = Date.now();
    const mgrAData = await usersService.createUser({
      name: 'Rahul Verma',
      email: `rahul_${timestamp}@wavevents.com`,
      role: 'EVENT_MANAGER',
      department: 'EVENT_MANAGEMENT',
    }, superAdminActor);
    const mgrA = mgrAData.user;
    createdUserIds.push(mgrA.id);

    const mgrBData = await usersService.createUser({
      name: 'Sneha Iyer',
      email: `sneha_${timestamp}@wavevents.com`,
      role: 'EVENT_MANAGER',
      department: 'EVENT_MANAGEMENT',
    }, superAdminActor);
    const mgrB = mgrBData.user;
    createdUserIds.push(mgrB.id);

    const mgrCData = await usersService.createUser({
      name: 'Amit Patel',
      email: `amit_${timestamp}@wavevents.com`,
      role: 'EVENT_MANAGER',
      department: 'EVENT_MANAGEMENT',
    }, superAdminActor);
    const mgrC = mgrCData.user;
    createdUserIds.push(mgrC.id);

    console.log(`   ✓ Manager A: ${mgrA.name} (${mgrA.id})`);
    console.log(`   ✓ Manager B: ${mgrB.name} (${mgrB.id})`);
    console.log(`   ✓ Manager C: ${mgrC.name} (${mgrC.id})`);

    testResults.push({
      step: 1,
      description: 'Create three Event Manager accounts',
      passed: !!mgrA.id && !!mgrB.id && !!mgrC.id,
      details: `Created Managers: ${mgrA.name}, ${mgrB.name}, ${mgrC.name}`
    });

    // Create a dedicated test event: "Technology Summit 2026"
    const testEventId = `evt_iso_test_${timestamp}`;
    createdEventIds.push(testEventId);
    store.create('event_requests', {
      id: testEventId,
      eventName: 'Technology Summit 2026',
      userId: 'usr_client_test',
      status: 'COMMERCIAL_APPROVED',
      operationalStatus: 'AWAITING_ASSIGNMENT',
      eventDate: '2026-11-20',
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      venue: 'Main Auditorium',
      expectedAttendance: 250,
      ticketPrice: 99,
      eventManagerUserId: null,
      assignedManagerUserId: null,
      onsiteCoordinatorUserId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    store.create('events', {
      id: testEventId,
      title: 'Technology Summit 2026',
      organizerUserId: null,
      status: 'PUBLISHED',
      operationalStatus: 'AWAITING_ASSIGNMENT',
      date: '2026-11-20',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // -------------------------------------------------------------------------
    // STEP 2: Assign one event to Manager A
    // -------------------------------------------------------------------------
    console.log('\n👉 Step 2: Assign "Technology Summit 2026" to Manager A (Rahul)...');
    const assignRes = await hierarchyService.assignStaff(
      testEventId,
      { eventManagerUserId: mgrA.id },
      deptHeadUser
    );
    const assignedManagerId = assignRes.eventRequest ? assignRes.eventRequest.eventManagerUserId : assignRes.eventManagerUserId;
    console.log(`   ✓ Event assigned to ${mgrA.id}, manager in response: ${assignedManagerId}`);

    testResults.push({
      step: 2,
      description: 'Assign one event to Manager A',
      passed: assignedManagerId === mgrA.id,
      details: `Assigned event ${testEventId} to Manager A (${mgrA.id})`
    });

    // -------------------------------------------------------------------------
    // STEP 3: Verify Manager A can see it
    // -------------------------------------------------------------------------
    console.log('\n👉 Step 3: Verify Manager A can see it in workspace & dashboard...');
    const mgrAEvents = await eventManagerService.getEvents({}, mgrA);
    const mgrADash = await eventManagerService.getDashboard(mgrA);
    const mgrADetail = await eventManagerService.getEventDetails(testEventId, mgrA);

    const aSeesInList = mgrAEvents.events.some(e => e.id === testEventId);
    const aAssignedCount = mgrADash.metrics.assignedEvents;
    const aSeesDetail = !!mgrADetail.request && mgrADetail.request.id === testEventId;

    console.log(`   ✓ Manager A sees event in list: ${aSeesInList}`);
    console.log(`   ✓ Manager A dashboard assigned count: ${aAssignedCount}`);
    console.log(`   ✓ Manager A can view details: ${aSeesDetail}`);

    testResults.push({
      step: 3,
      description: 'Verify Manager A can see the event',
      passed: aSeesInList && aAssignedCount === 1 && aSeesDetail,
      details: `In list: ${aSeesInList}, assigned count: ${aAssignedCount}, details accessible: ${aSeesDetail}`
    });

    // -------------------------------------------------------------------------
    // STEP 4: Verify Manager B cannot see it
    // -------------------------------------------------------------------------
    console.log('\n👉 Step 4: Verify Manager B (Sneha) cannot see it...');
    const mgrBEvents = await eventManagerService.getEvents({}, mgrB);
    const mgrBDash = await eventManagerService.getDashboard(mgrB);

    const bSeesInList = mgrBEvents.events.some(e => e.id === testEventId);
    const bAssignedCount = mgrBDash.metrics.assignedEvents;
    const bSeesInPriority = mgrBDash.priorityEvents.some(e => e.id === testEventId);

    console.log(`   ✓ Manager B sees event in list: ${bSeesInList} (Expected: false)`);
    console.log(`   ✓ Manager B dashboard assigned count: ${bAssignedCount} (Expected: 0)`);
    console.log(`   ✓ Manager B priority events contains event: ${bSeesInPriority} (Expected: false)`);

    testResults.push({
      step: 4,
      description: 'Verify Manager B cannot see the event',
      passed: !bSeesInList && bAssignedCount === 0 && !bSeesInPriority,
      details: `In list: ${bSeesInList}, assigned count: ${bAssignedCount}, in priority: ${bSeesInPriority}`
    });

    // -------------------------------------------------------------------------
    // STEP 5: Verify Manager C cannot see it
    // -------------------------------------------------------------------------
    console.log('\n👉 Step 5: Verify Manager C (Amit) cannot see it...');
    const mgrCEvents = await eventManagerService.getEvents({}, mgrC);
    const mgrCDash = await eventManagerService.getDashboard(mgrC);

    const cSeesInList = mgrCEvents.events.some(e => e.id === testEventId);
    const cAssignedCount = mgrCDash.metrics.assignedEvents;
    const cSeesInPriority = mgrCDash.priorityEvents.some(e => e.id === testEventId);

    console.log(`   ✓ Manager C sees event in list: ${cSeesInList} (Expected: false)`);
    console.log(`   ✓ Manager C dashboard assigned count: ${cAssignedCount} (Expected: 0)`);
    console.log(`   ✓ Manager C priority events contains event: ${cSeesInPriority} (Expected: false)`);

    testResults.push({
      step: 5,
      description: 'Verify Manager C cannot see the event',
      passed: !cSeesInList && cAssignedCount === 0 && !cSeesInPriority,
      details: `In list: ${cSeesInList}, assigned count: ${cAssignedCount}, in priority: ${cSeesInPriority}`
    });

    // -------------------------------------------------------------------------
    // STEP 6: Direct API request from Manager B to Manager A's event -> HTTP 403
    // -------------------------------------------------------------------------
    console.log("\n👉 Step 6: Try accessing Manager A's event through Manager B's direct API request...");
    let bGotForbiddenOnDetails = false;
    let bForbiddenDetailsMessage = '';
    try {
      await eventManagerService.getEventDetails(testEventId, mgrB);
    } catch (err) {
      if (err instanceof ForbiddenException || err.status === 403) {
        bGotForbiddenOnDetails = true;
        bForbiddenDetailsMessage = err.message;
      }
    }

    let bGotForbiddenOnConfig = false;
    try {
      await eventManagerService.updateConfiguration(testEventId, { expectedAttendance: 300 }, mgrB);
    } catch (err) {
      if (err instanceof ForbiddenException || err.status === 403) {
        bGotForbiddenOnConfig = true;
      }
    }

    console.log(`   ✓ Direct getEventDetails returned HTTP 403: ${bGotForbiddenOnDetails} ("${bForbiddenDetailsMessage}")`);
    console.log(`   ✓ Direct updateConfiguration returned HTTP 403: ${bGotForbiddenOnConfig}`);

    testResults.push({
      step: 6,
      description: "Direct API request to Manager A's event by Manager B returns HTTP 403",
      passed: bGotForbiddenOnDetails && bGotForbiddenOnConfig,
      details: `Details 403: ${bGotForbiddenOnDetails}, Config 403: ${bGotForbiddenOnConfig}`
    });

    // -------------------------------------------------------------------------
    // STEP 7: Verify Department Head can still see the event
    // -------------------------------------------------------------------------
    console.log('\n👉 Step 7: Verify Department Head can still see the event...');
    const deptHeadAssigned = await hierarchyService.getAssignedEvents(deptHeadUser);
    const assignedList = deptHeadAssigned.events || deptHeadAssigned.assigned || [];
    const deptHeadSeesEvent = assignedList.some(e => e.id === testEventId);
    const assignedMgrMatch = assignedList.find(e => e.id === testEventId)?.eventManagerUserId === mgrA.id;

    console.log(`   ✓ Department Head sees event in assigned list: ${deptHeadSeesEvent}`);
    console.log(`   ✓ Assigned manager recorded as Manager A: ${assignedMgrMatch}`);

    testResults.push({
      step: 7,
      description: 'Department Head retains department-wide visibility',
      passed: deptHeadSeesEvent && assignedMgrMatch,
      details: `In assigned list: ${deptHeadSeesEvent}, assigned to Manager A: ${assignedMgrMatch}`
    });

    // -------------------------------------------------------------------------
    // STEP 8: Reassign the event from Manager A to Manager B
    // -------------------------------------------------------------------------
    console.log('\n👉 Step 8: Reassign the event from Manager A to Manager B (Sneha)...');
    const reassignRes = await hierarchyService.assignStaff(
      testEventId,
      { eventManagerUserId: mgrB.id },
      deptHeadUser
    );
    const reassignedManagerId = reassignRes.eventRequest ? reassignRes.eventRequest.eventManagerUserId : reassignRes.eventManagerUserId;
    console.log(`   ✓ Reassigned event to ${mgrB.id}, new manager: ${reassignedManagerId}`);

    testResults.push({
      step: 8,
      description: 'Reassign event from Manager A to Manager B',
      passed: reassignedManagerId === mgrB.id,
      details: `Reassigned from ${mgrA.id} to ${mgrB.id}`
    });

    // -------------------------------------------------------------------------
    // STEP 9: Verify it disappears from A's workspace and appears in B's workspace
    // -------------------------------------------------------------------------
    console.log("\n👉 Step 9: Verify event disappears from A's workspace and appears in B's workspace...");
    const postReassignEventsA = await eventManagerService.getEvents({}, mgrA);
    const aHasEventNow = postReassignEventsA.events.some(e => e.id === testEventId);

    let aForbiddenOnDetailsNow = false;
    try {
      await eventManagerService.getEventDetails(testEventId, mgrA);
    } catch (err) {
      if (err instanceof ForbiddenException || err.status === 403) {
        aForbiddenOnDetailsNow = true;
      }
    }

    const postReassignEventsB = await eventManagerService.getEvents({}, mgrB);
    const bHasEventNow = postReassignEventsB.events.some(e => e.id === testEventId);
    let bCanAccessDetailsNow = false;
    try {
      const bDetail = await eventManagerService.getEventDetails(testEventId, mgrB);
      bCanAccessDetailsNow = !!bDetail.request;
    } catch (err) {
      bCanAccessDetailsNow = false;
    }

    console.log(`   ✓ Disappeared from Manager A's list: ${!aHasEventNow}`);
    console.log(`   ✓ Manager A blocked from details with 403: ${aForbiddenOnDetailsNow}`);
    console.log(`   ✓ Appeared in Manager B's list: ${bHasEventNow}`);
    console.log(`   ✓ Manager B can view details: ${bCanAccessDetailsNow}`);

    testResults.push({
      step: 9,
      description: "Disappears from Manager A's workspace, appears in Manager B's workspace",
      passed: !aHasEventNow && aForbiddenOnDetailsNow && bHasEventNow && bCanAccessDetailsNow,
      details: `A list: ${aHasEventNow}, A 403: ${aForbiddenOnDetailsNow}, B list: ${bHasEventNow}, B details: ${bCanAccessDetailsNow}`
    });

    // -------------------------------------------------------------------------
    // STEP 10: Verify dashboard statistics update correctly
    // -------------------------------------------------------------------------
    console.log('\n👉 Step 10: Verify dashboard statistics update dynamically for all managers...');
    const dashANow = await eventManagerService.getDashboard(mgrA);
    const dashBNow = await eventManagerService.getDashboard(mgrB);
    const dashCNow = await eventManagerService.getDashboard(mgrC);

    const aStatsCorrect = dashANow.metrics.assignedEvents === 0;
    const bStatsCorrect = dashBNow.metrics.assignedEvents === 1;
    const cStatsCorrect = dashCNow.metrics.assignedEvents === 0;

    // Now test completion scoping: complete the event and verify only Manager B's completedEvents updates
    store.update('event_requests', testEventId, {
      operationalStatus: 'COMPLETED',
      status: 'COMPLETED',
      updatedAt: new Date().toISOString()
    });
    store.update('events', testEventId, {
      status: 'COMPLETED',
      operationalStatus: 'COMPLETED',
      updatedAt: new Date().toISOString()
    });

    const dashACompleted = await eventManagerService.getDashboard(mgrA);
    const dashBCompleted = await eventManagerService.getDashboard(mgrB);
    const dashCCompleted = await eventManagerService.getDashboard(mgrC);

    const completionScopedProperly = 
      dashBCompleted.metrics.completedEvents === 1 &&
      dashACompleted.metrics.completedEvents === 0 &&
      dashCCompleted.metrics.completedEvents === 0;

    console.log(`   ✓ Manager A assigned count updated to 0: ${aStatsCorrect} (${dashANow.metrics.assignedEvents})`);
    console.log(`   ✓ Manager B assigned count updated to 1: ${bStatsCorrect} (${dashBNow.metrics.assignedEvents})`);
    console.log(`   ✓ Manager C assigned count remained 0: ${cStatsCorrect} (${dashCNow.metrics.assignedEvents})`);
    console.log(`   ✓ Completion stats scoped exclusively to assigned Manager B: ${completionScopedProperly} (B=${dashBCompleted.metrics.completedEvents}, A=${dashACompleted.metrics.completedEvents}, C=${dashCCompleted.metrics.completedEvents})`);

    testResults.push({
      step: 10,
      description: 'Dashboard statistics update correctly upon assignment, reassignment, and completion',
      passed: aStatsCorrect && bStatsCorrect && cStatsCorrect && completionScopedProperly,
      details: `A: assigned=${dashANow.metrics.assignedEvents}, completed=${dashACompleted.metrics.completedEvents}; B: assigned=${dashBNow.metrics.assignedEvents}, completed=${dashBCompleted.metrics.completedEvents}; C: assigned=${dashCNow.metrics.assignedEvents}, completed=${dashCCompleted.metrics.completedEvents}`
    });

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP: Purge test entities
    // -------------------------------------------------------------------------
    console.log('\n🧹 Cleaning up test accounts and event records...');
    for (const eid of createdEventIds) {
      store.delete('event_requests', eid);
      store.delete('events', eid);
    }
    for (const uid of createdUserIds) {
      store.delete('users', uid);
    }
    console.log('   ✓ Cleanup completed.');
    await app.close();
  }

  console.log('\n========================================================================');
  console.log('📊 FINAL TEST RESULTS SUMMARY:');
  console.log('========================================================================');
  let allPassed = true;
  for (const r of testResults) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | Step ${r.step}: ${r.description}`);
    if (!r.passed) allPassed = false;
  }
  console.log('========================================================================');
  console.log(allPassed ? '🎉 ALL 10 SCENARIOS PASSED WITH FULL WORKSPACE ISOLATION!' : '⚠️ SOME TESTS FAILED');
  console.log('========================================================================\n');

  process.exit(allPassed ? 0 : 1);
}

runTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
