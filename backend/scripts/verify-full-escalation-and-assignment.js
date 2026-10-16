const http = require('http');

function postJson(urlPath, payload, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload || {});
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5001,
        path: urlPath,
        method: 'POST',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(urlPath, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5001,
        path: urlPath,
        method: 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== STARTING COMPLETE WORKFLOW VERIFICATION ===\n');

  // 1. Authenticate test actors
  console.log('1. Authenticating test actors...');
  const clientLogin = await postJson('/api/auth/login', { email: 'siddu@wavevents.com', password: 'password123' });
  const clientToken = clientLogin.data.token;
  console.log(`   Client token: ${Boolean(clientToken)}`);

  const revLogin = await postJson('/api/auth/login', { email: 'priya.nair@wavevents.com', password: 'password123' });
  const revToken = revLogin.data.token;
  console.log(`   Revenue token: ${Boolean(revToken)}`);

  const deptLogin = await postJson('/api/auth/login', { email: 'devika.sharma@wavevents.com', password: 'password123' });
  const deptToken = deptLogin.data.token;
  console.log(`   Dept Head token: ${Boolean(deptToken)}`);

  const mgrLogin = await postJson('/api/auth/login', { email: 'rahul.verma@wavevents.com', password: 'password123' });
  const mgrToken = mgrLogin.data.token;
  console.log(`   Event Manager token: ${Boolean(mgrToken)}`);

  const coordLogin = await postJson('/api/auth/login', { email: 'karan.malhotra@wavevents.com', password: 'password123' });
  const coordToken = coordLogin.data.token;
  console.log(`   Onsite Coordinator token: ${Boolean(coordToken)}\n`);

  if (!clientToken || !revToken || !deptToken || !mgrToken || !coordToken) {
    throw new Error('Authentication failed for one or more actors!');
  }

  // 2. Client submits an Event Request
  console.log('2. Client submitting event proposal request...');
  const reqRes = await postJson('/api/event-requests', {
    eventName: 'End-to-End Workflow Summit 2026',
    organizationName: 'Global Horizon Tech',
    contactEmail: 'contact@globalhorizon.com',
    location: 'Chennai, TN',
    category: 'Technology',
    eventDate: '2026-11-20',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    venue: 'Anna University Convention Centre',
    expectedAttendance: 250,
    ticketPrice: 650,
    description: 'Comprehensive test proposal for event handoff workflow'
  }, clientToken);
  console.log(`   Create Request Status: ${reqRes.status}`);
  if (reqRes.status !== 201) {
    console.error('Create Request Error:', reqRes.data);
    throw new Error('Failed to create event request');
  }
  const eventReq = reqRes.data.request || reqRes.data;
  const eventRequestId = eventReq.id;
  console.log(`   Created Event Request ID: ${eventRequestId}`);

  // 3. Revenue Team creates and sends commercial quotation
  console.log('3. Revenue Team creates and sends commercial quotation...');
  const quoteRes = await postJson('/api/revenue/quotations', {
    eventRequestId,
    lineItems: [
      { description: 'Main Auditorium & Stage Logistics', quantity: 1, unitPrice: 75000 },
      { description: 'Audio-Visual & Streaming Infrastructure', quantity: 1, unitPrice: 25000 }
    ],
    terms: '50% advance, 50% on completion'
  }, revToken);
  console.log(`   Create Quotation Status: ${quoteRes.status}`);
  if (quoteRes.status !== 201) {
    console.error('Create Quotation Error:', quoteRes.data);
    throw new Error('Failed to create quotation');
  }
  const quotationId = quoteRes.data.quotationId;
  console.log(`   Created Quotation ID: ${quotationId}`);

  const sendRes = await postJson(`/api/revenue/quotations/${quotationId}/send`, {}, revToken);
  console.log(`   Send Quotation Status: ${sendRes.status}`);
  if (sendRes.status !== 200) {
    console.error('Send Quotation Error:', sendRes.data);
    throw new Error('Failed to send quotation');
  }

  // 4. Client accepts commercial quotation
  console.log('4. Client accepts commercial quotation...');
  const acceptRes = await postJson(`/api/client/quotations/${quotationId}/accept`, {}, clientToken);
  console.log(`   Accept Quotation Status: ${acceptRes.status}, Message:`, acceptRes.data.message);
  if (acceptRes.status !== 200) throw new Error('Client quotation acceptance failed!');

  // 5. Test Unauthorized Escalation (Client/Attendee cannot escalate)
  console.log('5. Testing Security: Client/Attendee cannot escalate event...');
  const unauthEsc = await postJson(`/api/revenue/event-requests/${eventRequestId}/escalate`, {}, clientToken);
  console.log(`   Status: ${unauthEsc.status} (Expected: 403 Forbidden)`);
  if (unauthEsc.status !== 403) throw new Error('Security check failed: Client was able to escalate!');

  // 6. Revenue Team escalates event to Event Management
  console.log('6. Revenue Team escalates event to Event Management...');
  const escRes = await postJson(`/api/revenue/event-requests/${eventRequestId}/escalate`, {}, revToken);
  console.log(`   Escalate Status: ${escRes.status}, Success: ${escRes.data.success}`);
  if (escRes.status !== 200 || !escRes.data.success) throw new Error('Revenue escalation failed!');

  // 7. Prevent duplicate escalation
  console.log('7. Testing Duplicate Escalation Rejection...');
  const dupEsc = await postJson(`/api/revenue/event-requests/${eventRequestId}/escalate`, {}, revToken);
  console.log(`   Status: ${dupEsc.status} (Expected: 400 Bad Request), Error:`, dupEsc.data.message || dupEsc.data.error);
  if (dupEsc.status !== 400) throw new Error('Duplicate escalation was not rejected with 400!');

  // 8. Verify Event Management Department Head receives notification
  console.log('8. Verifying notification to Event Management Department Head...');
  const notifRes = await getJson('/api/notifications', deptToken);
  const notifs = notifRes.data.notifications || [];
  const foundNotif = notifs.find(n => n.entityId === eventRequestId || (n.message && n.message.includes('End-to-End Workflow Summit 2026')));
  console.log(`   Notification found: ${Boolean(foundNotif)} -> "${foundNotif ? foundNotif.title : 'None'}"`);
  if (!foundNotif) throw new Error('Department Head did not receive escalation notification!');

  // 9. Verify event appears in Department Head's awaiting-assignment queue
  console.log("9. Verifying event in Department Head's awaiting-assignment queue...");
  const queueRes = await getJson('/api/hierarchy/events/awaiting-assignment', deptToken);
  const queueEvents = queueRes.data.events || [];
  const inQueue = queueEvents.find(e => e.id === eventRequestId);
  console.log(`   Found in awaiting queue: ${Boolean(inQueue)} (${inQueue ? inQueue.eventName : 'Not found'})`);
  if (!inQueue) throw new Error('Event not in awaiting assignment queue!');

  // 10. Role separation: Revenue Team cannot assign operational staff
  console.log('10. Testing Role Separation: Revenue Team cannot assign staff...');
  const revAssign = await postJson(`/api/hierarchy/events/${eventRequestId}/assign`, {
    eventManagerUserId: 'usr_mgr_rahul',
    onsiteCoordinatorUserId: 'usr_coord_karan'
  }, revToken);
  console.log(`    Status: ${revAssign.status} (Expected: 403 Forbidden)`);
  if (revAssign.status !== 403) throw new Error('Role separation failed: Revenue Team assigned staff!');

  // 11. Department Head checks staff availability
  console.log('11. Department Head checking staff availability...');
  const availRes = await getJson(`/api/hierarchy/staff/availability?eventDate=${inQueue.eventDate}&startTime=${encodeURIComponent(inQueue.startTime)}&endTime=${encodeURIComponent(inQueue.endTime)}`, deptToken);
  const staff = availRes.data.staff || [];
  const availManagers = staff.filter(s => s.role === 'EVENT_MANAGER');
  const availCoords = staff.filter(s => s.role === 'ONSITE_COORDINATOR');
  console.log(`    Managers found: ${availManagers.length}, Coordinators found: ${availCoords.length}`);
  const chosenManager = availManagers.find(m => m.isAvailable) || availManagers[0];
  const chosenCoord = availCoords.find(c => c.isAvailable) || availCoords[0];
  console.log(`    Chosen Manager: ${chosenManager.name} (${chosenManager.id}, ${chosenManager.email})`);
  console.log(`    Chosen Coordinator: ${chosenCoord.name} (${chosenCoord.id}, ${chosenCoord.email})`);

  // 12. Department Head assigns BOTH Event Manager and Onsite Coordinator
  console.log('12. Department Head assigns Event Manager and Onsite Coordinator...');
  const assignRes = await postJson(`/api/hierarchy/events/${eventRequestId}/assign`, {
    eventManagerUserId: chosenManager.id,
    onsiteCoordinatorUserId: chosenCoord.id
  }, deptToken);
  console.log(`    Assign Status: ${assignRes.status}, Message:`, assignRes.data.message);
  if (assignRes.status !== 200 || !assignRes.data.success) throw new Error('Staff assignment failed!');

  // 13. Verify queue transition (removed from awaiting, present in assigned)
  console.log('13. Verifying queue transition...');
  const queueAfter = await getJson('/api/hierarchy/events/awaiting-assignment', deptToken);
  const stillInQueue = (queueAfter.data.events || []).find(e => e.id === eventRequestId);
  console.log(`    Still in awaiting queue: ${Boolean(stillInQueue)} (Expected: false)`);
  if (stillInQueue) throw new Error('Event should no longer be in awaiting queue!');

  const assignedRes = await getJson('/api/hierarchy/events/assigned', deptToken);
  const assignedList = assignedRes.data.events || [];
  const assignedEvent = assignedList.find(e => e.id === eventRequestId);
  console.log(`    Present in assigned events: ${Boolean(assignedEvent)} (Expected: true)`);
  if (!assignedEvent) throw new Error('Event not found in assigned list!');
  console.log(`    Manager ID: ${assignedEvent.eventManagerUserId}`);
  console.log(`    Coordinator ID: ${assignedEvent.onsiteCoordinatorUserId}`);

  // 14. Verify assigned staff can see event in their respective dashboards
  console.log('14. Verifying assigned staff visibility...');
  const assignedMgrLogin = await postJson('/api/auth/login', { email: chosenManager.email, password: 'password123' });
  const mgrEvents = await getJson('/api/event-manager/events', assignedMgrLogin.data.token);
  const mgrList = mgrEvents.data.events || [];
  const inMgrDashboard = mgrList.find(e => e.id === eventRequestId);
  console.log(`    Visible in Event Manager (${chosenManager.name}) dashboard: ${Boolean(inMgrDashboard)}`);
  if (!inMgrDashboard) throw new Error('Event Manager cannot see assigned event!');

  const assignedCoordLogin = await postJson('/api/auth/login', { email: chosenCoord.email, password: 'password123' });
  const coordEvents = await getJson('/api/onsite-coordinator/events', assignedCoordLogin.data.token);
  const coordList = coordEvents.data.events || [];
  const inCoordDashboard = coordList.find(e => e.id === eventRequestId);
  console.log(`    Visible in Onsite Coordinator (${chosenCoord.name}) dashboard: ${Boolean(inCoordDashboard)}`);
  if (!inCoordDashboard) throw new Error('Onsite Coordinator cannot see assigned event!');

  console.log('\n=============================================================');
  console.log('🎉 ALL 14 E2E LIFECYCLE & SECURITY WORKFLOW CHECKS PASSED! 🎉');
  console.log('=============================================================');
}

run().catch((err) => {
  console.error('\n❌ WORKFLOW VERIFICATION FAILED:', err);
  process.exit(1);
});
