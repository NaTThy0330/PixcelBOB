import React, { useState } from 'react';
import { PixelBackground } from './PixelBackground';
import { PixelButton } from './PixelButton';
import { PixelCard } from './PixelCard';
import { apiService } from '../services/api';

interface SettingsPageProps {
  user: {
    email: string;
    name: string;
    googleConnected: boolean;
    lineConnected: boolean;
    selectedFolder?: string;
  };
  onBack: () => void;
  onFolderChange: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  user, 
  onBack, 
  onFolderChange 
}) => {
  const [showFAQ, setShowFAQ] = useState(false);

  const faqItems = [
    {
      question: 'How do I connect my LINE account?',
      answer: 'Click the "Connect LINE" button and follow the authorization process. You\'ll need to allow our app to access your LINE photos.'
    },
    {
      question: 'Can I change my Google Drive folder?',
      answer: 'Yes! Go to Settings and click "Change Google Drive Folder" to select a different destination folder.'
    },
    {
      question: 'What happens when I reach my photo limit?',
      answer: 'You\'ll need to purchase additional credits. The service will pause uploading until you add more credits to your account.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use secure OAuth connections and don\'t store your photos on our servers. Everything goes directly from LINE to your Google Drive.'
    },
    {
      question: 'How much does it cost?',
      answer: 'Our starter package is 39 THB for 10,000 photos. We also offer larger packages for heavy users.'
    }
  ];

  return (
    <PixelBackground>
      <div className="min-h-screen px-4 py-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <PixelCard>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-mono text-gray-800 mb-1">⚙️ Settings & Support</h1>
                <p className="text-sm text-gray-600 font-mono">Manage your account and get help</p>
              </div>
              <PixelButton 
                onClick={onBack}
                variant="secondary"
                className="font-mono"
              >
                ← Back to Dashboard
              </PixelButton>
            </div>
          </PixelCard>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Settings */}
          <PixelCard title="👤 Account Settings">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 border-2 border-gray-300 bg-gray-50 font-mono text-sm">
                  <label className="block text-gray-600 mb-1">Email</label>
                  <div className="font-bold">{user.email}</div>
                </div>

                <div className="p-3 border-2 border-gray-300 bg-gray-50 font-mono text-sm">
                  <label className="block text-gray-600 mb-1">Name</label>
                  <div className="font-bold">{user.name}</div>
                </div>

                <div className="p-3 border-2 border-gray-300 bg-gray-50 font-mono text-sm">
                  <label className="block text-gray-600 mb-1">Selected Folder</label>
                  <div className="font-bold">{user.selectedFolder || 'Not selected'}</div>
                </div>
              </div>
            </div>
          </PixelCard>

          {/* Connection Management */}
          <PixelCard title="🔗 Connections">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border-2 border-gray-300 bg-white">
                  <div className="font-mono">
                    <div className="text-sm font-bold">Google Drive</div>
                    <div className="text-xs text-gray-500">Connected</div>
                  </div>
                  <PixelButton 
                    variant="secondary"
                    size="sm"
                    className="font-mono"
                    onClick={async () => {
                      const response = await apiService.getGoogleAuthUrl();
                      if (response.data?.authUrl) {
                        window.location.href = response.data.authUrl;
                      }
                    }}
                  >
                    Reconnect
                  </PixelButton>
                </div>

                <div className="flex items-center justify-between p-3 border-2 border-gray-300 bg-white">
                  <div className="font-mono">
                    <div className="text-sm font-bold">LINE</div>
                    <div className="text-xs text-gray-500">
                      {user.lineConnected ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                  <PixelButton 
                    variant={user.lineConnected ? 'secondary' : 'success'}
                    size="sm"
                    className="font-mono"
                    onClick={async () => {
                      if (user.lineConnected) {
                        // Unbind LINE
                        await apiService.unbindLine();
                        window.location.reload();
                      } else {
                        // TODO: Implement LINE OAuth flow
                        alert('LINE OAuth integration coming soon');
                      }
                    }}
                  >
                    {user.lineConnected ? 'Disconnect' : 'Connect'}
                  </PixelButton>
                </div>
              </div>

              <PixelButton 
                onClick={onFolderChange}
                variant="primary"
                className="w-full font-mono"
              >
                📁 Change Google Drive Folder
              </PixelButton>
            </div>
          </PixelCard>

          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <PixelCard title="❓ Frequently Asked Questions">
              <div className="space-y-4">
                <PixelButton 
                  onClick={() => setShowFAQ(!showFAQ)}
                  variant="secondary"
                  className="w-full font-mono"
                >
                  {showFAQ ? 'Hide FAQ' : 'Show FAQ'}
                </PixelButton>

                {showFAQ && (
                  <div className="space-y-3">
                    {faqItems.map((item, index) => (
                      <div key={index} className="border-2 border-gray-300 p-4 bg-white">
                        <h4 className="font-mono font-bold text-sm text-gray-800 mb-2">
                          Q: {item.question}
                        </h4>
                        <p className="font-mono text-sm text-gray-600 leading-relaxed">
                          A: {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PixelCard>
          </div>

          {/* Contact Support */}
          <PixelCard title="📞 Contact Support">
            <div className="space-y-4">
              <p className="font-mono text-sm text-gray-600">
                Need help? Get in touch with our support team!
              </p>

              <div className="space-y-3">
                <PixelButton 
                  variant="primary"
                  className="w-full font-mono"
                  onClick={() => window.location.href = 'mailto:support@example.com'}
                >
                  📧 Email Support
                </PixelButton>
                
                <PixelButton 
                  variant="success"
                  className="w-full font-mono"
                  onClick={() => window.open('https://line.me/ti/p/@your-line-id', '_blank')}
                >
                  💬 LINE Support
                </PixelButton>
                
                <PixelButton 
                  variant="secondary"
                  className="w-full font-mono"
                  onClick={() => window.open('https://github.com/your-repo/issues', '_blank')}
                >
                  📋 Submit Bug Report
                </PixelButton>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 p-3 font-mono text-sm">
                <div className="font-bold text-blue-800 mb-1">Support Hours</div>
                <div className="text-blue-600">Mon-Fri: 9:00 AM - 6:00 PM (GMT+7)</div>
                <div className="text-blue-600">Sat-Sun: 10:00 AM - 4:00 PM (GMT+7)</div>
              </div>
            </div>
          </PixelCard>

          {/* About */}
          <PixelCard title="ℹ️ About">
            <div className="space-y-3">
              <div className="font-mono text-sm text-gray-600">
                <div className="mb-2">
                  <strong>LINE → Google Drive Service</strong>
                </div>
                <div className="space-y-1">
                  <div>Version: 1.0.0</div>
                  <div>Last Updated: Jan 2025</div>
                  <div>Made with ❤️ for photo enthusiasts</div>
                </div>
              </div>

              <div className="bg-gray-100 border-2 border-gray-300 p-3 font-mono text-xs">
                <div className="font-bold mb-1">Privacy Notice:</div>
                <div className="text-gray-600">
                  We don't store your photos. All transfers go directly from LINE to your Google Drive. 
                  We only store connection tokens and usage statistics.
                </div>
              </div>
            </div>
          </PixelCard>
        </div>
      </div>
    </PixelBackground>
  );
};