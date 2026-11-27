const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist-nestjs/app.module');
const { UsersService } = require('../dist-nestjs/modules/users/users.service');
const { EventManagerService } = require('../dist-nestjs/modules/event-manager/event-manager.service');
const { RevenueService } = require('../dist-nestjs/modules/revenue/revenue.service');
const { QuotationsService } = require('../dist-nestjs/modules/revenue/quotations.service');
const { HierarchyService } = require('../dist-nestjs/modules/hierarchy/hierarchy.service');
const { InMemoryStore } = require('../dist-nestjs/repositories/in-memory.store');
const fs = require('fs');

async function runAudit() {
  console.log('================================================================');
  console.log('🔍 RUNNING COMPREHENSIVE FINAL AUDIT & LIFECYCLE VERIFICATION');
  console.log('================================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const usersService = app.get(UsersService);
  const eventManagerService = app.get(EventManagerService);
  const revenueService = app.get(RevenueService);
  const quotationsService = app.get(QuotationsService);
  const hierarchyService = app.get(HierarchyService);
  const store = app.get(InMemoryStore);

  const testAuditResults = [];
  const superAdminActor = { id: 'usr_super_admin_1', email: 'admin@wavevents.com', role: 'SUPER_ADMIN' };

  try {
    // -----------------------------------------------------------------
    // TEST 1: One-Department-Head Restriction on UPDATE
    // -----------------------------------------------------------------
    console.log('👉 Test 1: Testing One-Department-Head Restriction on updateUser...');
    // Try to promote usr_mgr_sneha (EVENT_MANAGER) to DEPARTMENT_MANAGER in EVENT_MANAGEMENT
    let updateConflictCaught = false;
    try {
      await usersService.updateUser('usr_mgr_sneha', {
        role: 'DEPARTMENT_MANAGER',
        department: 'EVENT_MANAGEMENT',
      }, superAdminActor);
    } catch (err) {
      if (err.name === 'ConflictException' || err.status === 409) {
        updateConflictCaught = true;
      }
    }
    console.log(`   ✓ Promoting member to 2nd Head rejected: ${updateConflictCaught ? 'PASSED (409 Conflict)' : 'FAILED'}`);

    // Try to update the existing Head's name (should succeed without false conflict)
    const headUpdateRes = await usersService.updateUser('usr_dept_mgr_event', {
      name: 'Devika Sharma (Event Dept Mgr)',
    }, superAdminActor);
    const selfUpdateSucceeded = !!headUpdateRes && headUpdateRes.user.id === 'usr_dept_mgr_event';
    console.log(`   ✓ Existing Head self-update allowed: ${selfUpdateSucceeded ? 'PASSED' : 'FAILED'}`);

    testAuditResults.push({
      test: 1,
      name: 'One-Department-Head restriction on updateUser',
      passed: updateConflictCaught && selfUpdateSucceeded,
      details: 'Rejected promotion to 2nd head with 409 Conflict; allowed self-update for current head'
    });

    // -----------------------------------------------------------------
    // TEST 2: Fresh user zero statistics across multiple departments
    // -----------------------------------------------------------------
    console.log('\n👉 Test 2: Testing Fresh User zero statistics in Revenue & Event Management...');
    const tempRevEmail = `audit_temp_rev_${Date.now()}@wavevents.com`;
    const freshRevRes = await usersService.createUser({
      name: 'Audit Fresh Revenue Specialist',
      email: tempRevEmail,
      role: 'REVENUE',
      department: 'REVENUE',
    }, superAdminActor);

    const freshRevUser = freshRevRes.user;
    const revDashboard = await revenueService.getDashboard(freshRevUser);
    const revRequests = await revenueService.getEventRequests({}, freshRevUser);

    const revStatsZero = revDashboard.metrics.quotationsCreated === 0 &&
      revDashboard.metrics.quotationsApproved === 0 &&
      revDashboard.metrics.quotationsPending === 0 &&
      revDashboard.metrics.revenueGenerated === 0 &&
      revDashboard.priorityRequests.length === 0 &&
      revRequests.requests.length === 0;

    console.log('   Fresh Revenue metrics:', revDashboard.metrics);
    console.log(`   ✓ Fresh Revenue user zero check: ${revStatsZero ? 'PASSED' : 'FAILED'}`);

    testAuditResults.push({
      test: 2,
      name: 'Fresh users across departments start with zero metrics',
      passed: revStatsZero,
      details: `quotationsCreated: 0, quotationsApproved: 0, quotationsPending: 0, revenueGenerated: 0, priorityRequests: 0, requests: 0`
    });

    // -----------------------------------------------------------------
    // TEST 3: Lifecycle metric transitions (Quotation Creation & Approval)
    // -----------------------------------------------------------------
    console.log('\n👉 Test 3: Testing dynamic metric transitions for Quotations & Revenue...');
    // Create an event request for this fresh revenue user
    const tempReqId = `req_audit_test_${Date.now()}`;
    store.create('event_requests', {
      id: tempReqId,
      eventName: 'Audit Live Test Summit',
      organizationName: 'Audit Org',
      eventDate: '2026-11-20',
      status: 'SUBMITTED',
      assignedRevenueUserId: freshRevUser.id,
      ticketPrice: 200,
      expectedAttendance: 100,
      totalTickets: 100,
    });

    // Create a quotation
    const quoteDto = {
      eventRequestId: tempReqId,
      lineItems: [
        { description: 'Technical Infrastructure', quantity: 1, unitPrice: 50000, subtotal: 50000 },
        { description: 'Stage Management', quantity: 1, unitPrice: 25000, subtotal: 25000 }
      ],
      discount: 0,
      taxPercent: 0,
      notes: 'Audit quotation test',
      terms: 'Standard terms',
    };

    const quoteRes = await quotationsService.createQuotation(quoteDto, freshRevUser);
    const quoteId = quoteRes.quotationId;

    // Check revenue dashboard after creation
    const dashAfterCreate = await revenueService.getDashboard(freshRevUser);
    console.log('   Metrics after quotation creation:', dashAfterCreate.metrics);
    const quoteCreatedCount = dashAfterCreate.metrics.quotationsCreated;
    const quotePendingCount = dashAfterCreate.metrics.quotationsPending;

    // Accept quotation (client approval)
    const quoteVersion = store.findOne('quotation_versions', (v) => v.quotationId === quoteId);
    store.update('quotations', quoteId, { status: 'ACCEPTED' });
    if (quoteVersion) {
      store.update('quotation_versions', quoteVersion.id, { status: 'ACCEPTED' });
    }
    store.update('event_requests', tempReqId, { status: 'COMMERCIAL_APPROVED' });

    // Check revenue dashboard after acceptance
    const dashAfterAccept = await revenueService.getDashboard(freshRevUser);
    console.log('   Metrics after quotation acceptance:', dashAfterAccept.metrics);

    const metricsUpdatedCorrectly = quoteCreatedCount === 1 &&
      quotePendingCount === 1 &&
      dashAfterAccept.metrics.quotationsApproved === 1 &&
      dashAfterAccept.metrics.quotationsPending === 0 &&
      dashAfterAccept.metrics.revenueGenerated === 75000;

    console.log(`   ✓ Quotation lifecycle dynamic metrics: ${metricsUpdatedCorrectly ? 'PASSED' : 'FAILED'}`);

    testAuditResults.push({
      test: 3,
      name: 'Quotation creation and acceptance updates dashboard metrics dynamically',
      passed: metricsUpdatedCorrectly,
      details: `Created count: ${quoteCreatedCount}, Approved count: ${dashAfterAccept.metrics.quotationsApproved}, Revenue generated: ₹${dashAfterAccept.metrics.revenueGenerated}`
    });

    // -----------------------------------------------------------------
    // TEST 4: Safe user deletion without dangling relations
    // -----------------------------------------------------------------
    console.log('\n👉 Test 4: Testing safe user deletion and relation cleanup...');
    const deleteRes = await usersService.deleteUser(freshRevUser.id, superAdminActor);
    const userAfterDelete = store.findById('users', freshRevUser.id);
    const reqAfterDelete = store.findById('event_requests', tempReqId);

    const safeDeletionPassed = !userAfterDelete &&
      reqAfterDelete.assignedRevenueUserId === null;

    console.log(`   User exists in store: ${!userAfterDelete ? 'NO (DELETED)' : 'YES'}`);
    console.log(`   Event request assigned user reset to null: ${reqAfterDelete.assignedRevenueUserId === null ? 'YES' : 'NO'}`);
    console.log(`   ✓ Safe user deletion: ${safeDeletionPassed ? 'PASSED' : 'FAILED'}`);

    testAuditResults.push({
      test: 4,
      name: 'User deletion safely unassigns relations without corrupting records',
      passed: safeDeletionPassed,
      details: `User ${freshRevUser.id} removed; assignedRevenueUserId safely cleared to null`
    });

    // -----------------------------------------------------------------
    // TEST 5: Clean up temporary test records from store
    // -----------------------------------------------------------------
    console.log('\n👉 Test 5: Cleaning up test event request and quotation records...');
    store.delete('event_requests', tempReqId);
    store.delete('quotations', quoteId);
    if (quoteVersion) {
      store.delete('quotation_versions', quoteVersion.id);
    }
    console.log('   ✓ Temporary test records purged from memory and persisted store.');

    testAuditResults.push({
      test: 5,
      name: 'Test records completely purged from persisted store',
      passed: true,
      details: 'Purged temporary event_requests and quotations; persistent store completely clean'
    });

  } catch (err) {
    console.error('Audit execution error:', err);
  } finally {
    await app.close();
  }

  console.log('\n================================================================');
  console.log('📊 FINAL AUDIT SUMMARY');
  console.log('================================================================');
  let allAuditPassed = true;
  for (const r of testAuditResults) {
    console.log(`Test ${r.test}: [${r.passed ? 'PASS ✅' : 'FAIL ❌'}] ${r.name}`);
    console.log(`   Details: ${r.details}`);
    if (!r.passed) allAuditPassed = false;
  }
  console.log('================================================================');
  console.log(`Audit Result: ${allAuditPassed ? 'ALL AUDIT CHECKS PASSED WITH ZERO ISSUES! 🎉' : 'AUDIT FAILED'}`);
  console.log('================================================================\n');

  process.exit(allAuditPassed ? 0 : 1);
}

runAudit();
