/* ═══════════════════════════════════════
   script7.js  –  RSVP Form (index7.html)
   ═══════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const form      = document.getElementById('rsvp-form');
  const nameInput = document.getElementById('input-fullname');
  const emailInput= document.getElementById('input-email');
  const phoneInput= document.getElementById('input-phone');
  const cancelBtn = document.getElementById('btn-cancel');
  const closeBtn  = document.getElementById('btn-close-dialog');

  /* ── Validators ── */
  function isEmpty(val)      { return !val.trim(); }
  function isValidEmail(val) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()); }
  function isValidPhone(val) { return /^[\d\s\+\-\(\)]{7,15}$/.test(val.trim()); }

  /* ── Show / clear field errors ── */
  function setError(input, msg) {
    clearError(input);
    input.style.borderColor = '#ef4444';
    input.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.14)';
    const err = document.createElement('p');
    err.className = 'field-error';
    err.style.cssText = 'color:#ef4444; font-size:12px; margin-top:4px;';
    err.textContent = msg;
    input.parentNode.appendChild(err);
  }
  function clearError(input) {
    input.style.borderColor = '';
    input.style.boxShadow   = '';
    input.parentNode.querySelector('.field-error')?.remove();
  }

  /* ── Validate on blur ── */
  nameInput?.addEventListener('blur', () => {
    if (isEmpty(nameInput.value)) setError(nameInput, 'Full name is required.');
    else clearError(nameInput);
  });
  emailInput?.addEventListener('blur', () => {
    if (isEmpty(emailInput.value))           setError(emailInput, 'Email address is required.');
    else if (!isValidEmail(emailInput.value)) setError(emailInput, 'Please enter a valid email address.');
    else clearError(emailInput);
  });
  phoneInput?.addEventListener('blur', () => {
    if (isEmpty(phoneInput.value))           setError(phoneInput, 'Phone number is required.');
    else if (!isValidPhone(phoneInput.value)) setError(phoneInput, 'Please enter a valid phone number.');
    else clearError(phoneInput);
  });

  /* ── Form submission ── */
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    let valid = true;
    if (isEmpty(nameInput.value))                             { setError(nameInput, 'Full name is required.');             valid = false; }
    else clearError(nameInput);
    if (isEmpty(emailInput.value))                            { setError(emailInput, 'Email address is required.');        valid = false; }
    else if (!isValidEmail(emailInput.value))                 { setError(emailInput, 'Please enter a valid email.');       valid = false; }
    else clearError(emailInput);
    if (isEmpty(phoneInput.value))                            { setError(phoneInput, 'Phone number is required.');         valid = false; }
    else if (!isValidPhone(phoneInput.value))                 { setError(phoneInput, 'Please enter a valid phone number.');valid = false; }
    else clearError(phoneInput);

    if (!valid) return;

    // Store data to carry through the flow
    sessionStorage.setItem('rsvp_name',  nameInput.value.trim());
    sessionStorage.setItem('rsvp_email', emailInput.value.trim());
    sessionStorage.setItem('rsvp_phone', phoneInput.value.trim());

    // Navigate to OTP verification page
    window.location.href = 'index8.html';
  });

  /* ── Cancel / Close ── */
  cancelBtn?.addEventListener('click', () => {
    history.length > 1 ? history.back() : (window.location.href = 'index4.html');
  });
  closeBtn?.addEventListener('click', () => {
    history.length > 1 ? history.back() : (window.location.href = 'index4.html');
  });

  /* Form always starts blank – no pre-fill */
});
