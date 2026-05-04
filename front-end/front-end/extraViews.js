class EngagementView {
    static render() {
        return `
            <div class="page-header" style="margin-bottom: 20px;">
                <div class="page-title">
                    <h2>Engagement Tools</h2>
                    <p>Manage polls, Q&A, and session feedback in real-time</p>
                </div>
            </div>
            
            <div class="tabs" id="engagementTabs" style="border-bottom: 1px solid var(--border-color); margin-bottom: 20px;">
                <div class="tab active" data-target="poll" style="padding:10px 0;"><span style="color:var(--primary);">📊</span> Poll Management</div>
                <div class="tab" data-target="qa" style="padding:10px 0;"><span>💬</span> Attendee Questions</div>
                <div class="tab" data-target="feedback" style="padding:10px 0;"><span>⭐</span> Session Feedback</div>
            </div>
            
            <div id="engagementContent"></div>
        `;
    }

    static init() {
        const tabs = document.querySelectorAll('#engagementTabs .tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => {
                    t.classList.remove('active');
                    const icon = t.querySelector('span');
                    if (icon) t.innerHTML = t.textContent; // stripping span color
                });
                const targetTab = e.currentTarget;
                targetTab.classList.add('active');
                
                const parts = targetTab.textContent.split(' ');
                targetTab.innerHTML = `<span style="color:var(--primary);">${parts[0]}</span> ${parts.slice(1).join(' ')}`;
                
                this.renderTab(targetTab.getAttribute('data-target'));
            });
        });

        // Initialize first tab
        this.renderTab('poll');
    }

    static renderTab(tabId) {
        const content = document.getElementById('engagementContent');
        if (tabId === 'poll') {
            content.innerHTML = this.getPollHtml();
            this.attachPollListeners();
        } else if (tabId === 'qa') {
            content.innerHTML = this.getQAHtml();
            this.attachQAListeners();
        } else if (tabId === 'feedback') {
            content.innerHTML = this.getFeedbackHtml();
        }
    }

    static getPollHtml() {
        return `
            <button class="btn btn-primary" id="createNewPollBtn" style="margin-bottom: 24px;">+ Create New Poll</button>
            
            <div id="pollsContainer">
                <div class="card poll-card" style="padding: 30px; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 30px;">
                        <div>
                            <div style="display:flex; align-items:center; gap: 12px; margin-bottom: 8px;">
                                <h3 style="font-size: 18px; font-weight: 600;">What topic would you like to explore next?</h3>
                                <span class="badge badge-success poll-status">Live</span>
                            </div>
                            <p style="color: var(--text-muted); font-size: 14px;">Opening Keynote • 120 total votes</p>
                        </div>
                        <div style="display:flex; gap: 10px;">
                            <button class="btn btn-danger toggle-poll-btn">⏹ Close Poll</button>
                            <button class="btn btn-secondary delete-poll-btn" style="padding: 10px 14px;">🗑</button>
                        </div>
                    </div>
                    
                    <div class="bar-chart-wrapper" style="height: 250px; border-bottom: 1px dashed var(--border-color); border-left: 1px dashed var(--border-color); padding-left: 20px; position:relative;">
                        <div style="position: absolute; left: -20px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; color: var(--text-muted); font-size: 12px;">
                            <span>60</span><span>45</span><span>30</span><span>15</span><span>0</span>
                        </div>
                        
                        <div class="bar-group" style="margin-left: 20px;">
                            <div class="bar primary" style="height: 75%; width: 80%;"></div>
                            <span class="bar-label" style="text-align:center;">Machine Learning<br>(45)</span>
                        </div>
                        <div class="bar-group">
                            <div class="bar primary" style="height: 55%; width: 80%;"></div>
                            <span class="bar-label" style="text-align:center;">Cloud Computing<br>(33)</span>
                        </div>
                        <div class="bar-group">
                            <div class="bar primary" style="height: 30%; width: 80%;"></div>
                            <span class="bar-label" style="text-align:center;">Blockchain<br>(18)</span>
                        </div>
                        <div class="bar-group">
                            <div class="bar primary" style="height: 40%; width: 80%;"></div>
                            <span class="bar-label" style="text-align:center;">Cybersecurity<br>(24)</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static getQAHtml() {
        const questions = [
            { id: 'q1', text: 'How will AI models impact the job market in the next 5 years?', author: 'Priya Sharma' },
            { id: 'q2', text: 'Can we get access to these slides after the presentation?', author: 'Anonymous' },
            { id: 'q3', text: 'Where is lunch being served today?', author: 'Sarah Smith' },
            { id: 'q4', text: 'Are we going to cover the new API endpoints in this talk?', author: 'David L.' },
            { id: 'q5', text: 'Is there a dedicated channel for post-event discussion?', author: 'Emily Chen' },
            { id: 'q6', text: 'What is the Wi-Fi password for the main hall?', author: 'Manish Kumar' },
            { id: 'q7', text: 'How do I get my certificate of participation?', author: 'Anonymous' }
        ];

        let listHtml = questions.map(q => `
            <div class="qa-item" style="padding:15px; border:1px solid var(--border-color); border-radius:8px; background:white;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div style="font-weight:600; margin-bottom:5px;">${q.text}</div>
                        <div style="color:var(--text-muted); font-size:12px;">Asked by ${q.author} • <span class="qa-status">Pending</span></div>
                    </div>
                    <div style="display:flex; gap:10px;" class="qa-actions">
                        <button class="btn btn-primary btn-sm qa-attend">Answer</button>
                        <button class="btn btn-danger btn-sm qa-dismiss">Dismiss</button>
                    </div>
                </div>
                
                <div class="qa-reply-box" style="display:none; margin-top: 15px; border-top: 1px dashed var(--border-color); padding-top: 15px;">
                    <textarea class="qa-reply-text" placeholder="Type your answer here..." style="width:100%; height: 60px; padding: 10px; border:1px solid var(--border-color); border-radius:6px; margin-bottom: 10px; font-family:inherit; resize:vertical;"></textarea>
                    <div style="display:flex; justify-content:flex-end; gap: 10px;">
                        <button class="btn btn-secondary btn-sm qa-cancel">Cancel</button>
                        <button class="btn btn-success btn-sm qa-send" style="background:var(--success); color:white; border:none;">Send Reply</button>
                    </div>
                </div>
                <div class="qa-reply-display" style="display:none; margin-top: 10px; padding: 10px; background: var(--sidebar-bg); border-radius: 6px; font-size: 13px;">
                    <strong>Your Reply:</strong> <span class="qa-reply-content"></span>
                </div>
            </div>
        `).join('');

        return `
            <div class="card" style="padding: 30px;">
                <h3 style="margin-bottom: 20px;">Attendee Questions Platform</h3>
                
                <div id="qaList" style="display:flex; flex-direction:column; gap:15px;">
                    ${listHtml}
                </div>
            </div>
        `;
    }

    static getFeedbackHtml() {
        return `
            <div class="dashboard-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 30px;">
                <div class="card stat-card">
                    <div class="stat-header"><h3>Average Rating</h3><span style="color:#F59E0B; font-size:16px;">⭐</span></div>
                    <div class="stat-value" style="color:var(--text-main);">4.8 / 5.0</div>
                    <div class="stat-desc">Based on 344 reviews</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-header"><h3>Net Promoter Score</h3><span style="font-size:16px;">📈</span></div>
                    <div class="stat-value" style="color:var(--primary);">+72</div>
                    <div class="stat-desc">Excellent</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-header"><h3>Total Responses</h3><span style="font-size:16px;">📝</span></div>
                    <div class="stat-value" style="color:var(--info);">344</div>
                    <div class="stat-desc">45% response rate</div>
                </div>
            </div>
            <div class="card" style="padding: 30px;">
                <h3 style="margin-bottom: 20px;">Session Feedback Comments</h3>
                <div style="display:flex; flex-direction:column; gap:15px;">
                    <div style="padding:15px; background:var(--sidebar-bg); border-radius:8px; display:flex; gap:15px; align-items:flex-start;">
                        <div style="background:var(--primary); color:white; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">JD</div>
                        <div>
                            <div style="font-weight:600; margin-bottom:4px;">John Doe <span style="color:#F59E0B;">⭐⭐⭐⭐⭐</span></div>
                            <div style="color:var(--text-muted); font-size:14px; margin-bottom:8px;">"Thoroughly enjoyed the opening keynote. The insights on predictive models were exactly what our team was looking for."</div>
                            <div style="font-size:12px; color:var(--text-muted);">Session: Opening Keynote • 1 hour ago</div>
                        </div>
                    </div>
                    <div style="padding:15px; background:var(--sidebar-bg); border-radius:8px; display:flex; gap:15px; align-items:flex-start;">
                        <div style="background:var(--info); color:white; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">SM</div>
                        <div>
                            <div style="font-weight:600; margin-bottom:4px;">Sarah Mehta <span style="color:#F59E0B;">⭐⭐⭐⭐</span></div>
                            <div style="color:var(--text-muted); font-size:14px; margin-bottom:8px;">"Great panel discussion. Just wish there was more time for audience Q&A at the end."</div>
                            <div style="font-size:12px; color:var(--text-muted);">Session: Panel - AI Ethics • 2 hours ago</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static attachPollListeners() {
        const createBtn = document.getElementById('createNewPollBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                const modalHtml = `
                <div id="createPollModalOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999; animation: fadeIn 0.2s ease;">
                    <div style="background:white; padding:30px; border-radius:12px; max-width:500px; width:90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: scaleUp 0.2s ease;">
                        <h3 style="margin:0 0 20px; font-size:20px; color:var(--text-main);">Create New Poll</h3>
                        
                        <div class="form-group" style="margin-bottom:15px;">
                            <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:500; color:var(--text-muted)">Poll Question</label>
                            <input type="text" id="pollQuestionInput" placeholder="e.g. What topic should we cover next?" style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:6px; font-family:inherit;">
                        </div>
                        
                        <div style="margin-bottom:20px;">
                            <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:500; color:var(--text-muted)">Poll Options</label>
                            <input type="text" class="pollOptionInput" placeholder="Option 1" style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:8px; font-family:inherit;">
                            <input type="text" class="pollOptionInput" placeholder="Option 2" style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:8px; font-family:inherit;">
                            <input type="text" class="pollOptionInput" placeholder="Option 3 (Optional)" style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:8px; font-family:inherit;">
                            <input type="text" class="pollOptionInput" placeholder="Option 4 (Optional)" style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:6px; font-family:inherit;">
                        </div>
                        
                        <div style="display:flex; justify-content:flex-end; gap:12px;">
                            <button id="cancelPollBtn" class="btn btn-secondary">Cancel</button>
                            <button id="submitPollBtn" class="btn btn-primary" style="background:var(--primary); color:white; border:none;">Launch Poll</button>
                        </div>
                    </div>
                </div>
                `;
                
                let modalContainer = document.getElementById('modal-container');
                if (!modalContainer) {
                    modalContainer = document.createElement('div');
                    modalContainer.id = 'modal-container';
                    document.body.appendChild(modalContainer);
                }
                modalContainer.innerHTML = modalHtml;
                
                document.getElementById('cancelPollBtn').onclick = () => {
                    modalContainer.innerHTML = '';
                };
                
                document.getElementById('submitPollBtn').onclick = () => {
                    const question = document.getElementById('pollQuestionInput').value.trim();
                    const options = Array.from(document.querySelectorAll('.pollOptionInput'))
                                         .map(input => input.value.trim())
                                         .filter(val => val !== '');
                    
                    if (!question || options.length < 2) {
                        alert("Please provide a question and at least two options.");
                        return;
                    }
                    
                    let barsHtml = '';
                    options.forEach(opt => {
                        barsHtml += `
                        <div class="bar-group" style="margin-left: ${options.length > 2 ? '10px' : '30px'};">
                            <div class="bar primary" style="height: 0%; width: 80%; transition: height 1s ease;"></div>
                            <span class="bar-label" style="text-align:center; font-size:12px; margin-top:8px;">${opt}<br>(0)</span>
                        </div>`;
                    });

                    const newPoll = document.createElement('div');
                    newPoll.className = 'card poll-card';
                    newPoll.style.padding = '30px';
                    newPoll.style.marginBottom = '20px';
                    newPoll.style.animation = 'fadeIn 0.3s ease';
                    newPoll.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 30px;">
                            <div>
                                <div style="display:flex; align-items:center; gap: 12px; margin-bottom: 8px;">
                                    <h3 style="font-size: 18px; font-weight: 600;">${question}</h3>
                                    <span class="badge badge-success poll-status" style="animation: pulse 2s infinite;">Live</span>
                                </div>
                                <p style="color: var(--text-muted); font-size: 14px;">General Session • 0 total votes</p>
                            </div>
                            <div style="display:flex; gap: 10px;">
                                <button class="btn btn-danger toggle-poll-btn">⏹ Close Poll</button>
                                <button class="btn btn-secondary delete-poll-btn" style="padding: 10px 14px;">🗑</button>
                            </div>
                        </div>
                        <div class="bar-chart-wrapper" style="height: 200px; border-bottom: 1px dashed var(--border-color); border-left: 1px dashed var(--border-color); padding-left: 20px; position:relative; display:flex;">
                            <div style="position: absolute; left: -20px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; color: var(--text-muted); font-size: 12px;">
                                <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
                            </div>
                            ${barsHtml}
                        </div>
                    `;
                    document.getElementById('pollsContainer').prepend(newPoll);
                    EngagementView.attachCardListeners(newPoll);
                    
                    modalContainer.innerHTML = '';
                    alert("Poll successfully launched to all attendees!");
                };
            });
        }

        // Attach listeners to existing polls
        document.querySelectorAll('.poll-card').forEach(card => this.attachCardListeners(card));
    }

    static attachCardListeners(card) {
        const toggleBtn = card.querySelector('.toggle-poll-btn');
        const deleteBtn = card.querySelector('.delete-poll-btn');
        const badge = card.querySelector('.poll-status');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                const isClosing = e.target.textContent.includes('Close');
                if (isClosing) {
                    e.target.textContent = '▶️ Reopen Poll';
                    e.target.classList.replace('btn-danger', 'btn-primary');
                    if (badge) {
                        badge.textContent = 'Closed';
                        badge.classList.replace('badge-success', 'badge-secondary');
                        badge.style.background = 'var(--text-muted)';
                    }
                } else {
                    e.target.textContent = '⏹ Close Poll';
                    e.target.classList.replace('btn-primary', 'btn-danger');
                    if (badge) {
                        badge.textContent = 'Live';
                        badge.classList.replace('badge-secondary', 'badge-success');
                        badge.style.background = 'var(--success)';
                    }
                }
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const titleNode = card.querySelector('h3');
                const pollTitle = titleNode ? titleNode.textContent : 'this poll';

                const modalHtml = `
                <div id="deletePollModalOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999; animation: fadeIn 0.2s ease;">
                    <div style="background:white; padding:30px; border-radius:12px; max-width:400px; width:90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: scaleUp 0.2s ease;">
                        <div style="width:50px; height:50px; background:rgba(239, 68, 68, 0.1); color:#ef4444; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
                            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </div>
                        <h3 style="margin:0 0 10px; font-size:18px; text-align:center; color:var(--text-main);">Confirm Deletion</h3>
                        <p style="margin:0 0 24px; font-size:14px; color:var(--text-muted); text-align:center; line-height:1.5;">Are you completely sure you want to delete the poll: <strong>"${pollTitle}"</strong>? <br>This action cannot be undone.</p>
                        <div style="display:flex; gap:12px;">
                            <button id="cancelPollDelBtn" class="btn btn-secondary" style="flex:1;">Cancel</button>
                            <button id="confirmPollDelBtn" class="btn btn-danger" style="flex:1;">Yes, Delete Poll</button>
                        </div>
                    </div>
                </div>
                `;

                let modalContainer = document.getElementById('modal-container');
                if (!modalContainer) {
                    modalContainer = document.createElement('div');
                    modalContainer.id = 'modal-container';
                    document.body.appendChild(modalContainer);
                }
                modalContainer.innerHTML = modalHtml;

                document.getElementById('cancelPollDelBtn').onclick = () => {
                    modalContainer.innerHTML = '';
                };

                document.getElementById('confirmPollDelBtn').onclick = () => {
                    modalContainer.innerHTML = '';
                    card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        card.remove();
                    }, 200);
                };
            });
        }
    }

    static attachQAListeners() {
        document.querySelectorAll('.qa-item').forEach(item => {
            const attendBtn = item.querySelector('.qa-attend');
            const dismissBtn = item.querySelector('.qa-dismiss');
            const cancelBtn = item.querySelector('.qa-cancel');
            const sendBtn = item.querySelector('.qa-send');
            
            const actions = item.querySelector('.qa-actions');
            const replyBox = item.querySelector('.qa-reply-box');
            const replyText = item.querySelector('.qa-reply-text');
            const replyDisplay = item.querySelector('.qa-reply-display');
            const replyContent = item.querySelector('.qa-reply-content');
            const statusBox = item.querySelector('.qa-status');

            if (attendBtn) {
                attendBtn.addEventListener('click', () => {
                    actions.style.display = 'none';
                    replyBox.style.display = 'block';
                });
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    replyBox.style.display = 'none';
                    actions.style.display = 'flex';
                });
            }
            if (sendBtn) {
                sendBtn.addEventListener('click', () => {
                    const text = replyText.value.trim();
                    if (!text) {
                        alert("Please type a reply before sending.");
                        return;
                    }
                    replyBox.style.display = 'none';
                    replyContent.textContent = text;
                    replyDisplay.style.display = 'block';
                    
                    statusBox.innerHTML = '<span style="color:var(--success); font-weight:600;">Answered ✔️</span>';
                    item.style.background = 'var(--sidebar-bg)';
                });
            }
            if (dismissBtn) {
                dismissBtn.addEventListener('click', () => item.remove());
            }
        });
    }
}

