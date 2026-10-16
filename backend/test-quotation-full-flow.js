const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log('WAVEVENTS QUOTATION PAYMENT SUITE - FULL LIFECYCLE');
  console.log('====================================================\n');

  // Step 1: Register and login Client 1
  console.log('1. Registering and authenticating Client 1...');
  const client1Email = `client_${Date.now()}@innovate.com`;
  const reg1 = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Siddharth V',
    email: client1Email,
    password: 'password123',
    organization: 'Innovate Labs'
  });

  const client1Token = reg1.data.token;
  const client1UserId = reg1.data.user.id;
  console.log(`✓ Client 1 created: ${client1UserId} (${client1Email})`);

  // Step 2: Register Client 2 (for authorization attack testing)
  console.log('\n2. Registering Client 2 (unauthorized actor)...');
  const client2Email = `unauth_${Date.now()}@other.com`;
  const reg2 = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Malicious Attacker',
    email: client2Email,
    password: 'password123',
    organization: 'Hacker Corp'
  });
  const client2Token = reg2.data.token;
  console.log(`✓ Client 2 created: ${reg2.data.user.id}`);

  // Step 3: Client 1 creates an event request
  console.log('\n3. Client 1 submits a new corporate event request...');
  const reqRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/event-requests',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${client1Token}`
    }
  }, {
    eventName: 'Global AI & Cloud Leadership Summit 2026',
    organizationName: 'Innovate Labs',
    contactEmail: client1Email,
    description: 'Premier executive technology conference',
    category: 'Technology',
    eventType: 'CLOSED',
    eventDate: '2026-11-15',
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    venue: 'Convention Centre',
    location: 'Hyderabad',
    expectedAttendance: 250,
    budget: 100000
  });

  if (reqRes.status !== 201 && reqRes.status !== 200) {
    console.error('Failed to create event request:', reqRes);
    process.exit(1);
  }

  const eventRequestId = reqRes.data.id || reqRes.data.request?.id;
  console.log(`✓ Event request created with ID: ${eventRequestId}`);

  // Step 4: Login as Revenue Team to create and send quotation
  console.log('\n4. Logging in as Revenue Team (e2e.revenue@wavevents.com)...');
  const revLogin = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'e2e.revenue@wavevents.com',
    password: 'password123'
  });
  const revToken = revLogin.data.token;
  console.log('✓ Revenue Team authenticated.');

  // Step 5: Revenue creates quotation
  console.log('\n5. Revenue Team prepares commercial quotation with milestone schedule...');
  const createQtnRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/revenue/quotations',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${revToken}`
    }
  }, {
    eventRequestId,
    lineItems: [
      { description: 'Venue Setup and Stage Engineering', quantity: 1, unitPrice: 65000 },
      { description: 'Catering and VIP Hospitality', quantity: 1, unitPrice: 35000 }
    ],
    discount: 0,
    taxPercent: 0,
    notes: 'Official commercial proposal with 35% advance, 45% milestone, 20% settlement schedule.',
    terms: '1. Standard 3-stage milestone payment schedule apply.\n2. 35% advance due on approval.'
  });

  if (createQtnRes.status !== 201 && createQtnRes.status !== 200) {
    console.error('Failed to create quotation:', createQtnRes);
    process.exit(1);
  }
  const quotationId = createQtnRes.data.quotationId;
  console.log(`✓ Quotation draft created: ${quotationId} (Total: ₹100,000)`);

  // Step 6: Revenue sends quotation to client
  console.log('\n6. Revenue Team sends quotation to client...');
  const sendRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/revenue/quotations/${quotationId}/send`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${revToken}`
    }
  });
  console.log(`✓ Quotation sent. Status: ${sendRes.data.status}`);

  // TEST 1: Unaccepted Quotation Payment Attempt Must Fail
  console.log('\n--- TEST 1: Payment on UNACCEPTED Quotation must be rejected ---');
  const unacceptedPayRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/client/quotations/${quotationId}/pay`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${client1Token}`
    }
  }, {
    paymentMethod: 'UPI',
    amount: 35000
  });

  console.log(`Status returned: ${unacceptedPayRes.status}`);
  if (unacceptedPayRes.status === 400) {
    console.log(`✓ PASS: Payment correctly rejected because quotation is not accepted: "${unacceptedPayRes.data.message || unacceptedPayRes.data.error}"`);
  } else {
    console.error('FAIL: Unaccepted quotation should have thrown 400. Got:', unacceptedPayRes);
    process.exit(1);
  }

  // Step 7: Client Accepts Quotation
  console.log('\n--- Step 7: Client reviews and ACCEPTS Quotation ---');
  const acceptRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/client/quotations/${quotationId}/accept`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${client1Token}`
    }
  }, {
    notes: 'Terms accepted by Client Siddharth.'
  });
  console.log(`Quotation Acceptance status: ${acceptRes.status}, Message: ${acceptRes.data.message}`);

  // TEST 2: Inspect initial payment summary & Next Installment
  console.log('\n--- TEST 2: Verify Initial Payment Summary (Stage 1 Advance Due) ---');
  const clientView1 = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/client/quotations/request/${eventRequestId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${client1Token}` }
  });
  const summary1 = clientView1.data.paymentSummary;
  console.log(`Payment Status: ${summary1.paymentStatus}`);
  console.log(`Total Amount: ₹${summary1.totalAmount}, Total Paid: ₹${summary1.totalPaid}, Remaining Balance: ₹${summary1.remainingBalance}`);
  console.log(`Next Installment: Stage ${summary1.nextInstallment?.stage} (${summary1.nextInstallment?.name}) - ₹${summary1.nextInstallment?.amount} (${summary1.nextInstallment?.percent}%)`);

  if (!['ADVANCE', 1, '1'].includes(summary1.nextInstallment?.stage) || summary1.nextInstallment?.amount !== 35000) {
    console.error('FAIL: Stage 1 Advance should be 35% (₹35,000)! Got:', summary1.nextInstallment);
    process.exit(1);
  }
  console.log('✓ PASS: Stage 1 Advance (35% = ₹35,000) correctly designated as next installment.');

  // TEST 3: Process Stage 1 Advance Payment (35%)
  console.log('\n--- TEST 3: Process Stage 1 Payment (35% = ₹35,000) ---');
  const payStage1 = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/client/quotations/${quotationId}/pay`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${client1Token}`
    }
  }, {
    paymentMethod: 'UPI',
    amount: 35000,
    notes: 'Stage 1 Advance'
  });

  console.log(`Status: ${payStage1.status}`);
  console.log(`Transaction ID: ${payStage1.data.payment?.transactionId}`);
  console.log(`Payment Type: ${payStage1.data.payment?.type}`);
  console.log(`Installment Stage: ${payStage1.data.payment?.installmentStage}`);
  console.log(`Summary Status: ${payStage1.data.summary?.paymentStatus}`);
  console.log(`Total Paid: ₹${payStage1.data.summary?.totalPaid}, Remaining Balance: ₹${payStage1.data.summary?.remainingBalance}`);

  if (payStage1.data.summary?.paymentStatus !== 'PARTIALLY_PAID' || payStage1.data.summary?.totalPaid !== 35000 || payStage1.data.summary?.remainingBalance !== 65000) {
    console.error('FAIL: Stage 1 payment summary mismatch:', payStage1.data);
    process.exit(1);
  }
  console.log('✓ PASS: Stage 1 Advance recorded: Status is PARTIALLY_PAID, Paid ₹35,000, Remaining ₹65,000.');

  // TEST 4: Next Installment is automatically Stage 2 Milestone (45%)
  console.log('\n--- TEST 4: Verify Next Installment is Stage 2 Milestone (45% = ₹45,000) ---');
  const clientView2 = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/client/quotations/request/${eventRequestId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${client1Token}` }
  });
  const summary2 = clientView2.data.paymentSummary;
  console.log(`Next Installment: Stage ${summary2.nextInstallment?.stage} (${summary2.nextInstallment?.name}) - ₹${summary2.nextInstallment?.amount} (${summary2.nextInstallment?.percent}%)`);
  if (!['MILESTONE', 2, '2'].includes(summary2.nextInstallment?.stage) || summary2.nextInstallment?.amount !== 45000) {
    console.error('FAIL: Stage 2 Milestone should be 45% (₹45,000)! Got:', summary2.nextInstallment);
    process.exit(1);
  }
  console.log('✓ PASS: Next installment correctly advanced to Stage 2 Milestone (45% = ₹45,000).');

  // TEST 5: Process Stage 2 Milestone Payment (45%)
  console.log('\n--- TEST 5: Process Stage 2 Payment (45% = ₹45,000) ---');
  const payStage2 = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/client/quotations/${quotationId}/pay`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${client1Token}`
    }
  }, {
    paymentMethod: 'CARD',
    amount: 45000
  });

  console.log(`Status: ${payStage2.status}`);
  console.log(`Transaction ID: ${payStage2.data.payment?.transactionId}`);
  console.log(`Total Paid to Date: ₹${payStage2.data.summary?.totalPaid}, Remaining Balance: ₹${payStage2.data.summary?.remainingBalance}`);

  if (payStage2.data.summary?.totalPaid !== 80000 || payStage2.data.summary?.remainingBalance !== 20000) {
    console.error('FAIL: Stage 2 totals mismatch:', payStage2.data);
    process.exit(1);
  }
  console.log('✓ PASS: Stage 2 Milestone recorded: Total Paid ₹80,000, Remaining ₹20,000.');

  // TEST 6: Next Installment is Stage 3 Settlement (20%)
  console.log('\n--- TEST 6: Verify Next Installment is Stage 3 Settlement (20% = ₹20,000) ---');
  const clientView3 = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/client/quotations/request/${eventRequestId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${client1Token}` }
  });
  const summary3 = clientView3.data.paymentSummary;
  console.log(`Next Installment: Stage ${summary3.nextInstallment?.stage} (${summary3.nextInstallment?.name}) - ₹${summary3.nextInstallment?.amount} (${summary3.nextInstallment?.percent}%)`);
  if (!['FINAL', 3, '3'].includes(summary3.nextInstallment?.stage) || summary3.nextInstallment?.amount !== 20000) {
    console.error('FAIL: Stage 3 Settlement should be 20% (₹20,000)! Got:', summary3.nextInstallment);
    process.exit(1);
  }
  console.log('✓ PASS: Next installment correctly advanced to Stage 3 Settlement (20% = ₹20,000).');

  // TEST 7: Process Stage 3 Final Settlement Payment (20%)
  console.log('\n--- TEST 7: Process Stage 3 Payment (20% = ₹20,000) ---');
  const payStage3 = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/client/quotations/${quotationId}/pay`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${client1Token}`
    }
  }, {
    paymentMethod: 'NET_BANKING',
    amount: 20000
  });

  console.log(`Status: ${payStage3.status}`);
  console.log(`Payment Status: ${payStage3.data.summary?.paymentStatus}`);
  console.log(`Total Paid: ₹${payStage3.data.summary?.totalPaid}, Remaining Balance: ₹${payStage3.data.summary?.remainingBalance}`);
  console.log(`Next Installment: ${JSON.stringify(payStage3.data.summary?.nextInstallment)}`);

  if (payStage3.data.summary?.paymentStatus !== 'PAID' || payStage3.data.summary?.remainingBalance !== 0) {
    console.error('FAIL: Quotation should be fully PAID with 0 balance! Got:', payStage3.data);
    process.exit(1);
  }
  console.log('✓ PASS: Quotation is FULLY PAID (100% Settled).');

  // TEST 8: Prevent Duplicate / Excess Payment on Fully Paid Quotation
  console.log('\n--- TEST 8: Prevent duplicate payment on fully paid quotation ---');
  const duplicatePay = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/client/quotations/${quotationId}/pay`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${client1Token}`
    }
  }, {
    paymentMethod: 'UPI',
    amount: 10000
  });

  console.log(`Status: ${duplicatePay.status}`);
  if (duplicatePay.status === 400) {
    console.log(`✓ PASS: Duplicate payment rejected: "${duplicatePay.data.message || duplicatePay.data.error}"`);
  } else {
    console.error('FAIL: Should have rejected duplicate payment! Got:', duplicatePay);
    process.exit(1);
  }

  // TEST 9: Security & Authorization - Another Client cannot pay Client 1's quotation
  console.log('\n--- TEST 9: Unauthorized Client cannot access or pay another client quotation ---');
  const unauthPay = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/client/quotations/${quotationId}/pay`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${client2Token}`
    }
  }, {
    paymentMethod: 'UPI',
    amount: 5000
  });

  console.log(`Unauthorized status: ${unauthPay.status}`);
  if (unauthPay.status === 403 || unauthPay.status === 400) {
    console.log(`✓ PASS: Unauthorized client correctly blocked by authorization guard.`);
  } else {
    console.error('FAIL: Unauthorized client should be blocked! Got:', unauthPay);
    process.exit(1);
  }

  // TEST 10: Attendee Ticket Isolation Verification
  console.log('\n--- TEST 10: Attendee Ticket Counts & Sales Revenue Isolation ---');
  const ticketRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/tickets/my',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${client1Token}` }
  });

  const clientTickets = Array.isArray(ticketRes.data) ? ticketRes.data : ticketRes.data.tickets || [];
  console.log(`Client tickets in tickets collection: ${clientTickets.length}`);
  if (clientTickets.length !== 0) {
    console.error('FAIL: Client quotation payment created attendee ticket records!', clientTickets);
    process.exit(1);
  }
  console.log('✓ PASS: Quotation payments did NOT create tickets or increase attendee ticket counts.');

  console.log('\n====================================================');
  console.log('ALL 10 VERIFICATION TESTS COMPLETED AND PASSED!');
  console.log('====================================================');
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
