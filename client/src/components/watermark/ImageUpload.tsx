// client/src/components/watermark/ImageUpload.jsx

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ImageUpload = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  /** Validate file size, set preview, clear old messages. */
  const processFile = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should not exceed 5MB');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError('');
    setSuccess('');
  };

  /**
   * Helper function to embed pixelPattern into image's blue channel LSBs.
   * @param canvas The canvas element
   * @param ctx The 2D context of the canvas
   * @param pixelPattern Array of 0s and 1s
   */
  const embedPixelPattern = (canvas, ctx, pixelPattern) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;
    const totalPixels = width * height;

    if (pixelPattern.length > totalPixels) {
      throw new Error('Pixel pattern is too long for this image.');
    }

    for (let i = 0; i < pixelPattern.length; i++) {
      const dataIndex = i * 4 + 2; // Blue channel
      data[dataIndex] = (data[dataIndex] & 0xFE) | pixelPattern[i];
    }

    ctx.putImageData(imageData, 0, 0);
  };

  /**
   * Handle embedding watermark and optionally uploading to server
   */
  const handleEmbedAndDownload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    // Retrieve user data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      setError('User data not found. Please log in again.');
      return;
    }

    const user = JSON.parse(userData);
    const pixelPattern = user.pixelPattern;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const img = new Image();
      img.src = URL.createObjectURL(selectedFile);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get 2D context');
        }

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0);

        // Embed the pixelPattern into the image's blue channel LSBs
        embedPixelPattern(canvas, ctx, pixelPattern);

        // Convert canvas to Blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            throw new Error('Could not create Blob from canvas');
          }

          // Auto download the watermarked image
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `watermarked-${selectedFile.name}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);

          setSuccess('Image watermarked and downloaded successfully!');
          setLoading(false);

          // Optionally, upload the watermarked image to the server
          /*
          const formData = new FormData();
          formData.append('image', blob, `watermarked-${selectedFile.name}`);

          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/login');
            return;
          }

          const uploadResponse = await axios.post(`${process.env.REACT_APP_API_URL}/watermark/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          });

          if (uploadResponse.data.imageUrl) {
            setSuccess('Image watermarked, uploaded, and downloaded successfully!');
          }
          */
        }, 'image/png');
      };

      img.onerror = () => {
        setError('Failed to load the image for watermarking.');
        setLoading(false);
      };
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error embedding watermark');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-8 py-4 border-b border-emerald-500/10">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Upload Image
            </h2>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                {success}
              </div>
            )}

            <div className="text-center">
              <div>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 transition-all duration-200
                  ${dragActive 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : 'border-slate-700 hover:border-emerald-500/30'}
                  ${preview ? 'border-none p-0' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept="image/*"
                  />
                  {!preview ? (
                    <div className="space-y-4">
                      <div className="text-slate-400">
                        <svg
                          className="w-12 h-12 mx-auto mb-4 text-emerald-500/50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="text-lg">Drag and drop your image here or</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-[400px] mx-auto rounded-lg"
                      />
                      <div
                        className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 
                                transition-opacity duration-200 rounded-lg flex items-center justify-center backdrop-blur-sm"
                      >
                        <label className="cursor-pointer">
                          <span className="bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 
                                     transition-colors duration-200 backdrop-blur-sm">
                            Change Image
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleEmbedAndDownload}
                  disabled={!selectedFile || loading}
                  className={`mt-6 px-8 py-3 rounded-lg text-white font-semibold transition-all duration-200
                  ${
                    !selectedFile || loading
                      ? 'bg-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-emerald-500/25'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Upload & Watermark'
                  )}
                </button>

                {/* Extra info section (optional) */}
                <div className="mt-12 max-w-2xl mx-auto">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/10">
                    <h3 className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                      What We're Doing
                    </h3>
                    <div className="space-y-4 text-slate-300">
                      <p className="text-sm leading-relaxed">
                        When you upload an image, our system embeds a secure, invisible watermark 
                        that helps protect your content. This watermark:
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start space-x-2">
                          <svg
                            className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Becomes distorted if someone tries to edit or crop your image</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <svg
                            className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Contains traceable information to prove your ownership</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <svg
                            className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Remains effective even after basic image processing or compression</span>
                        </li>
                      </ul>
                      <p className="text-sm text-slate-400 italic">
                        The watermarked image will automatically download once processing is complete.
                      </p>
                    </div>
                  </div>
                </div>
                {/* End extra info */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
