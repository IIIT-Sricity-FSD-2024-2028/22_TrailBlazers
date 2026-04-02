/**
 * Wevents – Landing Page JavaScript
 * Handles smooth scrolling, navbar styling on scroll, and interaction for FAQ/Nav.
 */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ── Navbar Scroll Effect ───────────────────────────── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 20) {
      navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
      navbar.style.background = 'var(--blue-dark)';
    } else {
      navbar.style.boxShadow = 'none';
      navbar.style.background = 'var(--blue)';
    }
  });

  /* ── Nav Links Smooth Scrolling ─────────────────────── */
  const btnFeatures = document.getElementById('btn-features');
  const btnBenefits = document.getElementById('btn-benefits');
  const btnPricing = document.getElementById('btn-pricing');
  
  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  if (btnFeatures) {
    btnFeatures.addEventListener('click', () => scrollToSection('features'));
  }
  
  if (btnBenefits) {
    btnBenefits.addEventListener('click', () => scrollToSection('benefits'));
  }
  
  if (btnPricing) {
    btnPricing.addEventListener('click', () => {
      alert("Pricing options will be available soon!");
    });
  }

  /* ── FAQ Interactivity ──────────────────────────────── */
  const faqs = document.querySelectorAll('.faq-item');
  faqs.forEach(faq => {
    faq.addEventListener('click', function (e) {
      // Optional: Close other FAQs if one is opened
      if (!faq.hasAttribute('open')) {
        faqs.forEach(otherFaq => {
          if (otherFaq !== faq && otherFaq.hasAttribute('open')) {
            otherFaq.removeAttribute('open');
          }
        });
      }
    });
  });

});
