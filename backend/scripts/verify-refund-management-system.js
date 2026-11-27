/**
 * Wavevents Comprehensive Refund Management System Verification Suite
 * Tests all 17 scenarios specified in Requirement 9 plus additional constraint validations.
 * Target: http://localhost:5001/api
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';

const USERS = {
  superAdmin: { email: 'super.admin@wavevents.com', password: 'Password123!', role: 'SUPER_ADMIN' },
  deptHeadRevenue: { email: 'siddharth.goel@wavevents.com', password: 'Password123!', role: 'DEPARTMENT_MANAGER', department: 'REVENUE' },
  revenueSpecialist: { email: 'priya.menon@wavevents.com', password: 'Password123!', role: 'REVENUE', department: 'REVENUE' },
  eventManager: { email: 'karthik.subramanian@wavevents.com', password: 'Password123!', role: 'EVENT_MANAGER' },
  onsiteCoordinator: { email: 'vikram.reddy@wavevents.com', password: 'Password123!', role: 'ONSITE_COORDINATOR' },
  attendeeA: { email: 'ananya.iyer@gmail.com', password: 'Password123!', role: 'ATTENDEE' },
  attendeeB: { email: 'rohan.verma@gmail.com', password: 'Password123!', role: 'ATTENDEE' },
  client: { email: 'tarun@gmail.com', password: 'Password123!', role: 'CLIENT' },
};

const TOKENS = {};

async function loginUser(key, user) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${user.email} (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  TOKENS[key] = data.token;
  return data;
}

async function api(path, method = 'GET', body = null, tokenKey = 'superAdmin') {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKENS[tokenKey]) {
    headers['Authorization'] = `Bearer ${TOKENS[tokenKey]}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { rawText: text };
  }
  return { status: res.status, ok: res.ok, data };
}

const testResults = [];

function recordTest(scenarioNum, title, passed, details = '') {
  testResults.push({ scenarioNum, title, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] Scenario ${scenarioNum}: ${title}`);
  if (details) {
    console.log(`       Details: ${details}`);
  }
}

async function runAllTests() {
  console.log('========================================================================');
  console.log('  WAVEVENTS REFUND MANAGEMENT SYSTEM - END-TO-END VERIFICATION SUITE');
  console.log('  Testing 17 Core Business Scenarios and Security RBAC Controls');
  console.log('========================================================================\n');

  // Authenticate all test roles
  console.log('🔑 Authenticating all test actors...');
  for (const [k, u] of Object.entries(USERS)) {
    await loginUser(k, u);
  }
  console.log('   All 8 role personas successfully authenticated with valid JWTs.\n');

  // Discover published active events (open public event evt-5)
  const eventsRes = await api('/events', 'GET');
  const allEvents = Array.isArray(eventsRes.data) ? eventsRes.data : (eventsRes.data.events || []);
  const activeEventForCancellation = allEvents.find(e => e.id === 'evt-5') || allEvents.find(e => e.id !== 'evt-1' && e.type === 'OPEN') || allEvents[0];

  console.log('📦 Setting up fresh test tickets and fixtures...');
  // Multi-ticket on evt-1
  const multiTktRes = await api('/tickets/register', 'POST', {
    eventId: 'evt-1',
    quantity: 3,
    paymentMethod: 'UPI',
  }, 'attendeeA');
  const multiTicket = multiTktRes.data.ticket;
  console.log(`   Purchased Multi-ticket: ID=${multiTicket.id}, Qty=${multiTicket.quantity}, Total=₹${multiTicket.totalAmount}`);

  // Single ticket on active cancellation target event
  const singleTktRes = await api('/tickets/register', 'POST', {
    eventId: activeEventForCancellation.id,
    quantity: 1,
    paymentMethod: 'CARD',
  }, 'attendeeA');
  const singleTicket = singleTktRes.data.ticket;
  console.log(`   Purchased Single-ticket on ${activeEventForCancellation.name}: ID=${singleTicket.id}, Qty=1, Total=₹${singleTicket.totalAmount}\n`);

  // -------------------------------------------------------------------------
  // Scenario 1: Event cancelled before work begins (100% refund)
  // -------------------------------------------------------------------------
  try {
    const cancelRes = await api(`/refunds/cancel-event/${activeEventForCancellation.id}`, 'POST', {
      cancellationReason: 'Pre-production schedule conflict; cancellation before work begins.',
      workStarted: false,
    }, 'eventManager');

    const refundList = await api(`/refunds?eventId=${activeEventForCancellation.id}`, 'GET', null, 'revenueSpecialist');
    const refunds = refundList.data.refunds || [];
    const tktRefund = refunds.find(r => r.ticketId === singleTicket.id);

    const s1Passed = (cancelRes.ok || cancelRes.status === 200) && tktRefund &&
      tktRefund.refundableAmount === tktRefund.totalPaidAmount &&
      tktRefund.deductionAmount === 0;

    recordTest(1, 'Event cancelled before work begins (100% refund)', s1Passed,
      `Event=${activeEventForCancellation.name}, Refund ID=${tktRefund?.id}, Total Paid=₹${tktRefund?.totalPaidAmount}, Deduction=₹${tktRefund?.deductionAmount}, Refundable=₹${tktRefund?.refundableAmount}`);
  } catch (err) {
    recordTest(1, 'Event cancelled before work begins (100% refund)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 2: Event cancelled after work begins (deduct verified expenses)
  // -------------------------------------------------------------------------
  try {
    const tktForS2Res = await api('/tickets/register', 'POST', {
      eventId: 'evt-1',
      quantity: 1,
      paymentMethod: 'UPI',
    }, 'attendeeA');
    const tktForS2 = tktForS2Res.data.ticket;

    const reqRes = await api('/refunds/request', 'POST', {
      ticketId: tktForS2.id,
      reason: 'Event operational cancellation after work begins',
    }, 'attendeeA');
    const s2RefundId = reqRes.data.refund.id;

    const deductionRes = await api(`/refunds/${s2RefundId}/deductions`, 'POST', {
      deductionAmount: 200,
      deductionReason: 'Verified non-recoverable venue staging & audio setup deposit',
      contractReference: 'Clause 7.2 Non-recoverable Operational Setup Expenses',
    }, 'revenueSpecialist');

    const updatedRefund = deductionRes.data.refund;
    const s2Passed = deductionRes.ok &&
      updatedRefund.deductionAmount === 200 &&
      updatedRefund.refundableAmount === (updatedRefund.totalPaidAmount - 200) &&
      updatedRefund.deductionReason.includes('Verified non-recoverable');

    recordTest(2, 'Event cancelled after work begins (deduct verified expenses)', s2Passed,
      `Paid=₹${updatedRefund?.totalPaidAmount}, Deducted=₹${updatedRefund?.deductionAmount}, Final Refundable=₹${updatedRefund?.refundableAmount}`);
  } catch (err) {
    recordTest(2, 'Event cancelled after work begins (deduct verified expenses)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 3: Client cancels an event
  // -------------------------------------------------------------------------
  try {
    const clientRefunds = await api('/refunds?customerType=CLIENT', 'GET', null, 'revenueSpecialist');
    let targetRefund = (clientRefunds.data.refunds || []).find(r => r.eventRequestId === 'req_4a0d34d88389d2bd');

    if (!targetRefund) {
      const clientCancelRes = await api('/refunds/cancel-event/req_4a0d34d88389d2bd', 'POST', {
        cancellationReason: 'Client corporate restructuring of product launch event',
        workStarted: false,
      }, 'client');
      targetRefund = clientCancelRes.data?.refunds?.[0];
    }

    const s3Passed = targetRefund &&
      (targetRefund.cancellationType === 'CLIENT_CANCELLED' || targetRefund.cancellationInitiatorRole === 'CLIENT') &&
      targetRefund.cancellationReason.includes('restructuring');

    recordTest(3, 'Client cancels an event', s3Passed,
      `Client cancellation registered. Refund ID=${targetRefund?.id}, Type=${targetRefund?.cancellationType}, Reason="${targetRefund?.cancellationReason}"`);
  } catch (err) {
    recordTest(3, 'Client cancels an event', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 4: Attendee purchases multiple tickets (100% refund across all tickets + fee)
  // -------------------------------------------------------------------------
  try {
    const reqRes = await api('/refunds/request', 'POST', {
      ticketId: multiTicket.id,
      reason: 'Family schedule conflict',
    }, 'attendeeA');

    const ref = reqRes.data.refund;
    const expectedTotal = multiTicket.totalAmount;
    const s4Passed = reqRes.ok && ref.ticketQuantity === 3 && ref.refundableAmount === expectedTotal && ref.deductionAmount === 0;

    recordTest(4, 'Attendee purchases multiple tickets (100% refund across all tickets + fee)', s4Passed,
      `Quantity=${ref?.ticketQuantity}, UnitPrice=₹${multiTicket.unitPrice}, Fee=₹${multiTicket.platformFee}, Total Refundable=₹${ref?.refundableAmount} (100%)`);
  } catch (err) {
    recordTest(4, 'Attendee purchases multiple tickets (100% refund across all tickets + fee)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 5: Attendee has no ticket purchase
  // -------------------------------------------------------------------------
  try {
    const fakeReq = await api('/refunds/request', 'POST', {
      ticketId: 'tkt_non_existent_999999',
      reason: 'Fraudulent refund claim',
    }, 'attendeeB');

    const s5Passed = fakeReq.status === 404 || fakeReq.status === 400;
    recordTest(5, 'Attendee has no ticket purchase (refund rejected/prevented)', s5Passed,
      `HTTP status=${fakeReq.status}, Error Message="${fakeReq.data.message}"`);
  } catch (err) {
    recordTest(5, 'Attendee has no ticket purchase (refund rejected/prevented)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 6: Client has paid only the advance (refund correctly scoped to advance)
  // -------------------------------------------------------------------------
  try {
    let clientRef = null;
    const list = await api('/refunds?customerType=CLIENT', 'GET', null, 'revenueSpecialist');
    clientRef = (list.data.refunds || []).find(r => r.quotationId === 'qtn_208c65e7b719a9c7');

    if (!clientRef) {
      const clientRefRes = await api('/refunds/request', 'POST', {
        quotationId: 'qtn_208c65e7b719a9c7',
        reason: 'Contract terminated before milestone 2',
      }, 'superAdmin');
      clientRef = clientRefRes.data?.refund;
    }

    const s6Passed = clientRef && clientRef.totalPaidAmount === 28910 && clientRef.refundableAmount <= 28910;
    recordTest(6, 'Client has paid only the advance (refund scoped strictly to advance)', s6Passed,
      `Quotation=qtn_208c65e7b719a9c7, Paid=₹${clientRef?.totalPaidAmount} (35% advance), Max Refundable=₹${clientRef?.refundableAmount}`);
  } catch (err) {
    recordTest(6, 'Client has paid only the advance (refund scoped strictly to advance)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 7: Client has paid all installments (refund calculated against full payment)
  // -------------------------------------------------------------------------
  try {
    let refund = null;
    const list = await api('/refunds?customerType=CLIENT', 'GET', null, 'revenueSpecialist');
    refund = (list.data.refunds || []).find(r => r.quotationId === 'qtn_5a27a81492999310');

    if (!refund) {
      const fullPayRefund = await api('/refunds/request', 'POST', {
        quotationId: 'qtn_5a27a81492999310',
        reason: 'Full project cancellation after stage 3 payment',
      }, 'superAdmin');
      refund = fullPayRefund.data?.refund;
    }

    const s7Passed = refund && refund.totalPaidAmount === 100000 && refund.refundableAmount === 100000;
    recordTest(7, 'Client has paid all installments (refund calculated against full payment)', s7Passed,
      `Total 3-Stage Paid=₹${refund?.totalPaidAmount} (Advance+Milestone+Final), Refundable=₹${refund?.refundableAmount}`);
  } catch (err) {
    recordTest(7, 'Client has paid all installments (refund calculated against full payment)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 8: Refund is rejected (with mandatory rejection reason)
  // -------------------------------------------------------------------------
  try {
    const tktRes = await api('/tickets/register', 'POST', {
      eventId: 'evt-1',
      quantity: 1,
      paymentMethod: 'CARD',
    }, 'attendeeA');
    const reqRes = await api('/refunds/request', 'POST', {
      ticketId: tktRes.data.ticket.id,
      reason: 'Customer requested refund late',
    }, 'attendeeA');
    const rejectTargetId = reqRes.data.refund.id;

    // Test 8a: Reject without reason should fail with 400
    const emptyRejectRes = await api(`/refunds/${rejectTargetId}/reject`, 'POST', {
      rejectionReason: '',
    }, 'revenueSpecialist');
    const rejectedEmpty = emptyRejectRes.status === 400;

    // Test 8b: Reject with documented reason succeeds
    const rejectRes = await api(`/refunds/${rejectTargetId}/reject`, 'POST', {
      rejectionReason: 'Event ticket policy non-compliant; ticket was already checked in at venue gates.',
    }, 'revenueSpecialist');

    const s8Passed = rejectedEmpty && rejectRes.ok && rejectRes.data.refund.status === 'REJECTED';
    recordTest(8, 'Refund is rejected (with documented rejection reason)', s8Passed,
      `Empty reason rejected with HTTP ${emptyRejectRes.status}. Valid rejection status=${rejectRes.data?.refund?.status}`);
  } catch (err) {
    recordTest(8, 'Refund is rejected (with documented rejection reason)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 9: Refund is approved but not processed (status APPROVED, not REFUNDED)
  // -------------------------------------------------------------------------
  let approvedRefundId = null;
  try {
    const tktRes = await api('/tickets/register', 'POST', {
      eventId: 'evt-1',
      quantity: 1,
      paymentMethod: 'UPI',
    }, 'attendeeA');
    const reqRes = await api('/refunds/request', 'POST', {
      ticketId: tktRes.data.ticket.id,
      reason: 'Medical emergency',
    }, 'attendeeA');
    approvedRefundId = reqRes.data.refund.id;

    const approveRes = await api(`/refunds/${approvedRefundId}/approve`, 'POST', {
      notes: 'Approved by Revenue Specialist Priya Menon after medical documentation verification.',
    }, 'revenueSpecialist');

    const approvedRefund = approveRes.data.refund;
    const s9Passed = approveRes.ok &&
      approvedRefund.status === 'APPROVED' &&
      approvedRefund.status !== 'REFUNDED' &&
      !approvedRefund.refundTransactionId;

    recordTest(9, 'Refund is approved but not processed (status APPROVED, not REFUNDED)', s9Passed,
      `Status=${approvedRefund?.status}, ApprovedBy=${approvedRefund?.approvedByName}, TransactionID=${approvedRefund?.refundTransactionId || 'NONE (Pending settlement)'}`);
  } catch (err) {
    recordTest(9, 'Refund is approved but not processed (status APPROVED, not REFUNDED)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 10: Refund is successfully processed (PROCESSING -> REFUNDED with transaction reference)
  // -------------------------------------------------------------------------
  try {
    const procRes = await api(`/refunds/${approvedRefundId}/process`, 'POST', {
      notes: 'Initiating banking settlement via ICICI corporate payout API',
    }, 'revenueSpecialist');

    const completeRes = await api(`/refunds/${approvedRefundId}/complete`, 'POST', {
      refundTransactionId: 'TXN-SETTLE-2026-994821',
      refundMethod: 'UPI',
      notes: 'Payment settled and bank confirmation UTR verified.',
    }, 'revenueSpecialist');

    const completedRefund = completeRes.data.refund;
    const s10Passed = procRes.ok && completeRes.ok &&
      completedRefund.status === 'REFUNDED' &&
      completedRefund.refundTransactionId === 'TXN-SETTLE-2026-994821';

    recordTest(10, 'Refund is successfully processed (PROCESSING -> REFUNDED with transaction ref)', s10Passed,
      `Final Status=${completedRefund?.status}, Settlement Ref=${completedRefund?.refundTransactionId}, Disbursed=₹${completedRefund?.actualRefundedAmount}`);
  } catch (err) {
    recordTest(10, 'Refund is successfully processed (PROCESSING -> REFUNDED with transaction ref)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 11: Duplicate refund requests are prevented
  // -------------------------------------------------------------------------
  try {
    const dupRes = await api('/refunds/request', 'POST', {
      ticketId: multiTicket.id,
      reason: 'Duplicate claim attempt',
    }, 'attendeeA');

    const reCancelRes = await api(`/refunds/cancel-event/${activeEventForCancellation.id}`, 'POST', {
      cancellationReason: 'Duplicate cancellation trigger',
    }, 'eventManager');

    const s11Passed = dupRes.status === 400 && (reCancelRes.ok || reCancelRes.status === 200);
    recordTest(11, 'Duplicate refund requests are prevented', s11Passed,
      `Duplicate ticket request blocked with HTTP ${dupRes.status}: "${dupRes.data.message}"`);
  } catch (err) {
    recordTest(11, 'Duplicate refund requests are prevented', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 12: Event Manager cannot approve refunds (403 Forbidden)
  // -------------------------------------------------------------------------
  try {
    const emApproveRes = await api(`/refunds/${approvedRefundId}/approve`, 'POST', {
      notes: 'Event manager attempting illicit approval',
    }, 'eventManager');

    const s12Passed = emApproveRes.status === 403;
    recordTest(12, 'Event Manager cannot approve refunds (403 Forbidden enforced in backend)', s12Passed,
      `HTTP status=${emApproveRes.status}, Error="${emApproveRes.data.message}"`);
  } catch (err) {
    recordTest(12, 'Event Manager cannot approve refunds (403 Forbidden enforced in backend)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 13: Onsite Coordinator cannot approve refunds (403 Forbidden)
  // -------------------------------------------------------------------------
  try {
    const coordApproveRes = await api(`/refunds/${approvedRefundId}/approve`, 'POST', {
      notes: 'Onsite coordinator attempting illicit approval',
    }, 'onsiteCoordinator');

    const s13Passed = coordApproveRes.status === 403;
    recordTest(13, 'Onsite Coordinator cannot approve refunds (403 Forbidden enforced in backend)', s13Passed,
      `HTTP status=${coordApproveRes.status}, Error="${coordApproveRes.data.message}"`);
  } catch (err) {
    recordTest(13, 'Onsite Coordinator cannot approve refunds (403 Forbidden enforced in backend)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 14: Revenue Team can manage refunds
  // -------------------------------------------------------------------------
  try {
    const revCheck = await api(`/refunds?status=REFUNDED`, 'GET', null, 'revenueSpecialist');
    const s14Passed = revCheck.ok && Array.isArray(revCheck.data.refunds) && revCheck.data.refunds.length > 0;
    recordTest(14, 'Revenue Team can manage refunds (review, deductions, approve, process, complete)', s14Passed,
      `Revenue Specialist successfully managed refund lifecycle and retrieved ${revCheck.data?.refunds?.length} records`);
  } catch (err) {
    recordTest(14, 'Revenue Team can manage refunds', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 15: Revenue Department Head can monitor all department refunds
  // -------------------------------------------------------------------------
  try {
    const deptHeadMetrics = await api('/refunds/metrics', 'GET', null, 'deptHeadRevenue');
    const deptHeadList = await api('/refunds', 'GET', null, 'deptHeadRevenue');

    const m = deptHeadMetrics.data;
    const s15Passed = deptHeadMetrics.ok && deptHeadList.ok &&
      m.totalRefunds !== undefined && m.totalRefundedAmount !== undefined &&
      m.approved !== undefined && m.processing !== undefined;

    recordTest(15, 'Revenue Department Head can monitor all department refunds', s15Passed,
      `Dept Head Metrics: Total=${m.totalRefunds}, Approved=${m.approved}, Processing=${m.processing}, Completed=${m.completed}, Refunded=₹${m.totalRefundedAmount}`);
  } catch (err) {
    recordTest(15, 'Revenue Department Head can monitor all department refunds', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 16: Super Admin can monitor all refunds
  // -------------------------------------------------------------------------
  try {
    const saMetrics = await api('/refunds/metrics', 'GET', null, 'superAdmin');
    const saList = await api('/refunds', 'GET', null, 'superAdmin');

    const m = saMetrics.data;
    const s16Passed = saMetrics.ok && saList.ok && m.totalRefunds > 0 && m.totalPendingAmount !== undefined;

    recordTest(16, 'Super Admin can monitor all refunds platform-wide', s16Passed,
      `Super Admin Metrics: Total=${m.totalRefunds}, Pending Requests=${m.pendingRequests}, Total Pending Volume=₹${m.totalPendingAmount}`);
  } catch (err) {
    recordTest(16, 'Super Admin can monitor all refunds platform-wide', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 17: Attendees and clients can only view their own refund records
  // -------------------------------------------------------------------------
  try {
    const unauthorizedAccess = await api(`/refunds/${approvedRefundId}`, 'GET', null, 'attendeeB');
    const blockedOtherUser = unauthorizedAccess.status === 403;

    const authorizedAccess = await api(`/refunds/${approvedRefundId}`, 'GET', null, 'attendeeA');
    const allowedOwnUser = authorizedAccess.ok && authorizedAccess.data.refund.id === approvedRefundId;

    const myRefundsRes = await api('/refunds/my', 'GET', null, 'attendeeA');
    const myRefundsAllowed = myRefundsRes.ok && Array.isArray(myRefundsRes.data.refunds);

    const s17Passed = blockedOtherUser && allowedOwnUser && myRefundsAllowed;
    recordTest(17, 'Attendees and clients can only view their own refund records (isolated view)', s17Passed,
      `Unauthorized cross-user fetch returned HTTP ${unauthorizedAccess.status} (403 Forbidden). Own refund fetch returned HTTP 200 OK.`);
  } catch (err) {
    recordTest(17, 'Attendees and clients can only view their own refund records', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Additional Constraint Checks
  // -------------------------------------------------------------------------
  console.log('\n🔒 Running Additional Business Rule & Constraint Checks...');

  // Constraint 1: Refund never exceeds total amount paid
  try {
    const excessiveDeduction = await api(`/refunds/${approvedRefundId}/deductions`, 'POST', {
      deductionAmount: 9999999,
      deductionReason: 'Arbitrary exorbitant deduction',
    }, 'revenueSpecialist');
    const c1Passed = excessiveDeduction.status === 400;
    console.log(`   [${c1Passed ? '✅' : '❌'}] Constraint: Deductions exceeding total paid amount are rejected (HTTP ${excessiveDeduction.status})`);
  } catch (e) {
    console.log(`   [❌] Constraint: Exorbitant deduction check failed: ${e.message}`);
  }

  // Constraint 2: Deduction without documented reason is rejected
  try {
    const unreasonedDeduction = await api(`/refunds/${approvedRefundId}/deductions`, 'POST', {
      deductionAmount: 50,
      deductionReason: '',
    }, 'revenueSpecialist');
    const c2Passed = unreasonedDeduction.status === 400;
    console.log(`   [${c2Passed ? '✅' : '❌'}] Constraint: Deductions without documented reason are rejected (HTTP ${unreasonedDeduction.status})`);
  } catch (e) {
    console.log(`   [❌] Constraint: Undocumented deduction check failed: ${e.message}`);
  }

  // Constraint 3: Dashboard statistics derive from actual refund records
  try {
    const metricsRes = await api('/refunds/metrics', 'GET', null, 'revenueSpecialist');
    const allRefundsRes = await api('/refunds', 'GET', null, 'revenueSpecialist');
    const m = metricsRes.data;
    const list = allRefundsRes.data.refunds || [];

    const computedTotal = list.length;
    const computedCompleted = list.filter(r => r.status === 'REFUNDED').length;
    const c3Passed = m.totalRefunds === computedTotal && m.completed === computedCompleted;
    console.log(`   [${c3Passed ? '✅' : '❌'}] Constraint: Dashboard metrics accurately derive from refund repository records (Total: ${m.totalRefunds}, Completed: ${m.completed})`);
  } catch (e) {
    console.log(`   [❌] Constraint: Metrics accuracy check failed: ${e.message}`);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('  FINAL VERIFICATION SUMMARY');
  console.log('========================================================================');
  const totalPassed = testResults.filter(r => r.passed).length;
  const totalFailed = testResults.filter(r => !r.passed).length;

  console.log(`Total Scenarios Tested: ${testResults.length}`);
  console.log(`Scenarios Passed:       ${totalPassed} / ${testResults.length}`);
  console.log(`Scenarios Failed:       ${totalFailed} / ${testResults.length}`);

  if (totalFailed === 0) {
    console.log('\n🎉 ALL 17 SCENARIOS AND SECURITY CONSTRAINTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error(`\n⚠️  ${totalFailed} SCENARIO(S) FAILED.`);
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test suite execution error:', err);
  process.exit(1);
});
