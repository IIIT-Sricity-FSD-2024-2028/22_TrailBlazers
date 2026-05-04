/* ═══════════════════════════════════════
   script1.js  –  Home Page (index1.html)
   ═══════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────
     Browse All Events button
  ───────────────────────────────────── */
  document.getElementById('browse-all-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'index2.html';
  });

  /* ─────────────────────────────────────
     "Attend" → RSVP flow (index7)
     "RSVP'd" → already registered, go straight to event detail
  ───────────────────────────────────── */
  document.querySelectorAll('[id^="attend-"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const card = btn.closest('.event-card');
      const title = card?.querySelector('.card-title')?.textContent || 'Event';

      // 1. Create a full-screen overlay with blur effect
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
      overlay.style.backdropFilter = 'blur(6px)';
      overlay.style.webkitBackdropFilter = 'blur(6px)';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s ease';
      
      // 2. Create the Modal Container
      const modal = document.createElement('div');
      modal.style.backgroundColor = '#ffffff';
      modal.style.borderRadius = '14px';
      modal.style.padding = '32px';
      modal.style.width = '90%';
      modal.style.maxWidth = '420px';
      modal.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)';
      modal.style.textAlign = 'center';
      modal.style.fontFamily = 'Inter, sans-serif';
      modal.style.transform = 'scale(0.95)';
      modal.style.transition = 'transform 0.2s ease';

      // 3. Modal Content (Icon + Header + Warning Msg)
      const icon = document.createElement('div');
      icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      icon.style.marginBottom = '16px';
      
      const warningText = document.createElement('h3');
      warningText.textContent = 'Invitation Only Warning';
      warningText.style.margin = '0 0 12px 0';
      warningText.style.color = '#0f172a';
      warningText.style.fontSize = '20px';

      const descText = document.createElement('p');
      descText.textContent = 'This event is for the people who are invited to that event. Others do not attend.';
      descText.style.color = '#475569';
      descText.style.fontSize = '15px';
      descText.style.lineHeight = '1.5';
      descText.style.marginBottom = '24px';

      // 4. Accept Checkbox
      const checkboxContainer = document.createElement('label');
      checkboxContainer.style.display = 'flex';
      checkboxContainer.style.alignItems = 'flex-start';
      checkboxContainer.style.justifyContent = 'flex-start';
      checkboxContainer.style.gap = '12px';
      checkboxContainer.style.marginBottom = '28px';
      checkboxContainer.style.cursor = 'pointer';
      checkboxContainer.style.textAlign = 'left';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.width = '20px';
      checkbox.style.height = '20px';
      checkbox.style.cursor = 'pointer';
      checkbox.style.flexShrink = '0';
      checkbox.style.marginTop = '2px';

      const checkboxLabel = document.createElement('span');
      checkboxLabel.textContent = 'I accept and understand these conditions.';
      checkboxLabel.style.fontSize = '14.5px';
      checkboxLabel.style.color = '#0f172a';
      checkboxLabel.style.fontWeight = '500';

      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(checkboxLabel);

      // 5. Buttons Group
      const btnGroup = document.createElement('div');
      btnGroup.style.display = 'flex';
      btnGroup.style.gap = '12px';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.flex = '1';
      cancelBtn.style.padding = '12px';
      cancelBtn.style.border = '1px solid #cbd5e1';
      cancelBtn.style.backgroundColor = '#ffffff';
      cancelBtn.style.color = '#475569';
      cancelBtn.style.borderRadius = '8px';
      cancelBtn.style.fontWeight = '600';
      cancelBtn.style.fontSize = '15px';
      cancelBtn.style.cursor = 'pointer';
      cancelBtn.style.transition = 'background-color 0.2s';
      cancelBtn.onmouseenter = () => cancelBtn.style.backgroundColor = '#f8fafc';
      cancelBtn.onmouseleave = () => cancelBtn.style.backgroundColor = '#ffffff';

      const continueBtn = document.createElement('button');
      continueBtn.textContent = 'Continue';
      continueBtn.style.flex = '1';
      continueBtn.style.padding = '12px';
      continueBtn.style.border = 'none';
      continueBtn.style.backgroundColor = '#f97316';
      continueBtn.style.color = '#ffffff';
      continueBtn.style.borderRadius = '8px';
      continueBtn.style.fontWeight = '600';
      continueBtn.style.fontSize = '15px';
      continueBtn.style.cursor = 'not-allowed';
      continueBtn.style.opacity = '0.5';
      continueBtn.style.transition = 'all 0.2s';
      continueBtn.disabled = true;

      btnGroup.appendChild(cancelBtn);
      btnGroup.appendChild(continueBtn);

      modal.appendChild(icon);
      modal.appendChild(warningText);
      modal.appendChild(descText);
      modal.appendChild(checkboxContainer);
      modal.appendChild(btnGroup);
      overlay.appendChild(modal);

      document.body.appendChild(overlay);

      // Trigger animation after slightly delaying
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';
      });

      // 6. Interactions
      checkbox.addEventListener('change', () => {
        if(checkbox.checked) {
          continueBtn.disabled = false;
          continueBtn.style.opacity = '1';
          continueBtn.style.cursor = 'pointer';
          continueBtn.onmouseenter = () => continueBtn.style.backgroundColor = '#ea580c';
          continueBtn.onmouseleave = () => continueBtn.style.backgroundColor = '#f97316';
        } else {
          continueBtn.disabled = true;
          continueBtn.style.opacity = '0.5';
          continueBtn.style.cursor = 'not-allowed';
          continueBtn.onmouseenter = null;
          continueBtn.onmouseleave = null;
          continueBtn.style.backgroundColor = '#f97316';
        }
      });

      function closeModal() {
        overlay.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        setTimeout(() => document.body.removeChild(overlay), 200);
      }

      cancelBtn.addEventListener('click', closeModal);

      continueBtn.addEventListener('click', () => {
        // Only trigger if enabled
        if(!continueBtn.disabled) {
          const metaItems = card?.querySelectorAll('.meta-item') || [];
          const dateText  = metaItems[0]?.textContent.trim() || '';
          const locText   = metaItems[1]?.textContent.trim() || '';
          const attText   = metaItems[2]?.textContent.trim() || '';
          const badge     = card?.querySelector('.card-badge')?.textContent || 'Event';
          const imgDiv    = card?.querySelector('.card-image');
          const imgUrl    = imgDiv ? (imgDiv.style.backgroundImage || '').replace(/url\(['"]?|['"]?\)/g, '') : '';

          sessionStorage.setItem('rsvp_event', title);
          sessionStorage.setItem('rsvp_event_date', dateText);
          sessionStorage.setItem('rsvp_event_location', locText);
          sessionStorage.setItem('rsvp_event_attendees', attText);
          sessionStorage.setItem('rsvp_event_badge', badge);
          sessionStorage.setItem('rsvp_event_img', imgUrl);
          sessionStorage.removeItem('otp_verified');
          window.location.href = 'index7.html';
        }
      });

      // Also close when clicking outside modal
      overlay.addEventListener('click', (ev) => {
        if(ev.target === overlay) closeModal();
      });

    });
  });

  document.querySelectorAll('[id^="rsvp-"]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Already RSVP'd — go directly to event detail with data
      const card = btn.closest('.event-card');
      const title     = card?.querySelector('.card-title')?.textContent || 'Event';
      const metaItems = card?.querySelectorAll('.meta-item') || [];
      const dateText  = metaItems[0]?.textContent.trim() || '';
      const locText   = metaItems[1]?.textContent.trim() || '';
      const attText   = metaItems[2]?.textContent.trim() || '';
      const badge     = card?.querySelector('.card-badge')?.textContent || 'Event';
      const desc      = card?.querySelector('.card-desc')?.textContent || '';
      const imgDiv    = card?.querySelector('.card-image');
      const imgUrl    = imgDiv ? (imgDiv.style.backgroundImage || '').replace(/url\(['"]?|['"]?\)/g, '') : '';

      sessionStorage.setItem('detail_event_title', title);
      sessionStorage.setItem('detail_event_date', dateText);
      sessionStorage.setItem('detail_event_location', locText);
      sessionStorage.setItem('detail_event_attendees', attText);
      sessionStorage.setItem('detail_event_badge', badge);
      sessionStorage.setItem('detail_event_desc', desc);
      sessionStorage.setItem('detail_event_img', imgUrl);
      
      window.location.href = 'index4.html';
    });
  });

  /* ─────────────────────────────────────
     "Details" → Event Detail page (view only)
  ───────────────────────────────────── */
  document.querySelectorAll('[id^="details-"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.event-card');
      const title     = card?.querySelector('.card-title')?.textContent || 'Event';
      const metaItems = card?.querySelectorAll('.meta-item') || [];
      const dateText  = metaItems[0]?.textContent.trim() || '';
      const locText   = metaItems[1]?.textContent.trim() || '';
      const attText   = metaItems[2]?.textContent.trim() || '';
      const badge     = card?.querySelector('.card-badge')?.textContent || 'Event';
      const desc      = card?.querySelector('.card-desc')?.textContent || '';
      const imgDiv    = card?.querySelector('.card-image');
      const imgUrl    = imgDiv ? (imgDiv.style.backgroundImage || '').replace(/url\(['"]?|['"]?\)/g, '') : '';

      sessionStorage.setItem('detail_event_title', title);
      sessionStorage.setItem('detail_event_date', dateText);
      sessionStorage.setItem('detail_event_location', locText);
      sessionStorage.setItem('detail_event_attendees', attText);
      sessionStorage.setItem('detail_event_badge', badge);
      sessionStorage.setItem('detail_event_desc', desc);
      sessionStorage.setItem('detail_event_img', imgUrl);
      window.location.href = 'index4.html';
    });
  });

  /* ─────────────────────────────────────
     View All links
  ───────────────────────────────────── */
  document.getElementById('upcoming-view-all')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index2.html';
  });
  document.getElementById('recommended-view-all')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index2.html';
  });
  document.getElementById('recent-view-all')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index3.html';
  });

  /* ─────────────────────────────────────
     Sidebar navigation
  ───────────────────────────────────── */
  document.getElementById('sidebar-browse')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index2.html';
  });
  document.getElementById('sidebar-myevents')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index3.html';
  });
});
