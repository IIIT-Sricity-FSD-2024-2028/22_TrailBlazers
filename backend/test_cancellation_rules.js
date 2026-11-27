const jwt = require('./node_modules/jsonwebtoken');

const JWT_SECRET = 'ffsd-event-platform-secret-key-2026';
const BASE_URL = 'http://localhost:5001/api';

function makeToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department || null,
      emailVerified: true,
      organization: user.organization || null,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

const attendeeToken = makeToken({
  id: 'usr_49679b9a61eda9ac',
  email: 'rohan.verma@gmail.com',
  name: 'Rohan Verma',
  role: 'ATTENDEE',
});

const otherAttendeeToken = makeToken({
  id: 'usr_c2f61060c9978776',
  email: 'rohan.verma2@gmail.com',
  name: 'Rohan Verma 2',
  role: 'ATTENDEE',
});

const clientToken = makeToken({
  id: 'usr_e2e_client_a',
  email: 'arjun.krishnan@gmail.com',
  name: 'Arjun Krishnan',
  role: 'CLIENT',
});

const otherClientToken = makeToken({
  id: 'usr_malicious',
  email: 'manish.malhotra@gmail.com',
  name: 'Manish Malhotra',
  role: 'CLIENT',
});

async function runTests() {
  console.log('================================================================');
  console.log('   WAVEVENTS CANCELLATION BUSINESS RULES LIVE VERIFICATION');
  console.log('================================================================\n');

  const results = [];

  async function testCase(id, description, fn) {
    process.stdout.write(`Testing [${id}] ${description}... `);
    try {
      const res = await fn();
      if (res.passed) {
        console.log('PASSED');
        results.push({ id, description, status: 'PASSED', details: res.details });
      } else {
        console.log(`FAILED: ${res.reason}`);
        results.push({ id, description, status: 'FAILED', reason: res.reason, details: res.details });
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results.push({ id, description, status: 'ERROR', reason: err.message });
    }
  }

  // --- ATTENDEE TESTS ---
  console.log('--- SECTION 1: ATTENDEE TICKET CANCELLATION RULES ---');

  // A1: Eligible ticket (Upcoming, not checked in) -> 201 Created
  await testCase('A1', 'Upcoming + Not Checked-in Ticket Cancellation Allowed', async () => {
    const res = await fetch(`${BASE_URL}/refunds/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({
        ticketId: 'test_tkt_eligible',
        reason: 'Change in personal travel schedule',
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.refund && data.refund.status === 'REQUESTED') {
      return { passed: true, details: `HTTP 201 Created | Refund ID: ${data.refund.id}` };
    }
    return { passed: false, reason: `Expected 201, got ${res.status}: ${JSON.stringify(data)}` };
  });

  // A2: Checked-in ticket (checkedIn: 1, checkedInAt) -> 409 Conflict
  await testCase('A2', 'Checked-in Ticket Cancellation Blocked with 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/refunds/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({
        ticketId: 'test_tkt_checkedin',
        reason: 'Attempting cancellation after check-in',
      }),
    });
    const data = await res.json();
    const expectedMsg = 'This ticket cannot be cancelled because it has already been used for event entry.';
    if (res.status === 409 && data.message === expectedMsg) {
      return { passed: true, details: `HTTP 409 Conflict | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // A3: QR scanned/validated ticket (entryStatus: FULLY_CHECKED_IN) -> 409 Conflict
  await testCase('A3', 'QR Scanned/Validated Ticket Blocked with 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/refunds/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({
        ticketId: 'test_tkt_qr_scanned',
        reason: 'Attempting cancellation after QR scanned',
      }),
    });
    const data = await res.json();
    const expectedMsg = 'This ticket cannot be cancelled because it has already been used for event entry.';
    if (res.status === 409 && data.message === expectedMsg) {
      return { passed: true, details: `HTTP 409 Conflict | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // A4: Member entered ticket (ticket_members entryStatus: INSIDE) -> 409 Conflict
  await testCase('A4', 'Ticket with Entered Member Blocked with 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/refunds/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({
        ticketId: 'test_tkt_member_entered',
        reason: 'Attempting cancellation when guest entered',
      }),
    });
    const data = await res.json();
    const expectedMsg = 'This ticket cannot be cancelled because it has already been used for event entry.';
    if (res.status === 409 && data.message === expectedMsg) {
      return { passed: true, details: `HTTP 409 Conflict | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // A5: Ticket with Entry Audit Log -> 409 Conflict
  await testCase('A5', 'Ticket with Entry Audit Log Blocked with 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/refunds/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({
        ticketId: 'test_tkt_entry_logged',
        reason: 'Attempting cancellation with entry log',
      }),
    });
    const data = await res.json();
    const expectedMsg = 'This ticket cannot be cancelled because it has already been used for event entry.';
    if (res.status === 409 && data.message === expectedMsg) {
      return { passed: true, details: `HTTP 409 Conflict | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // A6: Already Cancelled Ticket -> 409 Conflict
  await testCase('A6', 'Already Cancelled Ticket Rejected with 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/refunds/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({
        ticketId: 'test_tkt_already_cancelled',
        reason: 'Attempting second cancellation',
      }),
    });
    const data = await res.json();
    const expectedMsg = 'This ticket has already been cancelled.';
    if (res.status === 409 && data.message === expectedMsg) {
      return { passed: true, details: `HTTP 409 Conflict | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // A7: Direct API Bypass Attempt on Checked-in Ticket -> 409 Conflict
  await testCase('A7', 'Direct API Cancellation on Checked-in Ticket Blocked (409 Conflict)', async () => {
    const res = await fetch(`${BASE_URL}/refunds/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({
        ticketId: 'test_tkt_checkedin',
        reason: 'Direct headless API cancellation request',
      }),
    });
    const data = await res.json();
    const expectedMsg = 'This ticket cannot be cancelled because it has already been used for event entry.';
    if (res.status === 409 && data.message === expectedMsg) {
      return { passed: true, details: `HTTP 409 Conflict | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // A8: Non-existent Ticket ID -> 404 Not Found
  await testCase('A8', 'Non-existent Ticket ID Returns 404 Not Found', async () => {
    const res = await fetch(`${BASE_URL}/refunds/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({
        ticketId: 'tkt_non_existent_9999',
        reason: 'Invalid ID',
      }),
    });
    const data = await res.json();
    if (res.status === 404 && data.message === 'Ticket not found.') {
      return { passed: true, details: `HTTP 404 Not Found | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // A9: Unauthorized cancellation of another attendee's ticket -> 403 Forbidden
  await testCase('A9', "Unauthorized Cancellation of Another Attendee's Ticket Blocked (403)", async () => {
    const res = await fetch(`${BASE_URL}/refunds/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherAttendeeToken}`,
      },
      body: JSON.stringify({
        ticketId: 'test_tkt_checkedin', // owned by Rohan, attempted by Rohan 2
        reason: 'Malicious attempt',
      }),
    });
    const data = await res.json();
    if (res.status === 403 && data.message.includes('only request refunds for your own tickets')) {
      return { passed: true, details: `HTTP 403 Forbidden | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // --- CLIENT TESTS ---
  console.log('\n--- SECTION 2: CLIENT EVENT CANCELLATION RULES ---');

  // C1: Eligible upcoming event owned by client -> 200 OK
  await testCase('C1', 'Client Can Cancel Eligible Upcoming Event (HTTP 200)', async () => {
    const res = await fetch(`${BASE_URL}/refunds/cancel-event/test_evt_client_upcoming`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        cancellationReason: 'Company restructuring and date rescheduling',
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.message && data.message.includes('successfully cancelled')) {
      return { passed: true, details: `HTTP 200 OK | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // C2: Ongoing event -> 409 Conflict
  await testCase('C2', 'Client Cannot Cancel Ongoing Event (HTTP 409 Conflict)', async () => {
    const res = await fetch(`${BASE_URL}/refunds/cancel-event/test_evt_client_ongoing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        cancellationReason: 'Attempt to cancel ongoing event',
      }),
    });
    const data = await res.json();
    const expectedMsg = 'This event cannot be cancelled because it has already started or has been completed.';
    if (res.status === 409 && data.message === expectedMsg) {
      return { passed: true, details: `HTTP 409 Conflict | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // C3: Completed event -> 409 Conflict
  await testCase('C3', 'Client Cannot Cancel Completed Event (HTTP 409 Conflict)', async () => {
    const res = await fetch(`${BASE_URL}/refunds/cancel-event/test_evt_client_completed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        cancellationReason: 'Attempt to cancel completed event',
      }),
    });
    const data = await res.json();
    const expectedMsg = 'This event cannot be cancelled because it has already started or has been completed.';
    if (res.status === 409 && data.message === expectedMsg) {
      return { passed: true, details: `HTTP 409 Conflict | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // C4: Past start time reached -> 409 Conflict
  await testCase('C4', 'Client Cannot Cancel Event Once Start Time Has Passed (HTTP 409)', async () => {
    const res = await fetch(`${BASE_URL}/refunds/cancel-event/test_evt_client_past_time`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        cancellationReason: 'Attempt to cancel event after start time',
      }),
    });
    const data = await res.json();
    const expectedMsg = 'This event cannot be cancelled because it has already started or has been completed.';
    if (res.status === 409 && data.message === expectedMsg) {
      return { passed: true, details: `HTTP 409 Conflict | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // C5: Preview for ongoing event -> isPermitted: false
  await testCase('C5', 'Cancellation Preview on Ongoing Event Reports Unavailable', async () => {
    const res = await fetch(`${BASE_URL}/refunds/cancellation-preview/test_evt_client_ongoing`, {
      headers: {
        Authorization: `Bearer ${clientToken}`,
      },
    });
    const data = await res.json();
    const expectedMsg = 'This event cannot be cancelled because it has already started or has been completed.';
    if (res.status === 200 && data.isPermitted === false && data.restrictionReason === expectedMsg) {
      return { passed: true, details: `HTTP 200 OK | isPermitted: false | "${data.restrictionReason}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, isPermitted: ${data.isPermitted}, restrictionReason: "${data.restrictionReason}"` };
  });

  // C6: Non-owner client attempts cancellation -> 403 Forbidden
  await testCase('C6', "Non-Owner Client Cannot Cancel Another Client's Event (HTTP 403)", async () => {
    const res = await fetch(`${BASE_URL}/refunds/cancel-event/test_evt_client_ongoing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherClientToken}`, // Manish Malhotra trying to cancel Arjun's event
      },
      body: JSON.stringify({
        cancellationReason: 'Malicious cancellation by competitor',
      }),
    });
    const data = await res.json();
    const expectedMsg = 'You do not have permission to initiate cancellation for this event.';
    if (res.status === 403 && data.message === expectedMsg) {
      return { passed: true, details: `HTTP 403 Forbidden | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // C7: Already cancelled event -> 409 Conflict
  await testCase('C7', 'Already Cancelled Event Rejected with 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/refunds/cancel-event/test_evt_client_cancelled`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        cancellationReason: 'Attempt to cancel an already cancelled event',
      }),
    });
    const data = await res.json();
    const expectedMsg = 'This event has already been cancelled.';
    if (res.status === 409 && data.message === expectedMsg) {
      return { passed: true, details: `HTTP 409 Conflict | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // C8: Non-existent Event ID -> 404 Not Found
  await testCase('C8', 'Non-existent Event ID Returns 404 Not Found', async () => {
    const res = await fetch(`${BASE_URL}/refunds/cancel-event/evt_non_existent_9999`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        cancellationReason: 'Invalid event ID test',
      }),
    });
    const data = await res.json();
    if (res.status === 404 && data.message.includes('not found')) {
      return { passed: true, details: `HTTP 404 Not Found | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // C9: Direct client refund request on ongoing event -> 409 Conflict
  await testCase('C9', 'Direct Client Refund Request on Ongoing Event Rejected (409 Conflict)', async () => {
    const res = await fetch(`${BASE_URL}/refunds/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        eventId: 'test_evt_client_ongoing',
        reason: 'Direct client refund attempt on live event',
      }),
    });
    const data = await res.json();
    const expectedMsg = 'This event cannot be cancelled because it has already started or has been completed.';
    if (res.status === 409 && data.message === expectedMsg) {
      return { passed: true, details: `HTTP 409 Conflict | "${data.message}"` };
    }
    return { passed: false, reason: `Status: ${res.status}, Message: "${data.message}"` };
  });

  // Summary
  console.log('\n================================================================');
  console.log('                      TEST SUMMARY RESULTS                      ');
  console.log('================================================================');
  const passedCount = results.filter((r) => r.status === 'PASSED').length;
  const failedCount = results.filter((r) => r.status !== 'PASSED').length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);

  results.forEach((r) => {
    const mark = r.status === 'PASSED' ? '✓' : '✗';
    console.log(` [${mark}] ${r.id}: ${r.description} -> ${r.status} (${r.details || r.reason})`);
  });

  if (failedCount > 0) {
    console.error(`\nTest suite FAILED with ${failedCount} failing case(s).`);
    process.exit(1);
  } else {
    console.log('\nAll business rules and edge cases PASSED successfully!');
    process.exit(0);
  }
}

runTests();

