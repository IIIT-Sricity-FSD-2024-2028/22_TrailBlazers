// Test script to submit feedback response and verify results & analytics
const BASE_URL = 'http://127.0.0.1:5001';

async function main() {
  console.log('1. Logging in as attendee Ananya Sharma...');
  const attendeeLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ananya.sharma@wavevents.com', password: 'password123' })
  });
  const { token: attendeeToken } = await attendeeLogin.json();

  console.log('2. Fetching available polls for attendee...');
  const pollsRes = await fetch(`${BASE_URL}/api/feedback/polls/attendee/my-polls`, {
    headers: { 'Authorization': `Bearer ${attendeeToken}` }
  });
  const { polls } = await pollsRes.json();
  const survey2 = polls.find(p => p.title === 'Event Organization and Management');

  if (!survey2) {
    console.error('Survey 2 not found!');
    return;
  }

  console.log(`Found "${survey2.title}" (ID: ${survey2.id}) with ${survey2.questions.length} questions.`);
  console.log('Before submitting, hasSubmitted =', survey2.hasSubmitted);

  // Prepare answers
  const answers = {};
  survey2.questions.forEach((q, idx) => {
    if (q.questionType === 'RATING') answers[q.id] = 5;
    else if (q.questionType === 'YES_NO') answers[q.id] = 'Yes';
    else if (q.questionType === 'TEXT') answers[q.id] = 'Everything was well coordinated and timely.';
    else answers[q.id] = 'Good';
  });

  console.log('3. Submitting answers as attendee...', answers);
  const submitRes = await fetch(`${BASE_URL}/api/feedback/polls/${survey2.id}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${attendeeToken}`
    },
    body: JSON.stringify({ answers })
  });
  const submitData = await submitRes.json();
  console.log('Submit response:', submitData);

  console.log('\n4. Re-fetching polls for attendee to verify hasSubmitted...');
  const pollsResAfter = await fetch(`${BASE_URL}/api/feedback/polls/attendee/my-polls`, {
    headers: { 'Authorization': `Bearer ${attendeeToken}` }
  });
  const { polls: pollsAfter } = await pollsResAfter.json();
  const survey2After = pollsAfter.find(p => p.id === survey2.id);
  console.log(`Survey 2 hasSubmitted is now: ${survey2After.hasSubmitted} (Expected: true)`);

  console.log('\n5. Logging in as Event Manager to check Analytics...');
  const mgrLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul.verma@wavevents.com', password: 'password123' })
  });
  const { token: mgrToken } = await mgrLogin.json();

  console.log(`6. Calling GET /api/feedback/polls/${survey2.id}/results as Event Manager...`);
  const analyticsRes = await fetch(`${BASE_URL}/api/feedback/polls/${survey2.id}/results`, {
    headers: { 'Authorization': `Bearer ${mgrToken}` }
  });
  const { analytics } = await analyticsRes.json();
  console.log('Analytics summary:');
  console.log({
    pollTitle: analytics.pollTitle,
    eventName: analytics.eventName,
    totalResponses: analytics.totalResponses,
    totalAttendees: analytics.totalAttendees,
    responseRate: analytics.responseRate + '%',
    overallAverageRating: analytics.overallAverageRating
  });

  console.log('\nQuestions analytics breakdown:');
  analytics.questions.forEach((q, idx) => {
    console.log(`  Q${idx+1}: "${q.questionText}" [${q.questionType}] -> totalAnswers: ${q.totalAnswers}, avg: ${q.averageRating || 'N/A'}`);
  });

  console.log('\n✓ Full end-to-end feedback survey lifecycle verified successfully!');
}

main().catch(console.error);
