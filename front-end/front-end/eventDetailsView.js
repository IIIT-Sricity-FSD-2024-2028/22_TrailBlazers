class EventDetailsView {
    static render(eventId) {
        const e = DataStore.getEventById(eventId);
        
        if (!e) {
            return `
                <div class="card" style="text-align:center; padding:50px;">
                    <h2 style="color:var(--text-main); margin-bottom:10px;">Event Not Found</h2>
                    <p style="color:var(--text-muted); margin-bottom:20px;">The event you are looking for does not exist or has been removed.</p>
                    <a href="#/dashboard" class="btn btn-primary">Return to Dashboard</a>
                </div>
            `;
        }

        const title = e.title || e.name || "Tech Conference 2026";
        const date = e.date || "2026-04-15";
        const status = e.status || 'ongoing';

        const user = Auth.getCurrentUser();
        const isClient = user.role === 'superuser'; // In this app 'superuser' is the event host/client role

        let tabsHtml = ``;
        if (!isClient) {
            // End User view
            tabsHtml = `
            <div class="tabs" id="eventTabs" style="font-size: 13px; gap: 20px; border-bottom: 1px solid var(--border-color); margin-bottom: 30px; padding-bottom:0;">
                <div class="tab active" data-target="overview" style="padding:10px 0;"><span style="color:var(--primary);">📋</span> Overview</div>
            </div>`;
        } else {
            // Manager/Owner view (Dashboard)
            tabsHtml = `
            <div class="tabs" id="eventTabs" style="font-size: 13px; gap: 20px; border-bottom: 1px solid var(--border-color); margin-bottom: 30px; padding-bottom:0;">
                <div class="tab active" data-target="overview" style="padding:10px 0;"><span style="color:var(--primary);">📋</span> Overview</div>
                <div class="tab" data-target="attendance" style="padding:10px 0;">👤 Attendance Tracking</div>
                <div class="tab" data-target="engagement" style="padding:10px 0;">📈 Engagement Insights</div>
                <div class="tab" data-target="analytics" style="padding:10px 0;">📊 Post-Event Analytics</div>
            </div>`;
        }

        return `
            <div style="margin-bottom: 20px;">
                <a href="#/my-events" style="text-decoration:none; color:var(--text-muted); font-size:13px;">⬅ Back to My Events</a>
                <div style="display:flex; align-items:center; gap: 15px; margin-top: 15px;">
                    <h2 style="margin:0; font-size: 24px;">${title}</h2>
                    <span class="badge status-${status.toLowerCase()}" style="background:var(--primary); color:white; padding: 4px 12px; border:none; font-size:12px; border-radius:12px;">${status.toLowerCase()}</span>
                    <span style="color:var(--text-muted); font-size:14px;">${date}</span>
                </div>
            </div>
            
            ${tabsHtml}
            
            <div id="eventDetailsContent"></div>
        `;
    }

    static init(eventId) {
        const tabs = document.querySelectorAll('#eventTabs .tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => {
                    t.classList.remove('active');
                    // Reset styling for inactive tabs
                    const parts = t.textContent.trim().split(' ');
                    if (parts.length > 1 && t.querySelector('span')) {
                        t.innerHTML = parts.join(' ');
                    }
                });
                const targetTab = e.currentTarget;
                targetTab.classList.add('active');
                
                // Add color to active tab icon
                const text = targetTab.textContent.trim();
                const firstSpace = text.indexOf(' ');
                if (firstSpace !== -1) {
                    const icon = text.substring(0, firstSpace);
                    const rest = text.substring(firstSpace);
                    targetTab.innerHTML = `<span style="color:var(--primary);">${icon}</span>${rest}`;
                }
                
                this.renderTab(targetTab.getAttribute('data-target'), eventId);
            });
        });

        // Initialize first tab
        this.renderTab('overview', eventId);
    }

    static renderTab(tabId, eventId) {
        const content = document.getElementById('eventDetailsContent');
        const e = DataStore.getEventById(eventId);
        if (!e) return;

        this.currentEvent = e;

        if (tabId === 'overview') {
            content.innerHTML = this.getOverviewHtml();
            const rsvpBtn = content.querySelector('.rsvp-btn');
            if (rsvpBtn) {
                rsvpBtn.addEventListener('click', (ev) => {
                    const id = ev.target.getAttribute('data-id');
                    const eventData = DataStore.getEventById(id);
                    if (eventData) {
                        if (!eventData.stats) eventData.stats = { rsvps: 0, checkins: 0, engagement: 0, rating: 0 };
                        eventData.stats.rsvps = (eventData.stats.rsvps || 0) + 1;
                        DataStore.updateEvent(id, eventData);
                        
                        // Update UI directly on the spot
                        const rsvpVal = content.querySelector('.stat-value');
                        if (rsvpVal) rsvpVal.textContent = eventData.stats.rsvps;
                    }

                    alert('RSVP Successful!');
                    ev.target.innerHTML = '✅ RSVPed';
                    ev.target.classList.replace('btn-primary', 'btn-secondary');
                    ev.target.disabled = true;
                });
            }
        }
        else if (tabId === 'attendance') content.innerHTML = this.getAttendanceHtml();
        else if (tabId === 'engagement') content.innerHTML = this.getEngagementHtml();
        else if (tabId === 'analytics') {
            content.innerHTML = this.getAnalyticsHtml();
            this.initAnalytics(eventId);
        }
    }

    static getOverviewHtml() {
        const e = this.currentEvent;
        const title = e.title || e.name || "Untitled Event";
        const date = e.date || "TBD";
        const capacity = e.capacity || 500;
        const venue = e.location || e.venue || "TBD";
        const id = e.id;
        const stats = e.stats || { rsvps: 0, checkins: 0, engagement: 0, rating: 0 };
        
        const user = Auth.getCurrentUser();
        const isClient = user.role === 'superuser';
        
        const isPending = e.status === 'pending';
        const rsvpCount = isPending ? 0 : (stats.rsvps || Math.floor(Math.random()*100)+50);
        const checkinCount = isPending ? 0 : (stats.checkins || Math.floor(rsvpCount * 0.8));
        const checkinRate = isPending ? 0 : (rsvpCount > 0 ? Math.round((checkinCount/rsvpCount)*100) : 0);
        const capRate = isPending ? 0 : (capacity > 0 ? Math.round((rsvpCount/capacity)*100) : 0);

        // Calculate days until event
        let daysUntil = "Passed";
        if (isPending) {
            daysUntil = "TBD";
        } else if (e.date) {
            const evDate = new Date(e.date);
            const today = new Date();
            const diffTime = evDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0) daysUntil = diffDays + " days";
            else if (diffDays === 0) daysUntil = "Today";
        }

        return `
            <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 30px;">
                <div class="card stat-card" style="align-items:flex-start;">
                    <div class="stat-header"><h3 style="font-size:13px; color:var(--text-main); font-weight:600;">Total RSVPs</h3></div>
                    <div class="stat-value" style="font-size:24px; color:var(--text-main);">${rsvpCount}</div>
                    <div class="stat-desc">Confirmed</div>
                </div>
                <div class="card stat-card" style="align-items:flex-start;">
                    <div class="stat-header"><h3 style="font-size:13px; color:var(--text-main); font-weight:600;">Check-ins</h3></div>
                    <div class="stat-value" style="font-size:24px; color:var(--primary);">${checkinCount}</div>
                    <div class="stat-desc">${checkinRate}% of confirmed</div>
                </div>
                <div class="card stat-card" style="align-items:flex-start;">
                    <div class="stat-header"><h3 style="font-size:13px; color:var(--text-main); font-weight:600;">Sessions</h3></div>
                    <div class="stat-value" style="font-size:24px; color:var(--info);">${e.sessions || (e.timeline ? e.timeline.length : 0)}</div>
                    <div class="stat-desc">${e.speakers || 0} speakers</div>
                </div>
                <div class="card stat-card" style="align-items:flex-start;">
                    <div class="stat-header"><h3 style="font-size:13px; color:var(--text-main); font-weight:600;">Capacity</h3></div>
                    <div class="stat-value" style="font-size:24px; color:var(--sidebar-bg);">${capRate}%</div>
                    <div class="stat-desc">${capacity} max</div>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap: 30px;">
                <!-- Main Col -->
                <div style="display:flex; flex-direction:column; gap: 30px;">
                    <div class="card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                            <h3 style="margin:0;">Event Details</h3>
                            ${isClient ? `<a href="#/edit-event?id=${id}" class="btn btn-secondary btn-sm">📝 Edit Event</a>` : `<button class="btn btn-primary btn-sm rsvp-btn" data-id="${id}">✅ RSVP Now</button>`}
                        </div>
                        
                        <h4 style="margin:0 0 10px 0; font-size:16px;">${title}</h4>
                        <p style="color:var(--text-muted); font-size:13px; line-height:1.5;">${e.description || 'Join us for this exciting event!'}</p>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top:20px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);">
                            <div>
                                <div style="color:var(--text-main); font-weight:500; font-size:13px; margin-bottom:4px;">Date</div>
                                <div style="color:var(--text-muted); font-size:13px;">${date}</div>
                            </div>
                            <div>
                                <div style="color:var(--text-main); font-weight:500; font-size:13px; margin-bottom:4px;">Venue</div>
                                <div style="color:var(--text-muted); font-size:13px;">${venue}</div>
                            </div>
                            <div>
                                <div style="color:var(--text-main); font-weight:500; font-size:13px; margin-bottom:4px;">Capacity</div>
                                <div style="color:var(--text-muted); font-size:13px;">${capacity} attendees</div>
                            </div>
                            <div>
                                <div style="color:var(--text-main); font-weight:500; font-size:13px; margin-bottom:4px;">Sessions</div>
                                <div style="color:var(--text-muted); font-size:13px;">${e.sessions || (e.timeline?e.timeline.length:0)} scheduled</div>
                            </div>
                        </div>
                        <div style="margin-top:20px; font-size:13px; display:flex; flex-direction:column; gap:8px;">
                            <div><span style="font-weight:600;">Event Manager:</span> <span style="color:var(--text-muted);">${e.managerName || 'Assigned Manager'}</span></div>
                            <div><span style="font-weight:600;">On Sight Co Ordinator:</span> <span style="color:var(--text-muted);">${e.coordinatorName || 'TBD'}</span></div>
                        </div>
                    </div>
                </div>
                
                <!-- Side Col -->
                <div style="display:flex; flex-direction:column; gap: 30px;">
                    <div class="card">
                        <h3 style="margin-bottom: 20px;">Event Status</h3>
                        <div style="display:flex; flex-direction:column; gap: 10px; font-size:13px;">
                            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
                                <span style="color:var(--text-muted);">Status</span>
                                <span class="badge status-${e.status}" style="background:var(--primary); color:white; border:none; border-radius:12px;">${e.status}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
                                <span style="color:var(--text-muted);">Days Until Event</span>
                                <span style="font-weight:600;">${daysUntil}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; padding-bottom:8px;">
                                <span style="color:var(--text-muted);">Attendance Rate</span>
                                <span style="font-weight:600;">${checkinRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static getAttendanceHtml() {
        const e = this.currentEvent;
        
        return `
            <div style="margin-bottom: 30px;">
                <h2 style="font-size:22px; margin-bottom: 5px;">Attendance Tracking</h2>
                <p style="color:var(--text-muted); font-size:14px;">Monitor event check-ins and live attendance</p>
            </div>
            
            <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                <div class="card stat-card" style="align-items:flex-start; padding: 24px;">
                    <div style="font-size:13px; color:var(--text-main); font-weight:600; margin-bottom: 15px;">Total Check-ins</div>
                    <div style="font-size:32px; color:#d97736; font-weight:700; margin-bottom: 5px;">356</div>
                    <div style="font-size:12px; color:var(--text-muted);">out of 400 RSVPs</div>
                </div>
                <div class="card stat-card" style="align-items:flex-start; padding: 24px;">
                    <div style="font-size:13px; color:var(--text-main); font-weight:600; margin-bottom: 15px;">Check-outs</div>
                    <div style="font-size:32px; color:var(--text-main); font-weight:700; margin-bottom: 5px;">142</div>
                    <div style="font-size:12px; color:var(--text-muted);">Left the venue</div>
                </div>
                <div class="card stat-card" style="align-items:flex-start; padding: 24px;">
                    <div style="font-size:13px; color:var(--text-main); font-weight:600; margin-bottom: 15px;">Attendance Rate</div>
                    <div style="font-size:32px; color:#4f46e5; font-weight:700; margin-bottom: 5px;">89.2%</div>
                    <div style="font-size:12px; color:#10b981;">+2.4% vs last event</div>
                </div>
                <div class="card stat-card" style="align-items:flex-start; padding: 24px;">
                    <div style="font-size:13px; color:var(--text-main); font-weight:600; margin-bottom: 15px;">No-show Count</div>
                    <div style="font-size:32px; color:#4f46e5; font-weight:700; margin-bottom: 5px;">43</div>
                    <div style="font-size:12px; color:var(--text-muted);">10.8% of expected</div>
                </div>
            </div>
            
            <div class="card" style="margin-bottom: 30px; padding: 24px; padding-bottom: 0px; max-width: 500px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 25px;">
                    <h3 style="margin:0; font-size: 15px;">Live Attendance Graph</h3>
                    <div style="display:flex; gap:15px; font-size:11px; color:var(--text-muted);">
                        <div style="display:flex; align-items:center; gap:5px;"><span style="width:8px; height:8px; border-radius:50%; background:#d97736;"></span> Check-ins</div>
                        <div style="display:flex; align-items:center; gap:5px;"><span style="width:8px; height:8px; border-radius:50%; background:#4f46e5;"></span> Check-outs</div>
                    </div>
                </div>
                <div style="height: 220px; position:relative; padding-left:30px; padding-bottom:30px;">
                    <!-- Y Axis -->
                    <div style="position:absolute; left:0; top:0; bottom:30px; display:flex; flex-direction:column; justify-content:space-between; font-size:10px; color:var(--text-muted); align-items:flex-end; width: 20px;">
                        <span>400</span><span>300</span><span>200</span><span>100</span><span>0</span>
                    </div>
                    <!-- Chart Area -->
                    <div style="height: 100%; border-bottom: 2px solid #e2e8f0; border-left: 2px solid #e2e8f0; position:relative;">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="overflow:visible; position:absolute;">
                            <!-- Check-outs -->
                            <path d="M 0,95 Q 20,90 40,75 T 100,40" fill="none" stroke="#4f46e5" stroke-width="2.5" />
                            <circle cx="0" cy="95" r="3" fill="#4f46e5" />
                            <circle cx="30" cy="85" r="3" fill="#4f46e5" />
                            <circle cx="70" cy="55" r="3" fill="#4f46e5" />
                            
                            <!-- Check-ins -->
                            <path d="M 0,85 Q 20,40 40,25 T 100,20" fill="none" stroke="#d97736" stroke-width="2.5" />
                            <circle cx="20" cy="50" r="3" fill="#d97736" />
                            <circle cx="50" cy="22" r="3" fill="#d97736" />
                            <circle cx="80" cy="18" r="3" fill="#d97736" />
                        </svg>
                    </div>
                    <!-- X Axis -->
                    <div style="position:absolute; left:30px; right:0; bottom:0; display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); padding-top:10px;">
                        <span>8 AM</span><span>10 AM</span><span>12 PM</span><span>2 PM</span><span>4 PM</span><span>6 PM</span>
                    </div>
                </div>
            </div>
            
            <div class="card" style="padding: 24px;">
                <h3 style="margin:0 0 5px 0; font-size: 15px;">Current Attendees (by session/area)</h3>
                <div style="font-size:18px; font-weight:700; margin-bottom:20px;">3428598145</div>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead>
                        <tr style="border-bottom:2px solid #e2e8f0; color:var(--text-main); text-align:left;">
                            <th style="padding:12px 0;">Location</th>
                            <th style="padding:12px 0;">Capacity</th>
                            <th style="padding:12px 0;">Current Count</th>
                            <th style="padding:12px 0;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:15px 0; color:var(--text-muted);">Main Hall - Opening Keynote</td>
                            <td style="padding:15px 0;">500</td>
                            <td style="padding:15px 0; font-weight:600;">342</td>
                            <td style="padding:15px 0;"><span style="color:#10b981; background:#10b98115; font-size:10px; padding:2px 6px; border-radius:10px;">Good</span></td>
                        </tr>
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:15px 0; color:var(--text-muted);">Workshop Room A</td>
                            <td style="padding:15px 0;">100</td>
                            <td style="padding:15px 0; font-weight:600;">85</td>
                            <td style="padding:15px 0;"><span style="color:#f97316; background:#f9731615; font-size:10px; padding:2px 6px; border-radius:10px;">Near Capacity</span></td>
                        </tr>
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:15px 0; color:var(--text-muted);">Workshop Room B</td>
                            <td style="padding:15px 0;">100</td>
                            <td style="padding:15px 0; font-weight:600;">100</td>
                            <td style="padding:15px 0;"><span style="color:#ef4444; background:#ef444415; font-size:10px; padding:2px 6px; border-radius:10px;">Full</span></td>
                        </tr>
                        <tr>
                            <td style="padding:15px 0; color:var(--text-muted);">Networking Lounge</td>
                            <td style="padding:15px 0;">200</td>
                            <td style="padding:15px 0; font-weight:600;">45</td>
                            <td style="padding:15px 0;"><span style="color:#10b981; background:#10b98115; font-size:10px; padding:2px 6px; border-radius:10px;">Good</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    static getEngagementHtml() {
        return `
            <div style="margin-bottom: 30px;">
                <h2 style="font-size:22px; margin-bottom: 5px;">Engagement Insights</h2>
                <p style="color:var(--text-muted); font-size:14px;">Analyze attendee participation and interaction</p>
            </div>
            
            <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px;">
                <div class="card stat-card" style="align-items:flex-start; padding: 24px;">
                    <div style="font-size:13px; color:var(--text-main); font-weight:600; margin-bottom: 15px;">Session Participation</div>
                    <div style="font-size:28px; color:#d97736; font-weight:700; margin-bottom: 5px;">87.5%</div>
                    <div style="font-size:12px; color:var(--text-muted);">Of checked-in attendees</div>
                </div>
                <div class="card stat-card" style="align-items:flex-start; padding: 24px;">
                    <div style="font-size:13px; color:var(--text-main); font-weight:600; margin-bottom: 15px;">Avg Session Attendance</div>
                    <div style="font-size:28px; color:#4f46e5; font-weight:700; margin-bottom: 5px;">278</div>
                    <div style="font-size:12px; color:var(--text-muted);">people per session</div>
                </div>
                <div class="card stat-card" style="align-items:flex-start; padding: 24px;">
                    <div style="font-size:13px; color:var(--text-main); font-weight:600; margin-bottom: 15px;">Interaction Level</div>
                    <div style="font-size:28px; color:#10b981; font-weight:700; margin-bottom: 5px;">High</div>
                    <div style="font-size:12px; color:var(--text-muted);">Based on Q&A and polls</div>
                </div>
                <div class="card stat-card" style="align-items:flex-start; padding: 24px;">
                    <div style="font-size:13px; color:var(--text-main); font-weight:600; margin-bottom: 15px;">Most Attended Session</div>
                    <div style="font-size:18px; color:var(--sidebar-bg); font-weight:600; margin-bottom: 5px;">Opening Keynote</div>
                    <div style="font-size:12px; color:var(--text-muted);">342 attendees</div>
                </div>
            </div>
            
            <div class="card" style="margin-bottom: 20px; padding: 24px;">
                <h3 style="margin:0 0 20px 0; font-size: 15px;">Key Engagement Metrics</h3>
                <div style="display:flex; gap: 40px;">
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:12px;">
                            <span style="font-weight:600;">Questions Asked</span>
                            <span style="color:#d97736;">248</span>
                        </div>
                        <div style="width:100%; height:6px; background:#f1f5f9; border-radius:3px;">
                            <div style="width:70%; height:100%; background:#d97736; border-radius:3px;"></div>
                        </div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:12px;">
                            <span style="font-weight:600;">Poll Responses</span>
                            <span style="color:#4f46e5;">312</span>
                        </div>
                        <div style="width:100%; height:6px; background:#f1f5f9; border-radius:3px;">
                            <div style="width:85%; height:100%; background:#4f46e5; border-radius:3px;"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                <div class="card" style="padding: 24px;">
                    <h3 style="margin:0 0 20px 0; font-size: 15px;">Session Popularity</h3>
                    <div style="display:flex; flex-direction:column; gap:20px;">
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:11px; color:var(--text-muted);">
                                <span>Opening Keynote</span>
                                <span>342 (86%)</span>
                            </div>
                            <div style="width:100%; height:4px; background:#f1f5f9;">
                                <div style="width:86%; height:100%; background:#d97736;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:11px; color:var(--text-muted);">
                                <span>AI in 2026 Panel</span>
                                <span>285 (80%)</span>
                            </div>
                            <div style="width:100%; height:4px; background:#f1f5f9;">
                                <div style="width:80%; height:100%; background:#4f46e5;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:11px; color:var(--text-muted);">
                                <span>Future of Web Dev</span>
                                <span>210 (58%)</span>
                            </div>
                            <div style="width:100%; height:4px; background:#f1f5f9;">
                                <div style="width:58%; height:100%; background:#1e3a8a;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:11px; color:var(--text-muted);">
                                <span>Cloud Security Workshop</span>
                                <span>145 (40%)</span>
                            </div>
                            <div style="width:100%; height:4px; background:#f1f5f9;">
                                <div style="width:40%; height:100%; background:#64748b;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card" style="padding: 24px;">
                    <h3 style="margin:0 0 20px 0; font-size: 15px;">Participation Trend</h3>
                    <div style="height: 180px; position:relative; padding-bottom:20px;">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="overflow:visible;">
                            <!-- Using cubic beziers for smooth curve like in the image -->
                            <path d="M 0,80 C 20,40 30,50 60,60 S 80,10 100,20" fill="none" stroke="#4f46e5" stroke-width="4" stroke-linecap="round" />
                        </svg>
                        <div style="position:absolute; left:0; right:0; bottom:0; display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted);">
                            <span>9 AM</span><span>11 AM</span><span>1 PM</span><span>3 PM</span><span>5 PM</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static getAnalyticsHtml() {
        const e = this.currentEvent;
        const stats = e.stats || { rsvps: 250, checkins: 180, engagement: 75, rating: 4.5, conversion: 80, nps: 60, participationTrend: [20, 40, 60, 80], popularSession: "N/A" };
        const checkinRate = stats.rsvps > 0 ? Math.round((stats.checkins / stats.rsvps) * 100) : 0;

        return `
            <div style="background-color: #F8FAFC; margin: -10px -20px; padding: 20px; border-radius: 12px; font-family: 'Inter', sans-serif;">
                <!-- Section 1: Dashboard Header -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 25px;">
                    <div>
                        <h2 style="font-size: 22px; font-weight: 800; color: #1E3A8A; margin: 0;">Event Performance Dash</h2>
                        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Comprehensive review of ${e.title} metrics</p>
                    </div>
                    <div style="display:flex; gap: 10px;">
                        <button class="btn btn-secondary" onclick="window.print()" style="background:white; border: 1px solid #E2E8F0; padding: 6px 12px; font-size: 12px; display:flex; align-items:center; gap:6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export PDF
                        </button>
                    </div>
                </div>

                <!-- Section 2: KPI Metrics -->
                <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 25px;">
                    <div class="card" style="padding: 15px; border-radius:12px; border:none; box-shadow: 0 2px 4px rgba(0,0,0,0.05); background: white;">
                        <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase;">RSVPs</div>
                        <div style="font-size: 22px; font-weight: 800; color: #0F172A; margin-top: 5px;">${stats.rsvps}</div>
                    </div>
                    <div class="card" style="padding: 15px; border-radius:12px; border:none; box-shadow: 0 2px 4px rgba(0,0,0,0.05); background: white;">
                        <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase;">Check-ins</div>
                        <div style="font-size: 22px; font-weight: 800; color: var(--primary); margin-top: 5px;">${stats.checkins}</div>
                    </div>
                    <div class="card" style="padding: 15px; border-radius:12px; border:none; box-shadow: 0 2px 4px rgba(0,0,0,0.05); background: white;">
                        <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase;">Engagement</div>
                        <div style="font-size: 22px; font-weight: 800; color: var(--info); margin-top: 5px;">${stats.engagement}%</div>
                    </div>
                    <div class="card" style="padding: 15px; border-radius:12px; border:none; box-shadow: 0 2px 4px rgba(0,0,0,0.05); background: white;">
                        <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase;">Rating</div>
                        <div style="font-size: 22px; font-weight: 800; color: #F59E0B; margin-top: 5px;">${stats.rating}</div>
                    </div>
                    <div class="card" style="padding: 15px; border-radius:12px; border:none; box-shadow: 0 2px 4px rgba(0,0,0,0.05); background: white;">
                        <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase;">NPS</div>
                        <div style="font-size: 22px; font-weight: 800; color: var(--sidebar-bg); margin-top: 5px;">${stats.nps || 65}</div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 2fr 1.2fr; gap: 20px;">
                    <!-- Section 3: Attendance Analytics -->
                    <div class="card" style="padding: 20px; border-radius:12px; border:none; box-shadow: 0 2px 4px rgba(0,0,0,0.05); background: white;">
                        <h3 style="font-size: 16px; font-weight: 700; color: #1E3A8A; margin-bottom: 20px;">Attendance Timeline</h3>
                        <div style="height: 250px; width: 100%;">
                            <canvas id="detailsAttendanceChart"></canvas>
                        </div>
                    </div>

                    <!-- Section 4: Success metrics -->
                    <div class="card" style="padding: 20px; border-radius:12px; border:none; box-shadow: 0 2px 4px rgba(0,0,0,0.05); background: white;">
                        <h3 style="font-size: 16px; font-weight: 700; color: #1E3A8A; margin-bottom: 20px;">Registration Mix</h3>
                        <div style="height: 180px; position:relative;">
                            <canvas id="detailsRegistrationPie"></canvas>
                        </div>
                        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #F1F5F9;">
                            <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                                <span style="font-size:12px; color:#64748b;">Target vs Actual</span>
                                <span style="font-size:12px; font-weight:700; color:#0F172A;">${stats.rsvps} / ${e.capacity}</span>
                            </div>
                            <div style="width:100%; height:8px; background:#F1F5F9; border-radius:4px; overflow:hidden;">
                                <div style="width:${Math.min(100, (stats.rsvps/e.capacity)*100)}%; height:100%; background:linear-gradient(90deg, #F97316, #EA580C); border-radius:4px;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 5: Session engagement -->
                <div class="card" style="padding: 20px; border-radius:12px; border:none; box-shadow: 0 2px 4px rgba(0,0,0,0.05); background: white; margin-top: 20px;">
                    <h3 style="font-size: 16px; font-weight: 700; color: #1E3A8A; margin-bottom: 20px;">Session Performance Analysis</h3>
                    <div style="height: 250px; width: 100%;">
                        <canvas id="detailsSessionChart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    static initAnalytics(eventId) {
        const e = DataStore.getEventById(eventId);
        if (!e) return;
        const stats = e.stats || { checkins: 180, rsvps: 250, engagement: 75 };

        setTimeout(() => {
            if (typeof Chart === 'undefined') return;

            // Helper for jitter
            const jitter = (val, range=5) => Math.max(0, val + (Math.random() * range - range/2));

            // Attendance Timeline
            const attCtx = document.getElementById('detailsAttendanceChart');
            if (attCtx) {
                // More realistic nonlinear growth
                const dataPoints = [
                    jitter(stats.checkins * 0.05), jitter(stats.checkins * 0.2), 
                    jitter(stats.checkins * 0.55), jitter(stats.checkins * 0.7), 
                    jitter(stats.checkins * 0.8), jitter(stats.checkins * 0.9), 
                    jitter(stats.checkins * 0.95), stats.checkins
                ];
                new Chart(attCtx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM'],
                        datasets: [{
                            label: 'Arrivals',
                            data: dataPoints,
                            borderColor: '#F97316',
                            backgroundColor: 'rgba(249, 115, 22, 0.05)',
                            borderWidth: 3,
                            tension: 0.35,
                            fill: true,
                            pointRadius: 4,
                            pointBackgroundColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
                            x: { grid: { display : false } }
                        }
                    }
                });
            }

            // Registration Mix
            const pieCtx = document.getElementById('detailsRegistrationPie');
            if (pieCtx) {
                new Chart(pieCtx.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Checked-In', 'No-Show', 'Pending'],
                        datasets: [{
                            data: [stats.checkins, stats.rsvps - stats.checkins, Math.max(0, e.capacity - stats.rsvps)],
                            backgroundColor: ['#22C55E', '#EF4444', '#E2E8F0'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '75%',
                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } }
                    }
                });
            }

            // Session Chart
            const sesCtx = document.getElementById('detailsSessionChart');
            if (sesCtx) {
                const sessionLabels = e.timeline && e.timeline.length ? e.timeline.map(s => s.name.substring(0, 15) + '...') : ['Session A', 'Session B', 'Session C', 'Session D'];
                new Chart(sesCtx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: sessionLabels,
                        datasets: [
                            { label: 'Feedback', data: sessionLabels.map(() => Math.floor(Math.random() * 20) + 10), backgroundColor: '#2563EB', borderRadius: 4 },
                            { label: 'Polls', data: sessionLabels.map(() => Math.floor(Math.random() * 50) + 30), backgroundColor: '#F97316', borderRadius: 4 }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
                            x: { grid: { display : false } }
                        }
                    }
                });
            }
        }, 100);
    }
}
