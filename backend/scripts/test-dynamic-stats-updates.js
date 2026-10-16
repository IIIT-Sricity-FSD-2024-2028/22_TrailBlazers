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

async function testDynamicUpdates() {
  console.log('Testing dynamic ticket sales and check-in updates for Client Dashboard...');

  // 1. Login as Client
  const clientLogin = await request(
    { hostname: 'localhost', port: 5001, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'siddu@wavevents.com', password: 'password123' }
  );
  const clientToken = clientLogin.data.token;

  // 2. Fetch client's events
  const reqsRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/event-requests/my',
    method: 'GET',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  const event = reqsRes.data.requests[0];
  console.log(`Target Event: ${event.eventName} (ID: ${event.id})`);

  // Initial stats
  const initialStats = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/event-requests/${event.id}/stats`,
    method: 'GET',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  console.log('Initial stats:', initialStats.data);

  // 3. Purchase a ticket for this event as attendee (hacker@evil.com)
  const attendeeLogin = await request(
    { hostname: 'localhost', port: 5001, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'hacker@evil.com', password: 'password123' }
  );
  const attendeeToken = attendeeLogin.data.token;

  console.log('Booking 2 tickets for event as attendee...');
  const purchaseRes = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: '/api/tickets/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${attendeeToken}` },
    },
    {
      eventId: event.id,
      ticketType: 'Standard',
      quantity: 2,
      paymentMethod: 'UPI',
    }
  );
  console.log('Booking status:', purchaseRes.status);
  const bookedTicket = purchaseRes.data.ticket;

  // 4. Verify updated tickets sold for client
  const updatedStats1 = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/event-requests/${event.id}/stats`,
    method: 'GET',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  console.log('Stats after 2 tickets booked:', updatedStats1.data);

  if (updatedStats1.data.ticketsSold !== initialStats.data.ticketsSold + 2) {
    console.error('❌ Tickets sold count did not update dynamically!');
    process.exit(1);
  }
  console.log('✅ Tickets sold dynamically increased by 2!');

  // 5. Check in attendee using onsite coordinator endpoint
  if (bookedTicket) {
    console.log(`Checking in ticket ${bookedTicket.ticketNumber || bookedTicket.id}...`);

    // Assign coordinator using Department Head if not yet assigned
    console.log('Logging in as Event Management Department Head (devika.sharma@wavevents.com)...');
    const deptHeadLogin = await request(
      { hostname: 'localhost', port: 5001, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'devika.sharma@wavevents.com', password: 'password123' }
    );
    const deptToken = deptHeadLogin.data.token;

    console.log('Assigning coordinator usr_coord_karan to event...');
    const assignRes = await request(
      {
        hostname: 'localhost',
        port: 5001,
        path: `/api/hierarchy/events/${event.id}/assign`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${deptToken}` },
      },
      {
        onsiteCoordinatorUserId: 'usr_coord_karan',
      }
    );
    console.log('Assignment response:', assignRes.status, assignRes.data);

    // Login coordinator (karan.malhotra@wavevents.com)
    console.log('Logging in as Onsite Coordinator (karan.malhotra@wavevents.com)...');
    const coordLogin = await request(
      { hostname: 'localhost', port: 5001, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'karan.malhotra@wavevents.com', password: 'password123' }
    );
    const coordToken = coordLogin.data.token;

    console.log('Performing check-in...');
    const checkInRes = await request(
      {
        hostname: 'localhost',
        port: 5001,
        path: `/api/onsite-coordinator/events/${event.id}/check-in`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${coordToken}` },
      },
      {
        ticketNumber: bookedTicket.ticketNumber || bookedTicket.id,
      }
    );
    console.log('Check-in response:', checkInRes.status, checkInRes.data?.message || checkInRes.data);

    // 6. Check updated check-ins for client
    const updatedStats2 = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/event-requests/${event.id}/stats`,
      method: 'GET',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    console.log('Stats after check-in:', updatedStats2.data);
    if (updatedStats2.data.attendeeCheckIns > initialStats.data.attendeeCheckIns) {
      console.log('✅ Attendee check-ins dynamically increased from', initialStats.data.attendeeCheckIns, 'to', updatedStats2.data.attendeeCheckIns, '!');
    } else {
      console.error('❌ Check-in did not increase attendeeCheckIns count!');
      process.exit(1);
    }

    // 7. Test Duplicate Check-in Prevention
    console.log('\nTesting duplicate check-in prevention for same ticket...');
    const dupCheckInRes = await request(
      {
        hostname: 'localhost',
        port: 5001,
        path: `/api/onsite-coordinator/events/${event.id}/check-in`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${coordToken}` },
      },
      {
        ticketNumber: bookedTicket.ticketNumber || bookedTicket.id,
      }
    );
    console.log('Duplicate check-in response status:', dupCheckInRes.status, dupCheckInRes.data?.message || dupCheckInRes.data);
    
    // Check client stats again: must not increase!
    const statsAfterDup = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/event-requests/${event.id}/stats`,
      method: 'GET',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    console.log('Stats after duplicate check-in attempt:', statsAfterDup.data);
    if (statsAfterDup.data.attendeeCheckIns === updatedStats2.data.attendeeCheckIns) {
      console.log('✅ Duplicate check-in correctly rejected and did NOT inflate attendee count!');
    } else {
      console.error('❌ Duplicate check-in incorrectly inflated attendee count!');
      process.exit(1);
    }
  }

  console.log('\n🎉 ALL DYNAMIC STATS & CHECK-IN TESTS PASSED SUCCESSFULLY!');
}

testDynamicUpdates().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
