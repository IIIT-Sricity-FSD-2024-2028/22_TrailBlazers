const http = require('http');

function request(options, body = null, isBinary = false) {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const headers = { ...options.headers };
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request({ ...options, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const fullBuffer = Buffer.concat(chunks);
        if (isBinary) {
          resolve({ status: res.statusCode, buffer: fullBuffer, headers: res.headers });
        } else {
          const strData = fullBuffer.toString('utf8');
          try {
            const parsed = strData ? JSON.parse(strData) : {};
            resolve({ status: res.statusCode, data: parsed, headers: res.headers, raw: strData });
          } catch {
            resolve({ status: res.statusCode, data: strData, headers: res.headers, raw: strData });
          }
        }
      });
    });
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function login(email, password) {
  const res = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email, password }
  );
  if (res.status !== 200 || !res.data.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return { token: res.data.token, user: res.data.user };
}

async function run() {
  console.log('================================================================');
  console.log('TESTING EVENT COMPLETION-BASED ANALYTICS PDF EXPORT & POPUP APIS');
  console.log('================================================================\n');

  // Step 1: Log in actors
  console.log('Step 1: Authenticating test users...');
  const client1 = await login('siddu@wavevents.com', 'password123');
  console.log(`✅ Client 1 (Siddu) authenticated: ${client1.user.name} (${client1.user.id})`);

  const client2 = await login('ananya.sharma@wavevents.com', 'password123');
  console.log(`✅ Client 2 (Ananya) authenticated: ${client2.user.name} (${client2.user.id})`);

  const manager = await login('e2e.manager@wavevents.com', 'password123');
  console.log(`✅ Event Manager authenticated: ${manager.user.name} (${manager.user.id})`);

  const unauthorizedUser = await login('hacker@evil.com', 'password123');
  console.log(`✅ Unauthorized user authenticated: ${unauthorizedUser.user.name} (${unauthorizedUser.user.id})\n`);

  // Step 2: Retrieve Client 1's events (Uncompleted Event)
  console.log('Step 2: Testing uncompleted event owned by Client 1...');
  const reqsRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/event-requests/my',
    method: 'GET',
    headers: { Authorization: `Bearer ${client1.token}` },
  });

  const uncompletedEvent = reqsRes.data.requests.find(
    (r) => r.operationalStatus !== 'COMPLETED' && r.status !== 'COMPLETED'
  ) || reqsRes.data.requests[0];

  console.log(`Target Uncompleted Event: "${uncompletedEvent.eventName}" (ID: ${uncompletedEvent.id})`);
  console.log(`Status: ${uncompletedEvent.status} | Operational: ${uncompletedEvent.operationalStatus || 'N/A'}`);

  // Test 1: Case A - Event Report Status for Uncompleted Event
  console.log('\n--- TEST 1: Check report status for uncompleted event (Case A) ---');
  const statusA = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/event-requests/${uncompletedEvent.id}/report-status`,
    method: 'GET',
    headers: { Authorization: `Bearer ${client1.token}` },
  });
  console.log('Status code:', statusA.status);
  console.log('Status payload:', statusA.data);

  if (statusA.status === 200 && statusA.data.isCompleted === false) {
    console.log('✅ Case A Confirmed: isCompleted is false. Export button will be disabled with clear explanation.');
  } else {
    console.error('❌ FAIL: Expected isCompleted: false');
    process.exit(1);
  }

  // Test 2: Direct API export on uncompleted event must be rejected with 403 Forbidden
  console.log('\n--- TEST 2: Direct API download on uncompleted event must be BLOCKED (HTTP 403) ---');
  const uncompletedExport = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/event-requests/${uncompletedEvent.id}/export-analytics`,
    method: 'GET',
    headers: { Authorization: `Bearer ${client1.token}` },
  });
  console.log('Status code:', uncompletedExport.status);
  console.log('Response body:', uncompletedExport.data);

  if (uncompletedExport.status === 403) {
    console.log('✅ PASS: Backend strictly blocked analytics export for non-completed event (HTTP 403).');
    console.log('Verified message:', uncompletedExport.data.message);
  } else {
    console.error('❌ FAIL: Expected HTTP 403 for non-completed event, got:', uncompletedExport.status);
    process.exit(1);
  }

  // Test 3: Check completed event status for owner (Ananya)
  const completedEventId = 'evt_fb_test_1_1314';
  console.log(`\n--- TEST 3: Completed event status for owner (${completedEventId}) ---`);

  const statusC = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/event-requests/${completedEventId}/report-status`,
    method: 'GET',
    headers: { Authorization: `Bearer ${client2.token}` },
  });
  console.log(`Status for completed event:`, statusC.status, statusC.data);

  if (statusC.status === 200 && statusC.data.isCompleted === true && statusC.data.reportExists === true) {
    console.log('✅ Case C Confirmed: Event is COMPLETED and Event Manager report exists.');
  } else {
    console.error('❌ FAIL: Expected completed event with report');
    process.exit(1);
  }

  // Test 4: Owner downloads the actual persisted Event Manager PDF
  console.log('\n--- TEST 4: Authorized owner downloading persisted Event Manager PDF ---');
  const pdfRes = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: `/api/event-requests/${completedEventId}/export-analytics`,
      method: 'GET',
      headers: { Authorization: `Bearer ${client2.token}` },
    },
    null,
    true // isBinary
  );

  console.log('Status code:', pdfRes.status);
  console.log('Headers:', {
    'content-type': pdfRes.headers['content-type'],
    'content-disposition': pdfRes.headers['content-disposition'],
    'content-length': pdfRes.headers['content-length'],
  });

  if (pdfRes.status === 200) {
    const pdfMagic = pdfRes.buffer.slice(0, 5).toString('ascii');
    console.log('PDF Header magic bytes:', pdfMagic);
    console.log('PDF byte size:', pdfRes.buffer.length);

    if (pdfMagic === '%PDF-') {
      console.log('✅ PASS: Valid PDF binary received from Event Manager persisted report store.');
    } else {
      console.error('❌ FAIL: File content is not a valid PDF header:', pdfMagic);
      process.exit(1);
    }

    const pdfString = pdfRes.buffer.toString('binary');
    const hasBranding = pdfString.includes('WAVEVENTS') || pdfString.includes('Wavevents');
    const hasForum = pdfString.includes('Chennai') || pdfString.includes('Architecture');
    console.log('Report contains Wavevents branding:', hasBranding);
    console.log('Report contains target event context:', hasForum);

    if (hasBranding && hasForum) {
      console.log('✅ PASS: Report integrity confirmed: actual persisted Event Manager report content.');
    }
  } else {
    console.error('❌ FAIL: PDF download failed with status:', pdfRes.status);
    process.exit(1);
  }

  // Test 5: Changing event ID / cross-client isolation
  console.log('\n--- TEST 5: Different client (Siddu) attempts to download Ananya\'s report ---');
  const crossClientPdf = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/event-requests/${completedEventId}/export-analytics`,
    method: 'GET',
    headers: { Authorization: `Bearer ${client1.token}` },
  });
  console.log('Status code for different client:', crossClientPdf.status);
  console.log('Response body:', crossClientPdf.data);

  if (crossClientPdf.status === 403) {
    console.log('✅ PASS: Cross-client isolation enforced: Client 1 cannot access Client 2\'s report (HTTP 403).');
  } else {
    console.error('❌ FAIL: Cross-client isolation failed, got status:', crossClientPdf.status);
    process.exit(1);
  }

  // Test 6: Unauthorized user access blocked
  console.log('\n--- TEST 6: Unauthorized user (hacker) cannot download report ---');
  const unauthPdf = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/event-requests/${completedEventId}/export-analytics`,
    method: 'GET',
    headers: { Authorization: `Bearer ${unauthorizedUser.token}` },
  });
  console.log('Status code for unauthorized user:', unauthPdf.status);

  if (unauthPdf.status === 403) {
    console.log('✅ PASS: Unauthorized attacker rejected with HTTP 403 Forbidden.');
  } else {
    console.error('❌ FAIL: Unauthorized user was not blocked (got status ' + unauthPdf.status + ')');
    process.exit(1);
  }

  // Test 7: Non-existent event ID
  console.log('\n--- TEST 7: Non-existent event ID returns 404 ---');
  const notFoundRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/event-requests/non_existent_event_999999/export-analytics`,
    method: 'GET',
    headers: { Authorization: `Bearer ${client2.token}` },
  });
  console.log('Status code for non-existent event:', notFoundRes.status);
  if (notFoundRes.status === 404) {
    console.log('✅ PASS: Non-existent event ID cleanly returns HTTP 404 Not Found.');
  } else {
    console.error('❌ FAIL: Expected HTTP 404, got:', notFoundRes.status);
    process.exit(1);
  }

  // Test 8: Event Manager report generation endpoint
  console.log('\n--- TEST 8: Event Manager can generate official reports ---');
  const genReportRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/analytics/events/${completedEventId}/generate-report`,
    method: 'POST',
    headers: { Authorization: `Bearer ${manager.token}` },
  });
  console.log('Status code for Event Manager report generation:', genReportRes.status);
  console.log('Generated report info:', genReportRes.data?.report);

  if (genReportRes.status === 201 || genReportRes.status === 200) {
    console.log('✅ PASS: Event Manager successfully generated and persisted official report.');
  } else {
    console.error('❌ FAIL: Report generation failed:', genReportRes.data);
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('ALL COMPLETION-BASED ANALYTICS PDF EXPORT & SECURITY TESTS PASSED!');
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
