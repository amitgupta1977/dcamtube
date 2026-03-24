'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import Logo from './Logo';
import AdminLoginModal from './AdminLoginModal';
import SearchModal from './SearchModal';

export default function Header() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0f0f0f]/95 backdrop-blur-md shadow-lg' : 'bg-[#0f0f0f]'
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white leading-tight">DCam<span className="text-[#E53935]">Tube</span></span>
              <span className="text-[10px] text-[#666] -mt-0.5 tracking-wider">ROAD INCIDENTS</span>
            </div>
          </Link>

          <button 
            onClick={() => setShowSearch(true)}
            className="hidden md:flex items-center gap-2 bg-[#1a1a1a] text-[#aaa] px-4 py-2 rounded-full w-80 hover:bg-[#272727] transition-colors border border-[#333]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span>Search by any 2 criteria...</span>
          </button>

          <nav className="flex items-center gap-3">
            <Link href="/leaderboard" className="text-[#aaa] hover:text-white transition-colors text-sm hidden sm:block">
              Leaderboard
            </Link>
            <Link href="/help" className="text-[#aaa] hover:text-white transition-colors text-sm hidden sm:block">
              Help
            </Link>
            {user?.isAdmin && (
              <Link href="/admin" className="text-[#aaa] hover:text-white transition-colors text-sm hidden sm:block">
                Admin
              </Link>
            )}
            {!user?.isAdmin && (
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="text-[#aaa] hover:text-white transition-colors text-sm hidden sm:block"
              >
                Admin Login
              </button>
            )}
            {user && (
              <>
                <Link href="/upload" className="bg-[#E53935] hover:bg-[#C62828] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                  Upload
                </Link>
                <Link href="/rewards" className="flex items-center gap-1 text-[#FFCA28] hover:text-[#FFD54F] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                  <span className="font-semibold">{user.points}</span>
                </Link>
              </>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-white text-sm hidden sm:block">{user.firstName} {user.lastName}</span>
                <button 
                  onClick={logout}
                  className="text-[#aaa] hover:text-white text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => setShowLogin(true)}
                  className="bg-[#E53935] hover:bg-[#C62828] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Login
                </button>
                <button onClick={() => setShowSignup(true)} className="bg-[#1a1a1a] text-[#aaa] border border-[#333] px-4 py-2 rounded-lg ml-2 hover:text-white hover:bg-[#272727] transition-colors">Sign Up</button>
              </>
            )}
          </nav>
        </div>
      </header>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true); }} />}
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true); }} />}
      {showAdminLogin && <AdminLoginModal onClose={() => setShowAdminLogin(false)} isAdmin />}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </>
  );
}