class ReportsView {
    static render() {
        return `
            <div class="page-header" style="margin-bottom: 20px;">
                <div class="page-title">
                    <h2>Reports</h2>
                    <p>Download analytics and compare past events</p>
                </div>
            </div>
            

            
            <div class="card" style="margin-bottom: 30px; background: transparent; padding: 0; box-shadow: none;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                    <h3 style="font-size: 16px;">Available Reports</h3>
                    <button class="btn btn-secondary">⬇️ Export All</button>
                </div>
                
                <div class="report-list">
                    <div class="report-item">
                        <div class="report-icon">📄</div>
                        <div class="report-details">
                            <div class="report-title">Annual Tech Summit Report</div>
                            <div class="report-meta">Mar 5, 2026 <span class="badge">Post-Event</span></div>
                        </div>
                        <div class="report-stats">
                            <div class="report-stat-col">
                                <span class="report-stat-label">Attendance</span>
                                <span class="report-stat-value">89%</span>
                            </div>
                            <div class="report-stat-col">
                                <span class="report-stat-label">Engagement</span>
                                <span class="report-stat-value blue">87%</span>
                            </div>
                            <div class="report-stat-col">
                                <span class="report-stat-label">Rating</span>
                                <span style="font-weight:600; color:var(--text-main);">4.6/5</span>
                            </div>
                        </div>
                        <div class="report-actions">
                            <button class="btn btn-secondary btn-sm">⬇️ PDF</button>
                            <button class="btn btn-secondary btn-sm">⬇️ CSV</button>
                        </div>
                    </div>
                    
                    <div class="report-item">
                        <div class="report-icon">📄</div>
                        <div class="report-details">
                            <div class="report-title">Spring Networking Report</div>
                            <div class="report-meta">Mar 3, 2026 <span class="badge">Post-Event</span></div>
                        </div>
                        <div class="report-stats">
                            <div class="report-stat-col">
                                <span class="report-stat-label">Attendance</span>
                                <span class="report-stat-value" style="color:var(--info);">91%</span>
                            </div>
                            <div class="report-stat-col">
                                <span class="report-stat-label">Engagement</span>
                                <span class="report-stat-value blue" style="color:var(--sidebar-bg);">82%</span>
                            </div>
                            <div class="report-stat-col">
                                <span class="report-stat-label">Rating</span>
                                <span style="font-weight:600; color:var(--text-main);">4.4/5</span>
                            </div>
                        </div>
                        <div class="report-actions">
                            <button class="btn btn-secondary btn-sm">⬇️ PDF</button>
                            <button class="btn btn-secondary btn-sm">⬇️ CSV</button>
                        </div>
                    </div>
                    
                    <div class="report-item">
                        <div class="report-icon">📄</div>
                        <div class="report-details">
                            <div class="report-title">Q1 2026 Summary Report</div>
                            <div class="report-meta">Mar 1, 2026 <span class="badge">Quarterly</span></div>
                        </div>
                        <div class="report-stats">
                            <div class="report-stat-col">
                                <span class="report-stat-label">Attendance</span>
                                <span class="report-stat-value">86%</span>
                            </div>
                            <div class="report-stat-col">
                                <span class="report-stat-label">Engagement</span>
                                <span class="report-stat-value blue">85%</span>
                            </div>
                            <div class="report-stat-col">
                                <span class="report-stat-label">Rating</span>
                                <span style="font-weight:600; color:var(--text-main);">4.5/5</span>
                            </div>
                        </div>
                        <div class="report-actions">
                            <button class="btn btn-secondary btn-sm">⬇️ PDF</button>
                            <button class="btn btn-secondary btn-sm">⬇️ CSV</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3 style="margin-bottom: 20px; font-size: 16px;">Compare Past Events</h3>
                <div class="table-responsive">
                    <table class="table" style="margin-top:0;">
                        <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Date</th>
                                <th>Total Attendance</th>
                                <th>Attendance Rate</th>
                                <th>Engagement Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="color:var(--text-main); font-weight:500;">Annual Tech Summit</td>
                                <td>Mar 5, 2026</td>
                                <td>356</td>
                                <td><span style="color:var(--primary); width:35px; display:inline-block;">89%</span> <div class="h-bar-container"><div class="h-bar" style="width:89%; background:var(--primary);"></div></div></td>
                                <td><span style="color:var(--info); width:35px; display:inline-block;">87%</span> <div class="h-bar-container"><div class="h-bar" style="width:87%; background:var(--info);"></div></div></td>
                            </tr>
                            <tr>
                                <td style="color:var(--text-main); font-weight:500;">Spring Networking</td>
                                <td>Mar 3, 2026</td>
                                <td>182</td>
                                <td><span style="color:var(--primary); width:35px; display:inline-block;">91%</span> <div class="h-bar-container"><div class="h-bar" style="width:91%; background:var(--primary);"></div></div></td>
                                <td><span style="color:var(--info); width:35px; display:inline-block;">82%</span> <div class="h-bar-container"><div class="h-bar" style="width:82%; background:var(--info);"></div></div></td>
                            </tr>
                            <tr>
                                <td style="color:var(--text-main); font-weight:500;">Workshop: AI Trends</td>
                                <td>Feb 28, 2026</td>
                                <td>95</td>
                                <td><span style="color:var(--primary); width:35px; display:inline-block;">78%</span> <div class="h-bar-container"><div class="h-bar" style="width:78%; background:var(--primary);"></div></div></td>
                                <td><span style="color:var(--info); width:35px; display:inline-block;">88%</span> <div class="h-bar-container"><div class="h-bar" style="width:88%; background:var(--info);"></div></div></td>
                            </tr>
                            <tr>
                                <td style="color:var(--text-main); font-weight:500;">Product Launch</td>
                                <td>Feb 25, 2026</td>
                                <td>312</td>
                                <td><span style="color:var(--primary); width:35px; display:inline-block;">93%</span> <div class="h-bar-container"><div class="h-bar" style="width:93%; background:var(--primary);"></div></div></td>
                                <td><span style="color:var(--info); width:35px; display:inline-block;">85%</span> <div class="h-bar-container"><div class="h-bar" style="width:85%; background:var(--info);"></div></div></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    static _toast(msg, color = 'var(--primary)') {
        const existing = document.getElementById('wevents-toast');
        if (existing) existing.remove();
        const t = document.createElement('div');
        t.id = 'wevents-toast';
        t.textContent = msg;
        Object.assign(t.style, {
            position: 'fixed', bottom: '30px', right: '30px',
            background: color, color: 'white', padding: '14px 22px',
            borderRadius: '8px', fontWeight: '600', fontSize: '14px',
            zIndex: '99999', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', opacity: '1'
        });
        document.body.appendChild(t);
        setTimeout(() => { t.style.transition = 'opacity 0.5s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 600); }, 2500);
    }

    static init() {
        const toast = (m, c) => ReportsView._toast(m, c);
        const download = (filename, content) => {
            const blob = new Blob([content], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
        };


        // Export All
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.includes('Export All')) {
                btn.addEventListener('click', () => {
                    const csv = 'Event Name,Date,Attendance Rate,Engagement Score\nAnnual Tech Summit,Mar 5 2026,89%,87%\nSpring Networking,Mar 3 2026,91%,82%\nWorkshop AI Trends,Feb 28 2026,78%,88%\nProduct Launch,Feb 25 2026,93%,85%';
                    download('wevents_all_reports.csv', csv);
                    toast('All reports exported!');
                });
            }
        });

        // Per-report PDF/CSV buttons
        const reportData = [
            { name: 'Annual Tech Summit', att: '89%', eng: '87%', rating: '4.6/5' },
            { name: 'Spring Networking',  att: '91%', eng: '82%', rating: '4.4/5' },
            { name: 'Q1 2026 Summary',    att: '86%', eng: '85%', rating: '4.5/5' }
        ];
        document.querySelectorAll('.report-item').forEach((item, idx) => {
            const d = reportData[idx] || reportData[0];
            const rBtns = item.querySelectorAll('button');
            if (rBtns[0]) rBtns[0].addEventListener('click', () => {
                toast('Downloading ' + d.name + ' PDF...');
                download(d.name.replace(/ /g,'_') + '_report.txt',
                    'Wevents Report: ' + d.name + '\nGenerated: ' + new Date().toLocaleString() + '\nAttendance: ' + d.att + ' | Engagement: ' + d.eng + ' | Rating: ' + d.rating);
            });
            if (rBtns[1]) rBtns[1].addEventListener('click', () => {
                const csv = 'Report,Attendance Rate,Engagement,Rating\n' + d.name + ',' + d.att + ',' + d.eng + ',' + d.rating;
                download(d.name.replace(/ /g,'_') + '_report.csv', csv);
                toast(d.name + ' exported as CSV!');
            });
        });
    }
}

class SettingsView {
    static render() {
        const user = App.user;
        return `
            <div class="page-header" style="margin-bottom: 20px;">
                <div class="page-title">
                    <h2>Settings</h2>
                    <p>Manage your organization and preferences</p>
                </div>
            </div>
            
            <div class="tabs" style="gap: 20px;">
                <div class="tab active"><span style="color:var(--primary); font-weight:600;">Organization Profile</span></div>
            </div>
            
            <div class="card">
                <h3 style="margin-bottom: 20px; display:flex; align-items:center; gap: 10px;">
                    <span style="color:var(--primary);">🏢</span> Organization Profile
                </h3>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Organization Name</label>
                        <input type="text" value="Tech Events Inc.">
                    </div>
                    <div class="form-group">
                        <label>Industry</label>
                        <input type="text" value="Technology & Conferences">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Contact Email</label>
                        <input type="email" value="contact@techevents.com">
                    </div>
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="tel" value="+91 (555) 123-4567">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Website</label>
                        <input type="url" value="https://techevents.com">
                    </div>
                    <div class="form-group">
                        <label>Timezone</label>
                        <input type="text" value="America/New_York (EST)">
                    </div>
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <input type="text" value="123 Event Street, Conference City, ST 12345">
                </div>
                <div class="form-group">
                    <label>Organization Logo</label>
                    <div style="display:flex; gap: 10px;">
                        <input type="text" readonly value="" style="flex:1;">
                        <button class="btn btn-secondary">Upload</button>
                    </div>
                </div>
                
                <div style="margin-top:30px; display:flex; flex-direction:column; gap: 15px; align-items:flex-start;">
                    <button class="btn btn-primary" onclick="alert('Settings Saved!')">Save Changes</button>
                    <button class="btn btn-primary" style="background:var(--primary);" onclick="Auth.logout()">Log Out</button>
                </div>
            </div>
        `;
    }

    static _toast(msg, color = 'var(--primary)') {
        const existing = document.getElementById('wevents-toast');
        if (existing) existing.remove();
        const t = document.createElement('div');
        t.id = 'wevents-toast';
        t.textContent = msg;
        Object.assign(t.style, {
            position: 'fixed', bottom: '30px', right: '30px',
            background: color, color: 'white', padding: '14px 22px',
            borderRadius: '8px', fontWeight: '600', fontSize: '14px',
            zIndex: '99999', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', opacity: '1'
        });
        document.body.appendChild(t);
        setTimeout(() => { t.style.transition = 'opacity 0.5s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 600); }, 2500);
    }

    static init() {
        const toast = (m, c) => SettingsView._toast(m, c);

        // Tab switching
        document.querySelectorAll('.tabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                toast('Switched to ' + tab.textContent.trim() + ' settings');
            });
        });

        // Upload Logo
        const uploadBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Upload');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const logoInput = uploadBtn.previousElementSibling;
                        if (logoInput) logoInput.value = file.name;
                        toast('Logo "' + file.name + '" uploaded!');
                    }
                };
                input.click();
            });
        }

        // Save Changes — replace inline onclick alert
        const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Save Changes');
        if (saveBtn) {
            saveBtn.removeAttribute('onclick');
            saveBtn.addEventListener('click', () => toast('Settings saved successfully!', '#22c55e'));
        }
    }
}

class NotificationsView {
    static render() {
        return `
            <div class="page-header" style="margin-bottom: 20px;">
                <div class="page-title">
                    <h2>Notifications</h2>
                    <p>Stay updated with event alerts and updates</p>
                </div>
                <div style="display:flex; gap: 10px;">
                    <button class="btn btn-secondary">Mark All as Read</button>
                    <button class="btn btn-secondary">🗑 Clear All</button>
                </div>
            </div>
            
            <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 30px;">
                <div class="card stat-card" style="align-items:flex-start;">
                    <div class="stat-header"><h3 style="font-size:13px; color:var(--text-main); font-weight:600;">Total Notifications</h3></div>
                    <div class="stat-value" style="font-size:24px; color:var(--text-main);">8</div>
                </div>
                <div class="card stat-card" style="align-items:flex-start;">
                    <div class="stat-header"><h3 style="font-size:13px; color:var(--text-main); font-weight:600;">Unread</h3></div>
                    <div class="stat-value" style="font-size:24px; color:var(--primary);">3</div>
                </div>
                <div class="card stat-card" style="align-items:flex-start;">
                    <div class="stat-header"><h3 style="font-size:13px; color:var(--text-main); font-weight:600;">RSVP Updates</h3></div>
                    <div class="stat-value" style="font-size:24px; color:var(--info);">2</div>
                </div>
                <div class="card stat-card" style="align-items:flex-start;">
                    <div class="stat-header"><h3 style="font-size:13px; color:var(--text-main); font-weight:600;">Event Reminders</h3></div>
                    <div class="stat-value" style="font-size:24px; color:var(--info);">2</div>
                </div>
            </div>
            
            <div class="card" style="padding: 0;">
                <h3 style="padding: 20px 20px 10px 20px; font-size:16px;">Recent Notifications</h3>
                
                <div style="display:flex; flex-direction:column;">


                    <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display:flex; gap: 15px; background:var(--bg-color);">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: #E3F2FD; color: #1565C0; display:flex; align-items:center; justify-content:center; font-size: 20px;">📅</div>
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                                <div style="display:flex; align-items:center; gap: 10px;">
                                    <h4 style="margin:0; font-size:15px; color:var(--text-main);">Event Reminder</h4>
                                    <span class="badge" style="background:var(--primary); color:white; border:none;">New</span>
                                </div>
                                <span style="font-size:12px; color:var(--text-muted);">2 hours ago</span>
                            </div>
                            <p style="margin:0 0 10px 0; font-size:13px; color:var(--text-muted);">Spring Networking event starts in 2 hours</p>
                            <div style="display:flex; gap: 8px;">
                                <button class="btn btn-secondary btn-sm">View Details</button>
                                <button class="btn btn-secondary btn-sm">Mark as Read</button>
                            </div>
                        </div>
                    </div>
                    
                    <div style="padding: 20px; display:flex; gap: 15px; opacity:0.7;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: #F5F5F5; color: #757575; display:flex; align-items:center; justify-content:center; font-size: 20px;">📊</div>
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                                <div style="display:flex; align-items:center; gap: 10px;">
                                    <h4 style="margin:0; font-size:15px; color:var(--text-main);">Analytics Report Ready</h4>
                                </div>
                                <span style="font-size:12px; color:var(--text-muted);">5 hours ago</span>
                            </div>
                            <p style="margin:0 0 10px 0; font-size:13px; color:var(--text-muted);">Post-event analytics for Product Launch are now available</p>
                            <div style="display:flex; gap: 8px;">
                                <button class="btn btn-secondary btn-sm">View Details</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static _toast(msg, color = 'var(--primary)') {
        const existing = document.getElementById('wevents-toast');
        if (existing) existing.remove();
        const t = document.createElement('div');
        t.id = 'wevents-toast';
        t.textContent = msg;
        Object.assign(t.style, {
            position: 'fixed', bottom: '30px', right: '30px',
            background: color, color: 'white', padding: '14px 22px',
            borderRadius: '8px', fontWeight: '600', fontSize: '14px',
            zIndex: '99999', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', opacity: '1'
        });
        document.body.appendChild(t);
        setTimeout(() => { t.style.transition = 'opacity 0.5s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 600); }, 2500);
    }

    static init() {
        const toast = (m, c) => NotificationsView._toast(m, c);

        // Mark All as Read
        const markAllBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Mark All as Read');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.badge').forEach(badge => {
                    if (badge.textContent === 'New') badge.remove();
                });
                document.querySelectorAll('button').forEach(b => { if (b.textContent === 'Mark as Read') { b.disabled = true; b.textContent = 'Read'; }});
                const topBadge = document.querySelector('.topbar .badge');
                if (topBadge) topBadge.textContent = '0';
                toast('All notifications marked as read', '#22c55e');
            });
        }

