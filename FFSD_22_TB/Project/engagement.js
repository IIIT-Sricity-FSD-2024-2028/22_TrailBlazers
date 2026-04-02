/* ==============================
   ENGAGEMENT PAGE — engagement.js
   ============================== */

const polls = [
  {
    topic:'Cloud Computing Best Practices',
    question:'Which cloud platform do you prefer?',
    meta:'156 of 189 responses (83%)',
    options:[
      { option:'AWS',          votes:'68 votes (43.6%)', percent:43.6 },
      { option:'Azure',        votes:'52 votes (33.3%)', percent:33.3 },
      { option:'Google Cloud', votes:'28 votes (17.9%)', percent:17.9 },
      { option:'Others',       votes:'8 votes (5.1%)',   percent:5.1  }
    ]
  },
  {
    topic:'AI & ML Workshop',
    question:'Have you implemented AI in your org?',
    meta:'198 of 234 responses (85%)',
    options:[
      { option:'Yes, extensively', votes:'45 votes (22.7%)', percent:22.7 },
      { option:'Yes, limited',     votes:'89 votes (44.9%)', percent:44.9 },
      { option:'Planning to',      votes:'52 votes (26.3%)', percent:26.3 },
      { option:'No plans',         votes:'12 votes (6.1%)',  percent:6.1  }
    ]
  }
];

const sessionEngData = [
  { name:'Inaugural Keynote', qas:42, votes:156, engagement:'94%' },
  { name:'AI & ML Workshop',  qas:38, votes:198, engagement:'87%' },
  { name:'Cloud Solutions',   qas:29, votes:143, engagement:'79%' },
  { name:'Cybersecurity',     qas:47, votes:167, engagement:'91%' }
];

function renderStats() {
  const totalQas   = sessionEngData.reduce((a, s) => a + s.qas,   0);
  const totalVotes = sessionEngData.reduce((a, s) => a + s.votes, 0);
  document.getElementById('eng-stats').innerHTML = `
    <div class="estat"><p>Total Questions</p><h2>${totalQas}</h2></div>
    <div class="estat"><p>Poll Votes</p><h2 style="color:#2563eb">${totalVotes}</h2></div>
    <div class="estat"><p>Active Polls</p><h2 style="color:#10b981">${polls.length}</h2></div>
    <div class="estat"><p>Avg Engagement</p><h2 style="color:#f97316">88%</h2></div>`;
}

function renderPolls() {
  document.getElementById('poll-list').innerHTML = polls.map(poll => `
    <div class="poll-card">
      <div class="ph">
        <div class="pl"><span class="pbadge">Active</span><span style="color:#64748b;font-size:13px">${poll.topic}</span></div>
      </div>
      <div class="poll-q">${poll.question}</div>
      <div class="poll-meta">${poll.meta}</div>
      ${poll.options.map(o => `
        <div class="opt">
          <div class="opt-top"><span>${o.option}</span><span style="font-weight:600">${o.votes}</span></div>
          <div class="pbar"><div class="pfill" style="width:${o.percent}%"></div></div>
        </div>`).join('')}
    </div>`).join('');
}

function renderSessionEng() {
  document.getElementById('session-eng-list').innerHTML = sessionEngData.map(s => `
    <div class="session-eng">
      <div class="se-left">${s.name}</div>
      <div class="se-stats">
        <div class="se-stat"><i class="fa-solid fa-comment" style="color:#2563eb"></i>${s.qas} Q&As</div>
        <div class="se-stat"><i class="fa-solid fa-chart-bar" style="color:#f97316"></i>${s.votes} votes</div>
        <div class="se-stat" style="color:#10b981;font-weight:600">${s.engagement}</div>
      </div>
    </div>`).join('');
}

function toggleControl(key, val) {
  toast((val ? 'Enabled' : 'Disabled') + ' — ' + key, val ? '#10b981' : '#ef4444');
}

function render() { renderStats(); renderPolls(); renderSessionEng(); }

initNav();
render();
