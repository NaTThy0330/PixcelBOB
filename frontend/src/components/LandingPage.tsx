import React from 'react';
import { PixelBackground } from './Background';
import { PixelButton } from './PixelButton';
import { PixelCard } from './PixelCard';
import { PixelCatLogo } from './PixelCatLogo';

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
              {/* Logo: Pixel Cat + Brand */}
              <div className="flex justify-center">
                <PixelCatLogo />
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
