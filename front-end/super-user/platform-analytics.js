document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('header-user').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('header-dropdown').classList.toggle('active'); });
    document.addEventListener('click', () => document.getElementById('header-dropdown').classList.remove('active'));
    document.getElementById('notif-bell').addEventListener('click', () => showToast('You have 3 new notifications', 'info'));
    document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '../landing-page/index.html'; });

    // Time range filter
    document.getElementById('time-range').addEventListener('change', () => {
        showToast('Analytics data updated for selected range', 'info');
        drawLineChart();
        drawDonutChart();
    });

    // ── Line Chart (Canvas) ──
    function drawLineChart() {
        const canvas = document.getElementById('line-chart');
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.scale(dpr, dpr);
        const w = rect.width, h = rect.height;

        ctx.clearRect(0, 0, w, h);

        const months = ['Jan', 'Feb', 'Mar'];
        const eventsData = [68, 82, 94];
        const attendeesData = [52, 78, 64]; // div by 100

        const padL = 50, padR = 30, padT = 20, padB = 40;
        const chartW = w - padL - padR;
        const chartH = h - padT - padB;
        const maxY = 100;

        // Grid lines
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padT + (chartH / 4) * i;
            ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
            ctx.fillStyle = '#94a3b8'; ctx.font = '11px Inter'; ctx.textAlign = 'right';
            ctx.fillText(maxY - (maxY / 4) * i, padL - 8, y + 4);
        }

        // X labels
        ctx.textAlign = 'center'; ctx.fillStyle = '#94a3b8';
        months.forEach((m, i) => {
            const x = padL + (chartW / (months.length - 1)) * i;
            ctx.fillText(m, x, h - 10);
        });

        function drawLine(data, color) {
            ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            ctx.beginPath();
            data.forEach((v, i) => {
                const x = padL + (chartW / (data.length - 1)) * i;
                const y = padT + chartH - (v / maxY * chartH);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Dots
            data.forEach((v, i) => {
                const x = padL + (chartW / (data.length - 1)) * i;
                const y = padT + chartH - (v / maxY * chartH);
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
            });
        }

        drawLine(eventsData, '#f97316');
        drawLine(attendeesData, '#2563eb');
    }

    // ── Donut Chart (Canvas) ──
    function drawDonutChart() {
        const canvas = document.getElementById('donut-chart');
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = Math.min(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(dpr, dpr);

        const cx = size / 2, cy = size / 2;
        const outerR = size / 2 - 10;
        const innerR = outerR * 0.65;

        const data = [
            { value: 1840, color: '#16a34a' },
            { value: 624, color: '#f97316' },
            { value: 692, color: '#2563eb' },
        ];
        const total = data.reduce((s, d) => s + d.value, 0);

        let startAngle = -Math.PI / 2;
        data.forEach(d => {
            const sliceAngle = (d.value / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
            ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = d.color;
            ctx.fill();
            startAngle += sliceAngle;
        });
    }

    drawLineChart();
    drawDonutChart();
    window.addEventListener('resize', () => { drawLineChart(); drawDonutChart(); });

    window.showToast = function(msg, type='info') { const c=document.getElementById('toast-container'); const t=document.createElement('div'); t.className=`toast ${type}`; const icons={success:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',error:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',info:'<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}; t.innerHTML=`${icons[type]||icons.info} ${msg}`; c.appendChild(t); requestAnimationFrame(()=>t.classList.add('show')); setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},3500); };
});