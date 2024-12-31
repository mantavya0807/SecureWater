// src/pages/Home.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface User {
  username: string;
  email: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const user: User | null = isLoggedIn 
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : null;

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Navigation - Notice the removal of border */}
      <nav className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
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
                <div className="flex items-center space-x-4">
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
                </div>
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
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-20 text-center relative">
        {/* Glow Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px]"></div>
        </div>

        {/* Hero Section */}
        <div className="relative">
          <h1 className="text-7xl font-bold mb-6 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 animate-gradient-x">
              Protect Your Digital Assets
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Ensure your images are traceable and tamper-proof with our advanced watermarking system.
            Secure your content effortlessly with state-of-the-art protection.
          </p>

          <div className="space-x-4 mb-12">
            {!isLoggedIn ? (
              <>
                <Link 
                  to="/login"
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 
                           text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 
                           hover:shadow-lg hover:shadow-emerald-500/25"
                >
                  Login to Start
                </Link>
                <Link
                  to="/register"
                  className="bg-slate-900 text-emerald-400 px-8 py-3 rounded-lg font-semibold 
                           ring-2 ring-emerald-500/50 hover:ring-emerald-400/50 
                           transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  Register Now
                </Link>
              </>
            ) : (
              <Link
                to="/upload"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 
                         text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 
                         hover:shadow-lg hover:shadow-emerald-500/25"
              >
                Start Watermarking
              </Link>
            )}
          </div>

          {!isLoggedIn && (
            <div className="inline-block px-6 py-4 bg-slate-800/50 backdrop-blur-sm rounded-xl">
              <p className="text-slate-400">
                Want to verify an image?{' '}
                <Link 
                  to="/verify" 
                  className="text-emerald-400 hover:text-emerald-300 underline decoration-dotted underline-offset-4"
                >
                  Use our verification tool
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer - Notice the removal of border */}
      <footer className="w-full bg-slate-900/80 backdrop-blur-sm py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-slate-500">© {new Date().getFullYear()} SecureWater. All rights reserved.</p>
          <p className="text-sm text-slate-600 mt-2">
            Protect your digital assets with advanced watermarking
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

