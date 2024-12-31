// client/src/App.jsx
import './index.css';  // This should be the first import
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home.tsx';
import Login from './components/auth/Login.tsx';
import Register from './components/auth/Register.tsx';
import ImageUpload from './components/watermark/ImageUpload.tsx';
import VerificationForm from './components/watermark/VerificationForm.tsx';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-900">
        <main className="flex-grow w-full px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/upload" element={<ImageUpload />} />
            <Route path="/verify" element={<VerificationForm />} />
          </Routes>
        </main>
        {/* Removed Footer */}
      </div>
    </Router>
  );
}

export default App;