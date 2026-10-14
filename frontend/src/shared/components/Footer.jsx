import React from 'react';
import { Shield, Mail, Heart } from 'lucide-react';
import WaveventsLogo from './WaveventsLogo';

export default function Footer({ user, onNavigate, onOpenAuth }) {
  const handleProtectedClick = (targetTab) => {
    if (!user) {
      if (onOpenAuth) {
        onOpenAuth('login', 'Please sign in to continue.', targetTab);
      }
      return;
    }
    onNavigate(targetTab);
  };

  return (
    <footer className="bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0B132B] text-slate-200 border-t border-white/10 mt-16 pt-16 pb-12 shadow-2xl relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 sm:gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <WaveventsLogo size="md" dark={true} />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium max-w-sm">
              The modern event platform empowering organizations and individuals to discover, publish, attend, and analyze exceptional experiences.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-indigo-300 border border-white/15 backdrop-blur-md shadow-2xs font-bold">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enterprise Grade Security</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Explore Platform</h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-indigo-400 transition cursor-pointer">Home</button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-indigo-400 transition cursor-pointer">Explore Events</button>
              </li>
              <li>
                <button onClick={() => handleProtectedClick('create-event')} className="hover:text-indigo-400 transition cursor-pointer">Create Event</button>
              </li>
              <li>
                <button onClick={() => handleProtectedClick('dashboard')} className="hover:text-indigo-400 transition cursor-pointer">Your Event Space</button>
              </li>
            </ul>
          </div>

          {/* Platform Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Solutions</h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li>Seamless Event Registration</li>
              <li>Instant QR Ticket Passes</li>
              <li>Simulated Payment Gateway</li>
              <li>Private Closed Event Invitations</li>
              <li>Post-Event Analytics Foundation</li>
            </ul>
          </div>

          {/* Support / Pricing Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Revenue & Pricing</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Organizing a large summit or require custom platform pricing structures?
            </p>
            <button
              onClick={() => handleProtectedClick('create-event')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition shadow-xs cursor-pointer"
            >
              <Mail className="w-4 h-4 text-purple-400" />
              Contact Revenue Specialist
            </button>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4 font-medium">
          <p>© 2026 Wavevents Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Security Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
