import React, { useState, useEffect } from 'react';
import { PixelBackground } from './Background';
import { PixelButton } from './PixelButton';
import { PixelCard } from './PixelCard';
import { apiService } from '../services/api';
import { Folder } from '../types';

interface FolderSelectionProps {
  onFolderSelect: (folderId: string, folderName: string) => void;
  onBack: () => void;
}

export const FolderSelection: React.FC<FolderSelectionProps> = ({ 
  onFolderSelect, 
  onBack 
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getFolders();
      if (response.data?.folders) {
        setFolders(response.data.folders);
      } else if (response.error) {
        setError(response.error);
        console.error('Folder fetch error:', response.error);
      }
    } catch (err) {
      setError('Failed to fetch folders');
      console.error('Folder fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    const folder = folders.find(f => f.id === selectedFolder);
    if (folder) {
      onFolderSelect(folder.id, folder.name);
    }
  };

  return (
    <PixelBackground>
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-lg w-full">
          <PixelCard title="Select Google Drive Folder">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 font-mono">
                  เลือกโฟลเดอร์ที่จะเก็บรูปภาพจาก LINE
                </p>
              </div>

              {/* Folder List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 font-mono">Loading folders...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 font-mono mb-2">{error}</p>
                    <PixelButton onClick={fetchFolders} size="sm" variant="secondary">
                      Retry
                    </PixelButton>
                  </div>
                ) : folders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 font-mono">No folders found</p>
                  </div>
                ) : (
                  folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`
                      border-2 border-gray-400 p-3
                      font-mono text-sm transition-colors
                      ${selectedFolder === folder.id 
                        ? 'bg-blue-100 border-blue-500' 
                        : 'bg-white hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-yellow-400 border-2 border-yellow-500 flex items-center justify-center">
                        📁
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{folder.name}</div>
                        <div className="text-xs text-gray-500">Google Drive Folder</div>
                      </div>
                      {selectedFolder === folder.id && (
                        <div className="ml-auto text-blue-500">✓</div>
                      )}
                    </div>
                  </div>
                  ))
                )}
              </div>

              {/* Create New Folder Option */}
              <div className="border-2 border-dashed border-gray-400 p-3 text-center">
                <p className="text-sm text-gray-500 font-mono">
                  💡 Want to create a new folder? Use Google Drive directly
                </p>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3">
                <PixelButton 
                  onClick={onBack}
                  variant="secondary"
                  className="flex-1 font-mono"
                >
                  ← Back
                </PixelButton>
                <PixelButton 
                  onClick={handleSave}
                  variant="success"
                  className="flex-1 font-mono"
                  disabled={!selectedFolder || loading}
                >
                  Save Folder
                </PixelButton>
              </div>

              {selectedFolder && (
                <div className="bg-green-100 border-2 border-green-300 p-3 font-mono text-sm">
                  Selected: <strong>{folders.find(f => f.id === selectedFolder)?.name}</strong>
                </div>
              )}
            </div>
          </PixelCard>
        </div>
      </div>
    </PixelBackground>
  );
};
