// client/src/components/shared/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 py-6">
      <div className="container mx-auto px-4">
        <div className="text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} SecureWater. All rights reserved.</p>
          <p className="text-sm mt-2">Protect your digital assets with advanced watermarking</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;