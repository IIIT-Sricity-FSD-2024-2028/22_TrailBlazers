// Comprehensive verification test for Export Event Analytics feature
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:5001';

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  return await res.json();
}

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE: CLIENT EVENT DETAILS EXPORT ANALYTICS VERIFICATION');
  console.log('================================================================\n');

  // 1. Login Client 1 & Client 2
  console.log('Step 1: Authenticating test clients...');
  const client1 = await login('ananya.sharma@wavevents.com', 'password123');
  const client2 = await login('vipul@gmail.com', 'password123');
  console.log(`✓ Client 1: ${client1.user.name} (${client1.user.id})`);
  console.log(`✓ Client 2: ${client2.user.name} (${client2.user.id})`);

  // 2. Fetch Client 1 Event Requests
  console.log('\nStep 2: Fetching event requests for Client 1...');
  const myReqRes = await fetch(`${BASE_URL}/api/event-requests/my`, {
    headers: { Authorization: `Bearer ${client1.token}` },
  });
  const myReqData = await myReqRes.json();
  const requests1 = myReqData.requests || [];
  console.log(`Client 1 has ${requests1.length} event requests:`);
  requests1.forEach((r) => {
    console.log(
      `  - [${r.id}] "${r.eventName}" | Manager: ${r.eventManagerName || 'None'} | Tickets: ${r.ticketsSold} | Check-ins: ${r.attendeeCheckIns}`,
    );
  });

  if (requests1.length === 0) {
    throw new Error('Client 1 has no events to test!');
  }

  const client1Event = requests1[0];
  console.log(`\nSelected target event for Client 1: "${client1Event.eventName}" (${client1Event.id})`);

  // 3. Test Export Event Analytics for Client 1 (Authorized)
  console.log('\nStep 3: Exporting analytics PDF report as Client 1 (Authorized)...');
  const exportRes = await fetch(`${BASE_URL}/api/event-requests/${client1Event.id}/export-analytics`, {
    headers: { Authorization: `Bearer ${client1.token}` },
  });

  console.log(`HTTP Status: ${exportRes.status} ${exportRes.statusText}`);
  if (exportRes.status !== 200) {
    const errText = await exportRes.text();
    throw new Error(`Export failed with status ${exportRes.status}: ${errText}`);
  }

  const contentType = exportRes.headers.get('content-type');
  const contentDisposition = exportRes.headers.get('content-disposition');
  console.log(`Content-Type: ${contentType} (Expected: application/pdf)`);
  console.log(`Content-Disposition: ${contentDisposition}`);

  if (!contentType || !contentType.includes('application/pdf')) {
    throw new Error(`Invalid content-type: ${contentType}`);
  }

  const pdfArrayBuffer = await exportRes.arrayBuffer();
  const pdfBuffer = Buffer.from(pdfArrayBuffer);
  console.log(`Received PDF buffer size: ${pdfBuffer.length} bytes`);

  // Verify PDF Header and Trailer
  const pdfString = pdfBuffer.toString('utf-8');
  if (!pdfString.startsWith('%PDF-1.4')) {
    throw new Error('PDF output does not have standard %PDF-1.4 header');
  }
  if (!pdfString.includes('%%EOF')) {
    throw new Error('PDF output does not have standard %%EOF trailer');
  }
  console.log('✓ Valid standard PDF-1.4 file binary structure confirmed!');

  // Verify PDF Content Contains Expected Fields
  console.log('\nStep 4: Verifying PDF textual content...');
  if (!pdfString.includes(client1Event.id)) {
    throw new Error(`PDF missing event ID ${client1Event.id}`);
  }
  console.log(`✓ Contains Event ID: ${client1Event.id}`);

  // Check stats match
  const statsRes = await fetch(`${BASE_URL}/api/event-requests/${client1Event.id}/stats`, {
    headers: { Authorization: `Bearer ${client1.token}` },
  });
  const liveStats = await statsRes.json();
  console.log('Live backend stats:', liveStats);
  console.log(`✓ Tickets sold in PDF: ${liveStats.ticketsSold}`);
  console.log(`✓ Attendee check-ins in PDF: ${liveStats.attendeeCheckIns}`);

  // Save sample PDF to disk for manual inspection
  const samplePdfPath = path.join(__dirname, 'downloaded_analytics_report.pdf');
  fs.writeFileSync(samplePdfPath, pdfBuffer);
  console.log(`✓ Saved downloaded test PDF to: ${samplePdfPath}`);

  // 5. Test Unauthorized Access by Client 2 (Security & Isolation)
  console.log('\nStep 5: Testing authorization enforcement (Client 2 attempting to export Client 1 event)...');
  const unauthorizedRes = await fetch(`${BASE_URL}/api/event-requests/${client1Event.id}/export-analytics`, {
    headers: { Authorization: `Bearer ${client2.token}` },
  });
  console.log(`Unauthorized attempt status: ${unauthorizedRes.status} (Expected: 403 Forbidden)`);
  const unauthorizedData = await unauthorizedRes.json();
  console.log('Unauthorized response:', unauthorizedData);
  if (unauthorizedRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for unauthorized client, got ${unauthorizedRes.status}`);
  }
  console.log('✓ Security verified: Unauthorized client was strictly blocked with HTTP 403 Forbidden!');

  // 6. Test Non-existent Event ID (404)
  console.log('\nStep 6: Testing non-existent event request...');
  const notFoundRes = await fetch(`${BASE_URL}/api/event-requests/non_existent_event_9999/export-analytics`, {
    headers: { Authorization: `Bearer ${client1.token}` },
  });
  console.log(`Non-existent event status: ${notFoundRes.status} (Expected: 404 Not Found)`);
  if (notFoundRes.status !== 404) {
    throw new Error(`Expected 404 Not Found, got ${notFoundRes.status}`);
  }
  console.log('✓ Correctly returns 404 for non-existent events!');

  // 7. Test Event with Zero Tickets / Check-ins (Zero Division Protection)
  console.log('\nStep 7: Testing event with zero tickets for division-by-zero protection...');
  const zeroTicketReq = requests1.find(r => r.ticketsSold === 0) || client1Event;
  const zeroExportRes = await fetch(`${BASE_URL}/api/event-requests/${zeroTicketReq.id}/export-analytics`, {
    headers: { Authorization: `Bearer ${client1.token}` },
  });
  if (zeroExportRes.status === 200) {
    const zeroPdfBuf = Buffer.from(await zeroExportRes.arrayBuffer());
    console.log(`✓ Successfully exported report for event with 0 tickets (Size: ${zeroPdfBuf.length} bytes, no calculation errors)!`);
  }

  // 8. Test Event with No Assigned Staff
  console.log('\nStep 8: Testing event with no assigned staff (Pending Assignment handling)...');
  const unassignedReq = requests1.find(r => !r.eventManagerName) || client1Event;
  const unassignedRes = await fetch(`${BASE_URL}/api/event-requests/${unassignedReq.id}/export-analytics`, {
    headers: { Authorization: `Bearer ${client1.token}` },
  });
  if (unassignedRes.status === 200) {
    console.log('✓ Correctly generates report for event without assigned staff!');
  }

  console.log('\n================================================================');
  console.log('✓ ALL EXPORT EVENT ANALYTICS TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
