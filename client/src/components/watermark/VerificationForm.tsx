import React, { useState } from 'react';
import axios from 'axios';

interface VerificationResult {
  verified: boolean;
  message: string;
  details?: {
    timestamp: string;
    imageInfo: {
      name: string;
      format: string;
      dimensions: {
        width: number;
        height: number;
      };
    };
    originalUser?: {
      username: string;
      email: string;
    };
  };
}

/** 
 * Utility to convert a binary array (0/1 bits) into a string.
 * Assumes each 8 bits form one character.
 */
function bitsToString(bits: number[]): string {
  let result = '';
  for (let i = 0; i < bits.length; i += 8) {
    let charCode = 0;
    for (let j = 0; j < 8; j++) {
      charCode = (charCode << 1) | bits[i + j];
    }
    result += String.fromCharCode(charCode);
  }
  return result;
}

/** 
 * Extract a watermark (string) from the LSB of the blue channel in ImageData.
 * @param imageData The ImageData from a canvas context.
 * @param watermarkLength The number of characters we expect to find.
 *        Each character is 8 bits, so total bits = watermarkLength * 8.
 */
function extractLSBWatermark(imageData: ImageData, watermarkLength: number): string {
  const totalBits = watermarkLength * 8;
  const { data } = imageData;

  // We'll read from the first `totalBits` pixels. 
  // Each pixel has 4 channels: RGBA; the blue channel is `data[4*i + 2]`.
  const bits: number[] = [];
  for (let i = 0; i < totalBits; i++) {
    const blueIndex = 4 * i + 2;
    // Extract the least significant bit (LSB) of the blue channel
    const bit = data[blueIndex] & 1;
    bits.push(bit);
  }

  return bitsToString(bits);
}

const VerificationForm: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should not exceed 5MB');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  /**
   * Example: 
   * 1) (Optional) we can still call server endpoint at /watermark/verify 
   *    to do any server-side verification if you want.
   * 2) We also do a local check for an LSB watermark to see if it matches 
   *    our known string. If it doesn't match, we assume tampering.
   */
  const handleVerify = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      // --- 1) (Optional) server-side verification via API call ---
      // const formData = new FormData();
      // formData.append('image', selectedFile);

      // const response = await axios.post(
      //   `${process.env.REACT_APP_API_URL}/watermark/verify`, 
      //   formData,
      //   { headers: { 'Content-Type': 'multipart/form-data' } }
      // );

      // We show the server's response in the UI (if you want to keep that logic):
      // setVerificationResult(response.data);

      // --- 2) Local LSB-based verification (client-side) ---
      const knownWatermark = "MyDemoMark"; 
      // 9 characters in "MyDemoMark", so we expect 9 * 8 = 72 bits.

      // Load the image into a canvas for local analysis
      const img = new Image();
      img.src = URL.createObjectURL(selectedFile);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get 2D context for verification');
        }
        ctx.drawImage(img, 0, 0);

        // Extract the ImageData
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Attempt to read the first 9 characters from the LSB of the blue channel
        const extracted = extractLSBWatermark(imageData, knownWatermark.length);

        let isVerified = false;
        let message: string;

        if (extracted === knownWatermark) {
          isVerified = true;
          message = "The image watermark matches. No tampering detected.";
        } else {
          isVerified = false;
          message = "The watermark does NOT match. This image may be tampered or unmarked.";
        }

        // Build a VerificationResult object to match your UI
        const localVerification: VerificationResult = {
          verified: isVerified,
          message,
          details: {
            timestamp: new Date().toISOString(),
            imageInfo: {
              name: selectedFile.name,
              format: selectedFile.type || 'unknown',
              dimensions: { width: img.width, height: img.height },
            },
            // In a real case, you might parse embedded user info, etc.
            originalUser: isVerified
              ? { username: 'DemoUser', email: 'demo@example.com' }
              : undefined,
          },
        };

        setVerificationResult(localVerification);
        setLoading(false);
      };
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error verifying image');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-8 py-4 border-b border-emerald-500/10">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Verify Watermarked Image
            </h2>
          </div>
          
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
                {error}
              </div>
            )}

            <div className="text-center">
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
              >
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
                    <label className="cursor-pointer">
                      <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 
                                   text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200
                                   hover:shadow-lg hover:shadow-emerald-500/25">
                        Browse Files
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative group">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-[400px] mx-auto rounded-lg"
                    />
                    <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 
                                transition-opacity duration-200 rounded-lg flex items-center justify-center backdrop-blur-sm">
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
                onClick={handleVerify}
                disabled={!selectedFile || loading}
                className={`mt-6 px-8 py-3 rounded-lg text-white font-semibold transition-all duration-200
                  ${!selectedFile || loading
                    ? 'bg-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-emerald-500/25'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : 'Verify Image'}
              </button>

              {verificationResult && (
                <div className="mt-6 p-6 rounded-lg bg-slate-800/50 backdrop-blur-sm text-left">
                  <h3 className="text-lg font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                    Verification Result
                  </h3>
                  <div className="space-y-2">
                    <p className={`text-lg font-semibold ${
                      verificationResult.verified 
                        ? 'text-emerald-400' 
                        : 'text-rose-400'
                    }`}>
                      Status: {verificationResult.verified ? 'Verified ✓' : 'Not Verified ✗'}
                    </p>
                    <p className="text-slate-400">{verificationResult.message}</p>
                    {verificationResult.details && (
                      <div className="mt-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <pre className="text-sm whitespace-pre-wrap text-slate-300">
                          {JSON.stringify(verificationResult.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationForm;
