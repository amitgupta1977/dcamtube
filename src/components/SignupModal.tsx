'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface SignupModalProps {
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export default function SignupModal({ onClose, onSwitchToLogin }: SignupModalProps) {
  const { login } = useAuth();
  const [step, setStep] = useState<'email' | 'details'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [via, setVia] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const COUNTRIES = ['India', 'USA', 'UK', 'Australia', 'Canada', 'Germany', 'France', 'Japan', 'China', 'Brazil', 'Mexico', 'Spain', 'Italy', 'South Korea', 'Singapore', 'UAE', 'Saudi Arabia', 'Russia'];

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const sendOTP = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    setPreviewUrl('');
    setDevOtp('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.ok) {
        setStep('details');
        setCountdown(60);
        setPreviewUrl(data.previewUrl || '');
        setVia(data.via || '');
        setSuccess(data.via === 'resend'
          ? 'Email sent! Check your inbox for the OTP code.'
          : 'Verification email sent! Open the inbox link to get your OTP.');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDevOtp = async () => {
    if (via === 'resend') return;
    try {
      const res = await fetch(`/api/auth/otp-dev?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.otp) setDevOtp(data.otp);
    } catch { /* ignore */ }
  };

  const handleSignup = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP from your email');
      return;
    }
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password, firstName, lastName, country, city })
      });
      const data = await res.json();
      if (data.ok) {
        login(data.user, data.token);
        setSuccess('Account created! Redirecting...');
        setTimeout(() => onClose(), 1200);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    onClose();
    onSwitchToLogin?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md mx-4 relative border border-[#333] max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#aaa] hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-1">
          {step === 'email' ? 'Create Account' : 'Complete Signup'}
        </h2>
        <p className="text-[#aaa] text-sm mb-4">
          {step === 'email' ? 'Step 1 of 2 — Enter your email' : 'Step 2 of 2 — Verify email & set profile'}
        </p>

        {error && <div className="bg-red-500/20 border border-red-500/40 text-red-400 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-500/20 border border-green-500/40 text-green-400 text-sm px-4 py-2 rounded-lg mb-4">{success}</div>}

        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[#aaa] text-sm mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && sendOTP()}
              />
            </div>
            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full bg-[#E53935] hover:bg-[#C62828] disabled:bg-[#444] text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Sending...' : 'Send Verification Email'}
            </button>
            <p className="text-[#555] text-xs text-center">
              Already have an account?{' '}
              <button onClick={handleSwitchToLogin} className="text-[#E53935] hover:underline">Sign in here</button>
            </p>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <p className="text-[#aaa] text-sm">
              Verification email sent to <span className="text-white font-medium">{email}</span>
            </p>

            {via !== 'resend' && previewUrl && (
              <div className="bg-[#1e3a8a]/20 border border-[#1e3a8a]/40 rounded-lg p-3 text-center">
                <p className="text-[#aaa] text-xs mb-1">Your email is captured by Ethereal Email:</p>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] text-sm hover:underline break-all">
                  Open email inbox to get your OTP
                </a>
              </div>
            )}

            {via !== 'resend' && (
              <div className="bg-[#2a2a2a] border border-[#444] rounded-lg p-3 text-center">
                <p className="text-[#888] text-xs mb-1">DEV MODE — OTP:</p>
                {!devOtp ? (
                  <button onClick={fetchDevOtp} className="text-[#FFCA28] text-xs hover:underline">Fetch OTP from server</button>
                ) : (
                  <span className="text-[#FFCA28] font-mono text-xl font-bold tracking-widest">{devOtp}</span>
                )}
              </div>
            )}

            <div>
              <label className="block text-[#aaa] text-sm mb-2">Verification Code (from email)</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333] text-center text-xl tracking-[0.3em] font-mono"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#aaa] text-sm mb-2">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                />
              </div>
              <div>
                <label className="block text-[#aaa] text-sm mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#aaa] text-sm mb-2">Country</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                >
                  <option value="">Select...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#aaa] text-sm mb-2">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="New York"
                  className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#aaa] text-sm mb-2">Password *</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
              />
            </div>
            <div>
              <label className="block text-[#aaa] text-sm mb-2">Confirm Password *</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                onKeyDown={e => e.key === 'Enter' && handleSignup()}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={sendOTP}
                disabled={loading || countdown > 0}
                className="flex-1 bg-[#333] hover:bg-[#444] disabled:bg-[#2a2a2a] text-white py-3 rounded-lg font-medium text-sm transition-colors"
              >
                {countdown > 0 ? `${countdown}s` : 'Resend Email'}
              </button>
              <button
                onClick={handleSignup}
                disabled={loading}
                className="flex-1 bg-[#E53935] hover:bg-[#C62828] disabled:bg-[#444] text-white py-3 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            <button
              onClick={() => { setStep('email'); setOtp(''); setError(''); setSuccess(''); setPreviewUrl(''); setDevOtp(''); setVia(''); }}
              className="w-full text-[#aaa] text-sm hover:text-white transition-colors"
            >
              Change email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
