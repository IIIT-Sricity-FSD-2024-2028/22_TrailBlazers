// Script to verify attendee retrieve surveys
const BASE_URL = 'http://127.0.0.1:5001';

async function testAttendee(email, password) {
  console.log(`\n=== Testing for attendee: ${email} ===`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { token, user } = await loginRes.json();
  if (!token) {
    console.error(`Login failed for ${email}`);
    return;
  }

  const res = await fetch(`${BASE_URL}/api/feedback/polls/attendee/my-polls`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(`Retrieved ${data.polls ? data.polls.length : 0} polls:`);
  (data.polls || []).forEach(p => {
    console.log(`- [${p.status}] "${p.title}" for event "${p.eventName}" (${p.eventId}) with ${p.questions.length} questions. hasSubmitted: ${p.hasSubmitted}`);
  });
}

async function main() {
  await testAttendee('ananya.sharma@wavevents.com', 'password123');
  await testAttendee('vipul@gmail.com', 'password123');
}

main().catch(console.error);
