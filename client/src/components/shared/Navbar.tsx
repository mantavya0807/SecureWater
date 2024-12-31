import React, { useState, FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface User {
  username: string;
  email: string;
}

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem('token');
  const user: User | null = isLoggedIn 
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 p-0.5 rounded-lg">
                <div className="bg-slate-900 p-1.5 rounded-md">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold">
                    SW
                  </span>
                </div>
              </div>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                SecureWater
              </span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {isLoggedIn && (
                <Link 
                  to="/upload"
                  className="text-slate-300 hover:text-emerald-400 transition-colors duration-200"
                >
                  Upload
                </Link>
              )}
              <Link 
                to="/verify"
                className="text-slate-300 hover:text-emerald-400 transition-colors duration-200"
              >
                Verify
              </Link>
              {!isLoggedIn ? (
                <>
                  <Link 
                    to="/login"
                    className="text-slate-300 hover:text-emerald-400 transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register"
                    className="text-slate-300 hover:text-emerald-400 transition-colors duration-200"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <span className="text-slate-400">
                    Hello, <span className="text-emerald-400">{user?.username}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-rose-400 hover:text-rose-300 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-emerald-400 p-2 rounded-lg transition-colors duration-200"
            >
              <svg 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-800/50 backdrop-blur-sm rounded-lg mt-2">
              {isLoggedIn && (
                <Link
                  to="/upload"
                  onClick={() => setIsOpen(false)}
                  className="block text-slate-300 hover:text-emerald-400 px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  Upload
                </Link>
              )}
              <Link
                to="/verify"
                onClick={() => setIsOpen(false)}
                className="block text-slate-300 hover:text-emerald-400 px-3 py-2 rounded-lg transition-colors duration-200"
              >
                Verify
              </Link>
              {!isLoggedIn ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block text-slate-300 hover:text-emerald-400 px-3 py-2 rounded-lg transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="block text-slate-300 hover:text-emerald-400 px-3 py-2 rounded-lg transition-colors duration-200"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <div className="px-3 py-2">
                  <span className="block text-slate-400 mb-2">
                    Hello, <span className="text-emerald-400">{user?.username}</span>
                  </span>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="text-rose-400 hover:text-rose-300 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;