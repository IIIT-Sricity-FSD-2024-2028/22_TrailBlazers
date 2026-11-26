import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  X,
  Mail,
  Lock,
  User,
  Building,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import WaveventsLogo from '../shared/components/WaveventsLogo';
import { loginUser, registerUser, verifyEmail } from '../store/auth-actions';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  noticeMessage = '',
  onAuthSuccess,
  onVerifySuccess,
}) {
  const dispatch = useDispatch();
  const getNormalizedMode = (m) => (m === 'signin' ? 'login' : m) || 'login';
  const [mode, setMode] = useState(() => getNormalizedMode(initialMode)); // 'login' | 'register' | 'verify' | 'forgot-password'

  useEffect(() => {
    if (isOpen) {
      setMode(getNormalizedMode(initialMode));
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, initialMode]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: '',
    verificationCode: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempUser, setTempUser] = useState(null);

  // Forgot Password state
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [receivedResetCode, setReceivedResetCode] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await dispatch(loginUser({ email: formData.email, password: formData.password }));
      if (!res.success) {
        throw new Error(res.error || 'Failed to sign in.');
      }

      if (onAuthSuccess) {
        onAuthSuccess(res.user, res.token);
      }

      if (!res.user.emailVerified) {
        setTempUser(res.user);
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
    setSuccessMsg('');

    try {
      const res = await dispatch(
        registerUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          organization: formData.organization,
        })
      );
      if (!res.success) {
        throw new Error(res.error || 'Failed to register account.');
      }

      if (onAuthSuccess) {
        onAuthSuccess(res.data.user, res.data.token);
      }
      setTempUser(res.data.user);
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
      const res = await dispatch(verifyEmail(code));
      if (!res.success) {
        throw new Error(res.error || 'Email verification failed.');
      }

      if (onVerifySuccess) {
        onVerifySuccess(res.user, localStorage.getItem('ffsd_token'));
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (e) => {
    if (e) e.preventDefault();
    const targetEmail = (forgotEmail || formData.email || '').trim();
    if (!targetEmail) {
      setError('Please provide your registered email address.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to request reset code.');
      }
      setReceivedResetCode(data.resetCode || '');
      setResetCode(data.resetCode || '');
      setForgotStep('reset');
      setSuccessMsg('Reset code generated! Enter your new password below.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (overrideCode, overridePassword) => {
    const code = (overrideCode || resetCode || '').trim();
    const pass = overridePassword || newPassword;
    const confirm = overridePassword || confirmPassword;
    const targetEmail = (forgotEmail || formData.email || '').trim();

    if (!code) {
      setError('Please enter the 6-digit reset code.');
      return;
    }
    if (!pass || pass.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (pass !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          code,
          newPassword: pass,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to reset password.');
      }

      setFormData((prev) => ({ ...prev, email: targetEmail, password: '' }));
      setMode('login');
      setForgotStep('request');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setReceivedResetCode('');
      setSuccessMsg('Password updated successfully! You can now sign in with your new password.');
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
              {mode === 'forgot-password' &&
                (forgotStep === 'request' ? 'Reset Your Password' : 'Set New Password')}
            </h2>

            <p className="text-xs text-purple-200/80 font-medium">
              {mode === 'login' && 'Sign in to access your dashboard and event tickets.'}
              {mode === 'register' && 'Join Wavevents to discover, register, and organize summits.'}
              {mode === 'verify' && 'Please verify your email address to unlock full access.'}
              {mode === 'forgot-password' &&
                (forgotStep === 'request'
                  ? 'Enter your registered email to receive a password reset code.'
                  : 'Enter the 6-digit code and choose a new password.')}
            </p>

            {noticeMessage && (
              <div className="mt-3 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{noticeMessage}</span>
              </div>
            )}
          </div>

          {/* Mode Switcher Tabs (Login vs Register) */}
          {mode !== 'verify' && mode !== 'forgot-password' && (
            <div className="flex bg-[#28154D]/90 p-1 rounded-2xl mb-6 border border-purple-500/30 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
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
                onClick={() => {
                  setMode('register');
                  setError('');
                  setSuccessMsg('');
                }}
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

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-password');
                      setForgotStep('request');
                      setForgotEmail(formData.email || '');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
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
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-600 text-white font-extrabold text-sm hover:scale-[1.02] transition shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 border border-white/20 mt-2 cursor-pointer"
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
                    placeholder="alex@gmail.com"
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
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-600 text-white font-extrabold text-sm hover:scale-[1.02] transition shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 border border-white/20 mt-2 cursor-pointer"
              >
                {loading ? 'Creating Account...' : 'Create Account & Verify'}
                {!loading && <ArrowRight className="w-4 h-4 text-white" />}
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
                <p className="text-sm font-extrabold text-white">
                  {tempUser?.email || formData.email}
                </p>

                {tempUser?.verificationCode && (
                  <div className="mt-3 inline-block px-3 py-1 bg-white/10 border border-purple-400/30 rounded-full text-xs font-mono font-bold text-white shadow-2xs">
                    Verification Code:{' '}
                    <span className="text-cyan-300 tracking-wider">
                      {tempUser.verificationCode}
                    </span>
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
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-600 text-white font-extrabold text-sm hover:scale-[1.02] transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Submit Verification Code'}
                </button>

                <button
                  type="button"
                  onClick={() => handleVerify('VERIFY_NOW')}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold text-xs hover:bg-emerald-500/30 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Instant 1-Click Verification (Demo)
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password Step 1: Request Code */}
          {mode === 'forgot-password' && forgotStep === 'request' && (
            <form onSubmit={handleRequestResetCode} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-purple-300" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-purple-400/30 text-white placeholder-purple-300/40 rounded-xl text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-purple-300/70 mt-1.5">
                  We will generate a 6-digit code to securely reset your credentials.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-600 text-white font-extrabold text-sm hover:scale-[1.02] transition shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 border border-white/20 mt-2 cursor-pointer"
              >
                {loading ? 'Sending Code...' : 'Send Reset Code'}
                {!loading && <ArrowRight className="w-4 h-4 text-white" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-purple-200 hover:text-white font-bold text-xs transition border border-purple-400/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>
            </form>
          )}

          {/* Forgot Password Step 2: Enter Code & New Password */}
          {mode === 'forgot-password' && forgotStep === 'reset' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-900/40 border border-purple-400/30 text-center">
                <KeyRound className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                <p className="text-xs text-purple-200 font-medium">Reset code generated for:</p>
                <p className="text-sm font-extrabold text-white">{forgotEmail}</p>

                {receivedResetCode && (
                  <div className="mt-2 inline-block px-3 py-1 bg-white/10 border border-purple-400/30 rounded-full text-xs font-mono font-bold text-white shadow-2xs">
                    Reset Code:{' '}
                    <span className="text-cyan-300 tracking-wider font-extrabold">
                      {receivedResetCode}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider mb-1.5 text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => {
                    setResetCode(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. 806726"
                  className="w-full text-center tracking-widest text-lg font-mono py-2 bg-white/10 border border-purple-400/30 text-white rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-purple-300" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-purple-400/30 text-white placeholder-purple-300/40 rounded-xl text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-purple-300" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-purple-400/30 text-white placeholder-purple-300/40 rounded-xl text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleResetPassword()}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-600 text-white font-extrabold text-sm hover:scale-[1.02] transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResetCode('RESET_NOW');
                    setNewPassword('Wavevents@2026');
                    setConfirmPassword('Wavevents@2026');
                    handleResetPassword('RESET_NOW', 'Wavevents@2026');
                  }}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold text-xs hover:bg-emerald-500/30 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Instant 1-Click Reset (Demo: Wavevents@2026)
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('request');
                      setError('');
                    }}
                    className="text-purple-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Request Different Code
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold transition hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
