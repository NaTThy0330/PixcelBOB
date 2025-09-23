import React from 'react';
import { PixelBackground } from './PixelBackground';
import { PixelButton } from './PixelButton';
import { PixelCard } from './PixelCard';

interface LandingPageProps {
  onGoogleLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoogleLogin }) => {
  return (
    <PixelBackground>
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full">
          <PixelCard title="LINE → Google Drive">
            <div className="space-y-6">
              {/* Logo/Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-500 border-4 border-green-600 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded-sm flex items-center justify-center">
                    <div className="w-4 h-4 bg-blue-500 border border-blue-600"></div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="text-center space-y-3">
                <h2 className="font-mono text-gray-800">Photo Upload Service</h2>
                <p className="text-sm text-gray-600 font-mono leading-relaxed">
                  บริการนี้จะอัพโหลดรูปจาก LINE ไปยังโฟลเดอร์ Google Drive ที่คุณเลือก
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-4">
                <PixelButton 
                  onClick={onGoogleLogin}
                  variant="primary"
                  size="lg"
                  className="w-full font-mono"
                >
                  🔗 Login with Google
                </PixelButton>

                <PixelButton 
                  variant="success"
                  size="lg"
                  className="w-full font-mono"
                  disabled
                >
                  📱 Connect LINE (Optional)
                </PixelButton>
              </div>

              {/* Features */}
              <div className="bg-gray-100 border-2 border-gray-300 p-3 font-mono text-xs">
                <h4 className="font-bold mb-2 text-gray-700">✨ Features:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Auto upload LINE photos</li>
                  <li>• Choose your Drive folder</li>
                  <li>• 10,000 photos / 39 THB</li>
                  <li>• Safe & secure</li>
                </ul>
              </div>
            </div>
          </PixelCard>
        </div>
      </div>
    </PixelBackground>
  );
};