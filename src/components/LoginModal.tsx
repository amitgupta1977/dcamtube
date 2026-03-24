'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface LoginModalProps {
  onClose: () => void;
  isAdmin?: boolean;
  onSwitchToSignup?: () => void;
}

export default function LoginModal({ onClose, isAdmin = false, onSwitchToSignup }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.token) {
        if (isAdmin && data.user.role !== 'ADMIN') {
          setError('You are not an admin');
          setLoading(false);
          return;
        }
        const meRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        const meData = await meRes.json();
        login(meData?.user || data.user, data.token);
        onClose();
        if (isAdmin) router.push('/admin');
      } else {
        setError(data.error || 'Login failed. Check your email and password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md mx-4 relative border border-[#333]">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#aaa] hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-1">{isAdmin ? 'Admin Login' : 'Welcome Back'}</h2>
        <p className="text-[#aaa] text-sm mb-6">Sign in to your account</p>

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
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div>
            <label className="block text-[#aaa] text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-400 text-sm px-4 py-2 rounded-lg mt-4">{error}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#E53935] hover:bg-[#C62828] disabled:bg-[#444] text-white py-3 rounded-lg font-medium transition-colors mt-4"
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>
        {!isAdmin && (
          <p className="text-[#555] text-xs text-center mt-3">
            No account? <button onClick={() => { onClose(); onSwitchToSignup?.(); }} className="text-[#E53935] hover:underline">Sign up here</button>
          </p>
        )}
      </div>
    </div>
  );
}
