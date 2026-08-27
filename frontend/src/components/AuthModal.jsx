import React, { useState } from 'react';
import { X, Mail, Lock, User, Building, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import WaveventsLogo from './WaveventsLogo';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', noticeMessage = '', onAuthSuccess, onVerifySuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'verify'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: '',
    verificationCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempUser, setTempUser] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in.');
      }

      onAuthSuccess(data.user, data.token);

      if (!data.user.emailVerified) {
        setTempUser(data.user);
        setMode('verify');
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          organization: formData.organization
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register account.');
      }

      onAuthSuccess(data.user, data.token);
      setTempUser(data.user);
      setMode('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (codeToSubmit) => {
    setLoading(true);
    setError('');
    const code = codeToSubmit || formData.verificationCode || 'VERIFY_NOW';

    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Email verification failed.');
      }

      onVerifySuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-white">
      <div className="relative w-full max-w-md bg-[#180E2E]/95 backdrop-blur-3xl rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] border border-purple-500/40 overflow-hidden">
        
        {/* Decorative Top Glowing Accent Header */}
        <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-purple-300 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          
          {/* Modal Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="flex justify-center mb-3">
              <WaveventsLogo size="lg" showText={true} showSubtitle={true} dark={true} />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight pt-1">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Your Account'}
              {mode === 'verify' && 'Email Verification'}
            </h2>

            <p className="text-xs text-purple-200/80 font-medium">
              {mode === 'login' && 'Sign in to access your dashboard and event tickets.'}
              {mode === 'register' && 'Join Wavevents to discover, register, and organize summits.'}
              {mode === 'verify' && 'Please verify your email address to unlock full access.'}
            </p>

            {noticeMessage && (
              <div className="mt-3 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{noticeMessage}</span>
              </div>
            )}
          </div>

          {/* Mode Switcher Tabs (Login vs Register) */}
          {mode !== 'verify' && (
            <div className="flex bg-[#28154D]/90 p-1 rounded-2xl mb-6 border border-purple-500/30 shadow-inner">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition ${
                  mode === 'login' 
                    ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-md' 
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition ${
                  mode === 'register' 
                    ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-md' 
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-purple-300" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-purple-400/30 text-white placeholder-purple-300/40 rounded-xl text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-purple-300" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-purple-400/30 text-white placeholder-purple-300/40 rounded-xl text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-600 text-white font-extrabold text-sm hover:scale-[1.02] transition shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 border border-white/20 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4 text-white" />}
              </button>
            </form>
          )}

          {/* Registration Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-purple-300" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Dr. Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-purple-400/30 text-white placeholder-purple-300/40 rounded-xl text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-purple-300" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="alex@organization.org"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-purple-400/30 text-white placeholder-purple-300/40 rounded-xl text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider mb-1">
                  Organization / University (Optional)
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 w-4 h-4 text-purple-300" />
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="Global Innovation Forum"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-purple-400/30 text-white placeholder-purple-300/40 rounded-xl text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-purple-300" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-purple-400/30 text-white placeholder-purple-300/40 rounded-xl text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-600 text-white font-extrabold text-sm hover:scale-[1.02] transition shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 border border-white/20 mt-2"
              >
                {loading ? 'Creating Account...' : 'Create Account & Verify'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Email Verification Step */}
          {mode === 'verify' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-purple-900/40 border border-purple-400/30 text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-1.5" />
                <p className="text-xs text-purple-200 font-medium">
                  We sent a 6-digit verification code to:
                </p>
                <p className="text-sm font-extrabold text-white">{tempUser?.email || formData.email}</p>
                
                {tempUser?.verificationCode && (
                  <div className="mt-3 inline-block px-3 py-1 bg-white/10 border border-purple-400/30 rounded-full text-xs font-mono font-bold text-white shadow-2xs">
                    Verification Code: <span className="text-cyan-300 tracking-wider">{tempUser.verificationCode}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider mb-1.5 text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  name="verificationCode"
                  maxLength={6}
                  value={formData.verificationCode}
                  onChange={handleChange}
                  placeholder="e.g. 842910"
                  className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-white/10 border border-purple-400/30 text-white rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none"
                />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleVerify(formData.verificationCode)}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-600 text-white font-extrabold text-sm hover:scale-[1.02] transition shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying...' : 'Submit Verification Code'}
                </button>

                <button
                  type="button"
                  onClick={() => handleVerify('VERIFY_NOW')}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold text-xs hover:bg-emerald-500/30 transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Instant 1-Click Verification (Demo)
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
