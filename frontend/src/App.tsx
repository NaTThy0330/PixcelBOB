import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { FolderSelection } from './components/FolderSelection';
import { Dashboard } from './components/Dashboard';
import { BillingPage } from './components/BillingPage';
import { SettingsPage } from './components/SettingsPage';
import { apiService } from './services/api';
import { User } from './types';

type Page = 'landing' | 'folder-selection' | 'dashboard' | 'billing' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Apply pixel cursor to body element
  useEffect(() => {
    document.body.classList.add('pixel-cursor');
    return () => {
      document.body.classList.remove('pixel-cursor');
    };
  }, []);

  useEffect(() => {
    // Handle OAuth callback first
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('Authentication error:', error);
      alert('Authentication failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
      setLoading(false);
      return;
    }
    
    if (token) {
      console.log('Token received from OAuth callback');
      apiService.setToken(token);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Don't check auth status immediately, let it set the token first
      setTimeout(() => {
        checkAuthStatus();
      }, 100);
    } else {
      // No token in URL, check if we have one stored
      console.log('No token in URL, checking stored token...');
      checkAuthStatus();
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = localStorage.getItem('authToken');
      console.log('Checking auth status, stored token:', storedToken ? 'exists' : 'not found');
      
      const response = await apiService.verifyToken();
      console.log('Auth verification response:', response);
      
      if (response.data?.valid && response.data.user) {
        const userData = response.data.user;
        console.log('User authenticated:', userData.email);
        
        setUser({
          email: userData.email,
          name: userData.name,
          googleConnected: true,
          lineConnected: !!userData.line_user_id,
          selectedFolder: userData.google_drive_folder_id ? 'Selected' : undefined,
          selectedFolderId: userData.google_drive_folder_id,
        });
        // Navigate based on user state
        // Only navigate to folder selection or dashboard if we have valid auth
        if (!userData.google_drive_folder_id) {
          console.log('No folder selected, navigating to folder selection');
          setCurrentPage('folder-selection');
        } else {
          console.log('Folder already selected, navigating to dashboard');
          setCurrentPage('dashboard');
        }
      } else {
        // Invalid token, clear it
        console.log('Invalid token or no user data, clearing token');
        apiService.clearToken();
        setCurrentPage('landing');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setCurrentPage('landing');
    } finally {
      setLoading(false);
    }
  };

  const navigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleGoogleLogin = async () => {
    try {
      // Check if LINE user ID is in URL params
      const urlParams = new URLSearchParams(window.location.search);
      const lineUserId = urlParams.get('line_user_id');
      
      const response = await apiService.getGoogleAuthUrl(lineUserId || undefined);
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        console.error('Failed to get auth URL:', response.error);
        alert('Failed to initiate Google login. Please try again.');
      }
    } catch (error) {
      console.error('Error during Google login:', error);
      alert('An error occurred. Please check your connection and try again.');
    }
  };

  const handleFolderSelection = async (folderId: string, folderName: string) => {
    if (user) {
      const response = await apiService.setFolder(folderId);
      if (!response.error) {
        setUser({ ...user, selectedFolder: folderName, selectedFolderId: folderId });
        navigate('dashboard');
      } else {
        console.error('Failed to set folder:', response.error);
      }
    }
  };

  const handleLineConnect = async () => {
    // This will be handled by LINE OAuth flow
    // For now, we'll use a placeholder LINE user ID
    alert('LINE integration coming soon! For now, add the LINE bot and send photos.');
    // TODO: Implement LINE OAuth flow
    // const lineUserId = 'LINE_USER_ID_FROM_OAUTH';
    // const response = await apiService.bindLine(lineUserId);
    // if (!response.error && user) {
    //   setUser({ ...user, lineConnected: true });
    // }
  };

  const handleLogout = () => {
    apiService.clearToken();
    setUser(null);
    setCurrentPage('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {currentPage === 'landing' && (
        <LandingPage onGoogleLogin={handleGoogleLogin} />
      )}
      {currentPage === 'folder-selection' && user && (
        <FolderSelection
          onFolderSelect={handleFolderSelection}
          onBack={() => navigate('landing')}
        />
      )}
      {currentPage === 'dashboard' && user && (
        <Dashboard
          user={user}
          onNavigate={navigate}
          onLineConnect={handleLineConnect}
          onLogout={handleLogout}
        />
      )}
      {currentPage === 'billing' && (
        <BillingPage onBack={() => navigate('dashboard')} />
      )}
      {currentPage === 'settings' && user && (
        <SettingsPage
          user={user}
          onBack={() => navigate('dashboard')}
          onFolderChange={() => navigate('folder-selection')}
        />
      )}
    </div>
  );
}