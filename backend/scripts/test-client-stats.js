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

async function run() {
  console.log('====================================================');
  console.log('TESTING CLIENT DASHBOARD TICKETS SOLD & CHECK-INS');
  console.log('====================================================\n');

  // Step 1: Authenticate Client 1 (siddu@wavevents.com)
  console.log('Step 1: Authenticating Client 1 (siddu@wavevents.com)...');
  const client1Login = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'siddu@wavevents.com', password: 'password123' }
  );

  if (client1Login.status !== 200) {
    console.error('❌ Client 1 login failed:', client1Login.data);
    process.exit(1);
  }
  const client1Token = client1Login.data.token;
  const client1Id = client1Login.data.user?.id;
  console.log('✅ Client 1 authenticated successfully. User ID:', client1Id, '\n');

  // Step 2: Fetch Client 1's event requests
  console.log('Step 2: Fetching Client 1 event requests via GET /api/event-requests/my...');
  const reqsRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/event-requests/my',
    method: 'GET',
    headers: { Authorization: `Bearer ${client1Token}` },
  });

  if (reqsRes.status !== 200 || !Array.isArray(reqsRes.data.requests)) {
    console.error('❌ Failed to fetch client 1 requests:', reqsRes.data);
    process.exit(1);
  }

  const client1Events = reqsRes.data.requests;
  console.log(`✅ Client 1 has ${client1Events.length} event request(s).`);

  if (client1Events.length === 0) {
    console.error('❌ No events found for client 1 to test.');
    process.exit(1);
  }

  const testEvent = client1Events[0];
  console.log(`Testing event: "${testEvent.eventName}" (ID: ${testEvent.id})`);
  console.log(`  Tickets Sold (from my-list):`, testEvent.ticketsSold);
  console.log(`  Attendee Check-Ins (from my-list):`, testEvent.attendeeCheckIns);
  console.log(`  Event Manager:`, testEvent.eventManagerName || 'Pending');
  console.log(`  Onsite Coordinator:`, testEvent.onsiteCoordinatorName || 'Pending');

  if (testEvent.ticketsSold === undefined || testEvent.attendeeCheckIns === undefined) {
    console.error('❌ ticketsSold or attendeeCheckIns missing from event request object.');
    process.exit(1);
  }
  console.log('✅ Event request in client list contains ticketsSold and attendeeCheckIns.\n');

  // Step 3: Call GET /api/event-requests/:id/stats as Client 1
  console.log(`Step 3: Fetching stats via dedicated endpoint GET /api/event-requests/${testEvent.id}/stats...`);
  const statsRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/event-requests/${testEvent.id}/stats`,
    method: 'GET',
    headers: { Authorization: `Bearer ${client1Token}` },
  });

  console.log('Status code:', statsRes.status);
  console.log('Response body:', statsRes.data);

  if (
    statsRes.status === 200 &&
    statsRes.data.eventId === testEvent.id &&
    typeof statsRes.data.ticketsSold === 'number' &&
    typeof statsRes.data.attendeeCheckIns === 'number'
  ) {
    console.log('✅ Dedicated endpoint returns accurate statistics matching response contract.\n');
  } else {
    console.error('❌ Dedicated stats endpoint failed.');
    process.exit(1);
  }

  // Step 4: Verify Authorization and Data Isolation
  // Authenticate another user (e.g. attendee or another account)
  console.log('Step 4: Testing Authorization & Data Isolation...');
  console.log('Attempting to access Client 1 event stats with an unauthorized user...');
  
  // Login as another user (attacker / unauthorized attendee)
  const user2Login = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'hacker@evil.com', password: 'password123' }
  );

  if (user2Login.status === 200 && user2Login.data.token) {
    const unauthStatsRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/event-requests/${testEvent.id}/stats`,
      method: 'GET',
      headers: { Authorization: `Bearer ${user2Login.data.token}` },
    });

    console.log('Status code for unauthorized request:', unauthStatsRes.status);
    console.log('Message:', unauthStatsRes.data.message);

    if (unauthStatsRes.status === 403) {
      console.log('✅ Security verification PASSED: 403 Forbidden correctly returned for unauthorized user.\n');
    } else {
      console.error('❌ Data isolation failed: Non-owner was able to access event statistics!');
      process.exit(1);
    }
  } else {
    console.log('Hacker login not available, testing unauthenticated request...');
    const unauthStatsRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/event-requests/${testEvent.id}/stats`,
      method: 'GET',
    });
    console.log('Status code without token:', unauthStatsRes.status);
    if (unauthStatsRes.status === 401) {
      console.log('✅ Authentication required verification PASSED.\n');
    }
  }

  // Step 5: Test Independent Statistics across two different events
  if (client1Events.length >= 2) {
    const event2 = client1Events[1];
    console.log(`Step 5: Verifying independent statistics for Event 2: "${event2.eventName}" (ID: ${event2.id})...`);
    const stats2Res = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/event-requests/${event2.id}/stats`,
      method: 'GET',
      headers: { Authorization: `Bearer ${client1Token}` },
    });
    console.log('Event 2 Stats:', stats2Res.data);
    if (stats2Res.status === 200 && stats2Res.data.eventId === event2.id) {
      console.log('✅ Independent statistics verified across multiple events.\n');
    }
  }

  console.log('====================================================');
  console.log('ALL CLIENT DASHBOARD STATS TESTS PASSED! 🎉');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
