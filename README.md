# SecureWater: Advanced Image Watermarking System

SecureWater is a robust image watermarking solution that helps protect digital assets through tamper-evident watermarking. The system embeds invisible watermarks that can detect any modifications to the image, including cropping, editing, or screenshot attempts.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Invisible Watermarking**: Embeds imperceptible watermarks that don't affect image quality
- **Tamper Detection**: Identifies if images have been modified, cropped, or screenshotted
- **User Authentication**: Secure user accounts with watermark tracking
- **Public Verification**: Anyone can verify image authenticity without an account
- **Responsive Design**: Modern, responsive interface built with React and Tailwind CSS
- **Real-time Processing**: Fast watermark embedding and verification
- **Secure Storage**: Encrypted metadata storage with MongoDB

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Axios for API calls

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication
- Sharp for image processing
- Multer for file uploads

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/securewater.git
cd securewater
```

2. Install dependencies for both frontend and backend
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Set up environment variables
```bash
# In server directory, create .env:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/watermark-system
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=24h

# In client directory, create .env:
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development servers
```bash
# Start backend server
cd server
npm run dev

# Start frontend server in a new terminal
cd client
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### Image Watermarking
1. Register an account or log in
2. Navigate to the Upload page
3. Drop or select an image
4. Receive your watermarked image

### Image Verification
1. Go to the Verify page (no account needed)
2. Upload a potentially watermarked image
3. View the verification results, including:
   - Original ownership information
   - Timestamp
   - Tampering detection results

## API Documentation

### Authentication Endpoints
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login

### Watermark Endpoints
- POST `/api/watermark/upload` - Upload and watermark image
- POST `/api/watermark/verify` - Verify image authenticity

Detailed API documentation is available in the [API.md](API.md) file.

## Architecture

### Watermarking Process
1. **Embedding**:
   - User uploads image
   - System generates unique watermark
   - Watermark is embedded using frequency-domain techniques
   - Watermarked image is returned to user

2. **Verification**:
   - Image is uploaded for verification
   - System extracts watermark data
   - Validates against database records
   - Returns authentication results

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) for image processing
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [MongoDB](https://www.mongodb.com/) for database
- All contributors and supporters

