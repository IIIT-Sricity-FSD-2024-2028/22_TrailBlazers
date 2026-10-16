// Script to create and publish the 3 sample feedback surveys via official Event Manager API
const BASE_URL = 'http://127.0.0.1:5001';

async function main() {
  console.log('Logging in as Event Manager Rahul Verma...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rahul.verma@wavevents.com',
      password: 'password123'
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.token) {
    console.error('Failed to log in:', loginData);
    process.exit(1);
  }
  const token = loginData.token;
  console.log('Successfully authenticated as Event Manager.');

  const surveysToCreate = [
    {
      eventId: 'evt-1',
      title: 'Overall Event Experience',
      description: 'Please share your feedback regarding your overall experience at the AI & Future Technology Summit 2026.',
      status: 'PUBLISHED',
      questions: [
        {
          questionText: 'How would you rate your overall experience?',
          questionType: 'RATING',
          options: []
        },
        {
          questionText: 'How satisfied were you with the event organization?',
          questionType: 'RATING',
          options: []
        },
        {
          questionText: 'How would you rate the venue and facilities?',
          questionType: 'RATING',
          options: []
        },
        {
          questionText: 'Would you recommend this event to others?',
          questionType: 'YES_NO',
          options: ['Yes', 'Maybe', 'No']
        },
        {
          questionText: 'What did you like most about the event?',
          questionType: 'TEXT',
          options: []
        },
        {
          questionText: 'What improvements would you suggest?',
          questionType: 'TEXT',
          options: []
        }
      ]
    },
    {
      eventId: 'evt-2',
      title: 'Event Organization and Management',
      description: 'Help us improve future logistics by providing feedback on organization, schedule, and staff assistance for the National Cybersecurity & Cloud Expo.',
      status: 'PUBLISHED',
      questions: [
        {
          questionText: 'How satisfied were you with the event schedule?',
          questionType: 'RATING',
          options: []
        },
        {
          questionText: 'How helpful was the event staff?',
          questionType: 'RATING',
          options: []
        },
        {
          questionText: 'Were the event instructions clear?',
          questionType: 'YES_NO',
          options: ['Yes', 'Maybe', 'No']
        },
        {
          questionText: 'What could be improved in the event organization?',
          questionType: 'TEXT',
          options: []
        }
      ]
    },
    {
      eventId: 'evt-3',
      title: 'Content and Engagement',
      description: 'Let us know how valuable and engaging the research sessions, topic relevance, and discussions were at the Wavevents Academic Research Symposium.',
      status: 'PUBLISHED',
      questions: [
        {
          questionText: 'How useful was the event content?',
          questionType: 'RATING',
          options: []
        },
        {
          questionText: 'How engaging were the sessions or activities?',
          questionType: 'RATING',
          options: []
        },
        {
          questionText: 'Did the event meet your expectations?',
          questionType: 'YES_NO',
          options: ['Yes', 'Maybe', 'No']
        },
        {
          questionText: 'Which session or activity did you enjoy the most?',
          questionType: 'TEXT',
          options: []
        },
        {
          questionText: 'What topics would you like to see in future events?',
          questionType: 'TEXT',
          options: []
        }
      ]
    }
  ];

  for (const s of surveysToCreate) {
    console.log(`\nCreating "${s.title}" for event ${s.eventId}...`);
    const res = await fetch(`${BASE_URL}/api/feedback/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(s)
    });
    const result = await res.json();
    if (res.ok && result.success) {
      console.log(`✓ Created & Published "${s.title}" with ID: ${result.poll.id}`);
    } else {
      console.error(`✗ Error creating "${s.title}":`, result);
    }
  }

  console.log('\nAll 3 feedback surveys processed successfully.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