        // Clear All
        const clearBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Clear All'));
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear all notifications?')) {
                    const notifList = document.querySelector('.card:not(.stat-card) > div[style*="flex-direction:column"]');
                    if (notifList) notifList.innerHTML = '<p style="padding:30px 20px; color:var(--text-muted);">No notifications to display.</p>';
                    toast('All notifications cleared');
                }
            });
        }

        // Per-notification buttons
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.trim() === 'View Details') {
                btn.addEventListener('click', () => { window.location.hash = '#/event-details?id=e1'; });
            }
            if (btn.textContent.trim() === 'Mark as Read') {
                btn.addEventListener('click', (e) => {
                    const notif = e.target.closest('[style*="padding: 20px"]');
                    if (notif) {
                        const badge = notif.querySelector('.badge');
                        if (badge && badge.textContent === 'New') badge.remove();
                        notif.style.opacity = '0.65';
                        e.target.disabled = true;
                        e.target.textContent = 'Read';
                    }
                    toast('Notification marked as read', '#22c55e');
                });
            }
        });
    }
}

// EventDetailsView has been moved to eventDetailsView.js

class EventDashboardView {
    static render(eventId) {
        const e = DataStore.getEventById(eventId);
        if (!e) return `<div class='card' style='text-align:center; padding:100px;'><h2 style='color:var(--text-main);'>Event not found.</h2></div>`;

        const stats = e.stats || { rsvps: 250, checkins: 180, engagement: 75, rating: 4.5, conversion: 80, nps: 60, participationTrend: [20, 40, 60, 80], popularSession: "N/A" };
        const checkinRate = stats.rsvps > 0 ? Math.round((stats.checkins / stats.rsvps) * 100) : 0;
        
        return `
            <div style="background-color: #F8FAFC; margin: -30px; padding: 30px; min-height: 100vh; font-family: 'Inter', sans-serif;">
                <!-- Section 1: Event Hero -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 30px;">
                    <div>
                        <a href="#/my-events" style="text-decoration:none; color:var(--text-muted); font-size:13px; display:flex; align-items:center; gap:5px; margin-bottom:10px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back to My Events
                        </a>
                        <h2 style="font-size: 28px; font-weight: 800; color: #1E3A8A; margin: 0;">${e.title} Analytics Dashboard</h2>
                        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">📅 ${e.date} &nbsp;•&nbsp; 📍 ${e.location}</p>
                    </div>
                    <span class="badge" style="background: ${e.status === 'live' ? 'var(--success)' : 'var(--primary)'}; color:white; padding: 8px 16px; border-radius: 20px; font-weight: 600; display:flex; align-items:center; gap:8px;">
                        <span style="width: 8px; height: 8px; background: white; border-radius: 50%; display: ${e.status === 'live' ? 'block' : 'none'}; animation: pulse 2s infinite;"></span>
                        ${e.status === 'live' ? 'Live Session' : e.status.toUpperCase()}
                    </span>
                    <button class="btn btn-secondary" onclick="window.print()" style="background:white; border: 1px solid #E2E8F0; display:flex; align-items:center; gap:8px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Report
                    </button>
                </div>

                <!-- Section 2: Key Performance Indicators -->
                <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap: 20px; margin-bottom: 30px;">
                    <div class="card" style="padding: 20px; border-radius:16px; border:none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background: white;">
                        <div style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Confirmed RSVPs</div>
                        <div style="font-size: 28px; font-weight: 800; color: #0F172A; margin-top: 8px;">${stats.rsvps}</div>
                        <div style="color: var(--success); font-size: 11px; margin-top: 5px; font-weight: 600;">↑ Target Reached</div>
                    </div>
                    <div class="card" style="padding: 20px; border-radius:16px; border:none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background: white;">
                        <div style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Checked-In</div>
                        <div style="font-size: 28px; font-weight: 800; color: var(--primary); margin-top: 8px;">${stats.checkins}</div>
                        <div style="color: #64748b; font-size: 11px; margin-top: 5px;">${checkinRate}% of RSVPs</div>
                    </div>
                    <div class="card" style="padding: 20px; border-radius:16px; border:none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background: white;">
                        <div style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Engagement</div>
                        <div style="font-size: 28px; font-weight: 800; color: var(--info); margin-top: 8px;">${stats.engagement}%</div>
                        <div style="color: #64748b; font-size: 11px; margin-top: 5px;">Overall interaction</div>
                    </div>
                    <div class="card" style="padding: 20px; border-radius:16px; border:none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background: white;">
                        <div style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Avg Rating</div>
                        <div style="font-size: 28px; font-weight: 800; color: #F59E0B; margin-top: 8px;">${stats.rating}</div>
                        <div style="color: #F59E0B; font-size: 11px; margin-top: 5px; font-weight:600;">48 Reviews</div>
                    </div>
                    <div class="card" style="padding: 20px; border-radius:16px; border:none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background: white;">
                        <div style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Questions</div>
                        <div style="font-size: 28px; font-weight: 800; color: var(--sidebar-bg); margin-top: 8px;">${Math.floor(stats.checkins / 5)}</div>
                        <div style="color: #64748b; font-size: 11px; margin-top: 5px;">Total Asked</div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 2fr 1fr; gap: 24px;">
                    <!-- Section 3: Attendance Analytics -->
                    <div class="card" style="padding: 24px; border-radius:16px; border:none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background: white;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 25px;">
                            <h3 style="font-size: 18px; font-weight: 700; color: #1E3A8A;">Attendance Timeline</h3>
                            <select style="background:transparent; border:none; color:var(--text-muted); font-size:12px; cursor:pointer;">
                                <option>Hourly View</option>
                                <option>Day View</option>
                            </select>
                        </div>
                        <div style="height: 320px; width: 100%;">
                            <canvas id="eventAttendanceChart"></canvas>
                        </div>
                    </div>

                    <!-- Section 4: Success metrics -->
                    <div class="card" style="padding: 24px; border-radius:16px; border:none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background: white;">
                        <h3 style="font-size: 18px; font-weight: 700; color: #1E3A8A; margin-bottom: 20px;">Registration Capacity</h3>
                        <div style="height: 250px; position:relative;">
                            <canvas id="registrationPieChart"></canvas>
                        </div>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #F1F5F9;">
                            <div style="display:flex; justify-content:space-between; margin-bottom: 10px;">
                                <span style="font-size:13px; color:#64748b;">Target vs Actual</span>
                                <span style="font-size:13px; font-weight:700; color:#0F172A;">${stats.rsvps} / ${e.capacity}</span>
                            </div>
                            <div style="width:100%; height:10px; background:#F1F5F9; border-radius:5px; overflow:hidden;">
                                <div style="width:${Math.min(100, (stats.rsvps/e.capacity)*100)}%; height:100%; background:linear-gradient(90deg, #F97316, #EA580C); border-radius:5px;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 5: Engagement benchmarks -->
                <div class="card" style="padding: 24px; border-radius:16px; border:none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background: white; margin-top: 24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 30px;">
                        <div>
                            <h3 style="font-size: 18px; font-weight: 700; color: #1E3A8A;">Session Performance Analysis</h3>
                            <p style="font-size:12px; color:var(--text-muted); margin-top:4px;">Engagement metrics across all event sessions</p>
                        </div>
                        <div style="display:flex; gap: 20px;">
                            <div style="display:flex; align-items:center; gap: 8px; font-size: 11px; font-weight:600; color:#64748b;">
                                <span style="width:12px; height:12px; background:#2563EB; border-radius:3px;"></span> Questions
                            </div>
                            <div style="display:flex; align-items:center; gap: 8px; font-size: 11px; font-weight:600; color:#64748b;">
                                <span style="width:12px; height:12px; background:#F97316; border-radius:3px;"></span> Poll Votes
                            </div>
                        </div>
                    </div>
                    <div style="height: 300px; width: 100%;">
                        <canvas id="sessionEngagementChart"></canvas>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes pulse {
                    0% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                    100% { opacity: 0.6; transform: scale(1); }
                }
            </style>
        `;
    }

