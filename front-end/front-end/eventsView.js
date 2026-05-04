class EventsView {
  static renderAllEvents() {
    this.initAllEvents();
    let events = DataStore.getEvents();

    let html = `
            <div class="page-header">
                <div class="page-title">
                    <h2>All Events</h2>
                    <p>Discover and register for upcoming events</p>
                </div>
            </div>
            
            <div class="events-list">
                ${events.map((ev) => this.renderEventCard(ev, true)).join("")}
                ${events.length === 0 ? "<p>No events found.</p>" : ""}
            </div>
        `;
    return html;
  }

  static renderMyEvents() {
    this.initMyEvents();
    let events = DataStore.getEvents();
    const user = Auth.getCurrentUser();

    // Filter events for the current domain
    if (user.role === "superuser") {
      events = events.filter((e) => e.domain === user.domain);
    }

    const upcoming = events.filter(
      (e) => e.status === "upcoming" || e.status === "live",
    );
    const completed = events.filter((e) => e.status === "completed").length;
    const pending = events.filter((e) => e.status === "pending").length;

    let html = `
            <div class="page-header">
                <div class="page-title" style="display:flex; flex-direction:column; gap:6px;">
                    <h2 style="margin:0; font-size:28px;">My Events</h2>
                    <p style="margin:0; color:var(--text-muted); font-size:14px;">View and manage the full lifecycle of your domain events</p>
                </div>
                ${
                  Auth.hasAccess("create_event")
                    ? `
                    <a href="#/create-event" class="btn btn-primary" id="btnCreateEvent" style="padding: 10px 24px; border-radius: 8px; font-weight:600; display:flex; align-items:center; gap:8px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Create New Event
                    </a>
                `
                    : ""
                }
            </div>
            
            <div class="dashboard-grid" style="margin-bottom: 35px;">
                <div class="card stat-card" style="border-bottom: 3px solid #6366f1;">
                    <div class="stat-header"><h3>Total Events</h3></div>
                    <div class="stat-value">${events.length}</div>
                    <div class="stat-desc">Across all stages</div>
                </div>
                <div class="card stat-card" style="border-bottom: 3px solid #ef4444;">
                    <div class="stat-title">Live & Upcoming</div>
                    <div class="stat-value" style="color:#ef4444;">${upcoming.length}</div>
                    <div class="stat-desc">Currently running</div>
                </div>
                <div class="card stat-card" style="border-bottom: 3px solid #10b981;">
                    <div class="stat-header"><h3>Completed</h3></div>
                    <div class="stat-value" style="color:#10b981;">${completed}</div>
                    <div class="stat-desc">Archived records</div>
                </div>
                <div class="card stat-card" style="border-bottom: 3px solid #f97316;">
                    <div class="stat-header"><h3>Pending</h3></div>
                    <div class="stat-value" style="color:#f97316;">${pending}</div>
                    <div class="stat-desc">Awaiting setup</div>
                </div>
            </div>

            <div class="events-list">
                ${events.map((ev) => this.renderEventCard(ev, false)).join("")}
                ${events.length === 0 ? '<div class="card" style="text-align:center; padding:40px; color:var(--text-muted);">No events found in your domain. Try creating a new one!</div>' : ""}
            </div>
        `;
    return html;
  }

  static renderEventCard(ev, isPublicView) {
    const canManage = Auth.hasAccess("manage_event", ev);
    const isPending = ev.status === "pending";
    const isLive = ev.status === "live";

    let actionsHtml = "";
    if (isPublicView) {
      actionsHtml = `<a href="#/event-details?id=${ev.id}" class="btn btn-secondary btn-block">👁 View Details</a>`;
    } else {
      actionsHtml = `
                ${
                  canManage
                    ? `
                    <a href="#/event-details?id=${ev.id}" class="btn btn-primary btn-block" style="background:${isLive ? "#ef4444" : "var(--primary)"}; border-color:${isLive ? "#ef4444" : "var(--primary)"};">📊 Dashboard</a>
                    <a href="#/edit-event?id=${ev.id}" class="btn btn-secondary btn-block">✏️ Manage</a>
                    <button class="btn btn-danger btn-block delete-event-btn" data-id="${ev.id}" data-name="${(ev.title || "").replace(/"/g, "&quot;")}">🗑 Delete</button>
                `
                    : `
                    <a href="#/event-details?id=${ev.id}" class="btn btn-secondary btn-block">👁 View Details</a>
                `
                }
            `;
    }

    // Mock Manager Phone
    let mNameHash = 0;
    if (ev.managerName) {
      for (let i = 0; i < ev.managerName.length; i++)
        mNameHash += ev.managerName.charCodeAt(i);
    }
    const managerPhone =
      "+91 9" + (mNameHash * 11111111).toString().padStart(9, "0").slice(0, 9);

    return `
            <div class="card event-item" style="border-left: 5px solid ${ev.status === "live" ? "#ef4444" : isPending ? "#f97316" : ev.status === "completed" ? "#10b981" : "var(--primary)"}; padding: 24px; display:flex; flex-direction:row; gap:30px; margin-bottom:20px; transition: transform 0.2s, box-shadow 0.2s;">
                <div class="event-details" style="flex:1;">
                    <div class="event-title" style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                        <h3 style="margin:0; font-size:18px; font-weight:700;">${ev.title}</h3>
                        <span class="status-badge status-${ev.status}" style="padding:4px 12px; border-radius:12px; font-size:11px; text-transform:uppercase; font-weight:700; letter-spacing:0.5px; background:${ev.status === "live" ? "#ef4444" : ""}; color:${ev.status === "live" ? "white" : ""};">${ev.status}</span>
                    </div>
                    <div class="event-meta" style="display:flex; flex-wrap:wrap; gap:20px; margin-bottom:20px; font-size:13px; color:var(--text-muted);">
                        <div style="display:flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${ev.date || "TBD"}</div>
                        <div style="display:flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${ev.location || "TBD"}</div>
                        <div style="display:flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${isPending ? "0" : ev.attendees || 0}/${ev.capacity || "TBD"} Attendees</div>
                    </div>
                    
                    <div style="border-top: 1px solid #f1f5f9; padding-top: 15px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <div style="font-size:12px; color:var(--text-muted);">Manager: <span style="font-weight:600; color:var(--text-main); font-style:normal;">${isPending ? 'TBD' : (ev.managerName || 'System Admin')}</span></div>
                            <div style="font-size:12px; color:var(--text-muted);">On Sight Co Ordinator: <span style="font-weight:600; color:var(--text-main); font-style:normal;">${isPending ? 'TBD' : (ev.coordinatorName || 'Alex Thompson')}</span></div>
                        </div>
                        <div style="font-size:12px; color:var(--text-muted);">${ev.sessions || 0} Sessionscheduled</div>
                    </div>
                </div>
                <div class="event-actions" style="width:160px; display:flex; flex-direction:column; gap:10px; justify-content:center;">
                    ${actionsHtml}
                </div>
            </div>
        `;
  }

  static initMyEvents() {
    this.attachEventListeners();
  }

  static initAllEvents() {
    this.attachEventListeners();
  }

  static attachEventListeners() {
    if (!window.__eventsViewBound) {
      document.addEventListener("click", (e) => {
        const deleteBtn = e.target.closest(".delete-event-btn");
        if (deleteBtn) {
          const id = deleteBtn.dataset.id;
          const name = deleteBtn.dataset.name;
          if (confirm(`Are you sure you want to delete "${name}"?`)) {
            DataStore.deleteEvent(id);
            const main = document.getElementById("mainContent");
            if (main) main.innerHTML = this.renderMyEvents();
          }
        }
      });
      window.__eventsViewBound = true;
    }
  }
}
