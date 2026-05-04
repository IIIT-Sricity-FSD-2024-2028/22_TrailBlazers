/* ==============================
   DASHBOARD PAGE — dashboard.js
   ============================== */

initNav();

/* Both charts: responsive:true + maintainAspectRatio:false
   The .chart-wrap div has a fixed pixel height in CSS so the
   canvas never grows when the user scrolls. */

new Chart(document.getElementById('attendanceChart'), {
  type: 'line',
  data: {
    labels: ['9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM'],
    datasets: [{
      label: 'Check-ins',
      data: [45, 180, 320, 290, 180, 250, 210, 140],
      borderColor: '#f97316',
      backgroundColor: 'rgba(249,115,22,.1)',
      tension: .4,
      fill: true,
      pointRadius: 4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f0f0f0' } }
    }
  }
});

new Chart(document.getElementById('engagementChart'), {
  type: 'bar',
  data: {
    labels: ['Keynote','AI ML','Cloud','Cyber','Web Dev','Data Sci'],
    datasets: [
      { label:'Questions',  data:[42,38,29,47,25,19],  backgroundColor:'#2563eb', borderRadius:6 },
      { label:'Poll Votes', data:[156,198,143,167,89,112], backgroundColor:'#f97316', borderRadius:6 }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f0f0f0' } }
    }
  }
});
