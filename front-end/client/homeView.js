class HomeView {
    static render() {
        const user = App.user;
        const stats = DataStore.getDashboardStats();
        const activities = DataStore.getRecentActivity();

        let html = `
            <div style="background-color: #F4EDE2; margin: -40px; padding: 40px; min-height: 100vh; font-family: 'Inter', sans-serif;">
                <div class="page-header" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div class="page-title">
                        <h2 style="font-size:28px; font-weight: 700; color: #1E3A8A; margin-bottom:5px;">Dashboard Overview</h2>
                        <p style="color: #64748b; font-size:14px;">Welcome back! Here's what's happening with your events.</p>
                    </div>
                    <div style="display:flex; gap: 12px;">
                        <button id="downloadReportBtn" class="btn btn-secondary" style="background: white; border: 1px solid #e2e8f0; color: #1E3A8A; font-weight: 600; padding: 10px 20px;">Download Report</button>
                    </div>
                </div>

                <!-- Primary Metrics -->
                <div class="dashboard-grid" style="grid-template-columns: 2fr 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                    <!-- Large Highlight Card -->
                    <div class="card" style="padding: 30px; border-radius: 16px; background: white; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between; height: 180px; position: relative; overflow: hidden;">
                        <div style="position: absolute; right: -20px; top: -20px; opacity: 0.05;">
                            <svg width="200" height="200" viewBox="0 0 24 24" fill="#F97316"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                        </div>
                        <div>
                            <h3 style="font-size: 14px; color: #64748b; margin-bottom: 10px; font-weight: 500;">Engagement Snapshot</h3>
                            <div style="font-size: 42px; font-weight: 800; color: #0F172A;">${stats.engagementScore}%</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #16a34a; font-size: 14px; font-weight: 600;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                            Up ${stats.engagementTrend}% this month
                        </div>
                    </div>

                    <!-- Medium Metric Cards -->
                    <div class="card" style="padding: 24px; border-radius: 16px; background: white; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: center; text-align: center;">
                        <p style="font-size: 12px; color: #64748b; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Active Events</p>
                        <div style="font-size: 32px; font-weight: 700; color: #2563EB;">${stats.activeEventsCount.toString().padStart(2, '0')}</div>
                        <p style="font-size: 11px; color: #94a3b8; margin-top: 4px;">of ${stats.totalEventsCount} total</p>
                    </div>

                    <div class="card" style="padding: 24px; border-radius: 16px; background: white; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: center; text-align: center;">
                        <p style="font-size: 12px; color: #64748b; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Avg Rating</p>
                        <div style="font-size: 32px; font-weight: 700; color: #F97316;">${stats.avgRating} <span style="font-size: 16px; color: #cbd5e1;">/ 5</span></div>
                        <p style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Based on ${stats.totalRSVPs} RSVPs</p>
                    </div>
                </div>

                <!-- Secondary Metrics Row -->
                <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                    <div class="card" style="padding: 20px; border-radius: 12px; background: white; border: 1px solid rgba(0,0,0,0.03); display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(37, 99, 235, 0.1); color: #2563EB; display: flex; align-items:center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #64748b; font-weight: 600;">RSVP Total</div>
                            <div style="font-size: 18px; font-weight: 700; color: #0F172A;">${stats.totalRSVPs.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="card" style="padding: 20px; border-radius: 12px; background: white; border: 1px solid rgba(0,0,0,0.03); display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(249, 115, 22, 0.1); color: #F97316; display: flex; align-items:center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="18" y="3" width="4" height="18"></rect><rect x="10" y="8" width="4" height="13"></rect><rect x="2" y="13" width="4" height="8"></rect></svg>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Poll Rate</div>
                            <div style="font-size: 18px; font-weight: 700; color: #0F172A;">${stats.pollRate}%</div>
                        </div>
                    </div>
                    <div class="card" style="padding: 20px; border-radius: 12px; background: white; border: 1px solid rgba(0,0,0,0.03); display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(37, 99, 235, 0.1); color: #2563EB; display: flex; align-items:center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Q&amp;A Count</div>
                            <div style="font-size: 18px; font-weight: 700; color: #0F172A;">${stats.qaCount}</div>
                        </div>
                    </div>
                    <div class="card" style="padding: 20px; border-radius: 12px; background: white; border: 1px solid rgba(0,0,0,0.03); display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(249, 115, 22, 0.1); color: #F97316; display: flex; align-items:center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Check-Ins</div>
                            <div style="font-size: 18px; font-weight: 700; color: #0F172A;">${stats.checkedIn} <span style="font-size:11px; color:#94a3b8;">(${stats.checkInRate}%)</span></div>
                        </div>
                    </div>
                </div>

                ${user && user.role === 'superuser' ? `
                <!-- Superuser: Live User Breakdown from backend -->
                <div class="card" style="padding:24px; border-radius:16px; background:white; border:1px solid rgba(0,0,0,0.05); margin-bottom:24px;">
                    <h3 style="margin:0 0 18px 0; font-size:16px; font-weight:700; color:#1E3A8A;">👥 Platform Users <span style="font-size:13px; font-weight:500; color:#94a3b8;">(Live from backend)</span></h3>
                    <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:16px;">
                        <div style="text-align:center; padding:16px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
                            <div style="font-size:28px; font-weight:800; color:#0F172A;">${stats.totalUsers}</div>
                            <div style="font-size:11px; color:#64748b; font-weight:600; margin-top:4px;">Total Users</div>
                        </div>
                        <div style="text-align:center; padding:16px; background:#eff6ff; border-radius:12px; border:1px solid #bfdbfe;">
                            <div style="font-size:28px; font-weight:800; color:#2563EB;">${stats.totalManagers}</div>
                            <div style="font-size:11px; color:#2563EB; font-weight:600; margin-top:4px;">Event Managers</div>
                        </div>
                        <div style="text-align:center; padding:16px; background:#fff7ed; border-radius:12px; border:1px solid #fed7aa;">
                            <div style="font-size:28px; font-weight:800; color:#F97316;">${stats.totalClients}</div>
                            <div style="font-size:11px; color:#F97316; font-weight:600; margin-top:4px;">Clients</div>
                        </div>
                        <div style="text-align:center; padding:16px; background:#f0fdf4; border-radius:12px; border:1px solid #bbf7d0;">
                            <div style="font-size:28px; font-weight:800; color:#16a34a;">${stats.totalAttendees}</div>
                            <div style="font-size:11px; color:#16a34a; font-weight:600; margin-top:4px;">Attendees</div>
                        </div>
                        <div style="text-align:center; padding:16px; background:#faf5ff; border-radius:12px; border:1px solid #e9d5ff;">
                            <div style="font-size:28px; font-weight:800; color:#7c3aed;">${stats.totalOSC}</div>
                            <div style="font-size:11px; color:#7c3aed; font-weight:600; margin-top:4px;">On-Site Coord.</div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Main Analytics Section with Tab Toggles -->
                <div style="background: white; border-radius: 20px; padding: 30px; border: 1px solid rgba(0,0,0,0.04); margin-bottom: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
                        <div style="display: flex; gap: 30px;">
                            <button style="background: none; border: none; font-size: 15px; font-weight: 700; color: #F97316; border-bottom: 2px solid #F97316; padding-bottom: 15px; margin-bottom: -21px; cursor: pointer;">Attendance Trends</button>
                            <button style="background: none; border: none; font-size: 15px; font-weight: 500; color: #64748b; padding-bottom: 15px; cursor: pointer;">Engagement Analysis</button>
                        </div>
                        <select style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #475569;">
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                        </select>
                    </div>

                    <div style="display:grid; grid-template-columns: 2fr 1fr; gap: 40px;">
                        <!-- Chart Area -->
                        <div style="height: 250px; position: relative;">
                            <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: flex; align-items: flex-end; gap: 30px; padding-bottom: 30px; border-bottom: 1px solid #f1f5f9;">
                                <div style="flex:1; height: 60%; background: #2563EB; border-radius: 6px 6px 0 0; position:relative;"><span style="position:absolute; bottom:-25px; left:50%; transform:translateX(-50%); font-size:11px; color:#94a3b8;">Jan</span></div>
                                <div style="flex:1; height: 75%; background: #F97316; border-radius: 6px 6px 0 0; position:relative;"><span style="position:absolute; bottom:-25px; left:50%; transform:translateX(-50%); font-size:11px; color:#94a3b8;">Feb</span></div>
                                <div style="flex:1; height: 90%; background: #2563EB; border-radius: 6px 6px 0 0; position:relative;"><span style="position:absolute; bottom:-25px; left:50%; transform:translateX(-50%); font-size:11px; color:#94a3b8;">Mar</span></div>
                                <div style="flex:1; height: 70%; background: #F97316; border-radius: 6px 6px 0 0; position:relative;"><span style="position:absolute; bottom:-25px; left:50%; transform:translateX(-50%); font-size:11px; color:#94a3b8;">Apr</span></div>
                                <div style="flex:1; height: 100%; background: #2563EB; border-radius: 6px 6px 0 0; position:relative;"><span style="position:absolute; bottom:-25px; left:50%; transform:translateX(-50%); font-size:11px; color:#94a3b8;">May</span></div>
                                <div style="flex:1; height: 85%; background: #F97316; border-radius: 6px 6px 0 0; position:relative;"><span style="position:absolute; bottom:-25px; left:50%; transform:translateX(-50%); font-size:11px; color:#94a3b8;">Jun</span></div>
                            </div>
                        </div>

                        <!-- Recent Legend/Summary -->
                        <div style="background: #f8fafc; border-radius: 12px; padding: 20px;">
                            <h4 style="font-size: 13px; color: #1E3A8A; margin-bottom: 15px; font-weight: 700;">Key Stats</h4>
                            <div style="display: flex; flex-direction: column; gap: 15px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 12px; color: #64748b;">Total Check-Ins</span>
                                    <span style="font-size: 14px; font-weight: 700; color: #0F172A;">${stats.checkedIn} Users</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 12px; color: #64748b;">Growth Rate</span>
                                    <span style="font-size: 14px; font-weight: 700; color: #16a34a;">+${stats.engagementTrend}%</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 12px; color: #64748b;">Total Events Hosted</span>
                                    <span style="font-size: 14px; font-weight: 700; color: #0F172A;">${stats.totalHosted}</span>
                                </div>
                                <div style="margin-top: 10px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                                    <p style="font-size: 11px; color: #94a3b8; line-height: 1.5;">You're seeing a consistent upward trend in attendee participation across all session types.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Overview Grid -->
                <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap: 30px;">
                    <!-- Recent Events Table-like list -->
                    <div class="card" style="padding:30px; border-radius: 16px; background: white; border: 1px solid rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #1E3A8A;">Recent Activity</h3>
                            <a href="#/browse-events" style="font-size: 13px; color: #2563EB; font-weight: 600; text-decoration: none;">View All Events</a>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:12px;">
                            ${activities.map(act => `
                                <a href="#/event-details?id=${act.id}" style="display:flex; justify-content:space-between; align-items: center; padding: 12px 15px; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9; text-decoration:none; color:inherit; transition:0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                                    <div style="display: flex; align-items: center; gap: 15px;">
                                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${act.color};"></div>
                                        <div>
                                            <div style="font-weight:700; font-size:14px; color: #0F172A;">${act.title}</div>
                                            <div style="color: #64748b; font-size:11px;">${act.status} • ${act.date}</div>
                                        </div>
                                    </div>
                                    <div style="color:#2563EB; font-size:13px; font-weight: 700;">${act.attendees} Attendees</div>
                                </a>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Small Feedback Overview -->
                    <div class="card" style="padding:30px; border-radius: 16px; background: white; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column;">
                        <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #1E3A8A;">Session Satisfaction</h3>
                        <div style="display:flex; flex-direction: column; gap: 15px; flex: 1; justify-content: center;">
                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                                <div style="font-size: 28px;">⭐</div>
                                <div>
                                    <div style="font-size: 24px; font-weight: 800; color: #0F172A;">${stats.avgRating} <span style="font-size: 12px; color: #94a3b8;">Average Rating</span></div>
                                    <div style="display: flex; gap: 2px;">
                                        <span style="color: #F97316;">★</span><span style="color: #F97316;">★</span><span style="color: #F97316;">★</span><span style="color: #F97316;">★</span><span style="color: #F97316;">★</span>
                                    </div>
                                </div>
                            </div>
                            <p style="font-size: 13px; color: #64748b; line-height: 1.6; font-style: italic;">"The best event management platform we've used in the last 4 years. Data precision is unmatched."</p>
                            <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px;">
                                <div style="width: 24px; height: 24px; border-radius: 50%; background: #F97316; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 700;">TK</div>
                                <span style="font-size: 11px; color: #1E3A8A; font-weight: 600;">Thomas K., Chief Marketing Officer</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return html;
    }

    static init() {
        const downloadBtn = document.getElementById('downloadReportBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const toast = (msg, color) => {
                    const existing = document.getElementById('wevents-toast');
                    if (existing) existing.remove();
                    const t = document.createElement('div');
                    t.id = 'wevents-toast';
                    t.textContent = msg;
                    Object.assign(t.style, {
                        position: 'fixed', bottom: '30px', right: '30px',
                        background: color || 'var(--primary)', color: 'white', padding: '14px 22px',
                        borderRadius: '8px', fontWeight: '600', fontSize: '14px',
                        zIndex: '99999', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', opacity: '1'
                    });
                    document.body.appendChild(t);
                    setTimeout(() => { t.style.transition = 'opacity 0.5s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 600); }, 2500);
                };

                const download = (filename, content) => {
                    const blob = new Blob([content], { type: 'text/plain' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = filename;
                    a.click();
                };

                const stats = DataStore.getDashboardStats();
                const csvContent = `Metric,Value\nEngagement Score,${stats.engagementScore}%\nActive Events,${stats.activeEventsCount}\nAverage Rating,${stats.avgRating}\nTotal RSVPs,${stats.totalRSVPs}\nPoll Rate,${stats.pollRate}%\nQ&A Count,${stats.qaCount}\nTotal Hosted,${stats.totalHosted}`;
                
                toast('Preparing your dashboard report...');
                setTimeout(() => {
                    download('dashboard_report.csv', csvContent);
                    toast('Report downloaded successfully!', '#22c55e');
                }, 1000);
            });
        }
    }
}