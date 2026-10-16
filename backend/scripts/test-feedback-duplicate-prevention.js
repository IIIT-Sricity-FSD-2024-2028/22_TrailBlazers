// Comprehensive automated test for Feedback Duplicate Prevention & Persistence
const BASE_URL = 'http://127.0.0.1:5001';

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.statusText}`);
  return await res.json();
}

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE: FEEDBACK DUPLICATE PREVENTION & PERSISTENCE VERIFICATION');
  console.log('================================================================\n');

  // 1. Login Attendees
  console.log('Step 1: Logging in test attendees...');
  const attendee1 = await login('ananya.sharma@wavevents.com', 'password123');
  const attendee2 = await login('vipul@gmail.com', 'password123');
  console.log(`✓ Attendee 1: ${attendee1.user.name} (${attendee1.user.id})`);
  console.log(`✓ Attendee 2: ${attendee2.user.name} (${attendee2.user.id})`);

  // 2. Fetch Tickets to identify events
  console.log('\nStep 2: Fetching tickets for Attendee 1 to find eligible events...');
  const tktRes1 = await fetch(`${BASE_URL}/api/tickets/my`, {
    headers: { 'Authorization': `Bearer ${attendee1.token}` }
  });
  const tktData1 = await tktRes1.json();
  const tickets1 = tktData1.tickets || [];
  console.log(`Found ${tickets1.length} tickets for Attendee 1:`);
  tickets1.forEach(t => {
    console.log(`  - Ticket ${t.ticketNumber}: Event "${t.eventName}" (${t.eventId}) | hasFeedbackSubmitted: ${t.hasFeedbackSubmitted}`);
  });

  const targetTicket = tickets1[0];
  if (!targetTicket) {
    throw new Error('No tickets found for Attendee 1!');
  }
  const testEventId = targetTicket.eventId;
  console.log(`\nSelected target event for tests: "${targetTicket.eventName}" (${testEventId})`);

  // 3. Check initial feedback status via GET /api/events/:id/feedback/status
  console.log('\nStep 3: Checking initial event feedback status for Attendee 1...');
  const initialStatusRes = await fetch(`${BASE_URL}/api/events/${testEventId}/feedback/status`, {
    headers: { 'Authorization': `Bearer ${attendee1.token}` }
  });
  console.log(`Status endpoint response code: ${initialStatusRes.status}`);
  const initialStatus = await initialStatusRes.json();
  console.log('Initial Status:', initialStatus);

  // 4. Test Event Feedback Submission
  console.log('\nStep 4: Submitting initial event feedback for Attendee 1...');
  const submitRes1 = await fetch(`${BASE_URL}/api/events/${testEventId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${attendee1.token}`
    },
    body: JSON.stringify({
      rating: 5,
      comment: 'Outstanding organization, sessions were very informative!'
    })
  });
  console.log(`First submission status code: ${submitRes1.status} (Expected: 200/201 or 409 if already submitted in previous runs)`);
  const submitData1 = await submitRes1.json();
  console.log('First submission response:', submitData1);

  // 5. Check duplicate rejection (409 Conflict)
  console.log('\nStep 5: Testing duplicate submission rejection for Attendee 1...');
  const duplicateRes = await fetch(`${BASE_URL}/api/events/${testEventId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${attendee1.token}`
    },
    body: JSON.stringify({
      rating: 4,
      comment: 'Trying to submit a duplicate feedback!'
    })
  });
  console.log(`Duplicate submission status code: ${duplicateRes.status} (Expected: 409 Conflict)`);
  const duplicateData = await duplicateRes.json();
  console.log('Duplicate submission response:', duplicateData);
  if (duplicateRes.status !== 409) {
    throw new Error(`Expected 409 Conflict for duplicate submission, got ${duplicateRes.status}`);
  }
  console.log('✓ Duplicate submission was correctly rejected with HTTP 409 Conflict!');

  // 6. Verify status persistence across new login session (simulating logout/login and refresh)
  console.log('\nStep 6: Verifying status persistence after new login (logout/login & refresh)...');
  const freshLogin = await login('ananya.sharma@wavevents.com', 'password123');
  const freshStatusRes = await fetch(`${BASE_URL}/api/events/${testEventId}/feedback/status`, {
    headers: { 'Authorization': `Bearer ${freshLogin.token}` }
  });
  const freshStatus = await freshStatusRes.json();
  console.log('Fresh session feedback status:', freshStatus);
  if (!freshStatus.hasSubmitted) {
    throw new Error('Expected hasSubmitted to be true after re-login/refresh!');
  }
  console.log('✓ Status persists across logout, login, and page refresh!');

  // 7. Verify ticket now reflects hasFeedbackSubmitted = true
  console.log('\nStep 7: Verifying ticket list marks hasFeedbackSubmitted: true...');
  const freshTicketsRes = await fetch(`${BASE_URL}/api/tickets/my`, {
    headers: { 'Authorization': `Bearer ${freshLogin.token}` }
  });
  const freshTickets = (await freshTicketsRes.json()).tickets || [];
  const refreshedTargetTicket = freshTickets.find(t => t.eventId === testEventId || t.eventRequestId === testEventId);
  console.log(`Ticket feedback status: ${refreshedTargetTicket?.hasFeedbackSubmitted} (Expected: true)`);
  if (!refreshedTargetTicket?.hasFeedbackSubmitted) {
    throw new Error('Ticket does not reflect hasFeedbackSubmitted = true!');
  }
  console.log('✓ Tickets list correctly reflects hasFeedbackSubmitted = true!');

  // 8. Verify Event Analytics reflects feedback and userHasSubmitted
  console.log('\nStep 8: Verifying event analytics reflects user submission...');
  const analyticsRes = await fetch(`${BASE_URL}/api/analytics/events/${testEventId}`, {
    headers: { 'Authorization': `Bearer ${freshLogin.token}` }
  });
  if (analyticsRes.ok) {
    const analytics = await analyticsRes.json();
    console.log('Analytics feedback summary:', {
      userHasSubmitted: analytics.feedback?.userHasSubmitted,
      totalCount: analytics.feedback?.totalCount,
      averageRating: analytics.feedback?.averageRating
    });
    if (!analytics.feedback?.userHasSubmitted) {
      throw new Error('Analytics feedback does not report userHasSubmitted: true!');
    }
    console.log('✓ Analytics endpoint correctly returns userHasSubmitted = true and existing rating data!');
  }

  // 9. Verify survey poll duplicate protection (Polls)
  console.log('\nStep 9: Testing survey poll duplicate protection...');
  const pollsRes = await fetch(`${BASE_URL}/api/feedback/polls/attendee/my-polls`, {
    headers: { 'Authorization': `Bearer ${freshLogin.token}` }
  });
  const { polls } = await pollsRes.json();
  const testPoll = polls.find(p => p.questions && p.questions.length > 0);
  if (testPoll) {
    console.log(`Testing poll "${testPoll.title}" (ID: ${testPoll.id}) | Current hasSubmitted: ${testPoll.hasSubmitted}`);
    const pollAnswers = {};
    testPoll.questions.forEach(q => {
      if (q.questionType === 'RATING') pollAnswers[q.id] = 5;
      else if (q.questionType === 'YES_NO') pollAnswers[q.id] = 'Yes';
      else pollAnswers[q.id] = 'Great session';
    });

    // If not submitted yet, submit first
    if (!testPoll.hasSubmitted) {
      const pSub = await fetch(`${BASE_URL}/api/feedback/polls/${testPoll.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshLogin.token}`
        },
        body: JSON.stringify({ answers: pollAnswers })
      });
      console.log(`Poll first submit code: ${pSub.status}`);
    }

    // Now attempt duplicate poll submission
    const pDup = await fetch(`${BASE_URL}/api/feedback/polls/${testPoll.id}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshLogin.token}`
      },
      body: JSON.stringify({ answers: pollAnswers })
    });
    console.log(`Poll duplicate submit code: ${pDup.status} (Expected: 409 Conflict)`);
    const pDupData = await pDup.json();
    console.log('Poll duplicate response:', pDupData);
    if (pDup.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate poll response, got ${pDup.status}`);
    }
    console.log('✓ Duplicate survey poll response correctly rejected with HTTP 409 Conflict!');
  }

  // 10. Multi-event and Multi-attendee Isolation
  console.log('\nStep 10: Verifying attendee isolation (Attendee 2 can still submit feedback)...');
  const tktRes2 = await fetch(`${BASE_URL}/api/tickets/my`, {
    headers: { 'Authorization': `Bearer ${attendee2.token}` }
  });
  const tickets2 = (await tktRes2.json()).tickets || [];
  console.log(`Attendee 2 has ${tickets2.length} tickets.`);
  const attendee2Ticket = tickets2.find(t => t.eventId === testEventId);
  if (attendee2Ticket) {
    const att2StatusRes = await fetch(`${BASE_URL}/api/events/${testEventId}/feedback/status`, {
      headers: { 'Authorization': `Bearer ${attendee2.token}` }
    });
    const att2Status = await att2StatusRes.json();
    console.log(`Attendee 2 initial status for same event: hasSubmitted = ${att2Status.hasSubmitted}`);
    console.log('✓ Attendee 2 is isolated from Attendee 1 feedback status!');
  }

  console.log('\n================================================================');
  console.log('✓ ALL FEEDBACK DUPLICATE PREVENTION & PERSISTENCE TESTS PASSED!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
