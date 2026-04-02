class CreateEventView {
    static render(eventId = null) {
        let e = { title: '', name: '', location: '', venue: '', date: '', capacity: '', description: '', timeline: [], stats: {} };
        let isEdit = false;
        
        if (eventId) {
            const found = DataStore.getEventById(eventId);
            if (found) {
                e = found;
                isEdit = true;
            }
        }

        this.currentTimeline = e.timeline || [];

        return `
            <div class="page-header">
                <div class="page-title">
                    <h2>${isEdit ? 'Manage Event' : 'Create / Manage Event'}</h2>
                    <p>${isEdit ? 'Update event details and schedule' : 'Create new events and manage event details'}</p>
                </div>
            </div>

            <div class="card" style="padding: 30px; margin-bottom: 30px; border-radius: 12px;">
                <h3 style="margin-bottom: 25px; font-size: 16px; font-weight: 700; color: #1E3A8A;">Event Details</h3>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 25px;">
                    <div class="form-group">
                        <label class="form-label" style="font-weight:600; font-size:13px; color:#475569;">Event Name *</label>
                        <input type="text" id="eventName" class="form-input" value="${e.title || e.name}" placeholder="Enter event name" style="padding: 12px; border: 1px solid #E2E8F0; width:100%;">
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-weight:600; font-size:13px; color:#475569;">Venue *</label>
                        <input type="text" id="eventVenue" class="form-input" value="${e.venue || e.location}" placeholder="Enter venue location" style="padding: 12px; border: 1px solid #E2E8F0; width:100%;">
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-weight:600; font-size:13px; color:#475569;">Date *</label>
                        <input type="date" id="eventDate" class="form-input" value="${e.date}" style="padding: 12px; border: 1px solid #E2E8F0; width:100%;">
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-weight:600; font-size:13px; color:#475569;">Capacity *</label>
                        <input type="number" id="eventCapacity" class="form-input" value="${e.capacity}" placeholder="Maximum attendees" style="padding: 12px; border: 1px solid #E2E8F0; width:100%;">
                    </div>
                </div>

                <div class="form-group" style="margin-top: 25px;">
                    <label class="form-label" style="font-weight:600; font-size:13px; color:#475569;">Event Description</label>
                    <textarea id="eventDescription" class="form-input" style="height: 100px; padding: 12px; border: 1px solid #E2E8F0; width:100%; resize:vertical;" placeholder="Enter event description">${e.description || ''}</textarea>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 25px;">
                    <div class="form-group">
                        <label class="form-label" style="font-weight:600; font-size:13px; color:#475569;">Event Poster</label>
                        <div style="display:flex; gap:10px;">
                            <input type="text" class="form-input" placeholder="No file selected" readonly style="flex:1; padding: 12px; background:#F8FAFC; border: 1px solid #E2E8F0;">
                            <button class="btn btn-secondary" style="padding: 0 15px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-weight:600; font-size:13px; color:#475569;">Session Timeline File</label>
                        <div style="display:flex; gap:10px;">
                            <input type="text" class="form-input" placeholder="No file selected" readonly style="flex:1; padding: 12px; background:#F8FAFC; border: 1px solid #E2E8F0;">
                            <button class="btn btn-secondary" style="padding: 0 15px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg></button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="padding: 30px; margin-bottom: 30px; border-radius: 12px;">
                <h3 style="margin-bottom: 25px; font-size: 16px; font-weight: 700; color: #1E3A8A;">Session Timeline</h3>
                
                <div class="table-responsive">
                    <table class="table" style="width:100%; border-collapse: collapse;">
                        <thead style="background: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
                            <tr>
                                <th style="text-align:left; padding: 12px; font-size:12px; text-transform: uppercase; color:#64748b;">Session Name</th>
                                <th style="text-align:left; padding: 12px; font-size:12px; text-transform: uppercase; color:#64748b;">Speaker</th>
                                <th style="text-align:left; padding: 12px; font-size:12px; text-transform: uppercase; color:#64748b;">Start Time</th>
                                <th style="text-align:left; padding: 12px; font-size:12px; text-transform: uppercase; color:#64748b;">End Time</th>
                                <th style="text-align:left; padding: 12px; font-size:12px; text-transform: uppercase; color:#64748b;">Location</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="sessionTbody">
                            <!-- Sessions added here -->
                        </tbody>
                    </table>
                </div>

                <div id="noSessions" style="padding: 20px; text-align:center; color:#64748b; font-size:13px; display: ${e.timeline.length ? 'none' : 'block'};">
                    No sessions added yet.
                </div>

                <div style="margin-top: 20px;">
                    <button id="btnAddSession" class="btn btn-secondary" style="background:#F97316; color:white; border:none; padding: 10px 20px; font-weight:600; font-size:13px;">+ Add Session</button>
                </div>
            </div>

            <div style="display:flex; gap:15px; margin-bottom: 50px;">
                <button id="btnCreateEvent" class="btn btn-primary" style="padding: 12px 30px; font-weight:700;">${isEdit ? 'Update Event' : 'Create Event'}</button>
                <button id="btnSaveDraft" class="btn btn-secondary" style="padding: 12px 25px; background:white; color:#64748b; border: 1px solid #E2E8F0;">Save as Draft</button>
                <button id="btnCancel" class="btn btn-secondary" style="padding: 12px 25px; background:white; color:#64748b; border: 1px solid #E2E8F0;">Cancel</button>
            </div>

            <!-- Modal for adding session -->
            <div id="sessionModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; align-items:center; justify-content:center;">
                <div class="card" style="width: 500px; padding: 30px;">
                    <h3 style="margin-bottom: 20px;">Add New Session</h3>
                    <div class="form-group" style="margin-bottom:15px;">
                        <label class="form-label">Session Name</label>
                        <input type="text" id="sName" class="form-input" placeholder="e.g. Opening Keynote">
                    </div>
                    <div class="form-group" style="margin-bottom:15px;">
                        <label class="form-label">Speaker</label>
                        <input type="text" id="sSpeaker" class="form-input" placeholder="e.g. Dr. Jane Smith">
                    </div>
                    <div style="display:flex; gap:15px; margin-bottom:15px;">
                        <div class="form-group" style="flex:1;">
                            <label class="form-label">Start Time</label>
                            <input type="time" id="sStart" class="form-input">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label class="form-label">End Time</label>
                            <input type="time" id="sEnd" class="form-input">
                        </div>
                    </div>
                    <div class="form-group" style="margin-bottom:25px;">
                        <label class="form-label">Location</label>
                        <input type="text" id="sLocation" class="form-input" placeholder="e.g. Hall A">
                    </div>
                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button id="btnCancelSession" class="btn btn-secondary">Cancel</button>
                        <button id="btnSaveSession" class="btn btn-primary">Save Session</button>
                    </div>
                </div>
            </div>
        `;
    }

    static init(eventId = null) {
        this.currentId = eventId;
        this.renderTimeline();

        document.getElementById('btnAddSession').addEventListener('click', () => {
            document.getElementById('sessionModal').style.display = 'flex';
        });

        document.getElementById('btnCancelSession').addEventListener('click', () => {
            document.getElementById('sessionModal').style.display = 'none';
        });

        document.getElementById('btnSaveSession').addEventListener('click', () => {
            const session = {
                id: Date.now().toString(),
                name: document.getElementById('sName').value.trim(),
                speaker: document.getElementById('sSpeaker').value.trim(),
                start: document.getElementById('sStart').value,
                end: document.getElementById('sEnd').value,
                location: document.getElementById('sLocation').value.trim()
            };

            if (!session.name || !session.speaker || !session.start || !session.end || !session.location) {
                alert('Please fill out all session fields.');
                return;
            }

            if (session.start >= session.end) {
                alert('Session end time must be after start time.');
                return;
            }
            
            this.currentTimeline.push(session);
            this.renderTimeline();
            document.getElementById('sessionModal').style.display = 'none';
            // Clear inputs
            ['sName','sSpeaker','sStart','sEnd','sLocation'].forEach(id => document.getElementById(id).value = '');
        });

        document.getElementById('btnCreateEvent').addEventListener('click', () => {
            const eventData = {
                title: document.getElementById('eventName').value.trim(),
                venue: document.getElementById('eventVenue').value.trim(),
                date: document.getElementById('eventDate').value,
                capacity: parseInt(document.getElementById('eventCapacity').value),
                description: document.getElementById('eventDescription').value.trim(),
                timeline: this.currentTimeline,
                managerName: Auth.getCurrentUser().name,
                managerId: Auth.getCurrentUser().id,
                domain: Auth.getCurrentUser().domain,
                status: 'pending' 
            };

            if (!eventData.title || !eventData.venue || !eventData.date || isNaN(eventData.capacity)) {
                alert('Please fill out all required fields (Name, Venue, Date, Capacity).');
                return;
            }

            if (eventData.capacity <= 0) {
                alert('Capacity must be greater than zero.');
                return;
            }

            if (this.currentId) {
                DataStore.updateEvent(this.currentId, eventData);
                alert('Event updated successfully!');
            } else {
                DataStore.addEvent(eventData);
                alert('Event created successfully!');
            }
            window.location.hash = '#/my-events';
        });

        document.getElementById('btnSaveDraft').addEventListener('click', () => {
            const eventData = {
                title: document.getElementById('eventName').value.trim(),
                venue: document.getElementById('eventVenue').value.trim(),
                date: document.getElementById('eventDate').value,
                capacity: parseInt(document.getElementById('eventCapacity').value),
                description: document.getElementById('eventDescription').value.trim(),
                timeline: this.currentTimeline,
                managerName: Auth.getCurrentUser().name,
                managerId: Auth.getCurrentUser().id,
                domain: Auth.getCurrentUser().domain,
                status: 'pending' // Note: Using 'pending' to match data modeling, or we could use 'draft' if supported
            };

            if (!eventData.title) {
                alert('Event name is required to save a draft.');
                return;
            }

            if (this.currentId) {
                DataStore.updateEvent(this.currentId, { ...eventData, status: 'pending' });
                alert('Draft updated successfully!');
            } else {
                DataStore.addEvent({ ...eventData, status: 'pending' });
                alert('Draft saved successfully!');
            }
            window.location.hash = '#/my-events';
        });

        document.getElementById('btnCancel').addEventListener('click', () => {
            window.location.hash = '#/my-events';
        });
    }

    static renderTimeline() {
        const tbody = document.getElementById('sessionTbody');
        const noSessions = document.getElementById('noSessions');
        
        if (!tbody) return;

        if (this.currentTimeline.length === 0) {
            noSessions.style.display = 'block';
            tbody.innerHTML = '';
        } else {
            noSessions.style.display = 'none';
            tbody.innerHTML = this.currentTimeline.map((s, idx) => `
                <tr style="border-bottom: 1px solid #F1F5F9;">
                    <td style="padding: 12px; font-size: 14px; font-weight:500;">${s.name}</td>
                    <td style="padding: 12px; font-size: 14px; color:#64748b;">${s.speaker}</td>
                    <td style="padding: 12px; font-size: 14px; color:#64748b;">${s.start}</td>
                    <td style="padding: 12px; font-size: 14px; color:#64748b;">${s.end}</td>
                    <td style="padding: 12px; font-size: 14px; color:#64748b;">${s.location}</td>
                    <td style="padding: 12px; text-align:right;">
                        <button class="btn-delete-session" data-idx="${idx}" style="background:none; border:none; color:#EF4444; cursor:pointer;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </td>
                </tr>
            `).join('');

            tbody.querySelectorAll('.btn-delete-session').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = btn.getAttribute('data-idx');
                    this.currentTimeline.splice(idx, 1);
                    this.renderTimeline();
                });
            });
        }
    }
}