    static init(eventId) {
        const e = DataStore.getEventById(eventId);
        if (!e) return;

        const stats = e.stats || { checkins: 0, rsvps: 1, engagement: 0 };
        
        // Use a slight delay to ensure the DOM elements are ready for Chart.js
        setTimeout(() => {
            // Attendance Line Chart
            const attCtx = document.getElementById('eventAttendanceChart');
            if (attCtx) {
                new Chart(attCtx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM'],
                        datasets: [{
                            label: 'Check-ins',
                            data: [stats.checkins * 0.1, stats.checkins * 0.35, stats.checkins * 0.68, stats.checkins * 0.82, stats.checkins * 0.88, stats.checkins * 0.94, stats.checkins * 0.98, stats.checkins],
                            borderColor: '#F97316',
                            backgroundColor: 'rgba(249, 115, 22, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#F97316',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: '#F1F5F9', borderDash: [5, 5] }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                            x: { grid: { display : false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
                        }
                    }
                });
            }

            // Registration Pie Chart
            const pieCtx = document.getElementById('registrationPieChart');
            if (pieCtx) {
                new Chart(pieCtx.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Checked-In', 'No-Show', 'Pending'],
                        datasets: [{
                            data: [stats.checkins, stats.rsvps - stats.checkins, Math.max(0, e.capacity - stats.rsvps)],
                            backgroundColor: ['#22C55E', '#EF4444', '#E2E8F0'],
                            borderWidth: 0,
                            hoverOffset: 12
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '80%',
                        plugins: {
                            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 25, font: { size: 11, weight: '500' } } }
                        }
                    }
                });
            }

            // Session Engagement Bar Chart
            const engageCtx = document.getElementById('sessionEngagementChart');
            if (engageCtx) {
                const sessionLabels = e.timeline && e.timeline.length ? e.timeline.map(s => s.name.length > 20 ? s.name.substring(0, 18) + '...' : s.name) : ['Session 1', 'Session 2', 'Session 3', 'Session 4'];
                new Chart(engageCtx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: sessionLabels,
                        datasets: [
                            {
                                label: 'Questions',
                                data: sessionLabels.map((_, i) => Math.floor(Math.random() * 25) + 10 + i*2),
                                backgroundColor: '#2563EB',
                                borderRadius: 6,
                                barThickness: 20
                            },
                            {
                                label: 'Poll Votes',
                                data: sessionLabels.map((_, i) => Math.floor(Math.random() * 60) + 40 + i*5),
                                backgroundColor: '#F97316',
                                borderRadius: 6,
                                barThickness: 20
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: '#F1F5F9', borderDash: [5, 5] }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                            x: { grid: { display : false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
                        }
                    }
                });
            }
        }, 100);
    }
}

