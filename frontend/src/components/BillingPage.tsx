import React, { useState, useEffect } from 'react';
import { PixelBackground } from './PixelBackground';
import { PixelButton } from './PixelButton';
import { PixelCard } from './PixelCard';
import { apiService } from '../services/api';
import { Upload, Quota, UsageStats } from '../types';

interface BillingPageProps {
  onBack: () => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({ onBack }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [uploadsRes, quotaRes, statsRes] = await Promise.all([
        apiService.getUploads(20, 0),
        apiService.getQuota(),
        apiService.getUsageStats(30)
      ]);

      if (uploadsRes.data) setUploads(uploadsRes.data.uploads);
      if (quotaRes.data) setQuota(quotaRes.data);
      if (statsRes.data) setUsageStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const packages = [
    { name: 'Starter', photos: 10000, price: 39, popular: true },
    { name: 'Pro', photos: 50000, price: 149, popular: false },
    { name: 'Business', photos: 100000, price: 249, popular: false },
  ];

  return (
    <PixelBackground>
      <div className="min-h-screen px-4 py-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <PixelCard>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-mono text-gray-800 mb-1">💰 Billing & Usage</h1>
                <p className="text-sm text-gray-600 font-mono">Manage your credits and view usage history</p>
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
          {/* Current Package */}
          <PixelCard title="📦 Current Package">
            <div className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-200 p-4 font-mono text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">Starter Plan</div>
                <div className="text-lg mb-1">10,000 Photos</div>
                <div className="text-sm text-gray-600">฿39 / package</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border-2 border-green-200 p-3 text-center font-mono">
                  <div className="text-lg font-bold text-green-600">{loading ? '...' : usageStats?.totalUploads?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-600">Photos Used</div>
                </div>
                <div className="bg-orange-50 border-2 border-orange-200 p-3 text-center font-mono">
                  <div className="text-lg font-bold text-orange-600">
                  {loading ? '...' : quota && usageStats 
                    ? Math.max(0, (quota.limit || 10000) - (usageStats.totalUploads || 0)).toLocaleString() 
                    : '0'
                  }
                </div>
                  <div className="text-xs text-gray-600">Photos Left</div>
                </div>
              </div>

              <PixelButton 
                onClick={() => setShowPayment(true)}
                variant="success"
                className="w-full font-mono"
              >
                💳 Buy More Credits
              </PixelButton>
            </div>
          </PixelCard>

          {/* Usage History */}
          <PixelCard title="📊 Usage History">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="text-center text-gray-500 font-mono py-4">Loading...</div>
              ) : uploads.length === 0 ? (
                <div className="text-center text-gray-500 font-mono py-4">No upload history</div>
              ) : (
                uploads.map((upload, index) => (
                  <div key={index} className="border border-gray-300 p-3 bg-white font-mono text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold">{new Date(upload.upload_date).toLocaleDateString()}</span>
                      <span className="text-blue-600">{upload.file_name}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Size: {(upload.file_size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ))
              )}
            </div>
          </PixelCard>

          {/* Available Packages */}
          {showPayment && (
            <div className="lg:col-span-2">
              <PixelCard title="💎 Available Packages">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.map((pkg, index) => (
                    <div 
                      key={index}
                      className={`
                        border-4 p-4 text-center font-mono relative
                        ${pkg.popular 
                          ? 'border-yellow-400 bg-yellow-50' 
                          : 'border-gray-400 bg-white'
                        }
                      `}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 border-2 border-yellow-500 px-2 py-1 text-xs">
                          POPULAR
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <h3 className="font-bold text-lg text-gray-800">{pkg.name}</h3>
                        <div className="text-2xl font-bold text-blue-600 my-2">
                          ฿{pkg.price}
                        </div>
                        <div className="text-sm text-gray-600">
                          {pkg.photos.toLocaleString()} photos
                        </div>
                      </div>

                      <PixelButton 
                        variant={selectedPackage === index ? 'success' : pkg.popular ? 'primary' : 'secondary'}
                        className="w-full font-mono"
                        onClick={() => {
                          setSelectedPackage(index);
                          // TODO: Implement payment flow
                          alert(`Payment integration for ${pkg.name} package coming soon!`);
                        }}
                      >
                        {selectedPackage === index ? 'Selected' : 'Select Plan'}
                      </PixelButton>
                    </div>
                  ))}
                </div>

                {/* Payment Methods */}
                <div className="mt-6 p-4 bg-gray-100 border-2 border-gray-300">
                  <h4 className="font-mono font-bold mb-3 text-gray-800">💳 Payment Methods</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border-2 border-gray-400 p-3 text-center font-mono text-sm">
                      📱 PromptPay
                    </div>
                    <div className="bg-white border-2 border-gray-400 p-3 text-center font-mono text-sm">
                      💳 Credit Card
                    </div>
                    <div className="bg-white border-2 border-gray-400 p-3 text-center font-mono text-sm">
                      🏦 Bank Transfer
                    </div>
                    <div className="bg-white border-2 border-gray-400 p-3 text-center font-mono text-sm">
                      📲 True Wallet
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <PixelButton 
                    onClick={() => setShowPayment(false)}
                    variant="secondary"
                    className="font-mono"
                  >
                    Cancel
                  </PixelButton>
                </div>
              </PixelCard>
            </div>
          )}
        </div>
      </div>
    </PixelBackground>
  );
};