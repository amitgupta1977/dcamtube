'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface LoginModalProps {
  onClose: () => void;
  isAdmin?: boolean;
}

export default function LoginModal({ onClose, isAdmin = false }: LoginModalProps) {
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!input) {
      setError('Email is required');
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
        body: JSON.stringify({
          email: input,
          password
        })
      });

      const data = await res.json();

      if (data.token) {
        if (isAdmin && data.user.role !== 'ADMIN') {
          setError('You are not an admin');
          setLoading(false);
          return;
        }
        login(data.user, data.token);
        onClose();
        if (isAdmin) {
          router.push('/admin');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md mx-4 relative border border-[#333]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#aaa] hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">{isAdmin ? 'Admin Login' : 'Welcome Back'}</h2>
        <p className="text-[#aaa] mb-6">Enter your password</p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setTab('email'); setInput(''); }}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              tab === 'email' ? 'bg-[#E53935] text-white' : 'bg-[#272727] text-[#aaa]'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => { setTab('phone'); setInput(''); }}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              tab === 'phone' ? 'bg-[#E53935] text-white' : 'bg-[#272727] text-[#aaa]'
            }`}
          >
            Mobile
          </button>
        </div>

        <div className="space-y-4">
          {tab === 'email' ? (
            <div>
              <label className="block text-[#aaa] text-sm mb-2">Email Address</label>
              <input
                type="email"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
              />
            </div>
          ) : (
            <div>
              <label className="block text-[#aaa] text-sm mb-2">Mobile Number</label>
              <input
                type="tel"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="+1234567890"
                className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
              />
            </div>
          )}
          
          {!isAdmin && (
            <div>
              <label className="block text-[#aaa] text-sm mb-2">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
              />
            </div>
          )}

          <div>
            <label className="block text-[#aaa] text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              className="w-full bg-[#272727] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
            />
          </div>
        </div>

        {error && (
          <p className="text-[#F44336] text-sm mt-4">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#E53935] hover:bg-[#C62828] disabled:bg-[#444] text-white py-3 rounded-lg font-medium transition-colors mt-4"
        >
          {loading ? 'Please wait...' : 'Login'}
        </button>
      </div>
    </div>
  );
}
