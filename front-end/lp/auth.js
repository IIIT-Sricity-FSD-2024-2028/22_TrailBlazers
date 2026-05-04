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

  /* ── Mock Data ─────────────────────────────────────── */
  const mockUsers = {
    'client':    { email: 'client@gmail.com',    url: '../front-end/dashboard.html' },
    'attendee':  { email: 'attendee@gmail.com',  url: '../f2/index1.html' },
    'manager':   { email: 'manager@gmail.com',   url: '../Project/home.html' },
    'osc':       { email: 'osc@gmail.com',       url: '../osc/scanner.html' },
    'superuser': { email: 'superuser@gmail.com', url: '../super user/dashboard.html' }
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
    const roleData = mockUsers[currentRole];

    if (!roleData) {
      showError('signin-email', "Invalid Role selection.");
      shakeButton(submitBtn);
      return;
    }

    // Role-based redirect only, ignore mock email requirement
    submitBtn.textContent = 'Signing in…';
    submitBtn.disabled = true;

    // Simulate network call
    setTimeout(function () {
      submitBtn.innerHTML = 'Sign In <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      submitBtn.disabled = false;
      
      // Store user data in localStorage to simulate session
      const userSession = {
        email: email,
        role: currentRole,
        name: currentRole.charAt(0).toUpperCase() + currentRole.slice(1) + ' User'
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userSession));
      
      // Client dashboard specifically expects 'wevents_user'
      if (currentRole === 'client') {
        const clientUser = {
          id: 'u1',
          name: 'Rajesh Kumar',
          email: email,
          role: 'superuser', // Internal role for client dashboard
          domain: 'Client Hosted Events',
          avatar: 'RK'
        };
        localStorage.setItem('wevents_user', JSON.stringify(clientUser));
      }

      window.location.href = roleData.url;
    }, 800);
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

    setTimeout(function () {
      submitBtn.innerHTML = 'Create Account <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      submitBtn.disabled = false;
      alert('Account created! (Demo)');
    }, 1200);
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
