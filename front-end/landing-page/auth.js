/**
 * Wevents – Auth Page JavaScript
 * Handles tab switching (Sign In / Sign Up), role toggles, form validation, and submissions.
 */
(function () {
  'use strict';

  /* ── DOM References ─────────────────────────────────── */
  const tabSignIn  = document.getElementById('tab-signin');
  const tabSignUp  = document.getElementById('tab-signup');
  const indicator  = document.getElementById('auth-tab-indicator');
  const formSignIn = document.getElementById('form-signin');
  const formSignUp = document.getElementById('form-signup');

  /* ── Tab Switching ──────────────────────────────────── */
  function showSignIn() {
    tabSignIn.classList.add('auth-tab--active');
    tabSignUp.classList.remove('auth-tab--active');
    tabSignIn.setAttribute('aria-selected', 'true');
    tabSignUp.setAttribute('aria-selected', 'false');
    indicator.classList.remove('left');

    formSignIn.classList.remove('auth-form--hidden');
    formSignUp.classList.add('auth-form--hidden');

    // Re-trigger animation
    formSignIn.style.animation = 'none';
    formSignIn.offsetHeight; // reflow
    formSignIn.style.animation = '';
  }

  function showSignUp() {
    tabSignUp.classList.add('auth-tab--active');
    tabSignIn.classList.remove('auth-tab--active');
    tabSignUp.setAttribute('aria-selected', 'true');
    tabSignIn.setAttribute('aria-selected', 'false');
    indicator.classList.add('left');

    formSignUp.classList.remove('auth-form--hidden');
    formSignIn.classList.add('auth-form--hidden');

    // Re-trigger animation
    formSignUp.style.animation = 'none';
    formSignUp.offsetHeight; // reflow
    formSignUp.style.animation = '';
  }

  tabSignIn.addEventListener('click', showSignIn);
  tabSignUp.addEventListener('click', showSignUp);

  /* ── Role Toggles ───────────────────────────────────── */
  const moreRolesBtn = document.getElementById('show-more-roles');
  const moreRolesContainer = document.getElementById('more-roles-container');
  const primaryRolesContainer = document.getElementById('primary-roles');
  
  if (moreRolesBtn && moreRolesContainer) {
    moreRolesBtn.addEventListener('click', function() {
      const isHidden = moreRolesContainer.style.display === 'none';
      if (isHidden) {
        moreRolesContainer.style.display = 'grid';
        primaryRolesContainer.style.display = 'none';
        moreRolesBtn.textContent = 'Back to Primary Roles';
        // Reset role if needed
        const firstMoreBtn = moreRolesContainer.querySelector('.auth-role-btn');
        if (firstMoreBtn) firstMoreBtn.click();
      } else {
        moreRolesContainer.style.display = 'none';
        primaryRolesContainer.style.display = 'grid';
        moreRolesBtn.textContent = 'More Roles';
        const firstPrimaryBtn = primaryRolesContainer.querySelector('.auth-role-btn');
        if (firstPrimaryBtn) firstPrimaryBtn.click();
      }
    });

    // Deselect both at once behavior: already handled by switching view between primary and more roles
  }

  function initRoleToggle(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const buttons = container.querySelectorAll('.auth-role-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Clear all active across both containers
        document.querySelectorAll('.auth-role-btn').forEach(function (b) { b.classList.remove('auth-role-btn--active'); });
        btn.classList.add('auth-role-btn--active');
        currentRole = btn.getAttribute('data-role');
      });
    });
  }

  let currentRole = 'client';
  initRoleToggle('signin-role');
  initRoleToggle('signup-role');

  /* ── Role → Dashboard URL map ─────────────────────── */
  const roleRedirects = {
    'client':       '../client/dashboard.html',
    'eventmanager': '../event-manager/home.html',
    'superuser':    '../super-user/dashboard.html',
    'attendee':     '../attendee/index1.html',
    'osc':          '../osc/scanner.html'
  };

  /* ── UI Helpers ─────────────────────────────────────── */
  function showError(inputId, message) {
    const wrap = document.getElementById('wrap-' + inputId);
    const errObj = document.getElementById('err-' + inputId);
    if (wrap && errObj) {
      wrap.classList.remove('has-success');
      wrap.classList.add('has-error');
      errObj.textContent = message;
    }
  }

  function clearError(inputId) {
    const wrap = document.getElementById('wrap-' + inputId);
    const errObj = document.getElementById('err-' + inputId);
    if (wrap && errObj) {
      wrap.classList.remove('has-error');
      wrap.classList.remove('has-success');
      errObj.textContent = '';
    }
  }

  function setSuccess(inputId) {
    const wrap = document.getElementById('wrap-' + inputId);
    const errObj = document.getElementById('err-' + inputId);
    if (wrap && errObj) {
      wrap.classList.remove('has-error');
      wrap.classList.add('has-success');
      errObj.textContent = '';
    }
  }

  function shakeButton(btn) {
    btn.style.animation = 'none';
    btn.offsetHeight;
    btn.style.animation = 'shake .4s ease';
    btn.addEventListener('animationend', function () {
      btn.style.animation = '';
    }, { once: true });
  }

  // Add shake keyframes dynamically
  var style = document.createElement('style');
  style.textContent = '@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }';
  document.head.appendChild(style);


  /* ── Validation Rules ───────────────────────────────── */
  const validators = {
    email: (val) => {
      const re = /^[a-zA-Z0-9._-]+@gmail\.com$/;
      if (!val || !re.test(val)) return "Invalid Email";
      return null;
    },
    password: (val) => {
      if (!val) return "Password is required.";
      if (val.length < 8) return "Password must be at least 8 characters long.";
      if (!/[A-Z]/.test(val)) return "Include at least one uppercase letter.";
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(val)) return "Include at least one special character.";
      return null;
    },
    name: (val) => {
      if (!val) return "Full name is required.";
      if (val.trim().length < 3) return "Name must be at least 3 characters long.";
      return null;
    }
  };


  /* ── Real-time Validation Setup ─────────────────────── */
  function bindValidation(inputId, validatorFn) {
    const el = document.getElementById(inputId);
    if (!el) return;
    
    // Clear error while typing
    el.addEventListener('input', () => clearError(inputId));
    
    // Validate when leaving the field
    el.addEventListener('blur', () => {
      const err = validatorFn(el.value.trim());
      if (err) showError(inputId, err);
      else if (el.value.length > 0) setSuccess(inputId);
    });
  }

  // Bind Sign In
  bindValidation('signin-email', validators.email);
  bindValidation('signin-password', validators.password);

  // Bind Sign Up
  bindValidation('signup-name', validators.name);
  bindValidation('signup-email', validators.email);
  bindValidation('signup-password', validators.password);
  
  // Custom bind for password confirm
  const signupConfirm = document.getElementById('signup-confirm');
  if (signupConfirm) {
    signupConfirm.addEventListener('input', () => clearError('signup-confirm'));
    signupConfirm.addEventListener('blur', () => {
      const pwd = document.getElementById('signup-password').value;
      if (!signupConfirm.value) showError('signup-confirm', "Please confirm your password.");
      else if (signupConfirm.value !== pwd) showError('signup-confirm', "Passwords do not match.");
      else setSuccess('signup-confirm');
    });
  }


  /* ── Show/Hide Password Toggle ──────────────────────── */
  const pwdToggles = document.querySelectorAll('.auth-pwd-toggle');
  pwdToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const wrap = this.parentElement;
      const input = wrap.querySelector('input');
      const eyeIcon = this.querySelector('.eye-icon');
      const eyeOffIcon = this.querySelector('.eye-off-icon');

      if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
      } else {
        input.type = 'password';
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
      }
    });
  });


  /* ── Form Submissions (mock verification) ────────────────────────── */
  formSignIn.addEventListener('submit', function (e) {
    e.preventDefault();
    
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    let isValid = true;

    // Validate email
    const emailErr = validators.email(email);
    if (emailErr) { showError('signin-email', emailErr); isValid = false; }
    
    // Validate password
    const pwdErr = validators.password(password);
    if (pwdErr) { showError('signin-password', pwdErr); isValid = false; }

    if (!isValid) {
      shakeButton(document.getElementById('signin-submit'));
      return;
    }

    const submitBtn = document.getElementById('signin-submit');

    if (!roleRedirects[currentRole]) {
      showError('signin-email', 'Invalid role selection.');
      shakeButton(submitBtn);
      return;
    }

    // Role-based redirect only, ignore mock email requirement
    submitBtn.textContent = 'Signing in…';
    submitBtn.disabled = true;

    fetch(`http://localhost:3000/users?role=${currentRole}`, {
      headers: { 'role': 'superuser' }
    })
    .then(res => res.json())
    .then(users => {
      const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!matched) {
        submitBtn.innerHTML = 'Sign In <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        submitBtn.disabled = false;
        showError('signin-email', 'No account found with this email for role: ' + currentRole + '.');
        return;
      }

      // Store ALL users under both keys — profile-init.js reads from these on every portal
      localStorage.setItem('currentUser',  JSON.stringify(matched));
      localStorage.setItem('wevents_user', JSON.stringify(matched));

      submitBtn.innerHTML = 'Sign In <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      submitBtn.disabled = false;
      // Use the matched user's actual role for the redirect (most authoritative)
      let redirectUrl = roleRedirects[matched.role] || roleRedirects[currentRole] || '../client/dashboard.html';
      // Attendees: also pass identity via URL params for deeper page personalization
      if (matched.role === 'attendee') {
        redirectUrl += '?userId=' + encodeURIComponent(matched.id) + '&email=' + encodeURIComponent(matched.email) + '&name=' + encodeURIComponent(matched.name || '');
      }
      window.location.href = redirectUrl;
    })
    .catch(err => {
      console.error('Sign-in error:', err);
      submitBtn.innerHTML = 'Sign In <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      submitBtn.disabled = false;
      showError('signin-email', 'Could not reach backend. Ensure server is running.');
    });
  });

  formSignUp.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    let isValid = true;

    // Run all validators
    if (validators.name(name)) { showError('signup-name', validators.name(name)); isValid = false; }
    if (validators.email(email)) { showError('signup-email', validators.email(email)); isValid = false; }
    if (validators.password(password)) { showError('signup-password', validators.password(password)); isValid = false; }
    
    // Check confirmation
    if (!confirm) { 
      showError('signup-confirm', "Please confirm your password."); isValid = false; 
    } else if (password !== confirm) { 
      showError('signup-confirm', "Passwords do not match."); isValid = false; 
    }

    if (!isValid) {
      shakeButton(document.getElementById('signup-submit'));
      return;
    }

    const submitBtn = document.getElementById('signup-submit');
    submitBtn.textContent = 'Creating account…';
    submitBtn.disabled = true;

    const payload = {
      name: name,
      email: email,
      role: currentRole,
      domain: currentRole === 'client' ? 'Client Hosted Events' : 'General'
    };

    fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'role': 'superuser' // Bypass role check for signup since this is a public form
      },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error('API Error');
      return res.json();
    })
    .then(data => {
      submitBtn.innerHTML = 'Create Account <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      submitBtn.disabled = false;
      alert('Account created! You can now sign in.');
      showSignIn(); // Switch to sign in tab
    })
    .catch(err => {
      console.error(err);
      submitBtn.innerHTML = 'Create Account <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      submitBtn.disabled = false;
      alert('Failed to create account. Ensure the backend is running.');
    });
  });

  /* ── URL hash support ───────────────────────────────── */
  // If the page is loaded with #signup hash, show sign-up form
  if (window.location.hash === '#signup') {
    showSignUp();
  }

  // Listen for hash changes
  window.addEventListener('hashchange', function () {
    if (window.location.hash === '#signup') {
      showSignUp();
    } else {
      showSignIn();
    }
  });

})();
