/* ==============================
   LIVE Q&A PAGE — liveQA.js
   ============================== */

let editIdx = -1;

let questions = [
  { text:'How can Indian startups leverage AI without large budgets?',         user:'Rahul M.',   likes:45, status:'pending',     topic:'AI & Machine Learning', time:'2 min ago',  answer: '' },
  { text:'Best cloud solutions for tier-2 and tier-3 cities?',                user:'Sneha D.',   likes:38, status:'highlighted', topic:'Cloud Solutions',        time:'5 min ago',  answer: '' },
  { text:'How does Digital India help in cybersecurity awareness?',            user:'Karthik R.', likes:52, status:'highlighted', topic:'Cybersecurity',          time:'3 min ago',  answer: '' },
  { text:'Which certifications are valuable for cloud professionals?',         user:'Pooja K.',   likes:28, status:'answered',    topic:'Cloud Solutions',        time:'8 min ago',  answer: 'AWS Certified Solutions Architect and Microsoft Certified: Azure Solutions Architect Expert are top tier.' },
  { text:'What are the best practices for securing APIs in microservices?',    user:'Dev S.',     likes:31, status:'pending',     topic:'Cybersecurity',          time:'12 min ago', answer: '' }
];

function renderStats() {
  const total       = questions.length;
  const pending     = questions.filter(q => q.status === 'pending').length;
  const highlighted = questions.filter(q => q.status === 'highlighted').length;
  const answered    = questions.filter(q => q.status === 'answered').length;
  document.getElementById('qa-stats').innerHTML = `
    <div class="qa-stat"><p>Total Questions</p><h2>${total}</h2></div>
    <div class="qa-stat"><p>Pending</p><h2 style="color:#64748b">${pending}</h2></div>
    <div class="qa-stat"><p>Highlighted</p><h2 style="color:#f97316">${highlighted}</h2></div>
    <div class="qa-stat"><p>Answered</p><h2 style="color:#10b981">${answered}</h2></div>`;
}

function renderQuestions() {
  const filt   = document.getElementById('q-filter').value;
  const search = document.getElementById('q-search').value.toLowerCase();
  const filtered = questions.filter(q => {
    const ms = !filt   || q.status === filt;
    const mq = !search || q.text.toLowerCase().includes(search) || q.user.toLowerCase().includes(search) || q.topic.toLowerCase().includes(search);
    return ms && mq;
  });
  const c = document.getElementById('qa-list');
  if (!filtered.length) { c.innerHTML = '<p style="color:#64748b;padding:20px;text-align:center">No questions found.</p>'; return; }
  c.innerHTML = filtered.map(q => {
    const i = questions.indexOf(q);
    return `<div class="qa-item ${q.status === 'highlighted' ? 'highlighted' : q.status === 'answered' ? 'answered' : ''}">
      <div class="qa-top">
        <div class="qa-meta">
          <span class="badge ${q.status}">${cap(q.status)}</span>
          <span>${q.topic}</span>
          <span>· ${q.time}</span>
        </div>
        <div class="qa-actions">
          ${q.status !== 'highlighted' ? `<button class="qbtn highlight" onclick="setStatus(${i},'highlighted')"><i class="fa-solid fa-eye"></i>Highlight</button>` : ''}
          ${q.status !== 'answered'    ? `<button class="qbtn answered"  onclick="setStatus(${i},'answered')"><i class="fa-solid fa-check"></i>Answered</button>` : ''}
          <button class="qbtn edit" onclick="openModal(${i})"><i class="fa-solid fa-pen"></i>Edit</button>
          <button class="qbtn hide" onclick="removeQ(${i})"><i class="fa-solid fa-eye-slash"></i>Hide</button>
        </div>
      </div>
      <div class="qa-question">${q.text}</div>
      ${q.answer ? `<div class="qa-answer" style="background: #f0fdf4; border-radius: 8px; padding: 10px; margin: 10px 0; font-size: 14px; border-left: 3px solid #10b981;"><strong>Answer:</strong> ${q.answer}</div>` : ''}
      <div class="qa-footer">
        <div class="qa-user">Asked by ${q.user}</div>
        <button class="qbtn edit" onclick="like(${i})"><i class="fa-solid fa-thumbs-up"></i>${q.likes}</button>
      </div>
    </div>`;
  }).join('');
}

function addQuestion() {
  const text = document.getElementById('new-q-text').value.trim();
  if (!text) { toast('Question text required', '#ef4444'); return; }
  questions.unshift({
    text,
    user:   document.getElementById('new-q-user').value  || 'Anonymous',
    likes:  0,
    status: 'pending',
    topic:  document.getElementById('new-q-topic').value,
    time:   'Just now'
  });
  document.getElementById('new-q-text').value = '';
  document.getElementById('new-q-user').value = '';
  render();
  toast('Question added ✅');
}

function setStatus(i, s) {
  questions[i].status = s;
  render();
  toast(s === 'highlighted' ? 'Highlighted 🔥' : 'Marked as answered ✅', s === 'highlighted' ? '#f97316' : '#10b981');
}
function like(i)    { questions[i].likes++; renderQuestions(); }
function removeQ(i) { questions.splice(i, 1); render(); toast('Question hidden', '#64748b'); }

function openModal(i) {
  editIdx = i;
  const q = questions[i];
  document.getElementById('eq-text').value   = q.text;
  document.getElementById('eq-answer').value = q.answer || '';
  document.getElementById('eq-user').value   = q.user;
  document.getElementById('eq-topic').value  = q.topic;
  document.getElementById('eq-status').value = q.status;
  document.getElementById('q-modal').classList.add('open');
}

function saveQuestion() {
  const text = document.getElementById('eq-text').value.trim();
  if (!text) { toast('Question required', '#ef4444'); return; }
  questions[editIdx].text   = text;
  questions[editIdx].answer = document.getElementById('eq-answer').value.trim();
  questions[editIdx].user   = v('eq-user');
  questions[editIdx].topic  = v('eq-topic');
  questions[editIdx].status = v('eq-status');
  closeModal('q-modal');
  render();
  toast('Updated ✅');
}

function render() { renderStats(); renderQuestions(); }

initNav();
render();