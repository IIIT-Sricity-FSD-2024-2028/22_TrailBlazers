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

async function runTests() {
  console.log('--- STARTING QUOTATION PAYMENT VERIFICATION TESTS ---');

  // 1. Sign in as client
  console.log('\n1. Logging in as client (ananya.sharma@wavevents.com)...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'ananya.sharma@wavevents.com',
    password: 'password123'
  });

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.error('Failed to log in as client:', loginRes);
    process.exit(1);
  }

  const token = loginRes.data.token || loginRes.data.access_token;
  console.log('✓ Client authenticated successfully');

  // 2. Fetch quotations for client's requests
  console.log('\n2. Fetching client event requests and quotation data...');
  const reqsRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/event-requests',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const clientRequests = Array.isArray(reqsRes.data) ? reqsRes.data : reqsRes.data.requests || [];
  console.log(`Found ${clientRequests.length} event requests for client.`);

  // Find a request with quotation
  let targetQuotation = null;
  let targetRequestId = null;

  for (const r of clientRequests) {
    const qRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/client/quotations/request/${r.id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (qRes.status === 200 && qRes.data?.quotation) {
      targetQuotation = qRes.data.quotation;
      targetRequestId = r.id;
      console.log(`Found quotation ${targetQuotation.id} for event "${r.eventName}" (Status: ${targetQuotation.status})`);
      break;
    }
  }

  if (!targetQuotation) {
    console.log('No existing quotation found for client requests. Querying revenue quotations to inspect or create...');
  } else {
    console.log('Target quotation status:', targetQuotation.status);
  }

  console.log('\n--- TESTS COMPLETED SCRIPT INITIALIZATION ---');
}

runTests().catch(console.error);
