import React, { useEffect, useState } from 'react';
import { PixelBackground } from './PixelBackground';
import { PixelButton } from './PixelButton';
import { PixelCard } from './PixelCard';
import { apiService } from '../services/api';
import { UsageStats, Quota, Activity } from '../types';

interface DashboardProps {
  user: {
    email: string;
    name: string;
    googleConnected: boolean;
    lineConnected: boolean;
    selectedFolder?: string;
  };
  onNavigate: (page: 'billing' | 'settings') => void;
  onLineConnect: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  onNavigate, 
  onLineConnect,
  onLogout 
}) => {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, quotaRes, activityRes] = await Promise.all([
        apiService.getUsageStats(),
        apiService.getQuota(),
        apiService.getActivity()
      ]);

      if (statsRes.data) setUsageStats(statsRes.data);
      if (quotaRes.data) setQuota(quotaRes.data);
      if (activityRes.data) setActivities(activityRes.data.activities);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    // TODO: Implement sync endpoint when available
    setTimeout(() => {
      setSyncing(false);
      fetchDashboardData();
    }, 2000);
  };

  return (
    <PixelBackground>
      <div className="min-h-screen px-4 py-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <PixelCard>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-mono text-gray-800 mb-1">Dashboard</h1>
                <p className="text-sm text-gray-600 font-mono">Welcome back, {user.name}!</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PixelButton
                  onClick={() => onNavigate('billing')}
                  variant="secondary"
                  size="sm"
                  className="font-mono flex-1 md:flex-none"
                >
                  💰 Billing
                </PixelButton>
                <PixelButton
                  onClick={() => onNavigate('settings')}
                  variant="secondary"
                  size="sm"
                  className="font-mono flex-1 md:flex-none"
                >
                  ⚙️ Settings
                </PixelButton>
                <PixelButton
                  onClick={onLogout}
                  variant="secondary"
                  size="sm"
                  className="font-mono flex-1 md:flex-none"
                >
                  🚪 Logout
                </PixelButton>
              </div>
            </div>
          </PixelCard>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage Stats */}
          <PixelCard title="📊 Usage Statistics">
            <div className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-200 p-4 font-mono">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Photos Uploaded</span>
                  <span className="font-bold text-blue-600">{loading ? '...' : usageStats?.totalUploads?.toLocaleString() || '0'}</span>
                </div>
                <div className="w-full bg-gray-200 border border-gray-400 h-4">
                  <div 
                    className="bg-blue-500 h-full border-r border-blue-600"
                    style={{ width: loading || !usageStats || !quota ? '0%' : `${(usageStats.totalUploads / (quota.limit || 10000)) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {loading ? '...' : quota && usageStats ? `${Math.max(0, (quota.limit || 10000) - usageStats.totalUploads).toLocaleString()} photos remaining` : '...'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border-2 border-green-200 p-3 text-center font-mono">
                  <div className="text-lg font-bold text-green-600">{loading ? '...' : (quota?.limit || 10000).toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Package Limit</div>
                </div>
                <div className="bg-orange-50 border-2 border-orange-200 p-3 text-center font-mono">
                  <div className="text-lg font-bold text-orange-600">฿39</div>
                  <div className="text-xs text-gray-600">Current Package</div>
                </div>
              </div>
            </div>
          </PixelCard>

          {/* Connection Status */}
          <PixelCard title="🔗 Connection Status">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border-2 border-gray-300 bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 border-2 border-blue-600 flex items-center justify-center text-white text-sm">
                      G
                    </div>
                    <div className="font-mono">
                      <div className="text-sm font-bold">Google Drive</div>
                      <div className="text-xs text-gray-500">
                        {user.selectedFolder ? `Folder: ${user.selectedFolder}` : 'Connected'}
                      </div>
                    </div>
                  </div>
                  <div className="text-green-500 font-mono">✅</div>
                </div>

                <div className="flex items-center justify-between p-3 border-2 border-gray-300 bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 border-2 border-green-600 flex items-center justify-center text-white text-sm">
                      L
                    </div>
                    <div className="font-mono">
                      <div className="text-sm font-bold">LINE</div>
                      <div className="text-xs text-gray-500">
                        {user.lineConnected ? 'Connected' : 'Not connected'}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-500 font-mono">
                    {user.lineConnected ? '✅' : '❌'}
                  </div>
                </div>
              </div>

              {!user.lineConnected && (
                <PixelButton 
                  onClick={onLineConnect}
                  variant="success"
                  className="w-full font-mono"
                >
                  📱 Connect LINE Now
                </PixelButton>
              )}
            </div>
          </PixelCard>

          {/* Recent Activity */}
          <PixelCard title="📈 Recent Activity">
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-gray-500 font-mono py-4">Loading...</div>
              ) : !activities || activities.length === 0 ? (
                <div className="text-center text-gray-500 font-mono py-4">No recent activity</div>
              ) : (
                activities.slice(0, 3).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-300 bg-gray-50">
                  <div className="font-mono">
                    <div className="text-sm font-bold">{activity.description || activity.type}</div>
                    <div className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleDateString()}</div>
                  </div>
                  <div className="text-blue-600 font-bold font-mono">
                    {activity.metadata?.count ? `+${activity.metadata.count}` : '✓'}
                  </div>
                </div>
                ))
              )}
              
              <PixelButton 
                onClick={() => onNavigate('billing')}
                variant="secondary"
                size="sm"
                className="w-full font-mono"
              >
                View Full History
              </PixelButton>
            </div>
          </PixelCard>

          {/* Quick Actions */}
          <PixelCard title="⚡ Quick Actions">
            <div className="space-y-3">
              <PixelButton 
                variant="primary"
                className="w-full font-mono"
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? '🔄 Syncing...' : '🔄 Sync Now'}
              </PixelButton>
              
              <PixelButton 
                onClick={() => onNavigate('billing')}
                variant="success"
                className="w-full font-mono"
              >
                💳 Buy More Credits
              </PixelButton>
              
              <PixelButton 
                onClick={() => onNavigate('settings')}
                variant="secondary"
                className="w-full font-mono"
              >
                📁 Change Folder
              </PixelButton>
            </div>
          </PixelCard>
        </div>
      </div>
    </PixelBackground>
  );
};