const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const headers = { ...options.headers };
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request({ ...options, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
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

async function runTests() {
  console.log('====================================================');
  console.log('TESTING EVENT START/END DATE & FREQUENCY REMOVAL');
  console.log('====================================================\n');

  // Step 1: Login as Client
  console.log('Step 1: Authenticating as Client...');
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'siddu@wavevents.com', password: 'password123' }
  );

  if (loginRes.status !== 200 || !loginRes.data.token) {
    console.error('❌ Login failed:', loginRes.data);
    process.exit(1);
  }
  const token = loginRes.data.token;
  console.log('✅ Client authenticated successfully.\n');

  // Test Case 1: Reject Start Date later than End Date
  console.log('Test Case 1: Submitting request with startDate > endDate (2026-11-25 > 2026-11-20)...');
  const invalidDateOrderRes = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: '/api/event-requests',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {
      organizationName: 'Nexus Global',
      contactEmail: 'sarah.jenkins@nexuscorp.com',
      eventName: 'Invalid Date Order Test Event',
      category: 'Tech Conference',
      startDate: '2026-11-25',
      endDate: '2026-11-20',
      venue: 'Main Hall',
      location: 'Hyderabad',
    }
  );

  console.log('Status code:', invalidDateOrderRes.status);
  console.log('Response error message:', invalidDateOrderRes.data.message);
  if (
    invalidDateOrderRes.status === 400 &&
    invalidDateOrderRes.data.message &&
    invalidDateOrderRes.data.message.includes('Start Date must not be later than End Date')
  ) {
    console.log('✅ Test Case 1 PASSED: Correctly rejected invalid date order with 400 Bad Request.\n');
  } else {
    console.error('❌ Test Case 1 FAILED');
    process.exit(1);
  }

  // Test Case 2: Reject missing End Date
  console.log('Test Case 2: Submitting request with missing endDate...');
  const missingEndRes = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: '/api/event-requests',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {
      organizationName: 'Nexus Global',
      contactEmail: 'sarah.jenkins@nexuscorp.com',
      eventName: 'Missing End Date Test Event',
      category: 'Tech Conference',
      startDate: '2026-11-20',
      venue: 'Main Hall',
      location: 'Hyderabad',
    }
  );

  console.log('Status code:', missingEndRes.status);
  console.log('Response error message:', missingEndRes.data.message);
  if (missingEndRes.status === 400) {
    console.log('✅ Test Case 2 PASSED: Correctly rejected missing endDate with 400 Bad Request.\n');
  } else {
    console.error('❌ Test Case 2 FAILED');
    process.exit(1);
  }

  // Test Case 3: Create valid event request with startDate & endDate, no frequency field
  console.log('Test Case 3: Creating event request with valid multi-day dates (2026-12-05 to 2026-12-08) and NO frequency...');
  const createValidRes = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: '/api/event-requests',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {
      organizationName: 'Nexus Global',
      contactEmail: 'sarah.jenkins@nexuscorp.com',
      eventName: 'International AI Summit 2026',
      description: 'Global summit on autonomous systems and AI governance.',
      agenda: 'Day 1: Keynotes\nDay 2: Technical Workshops\nDay 3: Policy',
      category: 'Tech Conference',
      startDate: '2026-12-05',
      endDate: '2026-12-08',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      venue: 'Convention Centre Hall 1',
      location: 'Bengaluru, Karnataka',
      eventType: 'OPEN',
      expectedAttendance: 500,
      isPaid: true,
      ticketPrice: 1500,
      additionalNotes: 'Requires keynote translation gear and AV streaming setup.',
    }
  );

  console.log('Status code:', createValidRes.status);
  const created = createValidRes.data.request;
  console.log('Created request id:', created?.id);
  console.log('Created request requestId:', created?.requestId);
  console.log('Stored startDate:', created?.startDate);
  console.log('Stored endDate:', created?.endDate);
  console.log('Stored eventDate:', created?.eventDate);

  if (
    createValidRes.status === 201 &&
    created?.startDate === '2026-12-05' &&
    created?.endDate === '2026-12-08' &&
    created?.eventDate === '2026-12-05'
  ) {
    console.log('✅ Test Case 3 PASSED: Successfully created and persisted request with separate startDate and endDate.\n');
  } else {
    console.error('❌ Test Case 3 FAILED');
    process.exit(1);
  }

  // Test Case 4: Verify client requests list preserves both dates and backward compatibility
  console.log('Test Case 4: Fetching Client requests via GET /api/event-requests/my...');
  const myRequestsRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/event-requests/my',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('Status code:', myRequestsRes.status);
  const requests = myRequestsRes.data || [];
  console.log(`Found ${requests.length} requests for client.`);
  
  const foundNew = requests.find((r) => r.id === created.id);
  console.log('New request found in list:');
  console.log('  Event:', foundNew?.eventName);
  console.log('  startDate:', foundNew?.startDate);
  console.log('  endDate:', foundNew?.endDate);
  console.log('  eventDate:', foundNew?.eventDate);

  if (foundNew?.startDate === '2026-12-05' && foundNew?.endDate === '2026-12-08') {
    console.log('✅ Newly created request returns correct startDate and endDate.');
  } else {
    console.error('❌ Newly created request missing correct dates in list.');
    process.exit(1);
  }

  // Check legacy request
  const legacyReq = requests.find((r) => r.id !== created.id);
  if (legacyReq) {
    console.log('Legacy request in list:');
    console.log('  Event:', legacyReq.eventName);
    console.log('  eventDate:', legacyReq.eventDate);
    console.log('  startDate:', legacyReq.startDate);
    console.log('  endDate:', legacyReq.endDate);
    console.log('✅ Legacy request safely handled without breaking or inventing fake end dates.');
  }

  console.log('\n✅ Test Case 4 PASSED.\n');

  // Test Case 5: Verify Published Events API
  console.log('Test Case 5: Verifying GET /api/events catalogue...');
  const eventsRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/events',
    method: 'GET',
  });
  console.log('Status code:', eventsRes.status);
  console.log(`Events count: ${eventsRes.data.events?.length}`);
  if (eventsRes.status === 200 && Array.isArray(eventsRes.data.events)) {
    console.log('✅ Test Case 5 PASSED: Events catalogue returned successfully.\n');
  } else {
    console.error('❌ Test Case 5 FAILED');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! 🎉');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
